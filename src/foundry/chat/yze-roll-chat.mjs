import {
    htmlToPlainText
} from "../../domain/rules/embedded-item-tooltip.mjs";

import {
    summarizeRangedAppliedEffects
} from "../../domain/rules/applied-effects-summary.mjs";

import {
    summarizeRollDecisions
} from "../../domain/rules/roll-decisions-summary.mjs";

import {
    DicePool
} from "../../domain/rolls/dice-pool.mjs";

import {
    YZEResult
} from "../../domain/rolls/yze-result.mjs";

import {
    canApplyReadyRangedAttack,
    isRangedAttackApplicationCompleted
} from "../../combat/ranged-attack-workflow.mjs";


/**
 * Représentation Chat générique
 * d'un jet Year Zero Engine.
 *
 * Responsabilités :
 *
 * - construire un ViewModel d'affichage ;
 * - rendre le template Handlebars ;
 * - créer un ChatMessage Foundry ;
 * - reconstruire un YZEResult depuis le Chat ;
 * - déléguer le Push à l'Actor.
 *
 * Cette classe ne contient aucune règle métier.
 */


const SYSTEM_ID =
    "metro-2033-yze";

const MESSAGE_FLAG =
    "yzeRoll";

const RANGED_ATTACK_APPLICATION_FLAG =
    "rangedAttackApplication";    

const TEMPLATE =
    `systems/${SYSTEM_ID}/templates/chat/yze-roll.hbs`;

const RANGED_ATTACK_TEMPLATE =
    `systems/${SYSTEM_ID}/templates/chat/ranged-attack.hbs`;


/* ============================================================
 * LABELS
 * ============================================================ */


const ATTRIBUTE_LABELS =
    Object.freeze({

        vigor:
            "Vigueur",

        agility:
            "Agilité",

        spirit:
            "Esprit",

        empathy:
            "Empathie"

    });


const SKILL_LABELS =
    Object.freeze({

        repair:
            "Bricolage",

        closeCombat:
            "Corps à corps",

        endurance:
            "Endurance",

        stealth:
            "Discrétion",

        reaction:
            "Réaction",

        shooting:
            "Tir",

        comprehension:
            "Compréhension",

        observation:
            "Observation",

        survival:
            "Survie",

        analysis:
            "Analyse",

        manipulation:
            "Manipulation",

        medicine:
            "Médecine"

    });


function getSkillLabel(
    skillId
) {

    return (
        SKILL_LABELS[
            skillId
        ]
        ?? skillId
        ?? null
    );

}    

function getAttributeLabel(
    attributeId
) {

    return (
        ATTRIBUTE_LABELS[
            attributeId
        ]
        ?? attributeId
        ?? "Attribut"
    );

}


/**
 * Intitulé court d'un jet (« Tir — Makarov », « Observation »,
 * « Vigueur »...) pour les messages de résumé (afflictions).
 */
export function getYZERollLabel(
    result
) {

    const context =
        result?.context
        ?? {};

    const testLabel =
        context.skill
            ? getSkillLabel(context.skill)
            : getAttributeLabel(context.attribute);

    const weaponName =
        context.attack?.weapon?.name
        ?? null;

    return weaponName
        ? `${testLabel} — ${weaponName}`
        : testLabel;

}


/* ============================================================
 * DICE VIEW MODEL
 * ============================================================ */


function createDiceViewModel(
    values,
    {
        stress = false
    } = {}
) {

    if (!Array.isArray(values)) {
        return [];
    }


    return values.map(
        value => ({

            value,

            success:
                value === 6,

            one:
                value === 1,

            stressAffliction:
                stress
                && value === 1

        })
    );

}


/* ============================================================
 * SERIALIZATION
 * ============================================================ */

export function serializeRollResult(
    result
) {

    if (!result) {
        return null;
    }


    return {

        successes:
            Number(
                result.successes
                ?? 0
            ),

        pushCount:
            Number(
                result.pushCount
                ?? 0
            ),

        dice:
            foundry.utils.deepClone(
                result.dice
                ?? {}
            ),

        history:
            foundry.utils.deepClone(
                result.history
                ?? []
            ),

        context:
            foundry.utils.deepClone(
                result.context
                ?? {}
            ),

        stressAfflictions:
            Number(
                result.stressAfflictions
                ?? 0
            ),

        eliminatedStress:
            Number(
                result.eliminatedStress
                ?? 0
            ),

        pool: {

            attribute:
                Number(
                    result.pool?.attribute
                    ?? 0
                ),

            skill:
                Number(
                    result.pool?.skill
                    ?? 0
                ),

            equipment:
                Number(
                    result.pool?.equipment
                    ?? 0
                ),

            stress:
                Number(
                    result.pool?.stress
                    ?? 0
                ),

            bonus:
                Number(
                    result.pool?.bonus
                    ?? 0
                ),

            penalty:
                Number(
                    result.pool?.penalty
                    ?? 0
                )

        }

    };

}


export function deserializeRollResult(
    data
) {

    if (!data) {
        return null;
    }


    const pool =
        new DicePool({

            attribute:
                Number(
                    data.pool?.attribute
                    ?? 0
                ),

            skill:
                Number(
                    data.pool?.skill
                    ?? 0
                ),

            equipment:
                Number(
                    data.pool?.equipment
                    ?? 0
                ),

            stress:
                Number(
                    data.pool?.stress
                    ?? 0
                ),

            bonus:
                Number(
                    data.pool?.bonus
                    ?? 0
                ),

            penalty:
                Number(
                    data.pool?.penalty
                    ?? 0
                )

        });


    return new YZEResult({

        pool,

        dice:
            foundry.utils.deepClone(
                data.dice
                ?? {}
            ),

        successes:
            Number(
                data.successes
                ?? 0
            ),

        pushCount:
            Number(
                data.pushCount
                ?? 0
            ),

        history:
            foundry.utils.deepClone(
                data.history
                ?? []
            ),

        context:
            foundry.utils.deepClone(
                data.context
                ?? {}
            ),

        stressAfflictions:
            Number(
                data.stressAfflictions
                ?? 0
            ),

        eliminatedStress:
            Number(
                data.eliminatedStress
                ?? 0
            )

    });

}


/* ============================================================
 * CHAT
 * ============================================================ */


export class YZERollChat {


    /**
     * Transforme un résultat YZE
     * en données exclusivement destinées
     * à l'affichage.
     */
    static createViewModel(
        result,
        {
            finalized = false,
            rangedAttackApplication = null
        } = {}
    ) {

        if (!result) {

            throw new TypeError(
                "Un résultat de jet YZE est requis."
            );

        }


        const context =
            result.context
            ?? {};


        const attack =
            context.attack
            ?? null;


        const target =
            context.target
            ?? null;


        const isAttack =
            attack !== null;


        const isMeleeAttack =
            isAttack
            && context.action === "melee-attack";


        const isRangedAttack =
            isAttack
            && attack?.type === "ranged";


        const weapon =
            attack?.weapon
            ?? null;


        const isBlockableAttack =
            isMeleeAttack
            && attack?.blockable === true
            && target !== null
            && Boolean(
                target.actorUuid
            );


        const pool =
            result.pool
            ?? {};


        const dice =
            result.dice
            ?? {};


        const attributeId =
            context.attribute
            ?? null;

        const skillId =
            context.skill
            ?? null;


        const skillLabel =
            getSkillLabel(
                skillId
            );


        const attributeLabel =
            getAttributeLabel(
                attributeId
            );


        const testLabel =
            skillId

                ? skillLabel

                : attributeLabel;


        const successes =
            Number(
                result.successes
                ?? 0
            );


        const afflictions =
            Number(
                result.afflictions
                ?? 0
            );


        const stressAfflictions =
            Number(
                result.stressAfflictions
                ?? 0
            );


        const pushCount =
            Number(
                result.pushCount
                ?? 0
            );

        const isFinalized =
            finalized === true;


        const canFirstPush =
            !isFinalized
            && pushCount === 0;


        const canSecondPush =
            !isFinalized
            && pushCount === 1;


        const pushFinished =
            pushCount >= 2;


        const canFinalize =
            !isFinalized;


        const blockedOperations =
            Array.isArray(
                rangedAttackApplication
                    ?.blockedOperations
            )
                ? rangedAttackApplication
                    .blockedOperations
                : [];


        const blockedProtectionOperation =
            blockedOperations.find(
                operation =>
                    operation?.type
                    === "protection-damage"
            )
            ?? null;


        const protectionChoices =
            Array.isArray(
                blockedProtectionOperation
                    ?.choices
            )
                ? [
                    ...blockedProtectionOperation
                        .choices
                ]
                : [];


        const blockedDisarmOperation =
            blockedOperations.find(
                operation =>
                    operation?.type
                    === "disarm"
            )
            ?? null;


        const disarmChoices =
            Array.isArray(
                blockedDisarmOperation
                    ?.choices
            )
                ? blockedDisarmOperation
                    .choices
                    .map(
                        choice => ({
                            ...choice
                        })
                    )
                : [];


        const rangedAttackApplicationStatus =
            rangedAttackApplication
                ?.status
            ?? null;


        const readyForManualApplication =
            canApplyReadyRangedAttack({
                status:
                    rangedAttackApplicationStatus
            });


        const applicationApplied =
            isRangedAttackApplicationCompleted({
                status:
                    rangedAttackApplicationStatus
            });


        return {

            actor: {

                id:
                    context.actorId
                    ?? null,

                uuid:
                    context.actorUuid
                    ?? null,

                name:
                    context.actorName
                    ?? "Actor"

            },

            attack: {

                isAttack,

                isMelee:
                    isMeleeAttack,

                isRanged:
                    isRangedAttack,

                blockable:
                    isBlockableAttack,

                weapon: {

                    name:
                        weapon?.name
                        ?? null,

                    damage:
                        Number(
                            weapon?.damage
                            ?? 0
                        ),

                    explosive:
                        weapon?.explosive
                        === true,

                    automatic:
                        weapon?.automatic
                        === true,
                    special:
                        htmlToPlainText(
                            weapon?.special
                            ?? ""
                        )

                },

                target: {

                    tokenId:
                        target?.tokenId
                        ?? null,

                    tokenUuid:
                        target?.tokenUuid
                        ?? null,

                    actorId:
                        target?.actorId
                        ?? null,

                    actorUuid:
                        target?.actorUuid
                        ?? null,

                    name:
                        target?.name
                        ?? null

                }

            },

            roll: {

                action:
                    context.action
                    ?? null,

                attributeId,

                attributeLabel,

                skillId,

                skillLabel,

                hasSkill:
                    Boolean(
                        skillId
                    ),

                testLabel,

                successes,

                success:
                    successes > 0,

                failed:
                    successes === 0,

                afflictions,

                hasAfflictions:
                    afflictions > 0,

                stressAfflictions,

                hasStressAfflictions:
                    stressAfflictions > 0,

                pushCount,

                pushed:
                    pushCount > 0,

                finalized:
                    isFinalized,

                canFinalize,

                canFirstPush,

                canSecondPush,

                pushFinished

            },


            dice: {

                attribute:
                    createDiceViewModel(
                        dice.attribute
                    ),

                skill:
                    createDiceViewModel(
                        dice.skill
                    ),

                equipment:
                    createDiceViewModel(
                        dice.equipment
                    ),

                bonus:
                    createDiceViewModel(
                        dice.bonus
                    ),

                stress:
                    createDiceViewModel(
                        dice.stress,
                        {
                            stress:
                                true
                        }
                    ),

                hasAttribute:
                    Array.isArray(
                        dice.attribute
                    )
                    && dice.attribute.length > 0,

                hasSkill:
                    Array.isArray(
                        dice.skill
                    )
                    && dice.skill.length > 0,

                hasEquipment:
                    Array.isArray(
                        dice.equipment
                    )
                    && dice.equipment.length > 0,

                hasBonus:
                    Array.isArray(
                        dice.bonus
                    )
                    && dice.bonus.length > 0,

                hasStress:
                    Array.isArray(
                        dice.stress
                    )
                    && dice.stress.length > 0,

                eliminatedStress:
                    Number(
                        result.eliminatedStress
                        ?? 0
                    ),

                hasEliminatedStress:
                    Number(
                        result.eliminatedStress
                        ?? 0
                    ) > 0

            },


            /*
             * Décisions de préparation (difficulté, sources
             * cochées, modificateur, Stress volontaire) : le Chat
             * transcrit les règles appliquées au jet.
             */
            decisions:
                summarizeRollDecisions(
                    context.preparation
                ),

            pool: {

                attribute:
                    Number(
                        pool.attribute
                        ?? 0
                    ),

                skill:
                    Number(
                        pool.skill
                        ?? 0
                    ),

                equipment:
                    Number(
                        pool.equipment
                        ?? 0
                    ),

                stress:
                    Number(
                        pool.stress
                        ?? 0
                    ),

                bonus:
                    Number(
                        pool.bonus
                        ?? 0
                    ),

                penalty:
                    Number(
                        pool.penalty
                        ?? 0
                    )

            },


            rangedAttackApplication: {

                /*
                 * Détail des effets appliqués, lu dans le ledger
                 * d'application (cf. « Résoudre les dégâts »).
                 */
                appliedLines:
                    applicationApplied
                        ? summarizeRangedAppliedEffects(
                            rangedAttackApplication
                                ?.applicationLedger,
                            context.target?.name
                            ?? "La cible"
                        )
                        : [],

                hasBlockedOperations:
                    blockedOperations.length > 0,

                requiresProtectionChoice:
                    blockedProtectionOperation
                    !== null,

                protectionChoices,

                requiresDisarmChoice:
                    blockedDisarmOperation
                    !== null,

                disarmChoices,

                /*
                 * Harmonisation UX du Tir (Bible v0.9.3
                 * §163, décision D2) : un Tir n'applique
                 * plus jamais ses conséquences tout seul,
                 * y compris lorsqu'il n'a jamais eu à
                 * bloquer sur une Protection ou un
                 * désarmement — il attend systématiquement
                 * ce clic manuel, à l'image du bouton
                 * « Résoudre les dommages / effets » du
                 * Corps-à-corps.
                 */
                readyForManualApplication,

                applied:
                    applicationApplied

            },

            /*
             * Jet de SURVIE pour augmenter une ressource de
             * Station (livre p.219, chantier d'automatisation
             * du système Station). Le jet lui-même reste un
             * jet de Compétence tout à fait ordinaire (gabarit
             * générique, Push inclus) ; seule l'application du
             * gain à la ressource de la Station est spécifique,
             * et volontairement gatée derrière la finalisation
             * du jet (même bouton « Verrouiller le résultat »
             * que n'importe quel autre jet), pour ne jamais
             * appliquer un gain qui pourrait encore être
             * repoussé.
             */
            stationSurvival:
                context.stationSurvival
                    ? {

                        active:
                            true,

                        stationUuid:
                            context.stationSurvival.stationUuid
                            ?? null,

                        resourceKey:
                            context.stationSurvival.resourceKey
                            ?? null,

                        resourceLabel:
                            context.stationSurvival.resourceLabel
                            ?? "",

                        stationName:
                            context.stationSurvival.stationName
                            ?? "",

                        applied:
                            context.stationSurvival.applied
                            === true,

                        readyForManualApplication:
                            finalized
                            && context.stationSurvival.applied
                                !== true,

                        gain:
                            successes

                    }
                    : {
                        active:
                            false
                    }

        };

    }


    /**
     * Produit le HTML du message.
     */
    static async render(
        result,
        {
            finalized = false,
            rangedAttackApplication = null
        } = {}
    ) {

        const viewModel =
            this.createViewModel(
                result,
                {
                    finalized,

                    rangedAttackApplication
                }
            );


        /*
        * Le Tir dispose de sa propre carte de chat,
        * plus lisible, mais réutilise exactement le
        * même ViewModel et donc les mêmes boutons
        * ("data-action") que la carte générique :
        * aucune règle métier ni aucun câblage de
        * hooks n'est modifié par ce choix de gabarit.
        */
        const template =
            viewModel.attack?.isRanged
                ? RANGED_ATTACK_TEMPLATE
                : TEMPLATE;


        return foundry
            .applications
            .handlebars
            .renderTemplate(
                template,
                viewModel
            );

    }

    /**
     * Rend le contenu d'un ChatMessage YZE existant
     * à partir de son résultat et de son éventuel
     * checkpoint d'application ranged persistés.
     *
     * Cette méthode ne recalcule aucune règle métier.
     */
    static async renderStoredMessage(
        message
    ) {

        if (!message) {

            throw new TypeError(
                "Un ChatMessage est requis."
            );

        }


        const result =
            this.getStoredResult(
                message
            );


        if (!result) {

            throw new Error(
                "Le résultat YZE du message est introuvable."
            );

        }


        const rangedAttackApplication =
            this.getRangedAttackApplication(
                message
            );


        const finalized =
            this.isFinalized(
                message
            );


        return this.render(
            result,
            {
                finalized,

                rangedAttackApplication
            }
        );

    }


    /**
     * Rerend un ChatMessage YZE existant
     * depuis son état persisté puis remplace
     * réellement son contenu.
     *
     * Cette méthode ne modifie aucun état métier.
     */
    static async rerenderStoredMessage(
        message
    ) {

        if (!message) {

            throw new TypeError(
                "Un ChatMessage est requis."
            );

        }


        const content =
            await this.renderStoredMessage(
                message
            );


        await message.update({
            content
        });


        return message;

    }
        

    /**
     * Crée un ChatMessage Foundry.
     *
     * Si result.physicalRoll est présent (jet physique
     * Foundry réellement effectué, cf. actor.mjs), il est
     * attaché au ChatMessage via `rolls` : le message reste
     * notre carte habillée, mais Foundry le reconnaît comme
     * un véritable jet de dés (son, reconnaissance par les
     * modules tiers tels que Dice So Nice).
     */
    static async createMessage(
        result
    ) {

        const content =
            await this.render(
                result
            );


        const rolls =
            result.physicalRoll
                ? [result.physicalRoll]
                : undefined;


        return ChatMessage.create({

            speaker:
                ChatMessage.getSpeaker({
                    actor:
                        game.actors.get(
                            result.context
                                ?.actorId
                        )
                        ?? null
                }),

            content,

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
                        serializeRollResult(
                            result
                        )

                }

            }

        });

    }


    /**
     * Reconstruit le YZEResult
     * stocké dans un ChatMessage.
     */
    static getStoredResult(
        message
    ) {

        if (!message) {
            return null;
        }


        const data =
            message.getFlag(
                SYSTEM_ID,
                MESSAGE_FLAG
            );


        return deserializeRollResult(
            data
        );

    }

    static async storeRangedAttackApplication(
        message,
        applicationState
    ) {

        if (!message) {

            throw new TypeError(
                "Un ChatMessage est requis."
            );

        }


        await message.update({

            [`flags.${SYSTEM_ID}.${RANGED_ATTACK_APPLICATION_FLAG}`]:
                foundry.utils.deepClone(
                    applicationState
                )

        });


        return message;

    }

    static getRangedAttackApplication(
        message
    ) {

        if (!message) {
            return null;
        }


        return (
            message.getFlag(
                SYSTEM_ID,
                RANGED_ATTACK_APPLICATION_FLAG
            )
            ?? null
        );

    }    

    static isFinalized(
        message
    ) {

        const data =
            message.getFlag(
                SYSTEM_ID,
                MESSAGE_FLAG
            );


        return (
            data?.finalized
            === true
        );

    }    

    /**
     * Met à jour le même ChatMessage
     * avec un nouveau résultat.
     *
     * Si result.physicalRoll est présent (ex. un Push ayant
     * déclenché son propre jet Foundry), il REMPLACE les
     * Roll déjà portés par le message plutôt que de s'y
     * ajouter.
     *
     * Important : ne pas accumuler (ancien(s) Roll + nouveau)
     * ici. Une mise à jour du message déclenche son propre
     * rendu (renderChatMessageHTML), et Dice So Nice peut
     * ré-analyser l'intégralité de `message.rolls` à cette
     * occasion — en conserver les anciens Roll à chaque Push
     * risquait de les faire ré-animer/re-décompter en plus du
     * nouveau (bug constaté : nombre de dés incohérent lors
     * d'un Push). Notre propre gabarit de Chat reconstruit de
     * toute façon l'historique complet à partir de
     * result.history ; `rolls` ne sert qu'à porter le jet
     * physique courant.
     */
    static async updateMessage(
        message,
        result
    ) {

        if (!message) {

            throw new TypeError(
                "Un ChatMessage est requis."
            );

        }


        const content =
            await this.render(
                result
            );


        const additionalRolls =
            result.physicalRoll
                ? [result.physicalRoll]
                : undefined;


        await message.update({

            content,

            ...(
                additionalRolls
                    ? { rolls: additionalRolls }
                    : {}
            ),

            [`flags.${SYSTEM_ID}.${MESSAGE_FLAG}`]:
                serializeRollResult(
                    result
                )

        });


        return message;

    }


    static async finalizeMessage(
        message
    ) {

        if (!message) {

            throw new TypeError(
                "Un ChatMessage est requis."
            );

        }


        if (
            this.isFinalized(
                message
            )
        ) {

            return message;

        }


        const data =
            message.getFlag(
                SYSTEM_ID,
                MESSAGE_FLAG
            );


        if (!data) {

            throw new Error(
                "Le résultat YZE du message est introuvable."
            );

        }


        const finalizedData = {

            ...data,

            finalized:
                true

        };


        const result =
            this.getStoredResult(
                message
            );


        const content =
            await this.render(
                result,
                {
                    finalized:
                        true
                }
            );


        await message.update({

            content,

            [`flags.${SYSTEM_ID}.${MESSAGE_FLAG}`]:
                finalizedData

        });


        return message;

    }

    /**
     * Force un jet depuis le Chat.
     *
     * Premier Push :
     * useStress = false.
     *
     * Second Push :
     * useStress = true.
     *
     * Toutes les règles Métro restent
     * déléguées à Actor.pushRoll().
     */
    static async pushMessage(
        message,
        {
            useStress = false
        } = {}
    ) {

        if (!message) {

            throw new TypeError(
                "Un ChatMessage est requis."
            );

        }

        if (
            this.isFinalized(
                message
            )
        ) {

            throw new Error(
                "Ce résultat a déjà été finalisé."
            );

        }        

        const result =
            this.getStoredResult(
                message
            );


        if (!result) {

            throw new Error(
                "Le résultat YZE du message est introuvable."
            );

        }


        /*
         * Sécurité côté présentation.
         *
         * La vraie règle reste également
         * contrôlée par pushMetroRoll().
         */
        if (
            result.pushCount >= 2
        ) {

            throw new Error(
                "Ce jet ne peut plus être forcé."
            );

        }


        /*
         * Un second Push doit explicitement
         * passer par l'option Stress.
         */
        if (
            result.pushCount === 1
            && !useStress
        ) {

            throw new Error(
                "Le second Push nécessite de subir un dé de Stress."
            );

        }


        /*
         * Inversement, le premier Push
         * ne doit pas accidentellement
         * utiliser le mode Stress.
         */
        if (
            result.pushCount === 0
            && useStress
        ) {

            throw new Error(
                "Le premier Push ne nécessite pas de Stress."
            );

        }


        const actorUuid =
            result.context
                ?.actorUuid;


        let actor = null;


        if (actorUuid) {

            actor =
                await fromUuid(
                    actorUuid
                );

        }


        if (!actor) {

            const actorId =
                result.context
                    ?.actorId;


            actor =
                game.actors.get(
                    actorId
                )
                ?? null;

        }


        if (!actor) {

            throw new Error(
                "L'Actor ayant effectué ce jet est introuvable."
            );

        }


        if (!actor.isOwner) {

            throw new Error(
                "Vous ne pouvez pas forcer le jet de cet Actor."
            );

        }


        let pushedResult = null;


        const attackType =
            result.context
                ?.attack
                ?.type
            ?? null;


        // ============================================================
        // PUSH D'UNE ATTAQUE À DISTANCE
        // ============================================================

        if (
            attackType === "ranged"
        ) {

            if (
                typeof actor.pushRangedAttack
                    !== "function"
            ) {

                throw new Error(
                    "Cet Actor ne possède pas la méthode pushRangedAttack()."
                );

            }


            /*
            * Premier Push :
            * conserver strictement l'ancien chemin validé.
            *
            * Second Push :
            * transmettre explicitement le paiement en Stress.
            */
            if (useStress) {

                pushedResult =
                    await actor.pushRangedAttack(
                        result,
                        {
                            useStress: true
                        }
                    );

            }
            else {

                pushedResult =
                    await actor.pushRangedAttack(
                        result
                    );

            }

        }


        // ============================================================
        // PUSH YZE GÉNÉRIQUE
        // ============================================================

        else {

            if (
                typeof actor.pushRoll
                    !== "function"
            ) {

                throw new Error(
                    "Cet Actor ne possède pas la méthode pushRoll()."
                );

            }


            if (useStress) {

                pushedResult =
                    await actor.pushRoll(
                        result,
                        {
                            useStress: true
                        }
                    );

            }
            else {

                pushedResult =
                    await actor.pushRoll(
                        result
                    );

            }


        }



        await this.updateMessage(
            message,
            pushedResult
        );


        return pushedResult;

    }

}

