/**
 * Message de Chat de l'attaque de Terreur (p.207).
 *
 * Architecture volontairement légère, à l'image du jet de
 * Trépas (death-roll.mjs / _postDeathRollChatMessage), et non
 * du moteur générique YZERollChat : ce jet n'est ni un test de
 * Compétence ordinaire, ni forçable (Push), et sa carte de Chat
 * n'a besoin d'afficher ni la finalisation, ni de bouton de
 * Push.
 *
 * Un ChatMessage distinct est créé par Acteur ciblé (exigence du
 * porteur du projet), car les dés de Stress ajoutés au jet sont
 * propres à chaque Acteur. Le message part « en attente » (aucun
 * jet effectué) avec un simple bouton ; ce n'est qu'au clic que
 * le jet est réellement effectué, par ou pour le joueur
 * concerné.
 *
 * Le bouton est visible par tous (comme le Push de
 * YZERollChat), mais sa résolution est refusée si le compte qui
 * clique n'est ni propriétaire de l'Acteur ni MJ — un MJ est
 * toujours considéré propriétaire par Foundry, ce qui couvre
 * naturellement les deux cas demandés (« seul le joueur et le
 * MJ pourront cliquer »).
 */

import {
    DicePool
} from "../../domain/rolls/dice-pool.mjs";

import {
    YZERoll
} from "../../domain/rolls/yze-roll.mjs";

import {
    computeTerrorDicePool,
    resolveTerrorOutcome
} from "../../domain/rules/terror.mjs";

import {
    resolveTalentKey
} from "../../domain/rules/talent-identity.mjs";

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
    "terrorRoll";


function escapeHTML(
    value
) {

    return foundry.utils.escapeHTML(
        String(
            value ?? ""
        )
    );

}


export class TerrorRollChat {


    /**
     * Crée, pour UN Acteur ciblé, le ChatMessage « en attente »
     * de l'attaque de Terreur (aucun jet effectué).
     */
    static async createPendingMessage({
        actor,
        terrorValue,
        sourceLabel
    } = {}) {

        if (!actor) {

            throw new TypeError(
                "Un Acteur cible est requis."
            );

        }


        if (
            !Number.isInteger(terrorValue)
            || terrorValue < 0
        ) {

            throw new TypeError(
                "La valeur de Terreur doit être un entier positif ou nul."
            );

        }


        const flagData = {

            actorUuid:
                actor.uuid,

            terrorValue,

            sourceLabel:
                sourceLabel ?? null,

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


    /**
     * Génère le contenu HTML de la carte de Chat, dans son état
     * en attente ou déjà résolu.
     */
    static renderContent(
        flagData
    ) {

        const sourceLabel =
            flagData?.sourceLabel
                ? ` — ${escapeHTML(flagData.sourceLabel)}`
                : "";

        const terrorValue =
            escapeHTML(
                flagData?.terrorValue
                ?? 0
            );


        if (!flagData?.rolled) {

            return `
                <div class="metro-chat-survival-card metro-chat-terror-roll-card">
                    <header class="metro-chat-survival-card-header">
                        <strong>Attaque de Terreur${sourceLabel}</strong>
                    </header>
                    <div class="metro-chat-survival-card-summary">
                        Valeur de Terreur : ${terrorValue}
                        (+ vos dés de Stress actuels).
                    </div>
                    <div class="metro-chat-actions">
                        <button
                            type="button"
                            class="metro-chat-button"
                            data-action="roll-terror"
                        >
                            Subir le jet
                        </button>
                    </div>
                </div>
            `;

        }


        const diceList =
            (flagData.diceValues ?? []).length
                ? escapeHTML(flagData.diceValues.join(", "))
                : "—";

        const summary =
            flagData.affected
                ? `${escapeHTML(flagData.successes)} réussite(s) — `
                    + `${escapeHTML(flagData.damage)} point(s) de dégâts à l'ESPRIT.`
                : "Aucune réussite — le personnage n'est pas affecté.";

        return `
            <div class="metro-chat-survival-card metro-chat-terror-roll-card">
                <header class="metro-chat-survival-card-header">
                    <strong>Attaque de Terreur${sourceLabel}</strong>
                </header>
                <div class="metro-chat-survival-card-dice">Dés : ${diceList}</div>
                <div class="metro-chat-survival-card-summary">${summary}</div>
            </div>
        `;

    }


    /**
     * Résout le jet subi par l'Acteur ciblé par ce message :
     * construit le DicePool (valeur de Terreur + Stress actuel
     * de l'Acteur), lance les dés, applique les dégâts à
     * l'ESPRIT, puis met à jour la carte de Chat.
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
                "Ce message n'est pas une attaque de Terreur."
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
                "L'Acteur ciblé par cette attaque de Terreur est introuvable."
            );

        }


        if (!actor.isOwner) {

            throw new Error(
                "Vous ne pouvez pas subir ce jet pour cet Acteur."
            );

        }


        /*
         * La carte est créée par le MJ : un joueur la met à jour
         * via le relais MJ. On vérifie avant de lancer les dés
         * qu'un MJ actif est joignable.
         */
        assertChatMessageUpdatable(
            message
        );


        /*
         * Talent général Courage (livre, p.165) : "Lorsque vous
         * êtes la cible d'une attaque de Terreur, les réussites
         * de cette dernière sont réduites de 1 pour vous.
         * Supérieur : seule la moitié (arrondie à l'inférieur)
         * de vos dés de Stress s'ajoute aux attaques de
         * Terreur."
         *
         * Ce sous-système (terror.mjs) est entièrement isolé du
         * moteur générique de Talents (il ne construit aucun
         * ActionResolutionContext) : accrochage direct sur
         * actor.items, comme pour Bête de somme/Maîtrise de
         * soi. La circonstance "être ciblé" n'est pas un fait
         * narratif à arbitrer (elle est toujours vraie dès que
         * ce jet est lancé) : contrairement à Tireur instinctif,
         * aucune case à cocher n'est nécessaire ici.
         *
         * Interprétation actée (le livre ne le précise pas
         * explicitement, mais c'est la convention suivie partout
         * ailleurs dans ce projet pour une clause "Supérieur" —
         * cf. Point faible) : le niveau supérieur AJOUTE son
         * effet à celui du niveau normal, il ne le remplace pas.
         * Au niveau supérieur, les deux effets s'appliquent donc
         * ensemble.
         */
        const courageTalent =
            actor.items.find(
                item =>
                    item.type === "talent"
                    && resolveTalentKey(item)
                        === "courage"
            );

        const courageAdvanced =
            Boolean(courageTalent)
            && Number(
                courageTalent.system
                    ?.level
                ?? 1
            )
            >= 2;


        const rawTargetStressDice =
            actor.system?.stress?.dice
            ?? 0;

        const targetStressDice =
            courageAdvanced
                ? Math.floor(
                    rawTargetStressDice / 2
                )
                : rawTargetStressDice;


        const poolConfig =
            computeTerrorDicePool({

                terrorValue:
                    flagData.terrorValue,

                targetStressDice

            });


        const pool =
            new DicePool(
                poolConfig
            );


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
                        "terror-roll",

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


        /*
         * Courage, niveau normal ou supérieur : réduit de 1 les
         * réussites de cette attaque de Terreur pour cette
         * cible (plancher à 0).
         */
        const courageAdjustedSuccesses =
            courageTalent
                ? Math.max(
                    0,
                    roll.successes - 1
                )
                : roll.successes;


        const outcome =
            resolveTerrorOutcome({
                successes:
                    courageAdjustedSuccesses
            });


        const diceValues = [
            ...roll.dice.attribute,
            ...roll.dice.skill,
            ...roll.dice.equipment,
            ...roll.dice.bonus,
            ...roll.dice.stress
        ];


        const updatedFlagData = {

            ...flagData,

            rolled:
                true,

            diceValues,

            successes:
                outcome.successes,

            damage:
                outcome.damage,

            affected:
                outcome.affected

        };


        const rolls =
            roll.physicalRoll
                ? [roll.physicalRoll]
                : undefined;


        /*
         * Mise à jour de la carte EN PREMIER (cf. Coup de grâce) :
         * elle peut passer par un MJ et échouer ; dans ce cas
         * aucun dégât n'est appliqué et la carte reste cliquable.
         */
        await updateChatMessageAsGM(message, {

            content:
                this.renderContent(
                    updatedFlagData
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

            [`flags.${SYSTEM_ID}.${MESSAGE_FLAG}`]:
                updatedFlagData

        });


        if (outcome.damage > 0) {

            await actor.takeAttributeDamage(
                "spirit",
                outcome.damage
            );

        }


        /*
         * Un 6 sur un dé de Stress l'élimine réellement, comme
         * pour tout autre jet YZE (cf. rollSkill()). Best-effort :
         * ne bloque jamais l'affichage du résultat si l'Acteur ne
         * propose pas ce mutateur.
         */
        if (
            roll.eliminatedStress > 0
            && typeof actor.removeStress === "function"
        ) {

            await actor.removeStress(
                roll.eliminatedStress
            );

        }


        return {
            actor,
            roll,
            outcome
        };

    }

}


registerRelayContentRenderer(
    MESSAGE_FLAG,
    flagData =>
        TerrorRollChat.renderContent(
            flagData
        )
);
