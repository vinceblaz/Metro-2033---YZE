/**
 * Préparation d'une attaque à distance.
 *
 * Responsabilités :
 *
 * - construire le contexte métier d'une attaque à distance ;
 * - imposer l'arme utilisée comme source ;
 * - récupérer les talents de l'Actor ;
 * - produire une ActionModifierPreparation.
 *
 * Ce service :
 *
 * - n'affiche aucune UI ;
 * - ne lance aucun dé ;
 * - ne consomme aucune action ;
 * - ne modifie aucun Document Foundry.
 */


import {
    resolveWeaponTalentType
} from "../domain/rules/weapon-talent-type.mjs";

import {
    resolveTalentKey
} from "../domain/rules/talent-identity.mjs";

import {
    ACTION_RESOLUTION_TYPES,
    createActionResolutionContext
} from "../domain/rules/action-resolution-context.mjs";


import {
    ActionPreparationService
} from "./action-preparation-service.mjs";


import {
    getUsableWeaponModsForWeapon
} from "../domain/rules/weapon-mod.mjs";


/**
 * Bonus suggéré (p.198 du livre de règles) pour
 * un tir en rafale.
 *
 * Ce bonus n'est jamais appliqué automatiquement :
 * il n'est qu'une valeur suggérée, visible et
 * modifiable, dans le champ « Bonus manuel » de la
 * fenêtre de préparation. C'est toujours le joueur
 * ou le MJ qui décide de la valeur réellement
 * utilisée pour le jet.
 */
const BURST_FIRE_SUGGESTED_BONUS =
    3;


/* ============================================================
 * TALENTS
 * ============================================================ */


function getActorTalents(
    actor
) {

    if (!actor) {

        return [];

    }


    const groups =
        new Map();


    const talentItems =
        Array.from(
            actor.items ?? []
        )
            .filter(
                item =>
                    item.type === "talent"
            );


    for (
        const item
        of talentItems
    ) {

        const key =
            resolveTalentKey(item);


        /*
         * Les nouveaux Talents doivent toujours
         * posséder un system.key.
         *
         * Le fallback sur l'id évite néanmoins
         * de fusionner accidentellement plusieurs
         * anciens Talents sans clé.
         */
        const groupKey =
            key
            || `item:${item.id}`;


        const existing =
            groups.get(
                groupKey
            );


        if (existing) {

            existing.level += 1;

            existing.itemIds.push(
                item.id
            );


            /*
             * Défense supplémentaire pendant
             * la période de migration.
             *
             * Toutes les acquisitions normales
             * d'un même Talent doivent partager
             * le même maxLevel.
             */
            existing.maxLevel =
                Math.max(
                    existing.maxLevel,
                    Number(
                        item.system?.maxLevel
                        ?? 1
                    )
                );


            continue;

        }


        groups.set(
            groupKey,
            {

                /*
                 * Item représentatif.
                 */
                id:
                    item.id,

                name:
                    item.name,

                key,

                /*
                 * IMPORTANT :
                 *
                 * `level` n'est désormais plus
                 * lu dans system.level.
                 *
                 * Il représente le niveau métier
                 * dérivé du nombre d'acquisitions
                 * possédées par l'Actor.
                 */
                level:
                    1,

                maxLevel:
                    Number(
                        item.system?.maxLevel
                        ?? 1
                    ),

                configuration:
                    item.system?.configuration
                    ?? {},

                /*
                 * Information utile au diagnostic
                 * et à une future migration.
                 */
                itemIds: [
                    item.id
                ]

            }
        );

    }


    return Array.from(
        groups.values()
    );

}


/* ============================================================
 * AMÉLIORATIONS D'ARME (weaponMod)
 * ============================================================ */


/**
 * Construit la liste des Améliorations d'arme proposables pour
 * une arme donnée, parmi celles embarquées sur l'Actor.
 *
 * Ne retient que celles :
 * - attachées précisément à cette arme (attachedItemUuid) ;
 * - ET usables (aucune ressource requise, ou ressource
 *   actuellement disponible sur l'Actor).
 *
 * `actor.system.survival` est lu dans son ensemble plutôt que de
 * coder en dur "energy" : seule cette ressource est utilisée par
 * le catalogue actuel, mais la règle de domaine reste générique.
 *
 * Cette fonction dépend de Foundry (actor.items) : elle n'est
 * donc pas testée ici — la logique de filtrage pure est, elle,
 * couverte par tests/domain/rules/weapon-mod.test.mjs.
 */
function getWeaponModViews(
    actor,
    weaponUuid
) {

    const allWeaponMods =
        Array.from(
            actor.items ?? []
        )
            .filter(
                item =>
                    item.type === "weaponMod"
            )
            .map(
                item => ({

                    id:
                        item.id,

                    uuid:
                        item.uuid,

                    name:
                        item.name,

                    description:
                        item.system?.description
                        ?? "",

                    resourceId:
                        item.system?.resource?.id
                        ?? "",

                    resourceAmount:
                        item.system?.resource?.amount
                        ?? 1,

                    attachedItemUuid:
                        item.system?.attachedItemUuid
                        ?? ""

                })
            );


    const actorResources =
        {
            ...(actor.system?.survival ?? {})
        };


    return getUsableWeaponModsForWeapon({

        weaponUuid,

        weaponMods:
            allWeaponMods,

        actorResources

    });

}


/* ============================================================
 * ARME
 * ============================================================ */


function createWeaponContext(
    weapon
) {

    const weaponCategory =
        String(
            weapon.system?.weaponCategory
            ?? ""
        )
            .trim()
        || String(
            weapon.system?.weaponType
            ?? ""
        )
            .trim()
        || null;


    return {

        id:
            weapon.id,

        uuid:
            weapon.uuid,

        name:
            weapon.name,

        /*
         * Catégorie métier de l'arme.
         *
         * Exemples :
         * pistol
         * rifle
         * assaultRifle
         * shotgun
         *
         * Utilisée notamment par
         * Arme de prédilection.
         */
        category:
            weaponCategory,

        /*
         * Type d'arme pour Spécialiste en armement
         * ("melee" | "ranged" | "heavy"), déduit de l'arme.
         */
        type:
            resolveWeaponTalentType({
                category: weapon.system?.category,
                heavy: weapon.system?.heavy === true
            }),

        isFirearm:
            weapon.system?.usesAmmunition
            === true,

        isHeavyWeapon:
            weapon.system?.heavy
            === true,

        automatic:
            weapon.system?.automatic
            === true

    };

}


/* ============================================================
 * SERVICE
 * ============================================================ */


export class RangedAttackPreparationService {


    static create(
        actor,
        weapon,
        {
            burstFire = false,

            circumstances = [],
            effects = [],
            equipmentModifiers = [],

            manualBonus = null,
            manualPenalty = 0,

            metadata = {}
        } = {}
    ) {

        if (!actor) {

            throw new TypeError(
                "Un Actor est requis pour préparer une attaque à distance."
            );

        }


        if (!weapon) {

            throw new TypeError(
                "Une arme est requise pour préparer une attaque à distance."
            );

        }


        if (
            weapon.actor?.id
            !== actor.id
        ) {

            throw new Error(
                "L'arme utilisée n'appartient pas à cet Actor."
            );

        }


        if (
            weapon.type
            !== "weapon"
        ) {

            throw new Error(
                "L'Item utilisé n'est pas une arme."
            );

        }


        if (
            weapon.system?.category
            !== "ranged"
        ) {

            throw new Error(
                "Cette arme n'est pas une arme à distance."
            );

        }


        const attribute =
            actor.getSkillAttribute(
                "shooting"
            );


        if (!attribute) {

            throw new Error(
                "L'Attribut associé à la compétence Tir est introuvable."
            );

        }


        const talents =
            getActorTalents(
                actor
            );


        const weaponContext =
            createWeaponContext(
                weapon
            );


        const weaponMods =
            getWeaponModViews(
                actor,
                weapon.uuid
            );


        const context =
            createActionResolutionContext({

                actionType:
                    ACTION_RESOLUTION_TYPES
                        .RANGED_ATTACK,

                actorId:
                    actor.id,

                attribute,

                skill:
                    "shooting",

                weapon:
                    weaponContext,

                metadata: {

                    ...metadata,

                    burstFire:
                        burstFire
                            === true

                }

            });


        /*
        * Le bonus manuel n'est jamais deviné
        * silencieusement à partir de rien : si
        * l'appelant en fournit un explicitement,
        * il reste prioritaire.
        *
        * Ce n'est qu'en son absence, et uniquement
        * pour une rafale, qu'une valeur suggérée
        * est proposée dans le champ éditable de la
        * fenêtre de préparation.
        */
        const resolvedManualBonus =
            manualBonus
            ?? (
                burstFire === true
                    ? BURST_FIRE_SUGGESTED_BONUS
                    : 0
            );


        const preparation =
            ActionPreparationService
                .create(
                    actor,
                    context,
                    {
                        talents,

                        circumstances,

                        effects,

                        equipmentModifiers,

                        weaponMods,

                        manualBonus:
                            resolvedManualBonus,

                        manualPenalty
                    }
                );


        return {

            actor,

            weapon,

            talents,

            context,

            preparation,

            burstFire:
                burstFire
                    === true

        };

    }


}