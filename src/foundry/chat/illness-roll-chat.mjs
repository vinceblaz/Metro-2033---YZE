/**
 * Message de Chat du jet de Maladie (p.204).
 *
 * Architecture légère, à l'image du jet de Poison
 * (poison-roll-chat.mjs) : un ChatMessage « en attente » par
 * Acteur ciblé, résolu au clic par le joueur concerné ou le MJ.
 *
 * C'est un jet en OPPOSITION : la victime lance ENDURANCE
 * (Attribut VIGUEUR + Compétence Endurance), la maladie lance un
 * nombre de dés égal à sa Virulence (aucun Attribut/Compétence,
 * cf. `domain/rules/illness.mjs`). Les deux jets sont effectués
 * l'un après l'autre lors du même clic et présentés ensemble sur
 * la carte.
 *
 * Push (ajouté le 03/10/2026, mêmes décisions que pour le Poison —
 * cf. poison-roll-chat.mjs, en-tête) : seule la victime peut
 * forcer son jet d'ENDURANCE (1er Push gratuit, 2e payé 1 point de
 * Stress, jamais de 3e — via `actor.pushRoll()`) ; le jet de la
 * maladie elle-même n'est jamais relancé. Le clic sur « Subir le
 * jet » effectue les deux jets et les affiche, mais l'application
 * de l'issue est différée jusqu'à « Pousser » ou « Accepter le
 * résultat ».
 *
 * À la différence du Poison, ce jet ne connaît pas d'« effets
 * réduits » : une victoire ou une égalité de la victime n'inflige
 * strictement aucun effet. Seul un échec (la maladie l'emporte
 * strictement) rend la victime Malade : 1 point de dégâts
 * immédiat à la VIGUEUR et à l'AGILITÉ, et pose de l'état
 * « Malade » (icône sur le Token), retiré manuellement par le MJ
 * (cf. périmètre détaillé dans `domain/rules/illness.mjs` : le
 * cycle quotidien, la contagion et le soutien médical restent
 * entièrement manuels, non automatisés par ce module).
 */

import {
    DicePool
} from "../../domain/rolls/dice-pool.mjs";

import {
    YZERoll
} from "../../domain/rolls/yze-roll.mjs";

import {
    ILLNESS_STATUS_EFFECT,
    computeIllnessOpposedPools,
    resolveIllnessOpposition
} from "../../domain/rules/illness.mjs";

import {
    serializeRollResult,
    deserializeRollResult
} from "./yze-roll-chat.mjs";

import {
    assertChatMessageUpdatable,
    registerRelayContentRenderer,
    updateChatMessageAsGM
} from "./gm-message-relay.mjs";

import {
    rollPhysicalDice,
    createDieDrawer
} from "../rolls/physical-dice-roller.mjs";


const SYSTEM_ID =
    "metro-2033-yze";

const MESSAGE_FLAG =
    "illnessRoll";


function escapeHTML(
    value
) {

    return foundry.utils.escapeHTML(
        String(
            value ?? ""
        )
    );

}


/**
 * Extrait, à plat, toutes les valeurs de dés d'un YZEResult
 * (Attribut, Compétence, Équipement, Bonus, Stress) dans l'ordre
 * où elles ont été lancées — y compris le(s) dé(s) de Stress
 * qu'un second Push peut avoir ajoutés.
 */
function flattenDiceValues(
    result
) {

    return [
        ...(result?.dice?.attribute ?? []),
        ...(result?.dice?.skill ?? []),
        ...(result?.dice?.equipment ?? []),
        ...(result?.dice?.bonus ?? []),
        ...(result?.dice?.stress ?? [])
    ];

}


export class IllnessRollChat {


    /**
     * Crée, pour UN Acteur ciblé, le ChatMessage « en attente »
     * du jet de Maladie (aucun jet effectué).
     */
    static async createPendingMessage({
        actor,
        virulence,
        sourceLabel = null
    } = {}) {

        if (!actor) {

            throw new TypeError(
                "Un Acteur cible est requis."
            );

        }


        const flagData = {

            actorUuid:
                actor.uuid,

            virulence,

            sourceLabel,

            rolled:
                false,

            applied:
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
     * Génère le contenu HTML de la carte de Chat, dans l'un de ses
     * trois états : en attente, jets effectués (Push/Accepter en
     * attente), ou appliquée (verrouillée).
     */
    static renderContent(
        flagData
    ) {

        const sourceLabel =
            flagData?.sourceLabel
                ? ` — ${escapeHTML(flagData.sourceLabel)}`
                : "";


        if (!flagData?.rolled) {

            return `
                <div class="metro-chat-survival-card metro-chat-illness-roll-card">
                    <header class="metro-chat-survival-card-header">
                        <strong>Jet de Maladie${sourceLabel}</strong>
                    </header>
                    <div class="metro-chat-survival-card-summary">
                        Virulence ${escapeHTML(flagData?.virulence ?? 0)}.
                        Jet en opposition d'ENDURANCE contre la maladie.
                    </div>
                    <div class="metro-chat-actions">
                        <button
                            type="button"
                            class="metro-chat-button"
                            data-action="roll-illness"
                        >
                            Subir le jet
                        </button>
                    </div>
                </div>
            `;

        }


        const victimDiceList =
            (flagData.victimDiceValues ?? []).length
                ? escapeHTML(flagData.victimDiceValues.join(", "))
                : "—";

        const illnessDiceList =
            (flagData.illnessDiceValues ?? []).length
                ? escapeHTML(flagData.illnessDiceValues.join(", "))
                : "—";


        if (!flagData.applied) {

            const pushCount =
                flagData.victimResult?.pushCount
                ?? 0;

            const canPush =
                pushCount < 2;

            const pushUsesStress =
                pushCount === 1;

            const pushLabel =
                pushUsesStress
                    ? "Pousser (coûte 1 point de Stress)"
                    : "Pousser";

            return `
                <div class="metro-chat-survival-card metro-chat-illness-roll-card">
                    <header class="metro-chat-survival-card-header">
                        <strong>Jet de Maladie${sourceLabel}</strong>
                    </header>
                    <div class="metro-chat-survival-card-dice">
                        Vos dés : ${victimDiceList}
                        (${escapeHTML(flagData.victimSuccesses)} réussite(s))
                    </div>
                    <div class="metro-chat-survival-card-dice">
                        Dés de la maladie : ${illnessDiceList}
                        (${escapeHTML(flagData.illnessSuccesses)} réussite(s))
                    </div>
                    <div class="metro-chat-actions">
                        ${
                            canPush
                                ? `<button
                                    type="button"
                                    class="metro-chat-button"
                                    data-action="push-illness"
                                    data-use-stress="${pushUsesStress}"
                                >
                                    ${pushLabel}
                                </button>`
                                : ""
                        }
                        <button
                            type="button"
                            class="metro-chat-button"
                            data-action="accept-illness"
                        >
                            Accepter le résultat
                        </button>
                    </div>
                </div>
            `;

        }


        const summary =
            flagData.sick
                ? "La maladie l'emporte — vous tombez Malade : 1 point "
                    + "de dégâts à la VIGUEUR et à l'AGILITÉ. La maladie "
                    + "se déclarera le jour suivant (jet de Maladie "
                    + "quotidien, contagion, soutien médical — à gérer "
                    + "manuellement par le MJ)."
                : "Vous résistez à l'infection — aucun effet.";

        return `
            <div class="metro-chat-survival-card metro-chat-illness-roll-card">
                <header class="metro-chat-survival-card-header">
                    <strong>Jet de Maladie${sourceLabel}</strong>
                </header>
                <div class="metro-chat-survival-card-dice">
                    Vos dés : ${victimDiceList}
                    (${escapeHTML(flagData.victimSuccesses)} réussite(s))
                </div>
                <div class="metro-chat-survival-card-dice">
                    Dés de la maladie : ${illnessDiceList}
                    (${escapeHTML(flagData.illnessSuccesses)} réussite(s))
                </div>
                <div class="metro-chat-survival-card-summary">
                    ${summary}
                </div>
            </div>
        `;

    }


    /**
     * Applique l'issue du jet en opposition : en cas d'échec
     * (victime rendue Malade), 1 point de dégâts immédiat à la
     * VIGUEUR et à l'AGILITÉ, puis pose de l'état « Malade »
     * (best-effort, retrait manuel par le MJ). Aucun effet en cas
     * de réussite ou d'égalité (pas d'« effets réduits » pour ce
     * jet, à la différence du Poison).
     */
    static async _applyOutcome(
        actor,
        resolution
    ) {

        if (!resolution.sick) {
            return;
        }


        if (resolution.vigorDamage > 0) {

            await actor.takeAttributeDamage(
                "vigor",
                resolution.vigorDamage
            );

        }


        if (resolution.agilityDamage > 0) {

            await actor.takeAttributeDamage(
                "agility",
                resolution.agilityDamage
            );

        }


        try {

            await actor.toggleStatusEffect(
                ILLNESS_STATUS_EFFECT.id,
                { active: true }
            );

        }
        catch (error) {

            /*
             * Best-effort : pas de Token lié au moment du jet,
             * par exemple. Le dégât reste appliqué, seule l'icône
             * d'état est manquante.
             */

        }

    }


    /**
     * Résout une seule fois les DEUX pools (victime et maladie) du
     * jet en opposition subi par l'Acteur ciblé par ce message, et
     * les affiche sur la carte — SANS appliquer l'issue : le
     * joueur doit ensuite cliquer sur « Pousser » (son propre jet
     * uniquement) ou « Accepter le résultat » (cf. `push()` et
     * `accept()`) pour que l'issue soit effectivement appliquée.
     *
     * Rejette si le message est déjà résolu, ou si le compte
     * appelant n'est ni propriétaire de l'Acteur ni MJ.
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
                "Ce message n'est pas un jet de Maladie."
            );

        }


        if (flagData.rolled) {

            throw new Error(
                "Ce jet a déjà été effectué."
            );

        }


        const actor =
            await fromUuid(
                flagData.actorUuid
            );


        if (!actor) {

            throw new Error(
                "L'Acteur ciblé par ce jet de Maladie est introuvable."
            );

        }


        if (!actor.isOwner) {

            throw new Error(
                "Vous ne pouvez pas subir ce jet pour cet Acteur."
            );

        }


        // Carte créée par le MJ : un joueur la met à jour via le
        // relais MJ. Échec rapide AVANT tout jet / coût / effet.
        assertChatMessageUpdatable(
            message
        );


        const vigorAttribute =
            actor.system?.attributes?.vigor?.value
            ?? 0;

        const enduranceSkill =
            actor.system?.skills?.endurance
            ?? 0;


        const pools =
            computeIllnessOpposedPools({

                virulence:
                    flagData.virulence,

                vigorAttribute,

                enduranceSkill

            });


        const victimPool =
            new DicePool(
                pools.victim
            );

        const victimDiceToRoll =
            YZERoll.countInitialDiceToRoll(
                victimPool
            );

        const {
            roll: victimPhysicalRoll,
            values: victimPhysicalDiceValues
        } =
            await rollPhysicalDice({

                normal:
                    victimDiceToRoll.normal,

                stress:
                    victimDiceToRoll.stress

            });

        const victimDrawDie =
            victimPhysicalDiceValues.length > 0
                ? createDieDrawer(
                    victimPhysicalDiceValues
                )
                : null;


        const victimRoll =
            YZERoll.roll(
                victimPool,
                {
                    type:
                        "illness-roll-victim",

                    actorId:
                        actor.id,

                    actorUuid:
                        actor.uuid
                },
                {
                    drawDie:
                        victimDrawDie
                }
            );


        if (victimPhysicalRoll) {

            victimRoll.physicalRoll =
                victimPhysicalRoll;

        }


        const illnessPool =
            new DicePool(
                pools.illness
            );

        const illnessDiceToRoll =
            YZERoll.countInitialDiceToRoll(
                illnessPool
            );

        const {
            roll: illnessPhysicalRoll,
            values: illnessPhysicalDiceValues
        } =
            await rollPhysicalDice({

                normal:
                    illnessDiceToRoll.normal,

                stress:
                    illnessDiceToRoll.stress

            });

        const illnessDrawDie =
            illnessPhysicalDiceValues.length > 0
                ? createDieDrawer(
                    illnessPhysicalDiceValues
                )
                : null;


        const illnessRoll =
            YZERoll.roll(
                illnessPool,
                {
                    type:
                        "illness-roll-illness"
                },
                {
                    drawDie:
                        illnessDrawDie
                }
            );


        if (illnessPhysicalRoll) {

            illnessRoll.physicalRoll =
                illnessPhysicalRoll;

        }


        const updatedFlagData = {

            ...flagData,

            rolled:
                true,

            applied:
                false,

            victimResult:
                serializeRollResult(
                    victimRoll
                ),

            victimDiceValues:
                flattenDiceValues(
                    victimRoll
                ),

            victimSuccesses:
                victimRoll.successes,

            illnessDiceValues:
                flattenDiceValues(
                    illnessRoll
                ),

            illnessSuccesses:
                illnessRoll.successes

        };


        const rolls =
            [
                victimRoll.physicalRoll,
                illnessRoll.physicalRoll
            ].filter(Boolean);


        await updateChatMessageAsGM(message, {

            content:
                this.renderContent(
                    updatedFlagData
                ),

            ...(
                rolls.length > 0
                    ? {
                        rolls,
                        sound:
                            CONFIG.sounds.dice
                    }
                    : {}
            ),

            [`flags.${SYSTEM_ID}.${MESSAGE_FLAG}`]:
                updatedFlagData

        });


        return {
            actor,
            victimRoll,
            illnessRoll
        };

    }


    /**
     * Force (Push) le jet d'ENDURANCE de la victime. Le jet de la
     * maladie n'est jamais concerné : seule la victime peut Push
     * (décision actée le 03/10/2026).
     *
     * Toutes les règles de Push (1er gratuit, 2e payé en Stress,
     * jamais de 3e) restent entièrement déléguées à
     * `actor.pushRoll()`, exactement comme n'importe quel autre
     * jet de Compétence.
     */
    static async push(
        message,
        {
            useStress = false
        } = {}
    ) {

        const flagData =
            this.getFlagData(
                message
            );


        if (!flagData?.rolled) {

            throw new Error(
                "Ce jet n'a pas encore été effectué."
            );

        }


        if (flagData.applied) {

            throw new Error(
                "Ce jet a déjà été accepté et ne peut plus être forcé."
            );

        }


        const actor =
            await fromUuid(
                flagData.actorUuid
            );


        if (!actor) {

            throw new Error(
                "L'Acteur ciblé par ce jet de Maladie est introuvable."
            );

        }


        if (!actor.isOwner) {

            throw new Error(
                "Vous ne pouvez pas forcer ce jet pour cet Acteur."
            );

        }


        // Carte créée par le MJ : un joueur la met à jour via le
        // relais MJ. Échec rapide AVANT tout jet / coût / effet.
        assertChatMessageUpdatable(
            message
        );


        const victimResult =
            deserializeRollResult(
                flagData.victimResult
            );


        const pushedVictimResult =
            useStress
                ? await actor.pushRoll(
                    victimResult,
                    { useStress: true }
                )
                : await actor.pushRoll(
                    victimResult
                );


        const updatedFlagData = {

            ...flagData,

            victimResult:
                serializeRollResult(
                    pushedVictimResult
                ),

            victimDiceValues:
                flattenDiceValues(
                    pushedVictimResult
                ),

            victimSuccesses:
                pushedVictimResult.successes

        };


        await updateChatMessageAsGM(message, {

            content:
                this.renderContent(
                    updatedFlagData
                ),

            [`flags.${SYSTEM_ID}.${MESSAGE_FLAG}`]:
                updatedFlagData

        });


        return {
            actor,
            victimResult:
                pushedVictimResult
        };

    }


    /**
     * Accepte le résultat courant (après un éventuel Push) :
     * compare les réussites finales, applique l'issue (dégâts +
     * état « Malade » en cas d'échec), puis verrouille la carte.
     */
    static async accept(
        message
    ) {

        const flagData =
            this.getFlagData(
                message
            );


        if (!flagData?.rolled) {

            throw new Error(
                "Ce jet n'a pas encore été effectué."
            );

        }


        if (flagData.applied) {

            throw new Error(
                "Ce jet a déjà été accepté."
            );

        }


        const actor =
            await fromUuid(
                flagData.actorUuid
            );


        if (!actor) {

            throw new Error(
                "L'Acteur ciblé par ce jet de Maladie est introuvable."
            );

        }


        if (!actor.isOwner) {

            throw new Error(
                "Vous ne pouvez pas accepter ce jet pour cet Acteur."
            );

        }


        // Carte créée par le MJ : un joueur la met à jour via le
        // relais MJ. Échec rapide AVANT tout jet / coût / effet.
        assertChatMessageUpdatable(
            message
        );


        const resolution =
            resolveIllnessOpposition({

                victimSuccesses:
                    flagData.victimSuccesses,

                illnessSuccesses:
                    flagData.illnessSuccesses

            });


        const updatedFlagData = {

            ...flagData,

            applied:
                true,

            sick:
                resolution.sick

        };


        await updateChatMessageAsGM(message, {

            content:
                this.renderContent(
                    updatedFlagData
                ),

            [`flags.${SYSTEM_ID}.${MESSAGE_FLAG}`]:
                updatedFlagData

        });


        /*
         * Effets sur l'Acteur APRÈS la mise à jour de la carte
         * (cf. Coup de grâce) : si le relais MJ échoue, aucun
         * dégât ni état n'est appliqué et la carte reste
         * acceptable.
         */
        await this._applyOutcome(
            actor,
            resolution
        );


        return {
            actor,
            resolution
        };

    }

}


registerRelayContentRenderer(
    MESSAGE_FLAG,
    flagData =>
        IllnessRollChat.renderContent(
            flagData
        )
);
