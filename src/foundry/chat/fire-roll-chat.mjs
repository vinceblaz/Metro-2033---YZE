/**
 * Message de Chat du Feu (p.203).
 *
 * Même architecture que le jet d'Asphyxie
 * (asphyxiation-roll-chat.mjs) : le MJ lance la macro, un
 * ChatMessage « en attente » est créé par Acteur exposé, résolu
 * au clic par le joueur propriétaire (mise à jour de la carte via
 * le relais MJ) ou par le MJ.
 *
 * Mécanique du livre :
 * - on jette un nombre de dés égal à l'Intensité (jet non
 *   forçable, aucun Push, aucune affliction) ;
 * - chaque réussite = 1 point de dégâts à la VIGUEUR ;
 * - la Protection réduit ces dégâts, sans la résilience ;
 * - si des dégâts subsistent, l'Acteur prend feu (état « En
 *   feu ») ; l'Intensité est mémorisée sur l'Acteur ;
 * - en combat, au début de chaque round, `rollAndPost` rejoue
 *   l'« attaque » du feu avec +1 d'Intensité, automatiquement
 *   (cf. metro-fire-hooks.mjs) ; sans dégâts, le feu s'éteint
 *   de lui-même ;
 * - extinction par un jet réussi de RÉACTION (bouton de la
 *   carte) ;
 * - Brisé par le feu : avertissement « jet de Trépas requis »
 *   (le jet reste lancé à la main — décision du porteur du
 *   projet).
 *
 * Limites assumées : la dégradation de la Protection par le feu
 * n'est pas appliquée (le livre n'en dit rien) ; hors combat, le
 * MJ rejoue ou éteint à la main.
 */

import {
    DicePool
} from "../../domain/rolls/dice-pool.mjs";

import {
    YZERoll
} from "../../domain/rolls/yze-roll.mjs";

import {
    FIRE_STATUS_EFFECT,
    isFireDeathRollRequired,
    isFireExtinguishSuccess,
    normalizeFireIntensity,
    resolveFireOutcome
} from "../../domain/rules/fire.mjs";

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
    "fireRoll";

/**
 * Flag d'Actor : Intensité de la dernière « attaque » du feu
 * subie, lue par le round automatique pour calculer la suivante.
 */
export const FIRE_INTENSITY_ACTOR_FLAG =
    "fireIntensity";


function escapeHTML(
    value
) {

    return foundry.utils.escapeHTML(
        String(
            value ?? ""
        )
    );

}


export class FireRollChat {

    /**
     * Crée, pour UN Acteur exposé, le ChatMessage « en
     * attente » (aucun jet effectué).
     */
    static async createPendingMessage({
        actor,
        intensity,
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
            sourceLabel,
            intensity:
                normalizeFireIntensity(
                    intensity
                ),
            rolled:
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


    static renderContent(
        flagData
    ) {

        const sourceLabel =
            flagData?.sourceLabel
                ? ` — ${escapeHTML(flagData.sourceLabel)}`
                : "";

        const title =
            `Feu${sourceLabel} (Intensité ${escapeHTML(flagData?.intensity)})`;

        if (!flagData?.rolled) {

            return `
                <div class="metro-chat-survival-card metro-chat-fire-roll-card">
                    <header class="metro-chat-survival-card-header">
                        <strong>${title}</strong>
                    </header>
                    <div class="metro-chat-survival-card-summary">
                        Jet de ${escapeHTML(flagData?.intensity)} dés.
                        Chaque réussite : 1 point de dégâts à la
                        VIGUEUR, réduit par la Protection (sans
                        résilience).
                    </div>
                    <div class="metro-chat-actions">
                        <button
                            type="button"
                            class="metro-chat-button"
                            data-action="roll-fire"
                        >
                            Subir le feu
                        </button>
                    </div>
                </div>
            `;

        }

        const diceList =
            (flagData.diceValues ?? []).length
                ? escapeHTML(flagData.diceValues.join(", "))
                : "—";

        const prevented =
            Number(flagData.successes ?? 0)
            - Number(flagData.remainingDamage ?? 0);

        let summary;

        if (flagData.ignites) {

            summary =
                `${escapeHTML(flagData.successes)} réussite(s)`
                + (
                    prevented > 0
                        ? `, ${escapeHTML(prevented)} absorbée(s) par la Protection`
                        : ""
                )
                + ` — ${escapeHTML(flagData.remainingDamage)} point(s) de `
                + "dégâts à la VIGUEUR. Le personnage brûle.";

        }
        else if (flagData.ongoing) {

            summary =
                "Aucun dégât : le feu s'éteint de lui-même.";

        }
        else {

            summary =
                `${escapeHTML(flagData.successes)} réussite(s) — `
                + "aucun dégât : le personnage ne prend pas feu.";

        }

        const deathRoll =
            flagData.deathRollRequired
                ? `
                    <div class="metro-chat-survival-card-summary">
                        <strong>Brisé par le feu : un jet de Trépas est
                        requis à chaque round</strong> (à lancer à la
                        main, jusqu'à la mort ou jusqu'à l'intervention
                        des camarades).
                    </div>
                `
                : "";

        const extinguish =
            flagData.ignites
                ? `
                    <div class="metro-chat-actions">
                        <button
                            type="button"
                            class="metro-chat-button"
                            data-action="extinguish-fire"
                        >
                            Tenter d'éteindre (RÉACTION)
                        </button>
                    </div>
                `
                : "";

        return `
            <div class="metro-chat-survival-card metro-chat-fire-roll-card">
                <header class="metro-chat-survival-card-header">
                    <strong>${title}</strong>
                </header>
                <div class="metro-chat-survival-card-dice">Dés : ${diceList}</div>
                <div class="metro-chat-survival-card-summary">${summary}</div>
                ${deathRoll}
                ${extinguish}
            </div>
        `;

    }


    // ============================================================
    // « ATTAQUE » DU FEU
    // ============================================================

    /**
     * Jette l'Intensité, applique la Protection (sans résilience)
     * et les dégâts de VIGUEUR, puis pose l'état « En feu » et
     * mémorise l'Intensité si l'Acteur est blessé.
     *
     * N'ouvre aucune fenêtre : le feu n'admet ni Push, ni dé de
     * Stress, ni modificateur.
     */
    static async _attack(
        actor,
        {
            intensity
        } = {}
    ) {

        const pool =
            new DicePool({
                attribute:
                    normalizeFireIntensity(
                        intensity
                    )
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
                    diceToRoll.stress
            });

        const drawDie =
            physicalDiceValues.length > 0
                ? createDieDrawer(
                    physicalDiceValues
                )
                : null;

        const roll =
            YZERoll.roll(
                pool,
                {
                    type:
                        "fire-roll",
                    actorId:
                        actor.id,
                    actorUuid:
                        actor.uuid
                },
                {
                    drawDie
                }
            );

        if (physicalRoll) {
            roll.physicalRoll =
                physicalRoll;
        }

        const successes =
            roll.successes;

        // Protection : la résilience ne compte pas (p.203).
        let remainingDamage =
            successes;

        if (successes > 0) {

            const protection =
                actor.rollProtection(
                    successes,
                    {
                        ignoreWornResilience:
                            true
                    }
                );

            remainingDamage =
                Math.min(
                    successes,
                    Math.max(
                        0,
                        Number(
                            protection.remainingDamage
                        )
                    )
                );

        }

        const outcome =
            resolveFireOutcome({
                successes,
                remainingDamage
            });

        let vigorAfter =
            actor.getAttribute(
                "vigor"
            );

        if (outcome.remainingDamage > 0) {

            const damage =
                await actor.takeAttributeDamage(
                    "vigor",
                    outcome.remainingDamage
                );

            vigorAfter =
                damage.current;

        }

        const diceValues = [
            ...roll.dice.attribute,
            ...roll.dice.skill,
            ...roll.dice.equipment,
            ...roll.dice.bonus
        ];

        return {
            roll,
            outcome,
            diceValues,
            deathRollRequired:
                isFireDeathRollRequired({
                    remainingDamage:
                        outcome.remainingDamage,
                    vigorAfter
                })
        };

    }


    static async _setBurning(
        actor,
        intensity
    ) {

        try {

            await actor.setFlag(
                SYSTEM_ID,
                FIRE_INTENSITY_ACTOR_FLAG,
                intensity
            );

        }
        catch (error) {
            // Best-effort : n'empêche jamais l'application du dégât.
        }

        try {

            await actor.toggleStatusEffect(
                FIRE_STATUS_EFFECT.id,
                { active: true }
            );

        }
        catch (error) {
            // Best-effort : pas de Token lié, par exemple.
        }

    }


    static async _extinguish(
        actor
    ) {

        try {

            await actor.unsetFlag(
                SYSTEM_ID,
                FIRE_INTENSITY_ACTOR_FLAG
            );

        }
        catch (error) {
            // Best-effort.
        }

        try {

            await actor.toggleStatusEffect(
                FIRE_STATUS_EFFECT.id,
                { active: false }
            );

        }
        catch (error) {
            // Best-effort.
        }

    }


    // ============================================================
    // CLIC DU JOUEUR
    // ============================================================

    /**
     * Résout une carte « en attente » au clic du propriétaire de
     * l'Acteur ou du MJ.
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
                "Ce message n'est pas un jet de Feu."
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
                "L'Acteur ciblé par ce jet de Feu est introuvable."
            );

        }

        if (!actor.isOwner) {

            throw new Error(
                "Vous ne pouvez pas subir ce jet pour cet Acteur."
            );

        }

        /*
         * Vérifié AVANT le jet et les dégâts (irréversibles) :
         * un MJ actif doit pouvoir mettre la carte à jour.
         */
        assertChatMessageUpdatable(
            message
        );

        const {
            roll,
            outcome,
            diceValues,
            deathRollRequired
        } =
            await this._attack(
                actor,
                {
                    intensity:
                        flagData.intensity
                }
            );

        if (outcome.ignites) {

            await this._setBurning(
                actor,
                flagData.intensity
            );

        }

        const updatedFlagData = {
            ...flagData,
            rolled:
                true,
            diceValues,
            successes:
                outcome.successes,
            remainingDamage:
                outcome.remainingDamage,
            ignites:
                outcome.ignites,
            deathRollRequired
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
            outcome,
            roll
        };

    }


    // ============================================================
    // ROUND DE COMBAT (AUTOMATIQUE)
    // ============================================================

    /**
     * Rejoue l'« attaque » du feu pour un Acteur qui brûle et
     * publie directement le résultat. Sans dégât, le feu
     * s'éteint de lui-même.
     */
    static async rollAndPost({
        actor,
        intensity,
        sourceLabel = null
    } = {}) {

        if (!actor) {

            throw new TypeError(
                "Un Acteur cible est requis."
            );

        }

        const normalized =
            normalizeFireIntensity(
                intensity
            );

        const {
            roll,
            outcome,
            diceValues,
            deathRollRequired
        } =
            await this._attack(
                actor,
                {
                    intensity:
                        normalized
                }
            );

        if (outcome.ignites) {

            await this._setBurning(
                actor,
                normalized
            );

        }
        else {

            await this._extinguish(
                actor
            );

        }

        const flagData = {
            actorUuid:
                actor.uuid,
            sourceLabel,
            intensity:
                normalized,
            rolled:
                true,
            diceValues,
            successes:
                outcome.successes,
            remainingDamage:
                outcome.remainingDamage,
            ignites:
                outcome.ignites,
            deathRollRequired,
            // Carte de round : jamais relayée, champ libre.
            ongoing:
                true
        };

        const rolls =
            roll.physicalRoll
                ? [roll.physicalRoll]
                : undefined;

        return ChatMessage.create({
            speaker:
                ChatMessage.getSpeaker({
                    actor
                }),
            content:
                this.renderContent(
                    flagData
                ),
            ...(
                rolls
                    ? {
                        rolls,
                        sound:
                            CONFIG.sounds.dice
                    }
                    : {}
            ),
            flags: {
                [SYSTEM_ID]: {
                    [MESSAGE_FLAG]:
                        flagData
                }
            }
        });

    }


    // ============================================================
    // EXTINCTION
    // ============================================================

    /**
     * Jet de RÉACTION (action lente) pour éteindre le feu de
     * l'Acteur brûlant. La victime lance elle-même ; le MJ peut
     * faire agir un camarade au contact en sélectionnant son
     * Token. Une réussite retire l'état « En feu ».
     *
     * Retourne null si la victime ne brûle plus.
     */
    static async attemptExtinguish(
        message
    ) {

        const flagData =
            this.getFlagData(
                message
            );

        if (!flagData) {

            throw new Error(
                "Ce message n'est pas un jet de Feu."
            );

        }

        const victim =
            await fromUuid(
                flagData.actorUuid
            );

        if (!victim) {

            throw new Error(
                "L'Acteur en feu est introuvable."
            );

        }

        if (!victim.statuses?.has(FIRE_STATUS_EFFECT.id)) {

            ui.notifications?.info(
                `${victim.name} ne brûle plus.`
            );

            return null;

        }

        if (!victim.isOwner) {

            throw new Error(
                "Seul le propriétaire du personnage en feu ou le MJ peut tenter de l'éteindre."
            );

        }

        let actingActor =
            victim;

        if (game.user.isGM) {

            const controlled =
                canvas?.tokens?.controlled ?? [];

            if (
                controlled.length === 1
                && controlled[0].actor
            ) {

                actingActor =
                    controlled[0].actor;

            }

        }

        const result =
            await actingActor.rollSkill(
                "reaction",
                {
                    context: {
                        action:
                            "fire-extinguish"
                    }
                }
            );

        const success =
            isFireExtinguishSuccess(
                result.successes
            );

        if (success) {

            await this._extinguish(
                victim
            );

        }

        const diceValues = [
            ...result.dice.attribute,
            ...result.dice.skill,
            ...result.dice.equipment,
            ...result.dice.bonus
        ];

        const helper =
            actingActor.id === victim.id
                ? `${escapeHTML(victim.name)} tente d'éteindre le feu qui le consume`
                : `${escapeHTML(actingActor.name)} tente d'éteindre le feu de ${escapeHTML(victim.name)}`;

        const rolls =
            result.physicalRoll
                ? [result.physicalRoll]
                : undefined;

        await ChatMessage.create({
            speaker:
                ChatMessage.getSpeaker({
                    actor:
                        actingActor
                }),
            content: `
                <div class="metro-chat-survival-card metro-chat-fire-roll-card">
                    <header class="metro-chat-survival-card-header">
                        <strong>Extinction du feu (RÉACTION)</strong>
                    </header>
                    <div class="metro-chat-survival-card-dice">
                        Dés : ${escapeHTML(diceValues.join(", ") || "—")}
                    </div>
                    <div class="metro-chat-survival-card-summary">
                        ${helper} — ${
                            success
                                ? "réussite : le feu est éteint."
                                : "échec : le feu continue de brûler."
                        }
                    </div>
                </div>
            `,
            ...(
                rolls
                    ? {
                        rolls,
                        sound:
                            CONFIG.sounds.dice
                    }
                    : {}
            )
        });

        return {
            success,
            result
        };

    }

}


registerRelayContentRenderer(
    MESSAGE_FLAG,
    flagData =>
        FireRollChat.renderContent(
            flagData
        )
);
