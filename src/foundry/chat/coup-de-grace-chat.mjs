/**
 * Message de Chat du COUP DE GRÂCE (p.200).
 *
 * Même patron que TerrorRollChat : un ChatMessage « en attente »
 * est créé par PJ sélectionné par le MJ ; le jet (le cas
 * échéant) et l'application des coûts n'ont lieu qu'au clic sur
 * le bouton « Coup de grâce », réservé au propriétaire de
 * l'Acteur (le MJ, toujours propriétaire pour Foundry, compris).
 * La carte est verrouillée après résolution (usage unique).
 *
 * La règle pure est dans domain/rules/coup-de-grace.mjs ; ce
 * module dépend de l'API Foundry et n'est pas testé
 * unitairement, par convention du projet.
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
    COUP_DE_GRACE_VERDICTS,
    requiresEmpathyRoll,
    resolveCoupDeGrace
} from "../../domain/rules/coup-de-grace.mjs";

import {
    updateChatMessageAsGM
} from "./gm-message-relay.mjs";

import {
    rollPhysicalDice,
    createDieDrawer
} from "../rolls/physical-dice-roller.mjs";


const SYSTEM_ID =
    "metro-2033-yze";

const MESSAGE_FLAG =
    "coupDeGrace";


function escapeHTML(
    value
) {

    return foundry.utils.escapeHTML(
        String(
            value ?? ""
        )
    );

}


export class CoupDeGraceChat {


    /**
     * Crée, pour UN PJ, le ChatMessage « en attente ».
     */
    static async createPendingMessage({
        actor,
        text
    } = {}) {

        if (!actor) {

            throw new TypeError(
                "Un Acteur est requis."
            );

        }


        const flagData = {

            actorUuid:
                actor.uuid,

            actorName:
                actor.name,

            text:
                String(text ?? ""),

            resolved:
                false

        };


        return ChatMessage.create({

            speaker:
                ChatMessage.getSpeaker({
                    actor
                }),

            content:
                this.renderContent(
                    flagData
                ),

            flags: {

                [SYSTEM_ID]: {

                    [MESSAGE_FLAG]:
                        flagData

                }

            }

        });

    }


    static getFlagData(
        message
    ) {

        return message?.getFlag(
            SYSTEM_ID,
            MESSAGE_FLAG
        )
        ?? null;

    }


    /**
     * Carte de Chat, état en attente ou résolu.
     */
    static renderContent(
        flagData
    ) {

        const header = `
            <header class="metro-chat-survival-card-header">
                <strong>${escapeHTML(flagData?.actorName)} : ${escapeHTML(flagData?.text)}</strong>
            </header>
        `;


        if (!flagData?.resolved) {

            return `
                <div class="metro-chat-survival-card metro-chat-coup-de-grace-card">
                    ${header}
                    <div class="metro-chat-actions">
                        <button
                            type="button"
                            class="metro-chat-button"
                            data-action="coup-de-grace"
                        >
                            <i class="fa-solid fa-skull"></i> Coup de grâce
                        </button>
                    </div>
                </div>
            `;

        }


        const executed =
            flagData.verdict
                === COUP_DE_GRACE_VERDICTS.EXECUTED;


        const diceLine =
            flagData.rolled
                ? `<div class="metro-chat-survival-card-dice">Jet d'EMPATHIE (dés d'attribut) : ${
                    (flagData.diceValues ?? []).length
                        ? escapeHTML(flagData.diceValues.join(", "))
                        : "—"
                } — ${escapeHTML(flagData.empathySuccesses)} réussite(s)</div>`
                : `<div class="metro-chat-survival-card-dice">Impitoyable : aucun jet d'EMPATHIE.</div>`;


        const costs = [];

        if (flagData.empathyDamage > 0) {

            costs.push(
                `${escapeHTML(flagData.empathyDamage)} point de dégâts à l'EMPATHIE`
            );

        }

        if (flagData.composureChecks > 0) {

            costs.push(
                `${escapeHTML(flagData.composureChecks)} case de Sang-froid cochée`
            );

        }


        const verdict =
            executed
                ? "Coup de grâce porté."
                : "Le personnage n'y parvient pas.";

        const costLine =
            costs.length > 0
                ? `Coûts : ${costs.join(", ")}.`
                : "Aucun coût.";


        return `
            <div class="metro-chat-survival-card metro-chat-coup-de-grace-card">
                ${header}
                ${diceLine}
                <div class="metro-chat-survival-card-summary">
                    <strong>${verdict}</strong> ${costLine}
                </div>
            </div>
        `;

    }


    /**
     * Résout le coup de grâce du PJ ciblé par ce message.
     *
     * Rejette si déjà résolu ou si le compte appelant n'est pas
     * propriétaire de l'Acteur.
     */
    static async resolve(
        message
    ) {

        const flagData =
            this.getFlagData(
                message
            );


        if (!flagData) {

            throw new Error(
                "Ce message n'est pas un coup de grâce."
            );

        }


        if (flagData.resolved) {

            throw new Error(
                "Ce coup de grâce a déjà été résolu."
            );

        }


        const actor =
            await fromUuid(
                flagData.actorUuid
            );


        if (!actor) {

            throw new Error(
                "Le personnage concerné par ce coup de grâce est introuvable."
            );

        }


        if (!actor.isOwner) {

            throw new Error(
                "Vous ne pouvez pas porter ce coup de grâce pour ce personnage."
            );

        }


        const hasRuthless =
            actor.hasTalent(
                TALENT_IDENTITIES.RUTHLESS
            );


        let empathySuccesses;

        let diceValues = [];

        let physicalRoll = null;


        if (
            requiresEmpathyRoll({
                hasRuthless
            })
        ) {

            // Dés d'attribut UNIQUEMENT : ni compétence, ni
            // Stress ; jamais forçable (aucun Push câblé).
            const pool =
                new DicePool({
                    attribute:
                        Math.max(
                            0,
                            Math.trunc(
                                Number(
                                    actor.getAttribute("empathy")
                                    ?? 0
                                )
                            )
                        )
                });


            const diceToRoll =
                YZERoll.countInitialDiceToRoll(
                    pool
                );


            const rolled =
                await rollPhysicalDice({

                    normal:
                        diceToRoll.normal,

                    stress:
                        0

                });


            physicalRoll =
                rolled.roll;


            const drawDie =
                rolled.values.length > 0
                    ? createDieDrawer(
                        rolled.values
                    )
                    : null;


            const roll =
                YZERoll.roll(
                    pool,
                    {
                        type:
                            "coup-de-grace",

                        actorId:
                            actor.id,

                        actorUuid:
                            actor.uuid
                    },
                    {
                        drawDie
                    }
                );


            empathySuccesses =
                roll.successes;

            diceValues = [
                ...roll.dice.attribute
            ];

        }


        const outcome =
            resolveCoupDeGrace({
                hasRuthless,
                empathySuccesses
            });


        const updatedFlagData = {

            ...flagData,

            resolved:
                true,

            rolled:
                outcome.rolled,

            diceValues,

            empathySuccesses:
                outcome.empathySuccesses,

            verdict:
                outcome.verdict,

            empathyDamage:
                outcome.empathyDamage,

            composureChecks:
                outcome.composureChecks

        };


        /*
         * Mise à jour de la carte EN PREMIER : elle peut passer
         * par un MJ (un joueur n'est pas l'auteur du message) et
         * échouer (« Aucun MJ actif ») ; dans ce cas aucun coût
         * n'est appliqué et la carte reste cliquable.
         */
        await updateChatMessageAsGM(message, {

            content:
                this.renderContent(
                    updatedFlagData
                ),

            ...(
                physicalRoll
                    ? {
                        rolls:
                            [physicalRoll],
                        sound:
                            CONFIG.sounds.dice
                    }
                    : {}
            ),

            [`flags.${SYSTEM_ID}.${MESSAGE_FLAG}`]:
                updatedFlagData

        });


        if (outcome.empathyDamage > 0) {

            await actor.takeAttributeDamage(
                "empathy",
                outcome.empathyDamage
            );

        }


        if (outcome.composureChecks > 0) {

            await actor.addComposure(
                outcome.composureChecks
            );

        }


        return {
            actor,
            outcome
        };

    }

}
