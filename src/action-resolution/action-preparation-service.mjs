/**
 * Préparation générique d'une résolution d'action.
 *
 * Responsabilités :
 *
 * - résoudre les valeurs de base de l'Actor ;
 * - collecter les sources applicables ;
 * - construire l'ActionModifierPreparation.
 *
 * Ce service :
 *
 * - ne construit pas l'ActionResolutionContext ;
 * - n'affiche aucune UI ;
 * - ne lance aucun dé ;
 * - ne consomme aucune action ;
 * - ne modifie aucun Document Foundry.
 */


import {
    resolveActionBase,
    getActorAttributeValue
} from "./action-base-resolver.mjs";


import {
    collectActionSources
} from "./action-modifier-sources.mjs";


import {
    ActionModifierService
} from "./action-modifier-service.mjs";


import {
    evaluateTalentsForAction,
    TALENT_EFFECT_TYPES
} from "../domain/rules/talents.mjs";


/* ============================================================
 * ATTRIBUT ALTERNATIF (Esquive, Sens du danger, Menaçant)
 * ============================================================ */


/**
 * Recherche, parmi les Talents de l'Actor, un effet
 * ATTRIBUTE_SWAP pertinent pour ce contexte (Esquive, Sens du
 * danger, Menaçant) et résout le score de l'Attribut alternatif
 * sur l'Actor.
 *
 * Au plus un seul de ces Talents est pertinent pour un contexte
 * donné (ils ciblent chacun une action/Compétence distincte),
 * donc une seule option est retournée.
 *
 * Toujours `selected: false` par défaut : c'est un effet
 * « au choix », jamais appliqué automatiquement.
 */
function resolveTalentAttributeSwapOption(
    actor,
    talents,
    context
) {

    const evaluatedTalents =
        evaluateTalentsForAction(
            talents,
            context
        );


    for (
        const talent
        of evaluatedTalents
    ) {

        const swapEffect =
            talent.effects.find(
                effect =>
                    effect.type
                        === TALENT_EFFECT_TYPES
                            .ATTRIBUTE_SWAP
            );


        if (!swapEffect) {

            continue;

        }


        return {

            talentKey:
                talent.key,

            talentLabel:
                talent.label,

            attribute:
                swapEffect.attribute,

            value:
                getActorAttributeValue(
                    actor,
                    swapEffect.attribute
                ),

            conditionState:
                talent.conditionState,

            selected:
                false,

            editable:
                true

        };

    }


    return null;

}


/* ============================================================
 * SERVICE
 * ============================================================ */


export class ActionPreparationService {


    /**
     * Construit la préparation générique d'une action.
     */
    static create(
        actor,
        context,
        {
            talents = [],
            circumstances = [],
            effects = [],
            equipmentModifiers = [],
            weaponMods = [],
            manualBonus = 0,
            manualPenalty = 0
        } = {}
    ) {

        if (!actor) {

            throw new TypeError(
                "Un Actor est requis pour préparer une action."
            );

        }


        if (!context) {

            throw new TypeError(
                "Un contexte de résolution est requis pour préparer une action."
            );

        }


        const base =
            resolveActionBase(
                actor,
                context
            );


        const sources =
            collectActionSources(
                actor,
                context
            );


        const attributeSwap =
            resolveTalentAttributeSwapOption(
                actor,
                talents,
                context
            );


        return (
            ActionModifierService
                .createPreparation({

                    context,

                    talents,

                    circumstances,

                    effects,

                    equipmentModifiers,

                    weaponMods,

                    manualBonus,

                    manualPenalty,

                    base,

                    sources,

                    attributeSwap

                })
        );

    }


}