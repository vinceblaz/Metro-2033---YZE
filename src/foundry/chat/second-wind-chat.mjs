/**
 * Exécution du Talent SECOND SOUFFLE (bouton de la fiche
 * Personnage, onglet Survie, sous le bouton « Repos »).
 *
 * Jet d'ENDURANCE avec UNIQUEMENT les dés de compétence (aucun
 * dé d'attribut, aucun dé de Stress), non forçable, dés
 * physiques Foundry. Chaque réussite rend 1 point de VIGUEUR,
 * plafonné au maximum. Une carte de Chat présente les dés et le
 * résultat.
 *
 * Dépend de l'API Foundry (ChatMessage, Roll) : non testé
 * unitairement. La règle pure est dans
 * domain/rules/second-wind.mjs.
 */

import {
    DicePool
} from "../../domain/rolls/dice-pool.mjs";

import {
    YZERoll
} from "../../domain/rolls/yze-roll.mjs";

import {
    TALENT_IDENTITIES
} from "../../domain/rules/talent-identity.mjs";

import {
    isSecondWindAvailable,
    resolveSecondWind
} from "../../domain/rules/second-wind.mjs";

import {
    rollPhysicalDice,
    createDieDrawer
} from "../rolls/physical-dice-roller.mjs";


function escapeHTML(
    value
) {

    return foundry.utils.escapeHTML(
        String(
            value ?? ""
        )
    );

}


export class SecondWindChat {


    /**
     * Carte de Chat du résultat.
     */
    static renderContent({
        diceValues,
        successes,
        recovered,
        vigor,
        vigorMax
    }) {

        const diceList =
            diceValues.length
                ? escapeHTML(diceValues.join(", "))
                : "—";

        const summary =
            recovered > 0
                ? `${escapeHTML(successes)} réussite(s) — `
                    + `${escapeHTML(recovered)} point(s) de VIGUEUR récupéré(s) `
                    + `(${escapeHTML(vigor)} / ${escapeHTML(vigorMax)}).`
                : "Aucune réussite — aucun point de VIGUEUR récupéré.";

        return `
            <div class="metro-chat-survival-card metro-chat-second-wind-card">
                <header class="metro-chat-survival-card-header">
                    <strong>Second souffle (ENDURANCE, dés de compétence)</strong>
                </header>
                <div class="metro-chat-survival-card-dice">Dés : ${diceList}</div>
                <div class="metro-chat-survival-card-summary">${summary}</div>
            </div>
        `;

    }


    /**
     * Exécute le Talent pour l'Actor donné.
     *
     * Refuse si l'Actor n'a pas le Talent ou n'est pas Brisé
     * (VIGUEUR à 0). L'usage unique par état Brisé n'est pas
     * suivi : le MJ et le joueur en restent garants.
     */
    static async execute(
        actor
    ) {

        if (!actor) {

            throw new TypeError(
                "Un Acteur est requis."
            );

        }


        const hasTalent =
            actor.hasTalent(
                TALENT_IDENTITIES.SECOND_WIND
            );

        const currentVigor =
            Number(
                actor.getAttribute("vigor")
            );


        if (
            !isSecondWindAvailable({
                hasTalent,
                vigor:
                    currentVigor
            })
        ) {

            throw new Error(
                "Second souffle n'est utilisable que par un personnage Brisé (VIGUEUR à 0) possédant ce Talent."
            );

        }


        const skillDice =
            Math.max(
                0,
                Math.trunc(
                    Number(
                        actor.getSkill("endurance")
                        ?? 0
                    )
                )
            );


        // Dés de compétence UNIQUEMENT : ni attribut, ni Stress.
        const pool =
            new DicePool({
                skill:
                    skillDice
            });


        const diceToRoll =
            YZERoll.countInitialDiceToRoll(
                pool
            );


        const {
            roll: physicalRoll,
            values: physicalDiceValues
        } =
            await rollPhysicalDice({

                normal:
                    diceToRoll.normal,

                stress:
                    0

            });


        const drawDie =
            physicalDiceValues.length > 0
                ? createDieDrawer(
                    physicalDiceValues
                )
                : null;


        // Jamais forçable : aucun Push n'est proposé ni câblé.
        const roll =
            YZERoll.roll(
                pool,
                {
                    type:
                        "second-wind",

                    actorId:
                        actor.id,

                    actorUuid:
                        actor.uuid
                },
                {
                    drawDie
                }
            );


        const vigorMax =
            Number(
                actor.getAttributeMax("vigor")
                ?? 0
            );


        const outcome =
            resolveSecondWind({
                successes:
                    roll.successes,
                vigor:
                    currentVigor,
                vigorMax
            });


        if (outcome.recovered > 0) {

            await actor.recoverAttribute(
                "vigor",
                outcome.recovered
            );

        }


        const diceValues = [
            ...roll.dice.skill
        ];


        await ChatMessage.create({

            speaker:
                ChatMessage.getSpeaker({
                    actor
                }),

            content:
                this.renderContent({
                    diceValues,
                    successes:
                        outcome.successes,
                    recovered:
                        outcome.recovered,
                    vigor:
                        outcome.vigor,
                    vigorMax
                }),

            ...(
                physicalRoll
                    ? {
                        rolls:
                            [physicalRoll],
                        sound:
                            CONFIG.sounds.dice
                    }
                    : {}
            )

        });


        return {
            actor,
            roll,
            outcome
        };

    }

}
