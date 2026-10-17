/**
 * Préparation générique d'un jet de Compétence.
 *
 * Responsabilités :
 *
 * - construire le contexte de résolution ;
 * - récupérer les talents de l'Actor ;
 * - produire une ActionModifierPreparation.
 *
 * Ce service :
 *
 * - n'affiche aucune UI ;
 * - ne lance aucun dé ;
 * - ne modifie aucun Document Foundry.
 */


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


/* ============================================================
 * TALENTS
 * ============================================================ */


function getActorTalents(
    actor
) {

    if (!actor) {

        return [];

    }


    return Array.from(
        actor.items ?? []
    )
        .filter(
            item =>
                item.type === "talent"
        )
        .map(
            item => ({

                id:
                    item.id,

                name:
                    item.name,

                key:
                    resolveTalentKey(item),

                level:
                    item.system?.level
                    ?? 1,

                configuration:
                    item.system?.configuration
                    ?? {}

            })
        );

}


/* ============================================================
 * SERVICE
 * ============================================================ */


export class SkillRollPreparationService {


    static create(
        actor,
        {
            attribute,
            skill,

            circumstances = [],
            effects = [],
            equipmentModifiers = [],
            manualBonus = 0,
            manualPenalty = 0,

            metadata = {}
        } = {}
    ) {

        if (!actor) {

            throw new TypeError(
                "Un Actor est requis pour préparer un jet de Compétence."
            );

        }


        if (
            typeof attribute !== "string"
            || attribute.trim().length === 0
        ) {

            throw new TypeError(
                "Un Attribut est requis pour préparer un jet de Compétence."
            );

        }


        if (
            typeof skill !== "string"
            || skill.trim().length === 0
        ) {

            throw new TypeError(
                "Une Compétence est requise pour préparer un jet de Compétence."
            );

        }


        const talents =
            getActorTalents(
                actor
            );


        const context =
            createActionResolutionContext({

                actionType:
                    ACTION_RESOLUTION_TYPES
                        .SKILL_ROLL,

                actorId:
                    actor.id,

                attribute,

                skill,

                metadata

            });


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

                        manualBonus,

                        manualPenalty
                    }
                );


        return {

            actor,

            talents,

            context,

            preparation

        };

    }


}