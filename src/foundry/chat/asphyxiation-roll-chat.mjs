/**
 * Message de Chat du jet d'Asphyxie (p.205).
 *
 * Même architecture que le jet de Terreur (terror-roll-chat.mjs)
 * : un ChatMessage « en attente » par Acteur ciblé, résolu au
 * clic par le joueur concerné ou le MJ, sans Push (interdit par
 * le livre).
 *
 * Différence avec la Terreur : c'est un test de Compétence
 * standard (VIGUEUR + Endurance), sans dé de Stress, et l'issue
 * se lit en succès/échec (pas au nombre de réussites).
 *
 * Mécanique homebrew ajoutée le 28/09/2026 (retour utilisateur,
 * absente du livre) : un échec pose l'état « Asphyxié » sur
 * l'Actor (icône sur le Token), que le MJ retire manuellement
 * quand la source n'est plus présente. La Nocivité choisie par
 * le MJ dans la fenêtre de lancement est alors persistée comme
 * flag sur l'Actor (`asphyxiationSourceLevel`) : tant que l'état
 * reste actif ET que cette Nocivité vaut Extrême, un nouveau jet
 * est automatiquement relancé à chaque round de combat
 * (`rollAndPost`, appelé par `combat/combat-round-coordinator.mjs`
 * via `metro-asphyxiation-hooks.mjs`, qui filtre sur la Nocivité —
 * Légère/Forte restent manuelles même en combat, Bible §32) ;
 * hors combat, rien n'est automatisé, seul le clic manuel
 * (`resolve`) déclenche un jet.
 *
 * `resolve` (clic du joueur sur « Subir le jet ») passe par la
 * fenêtre de préparation universelle (ActionModifierDialog), afin
 * que le joueur puisse notamment utiliser « Subir 1 Stress pour
 * +3 » (livre p.190, cf. ActionModifierService) sur son jet
 * d'Asphyxie. `rollAndPost` (relance automatique par round) n'y
 * passe volontairement PAS : construit son propre pool via
 * `_rollForActor`, sans ouvrir aucune fenêtre (déclenchement
 * sans intervention). Ce jet reste non-forçable (interdit par le
 * livre) dans les deux cas : la carte de Chat produite par ce
 * module n'offre jamais de bouton Push.
 */

import {
    DicePool
} from "../../domain/rolls/dice-pool.mjs";

import {
    YZERoll
} from "../../domain/rolls/yze-roll.mjs";

import {
    ASPHYXIATION_STATUS_EFFECT,
    computeAsphyxiationDicePool,
    resolveAsphyxiationOutcome
} from "../../domain/rules/asphyxiation.mjs";

import {
    SkillRollPreparationService
} from "../../action-resolution/skill-roll-preparation-service.mjs";

import {
    ActionModifierDialog
} from "../applications/action-modifier-dialog.mjs";

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
    "asphyxiationRoll";

/**
 * Flag d'Actor mémorisant la Nocivité choisie par le MJ au
 * moment où l'état « Asphyxié » lui est posé — c'est lui que
 * `metro-asphyxiation-hooks.mjs` consulte pour savoir si le
 * round de combat doit redéclencher automatiquement ce jet
 * (Nocivité Extrême uniquement, Bible §32).
 */
export const ASPHYXIATION_SOURCE_LEVEL_ACTOR_FLAG =
    "asphyxiationSourceLevel";

const SOURCE_LEVEL_ACTOR_FLAG =
    ASPHYXIATION_SOURCE_LEVEL_ACTOR_FLAG;


function escapeHTML(
    value
) {

    return foundry.utils.escapeHTML(
        String(
            value ?? ""
        )
    );

}


export class AsphyxiationRollChat {


    /**
     * Crée, pour UN Acteur ciblé, le ChatMessage « en attente »
     * du jet d'Asphyxie (aucun jet effectué).
     */
    static async createPendingMessage({
        actor,
        sourceLabel = null,
        sourceLevel = null
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

            sourceLevel,

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


        if (!flagData?.rolled) {

            return `
                <div class="metro-chat-survival-card metro-chat-asphyxiation-roll-card">
                    <header class="metro-chat-survival-card-header">
                        <strong>Jet d'Asphyxie${sourceLabel}</strong>
                    </header>
                    <div class="metro-chat-survival-card-summary">
                        Jet d'ENDURANCE. En cas d'échec : 1 point de
                        dégâts à la VIGUEUR et à l'ESPRIT.
                    </div>
                    <div class="metro-chat-actions">
                        <button
                            type="button"
                            class="metro-chat-button"
                            data-action="roll-asphyxiation"
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
            flagData.failed
                ? `Échec (${escapeHTML(flagData.successes)} réussite(s)) — `
                    + "1 point de dégâts à la VIGUEUR et à l'ESPRIT."
                : `Réussite (${escapeHTML(flagData.successes)} réussite(s)) — `
                    + "aucun dégât.";

        return `
            <div class="metro-chat-survival-card metro-chat-asphyxiation-roll-card">
                <header class="metro-chat-survival-card-header">
                    <strong>Jet d'Asphyxie${sourceLabel}</strong>
                </header>
                <div class="metro-chat-survival-card-dice">Dés : ${diceList}</div>
                <div class="metro-chat-survival-card-summary">${summary}</div>
            </div>
        `;

    }


    /**
     * Applique les dégâts en cas d'échec et pose l'état
     * « Asphyxié » (best-effort : un Actor sans Token sur le
     * canevas ne peut pas porter d'état, exactement comme
     * `toggleStatusEffect("dead", …)` ailleurs dans le
     * système).
     *
     * Factorisé entre `_rollForActor` (relance automatique par
     * round, pool construit manuellement) et
     * `_rollForActorViaDialog` (clic manuel du joueur, pool
     * construit par `actor.rollSkill()` via la fenêtre de
     * préparation) : l'application de l'issue du jet ne dépend
     * pas de la façon dont le jet a été lancé.
     *
     * `sourceLevel`, quand fourni, est persisté comme flag sur
     * l'Actor dès que l'état « Asphyxié » lui est posé — c'est ce
     * flag que la relance automatique par round consultera
     * ensuite (elle ne fournit pas de `sourceLevel` elle-même,
     * pour ne jamais écraser le choix du MJ).
     */
    static async _applyOutcome(
        actor,
        {
            successes,
            sourceLevel = null
        } = {}
    ) {

        const outcome =
            resolveAsphyxiationOutcome({
                successes
            });


        if (outcome.vigorDamage > 0) {

            await actor.takeAttributeDamage(
                "vigor",
                outcome.vigorDamage
            );

        }


        if (outcome.spiritDamage > 0) {

            await actor.takeAttributeDamage(
                "spirit",
                outcome.spiritDamage
            );

        }


        if (outcome.failed) {

            if (sourceLevel) {

                try {

                    await actor.setFlag(
                        SYSTEM_ID,
                        SOURCE_LEVEL_ACTOR_FLAG,
                        sourceLevel
                    );

                }
                catch (error) {

                    /*
                     * Best-effort, au même titre que la pose de
                     * l'état ci-dessous : n'empêche jamais
                     * l'application du dégât.
                     */

                }

            }


            try {

                await actor.toggleStatusEffect(
                    ASPHYXIATION_STATUS_EFFECT.id,
                    { active: true }
                );

            }
            catch (error) {

                /*
                 * Best-effort : pas de Token lié au moment du
                 * jet, par exemple. Le dégât reste appliqué,
                 * seule l'icône d'état est manquante.
                 */

            }

        }


        return outcome;

    }


    /**
     * Construit le DicePool (VIGUEUR + Endurance) et lance les
     * dés directement (sans fenêtre de préparation, sans passer
     * par `actor.rollSkill()`) : utilisé exclusivement par
     * `rollAndPost` pour la relance automatique à chaque round
     * de combat, un déclenchement sans intervention qui ne doit
     * ouvrir aucune fenêtre.
     *
     * Le clic manuel du joueur (« Subir le jet ») passe par
     * `_rollForActorViaDialog`, pas par cette méthode : c'est
     * ainsi qu'il peut bénéficier de « Subir 1 Stress pour +3 ».
     */
    static async _rollForActor(
        actor,
        { sourceLevel = null } = {}
    ) {

        const vigorAttribute =
            actor.system?.attributes?.vigor?.value
            ?? 0;

        const enduranceSkill =
            actor.system?.skills?.endurance
            ?? 0;


        const poolConfig =
            computeAsphyxiationDicePool({
                vigorAttribute,
                enduranceSkill
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
                        "asphyxiation-roll",

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


        const outcome =
            await this._applyOutcome(
                actor,
                {
                    successes:
                        roll.successes,

                    sourceLevel
                }
            );


        const diceValues = [
            ...roll.dice.attribute,
            ...roll.dice.skill,
            ...roll.dice.equipment,
            ...roll.dice.bonus
        ];


        return {
            roll,
            outcome,
            diceValues
        };

    }


    /**
     * Prépare puis effectue le jet d'Asphyxie subi par le joueur
     * via la fenêtre de préparation universelle
     * (ActionModifierDialog), préremplie VIGUEUR + Endurance,
     * afin qu'il puisse notamment utiliser « Subir 1 Stress pour
     * +3 » (livre, p.190). Le jet reste non-forçable (interdit
     * par le livre) : cette méthode ne propose aucun Push après
     * résolution, et la carte de Chat produite par `resolve`
     * n'affiche jamais de bouton Push.
     *
     * Retourne `null` si la fenêtre est annulée (aucun jet,
     * aucun changement d'état : la carte de Chat reste en
     * attente).
     */
    static async _rollForActorViaDialog(
        actor,
        { sourceLevel = null } = {}
    ) {

        const {
            preparation
        } =
            SkillRollPreparationService.create(
                actor,
                {
                    attribute:
                        "vigor",

                    skill:
                        "endurance"
                }
            );


        const resolvedPreparation =
            await ActionModifierDialog.prompt(
                preparation,
                {
                    title:
                        `${actor.name} — Jet d'Asphyxie`,

                    confirmLabel:
                        "Subir le jet"
                }
            );


        if (!resolvedPreparation) {

            return null;

        }


        const totals =
            resolvedPreparation.totals
            ?? {};


        const equipment =
            Number(
                totals.weapon
                ?? 0
            )
            +
            Number(
                totals.equipment
                ?? 0
            );


        const adjustment =
            Number(
                totals.talent
                ?? 0
            )
            +
            Number(
                totals.difficulty
                ?? 0
            )
            +
            Number(
                totals.modifier
                ?? 0
            )
            +
            /*
            * « Subir 1 Stress pour +3 dés » (livre, p.190) :
            * omis par erreur jusqu'ici, la case cochée ne
            * changeait donc jamais réellement le jet.
            */
            Number(
                totals.stressBonus
                ?? 0
            );


        const bonus =
            Math.max(
                0,
                adjustment
            );


        const penalty =
            Math.max(
                0,
                -adjustment
            );


        const roll =
            await actor.rollSkill(
                "endurance",
                {
                    attributeOverride:
                        resolvedPreparation
                            .base
                            ?.attribute
                        ?? null,

                    skillOverride:
                        resolvedPreparation
                            .base
                            ?.skill
                        ?? null,

                    equipment,

                    stressOverride:
                        resolvedPreparation
                            .base
                            ?.stress
                        ?? null,

                    extraStressDie:
                        Number(
                            totals.extraStressDie
                            ?? 0
                        ),

                    bonus,

                    penalty,

                    context: {

                        action:
                            "asphyxiation-roll",

                        preparation: {

                            base:
                                foundry.utils.deepClone(
                                    resolvedPreparation.base
                                    ?? {}
                                ),

                            sources:
                                foundry.utils.deepClone(
                                    resolvedPreparation.sources
                                    ?? []
                                ),

                            selectedSources:
                                foundry.utils.deepClone(
                                    resolvedPreparation.selectedSources
                                    ?? []
                                ),

                            difficulty:
                                foundry.utils.deepClone(
                                    resolvedPreparation.difficulty
                                    ?? null
                                ),

                            totals:
                                foundry.utils.deepClone(
                                    resolvedPreparation.totals
                                    ?? {}
                                )

                        }

                    }
                }
            );


        const outcome =
            await this._applyOutcome(
                actor,
                {
                    successes:
                        roll.successes,

                    sourceLevel
                }
            );


        const diceValues = [
            ...roll.dice.attribute,
            ...roll.dice.skill,
            ...roll.dice.equipment,
            ...roll.dice.bonus
        ];


        return {
            roll,
            outcome,
            diceValues
        };

    }


    /**
     * Résout le jet subi par l'Acteur ciblé par ce message
     * (clic sur « Subir le jet »), via la fenêtre de préparation
     * universelle (cf. `_rollForActorViaDialog`), puis met à
     * jour la carte de Chat.
     *
     * Rejette si le message est déjà résolu, ou si le compte
     * appelant n'est ni propriétaire de l'Acteur ni MJ.
     *
     * Retourne `null` (sans rejeter, sans modifier la carte) si
     * la fenêtre de préparation est annulée par le joueur : la
     * carte reste « en attente », le bouton redevient cliquable
     * (cf. asphyxiation-roll-chat-hooks.mjs).
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
                "Ce message n'est pas un jet d'Asphyxie."
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
                "L'Acteur ciblé par ce jet d'Asphyxie est introuvable."
            );

        }


        if (!actor.isOwner) {

            throw new Error(
                "Vous ne pouvez pas subir ce jet pour cet Acteur."
            );

        }


        /*
         * Carte créée par le MJ : un joueur la met à jour via le
         * relais MJ. Ici l'ordre ne peut PAS être inversé (les
         * dégâts / l'état « Asphyxié » sont appliqués dans
         * `_rollForActorViaDialog`, avant que le résultat qui
         * alimente la carte soit connu) : on vérifie donc au
         * moins AVANT la fenêtre et le jet qu'un MJ actif est
         * joignable, pour éviter l'échec le plus probable après
         * application des effets.
         */
        assertChatMessageUpdatable(
            message
        );


        const rollOutcome =
            await this._rollForActorViaDialog(
                actor,
                { sourceLevel: flagData.sourceLevel ?? null }
            );


        if (!rollOutcome) {

            /*
             * Annulé depuis la fenêtre de préparation : aucun
             * jet, aucun changement d'état. La carte reste en
             * attente.
             */
            return null;

        }


        const {
            outcome,
            diceValues
        } =
            rollOutcome;


        const updatedFlagData = {

            ...flagData,

            rolled:
                true,

            diceValues,

            successes:
                outcome.successes,

            failed:
                outcome.failed

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
            outcome
        };

    }


    /**
     * Effectue immédiatement un jet pour l'Acteur donné et
     * publie directement le résultat (pas de carte « en
     * attente », pas de bouton) : utilisé pour le déclenchement
     * automatique à chaque round de combat tant que l'état
     * « Asphyxié » reste actif sur cet Acteur ET que sa Nocivité
     * persistée vaut Extrême (cf.
     * `combat/combat-round-coordinator.mjs` et
     * `metro-asphyxiation-hooks.mjs`, qui fait ce filtrage avant
     * d'appeler cette méthode).
     *
     * Ne transmet volontairement aucun `sourceLevel` à
     * `_rollForActor` : la relance automatique ne doit jamais
     * écraser le choix de Nocivité déjà persisté par le MJ.
     */
    static async rollAndPost({
        actor,
        sourceLabel = null
    } = {}) {

        if (!actor) {

            throw new TypeError(
                "Un Acteur cible est requis."
            );

        }


        const {
            roll,
            outcome,
            diceValues
        } =
            await this._rollForActor(
                actor
            );


        const flagData = {

            actorUuid:
                actor.uuid,

            sourceLabel,

            rolled:
                true,

            diceValues,

            successes:
                outcome.successes,

            failed:
                outcome.failed

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

}


registerRelayContentRenderer(
    MESSAGE_FLAG,
    flagData =>
        AsphyxiationRollChat.renderContent(
            flagData
        )
);
