/**
 * Règles pures relatives aux Améliorations d'équipement
 * (weaponMod).
 *
 * Rappel de la spécification (déjà validée, livre p.213-214) :
 *
 * - une Amélioration d'équipement est attachée à UN équipement
 *   précis (une arme ou, de façon générique, une protection) ;
 * - elle n'ajoute JAMAIS automatiquement de bonus chiffré à un
 *   jet : elle est purement informative, le MJ en applique
 *   l'effet narrativement à la table ;
 * - seule une poignée d'entre elles nécessite une ressource
 *   (la réserve d'Énergie, system.survival.energy) pour être
 *   utilisée ; les autres n'en nécessitent aucune ;
 * - chaque arme/protection déclare elle-même (system.
 *   weaponModSlots) combien d'Améliorations elle peut accueillir
 *   simultanément — un paramétrage du MJ, le livre n'en impose
 *   aucun.
 *
 * Ce fichier ne dépend jamais de `foundry.*` : il travaille sur
 * des vues simples déjà extraites par l'appelant (jamais sur des
 * Item/Actor Foundry), afin de rester testable avec node:test.
 */


/**
 * Une Amélioration d'arme nécessitant une ressource peut-elle
 * être utilisée avec les ressources actuellement disponibles ?
 *
 * @param {object} params
 * @param {string} params.resourceId
 *     Identifiant de ressource sur actor.system.survival
 *     (ex. "energy"). Chaîne vide = aucune ressource requise.
 * @param {number} [params.resourceAmount]
 *     Quantité nécessaire (par défaut 1).
 * @param {object} [params.actorResources]
 *     Ressources actuellement disponibles sur l'Actor,
 *     sous forme d'un objet simple (ex. { energy: 3 }).
 *     Ce n'est JAMAIS l'Actor Foundry lui-même.
 *
 * @returns {boolean}
 */
export function isWeaponModUsable({
    resourceId,
    resourceAmount = 1,
    actorResources = {}
} = {}) {

    if (!resourceId) {

        return true;

    }


    const available =
        actorResources?.[resourceId]
        ?? 0;


    return (
        available
        >= (resourceAmount ?? 1)
    );

}


/**
 * Filtre les Améliorations d'équipement effectivement proposables
 * pour une arme donnée dans la fenêtre de préparation :
 *
 * - uniquement celles attachées à cette arme précise
 *   (attachedItemUuid === weaponUuid) ;
 * - ET usables, c'est-à-dire soit sans ressource requise,
 *   soit avec une ressource requise actuellement disponible.
 *
 * @param {object} params
 * @param {string} params.weaponUuid
 *     UUID Foundry de l'arme impliquée dans le jet.
 * @param {object[]} [params.weaponMods]
 *     Vues simples déjà extraites des Items weaponMod de
 *     l'Actor, chacune sous la forme :
 *     { id, uuid, name, description, resourceId, resourceAmount,
 *       attachedItemUuid }.
 * @param {object} [params.actorResources]
 *     Ressources actuellement disponibles sur l'Actor.
 *
 * @returns {object[]}
 *     Les vues filtrées, sans le champ attachedItemUuid :
 *     { id, uuid, name, description, resourceId, resourceAmount }.
 */
export function getUsableWeaponModsForWeapon({
    weaponUuid,
    weaponMods = [],
    actorResources = {}
} = {}) {

    return weaponMods
        .filter(
            mod =>
                mod?.attachedItemUuid === weaponUuid
                && isWeaponModUsable({
                    resourceId:
                        mod?.resourceId ?? "",

                    resourceAmount:
                        mod?.resourceAmount ?? 1,

                    actorResources
                })
        )
        .map(
            mod => ({

                id:
                    mod.id,

                uuid:
                    mod.uuid,

                name:
                    mod.name,

                description:
                    mod.description,

                resourceId:
                    mod.resourceId ?? "",

                resourceAmount:
                    mod.resourceAmount ?? 1

            })
        );

}


/**
 * Une Amélioration d'équipement est-elle compatible avec le type
 * d'Item embarqué visé (ex. "weapon" ou "armor") ?
 *
 * @param {object} params
 * @param {string[]} [params.applicableTypes]
 *     Types déclarés par l'Amélioration (system.applicableTypes).
 * @param {string} params.itemType
 *     Type de l'Item embarqué visé par l'attachement.
 *
 * @returns {boolean}
 */
export function isWeaponModApplicableToItemType({
    applicableTypes = [],
    itemType
} = {}) {

    return (
        Array.isArray(applicableTypes)
        && applicableTypes.includes(itemType)
    );

}


/**
 * Une arme/protection disposant de `weaponModSlots` emplacements,
 * et comptant déjà `currentlyAttachedCount` Améliorations
 * d'équipement attachées, peut-elle en accueillir une de plus ?
 *
 * Cette fonction ne compte jamais elle-même les Améliorations
 * déjà attachées : c'est à l'appelant de fournir ce décompte
 * (typiquement en excluant l'Amélioration en cours de dépôt,
 * pour que le réattachement d'une Amélioration déjà attachée à
 * cet équipement reste idempotent).
 *
 * @param {object} params
 * @param {number} [params.currentlyAttachedCount]
 * @param {number} [params.weaponModSlots]
 *
 * @returns {boolean}
 */
export function canAttachWeaponModToItem({
    currentlyAttachedCount = 0,
    weaponModSlots = 0
} = {}) {

    return (
        Number(currentlyAttachedCount)
        < Number(weaponModSlots)
    );

}
