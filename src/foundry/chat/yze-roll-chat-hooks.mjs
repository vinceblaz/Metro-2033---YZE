import {
    triggerWeaponVenom
} from "../poison/weapon-venom.mjs";

import {
    YZERollChat,
    getYZERollLabel
} from "./yze-roll-chat.mjs";

import {
    resolveAfflictionsForRoll
} from "../afflictions/afflictions-service.mjs";

import {
    RangedAttackResolutionService
} from "../../combat/ranged-attack-resolution-service.mjs";

import {
    RangedStuntDialog,
    FoundryRangedStuntDialog
} from "../applications/ranged-stunt-dialog.mjs";

import {
    createRangedAttackApplicationPlan
} from "../../domain/rules/ranged-attack-application-plan.mjs";

import {
    createRangedAttackApplicationLedger,
    getRangedAttackBlockedOperations,
    resolveRangedAttackProtectionChoice,
    resolveRangedAttackDisarmChoice
} from "../../domain/rules/ranged-attack-application-ledger.mjs";

import {
    applyRangedAttackApplicationLedger
} from "../../application/ranged-attack-application.mjs";

import {
    InitiativeSwapService
} from "../../combat/initiative-swap-service.mjs";

import {
    resolveRangedAttackApplicationStatus,
    RANGED_ATTACK_APPLICATION_STATUSES
} from "../../combat/ranged-attack-workflow.mjs";

import {
    applyStationSurvivalRollSuccesses
} from "../../domain/rules/station-survival-roll.mjs";


/**
 * Applique le gain d'un jet de SURVIE (système Station, livre
 * p.219) à la ressource de Station ciblée, une fois le jet
 * finalisé — jamais avant, pour ne jamais appliquer un résultat
 * qui pourrait encore être repoussé (Push).
 *
 * Fonction dépendante de l'API Foundry (fromUuid, ChatMessage) :
 * non testée unitairement par convention du projet. La règle
 * pure elle-même (applyStationSurvivalRollSuccesses) est testée
 * séparément.
 */
export async function applyStationSurvivalRollFromMessage(
    message
) {

    const result =
        YZERollChat.getStoredResult(
            message
        );

    const stationSurvival =
        result?.context?.stationSurvival
        ?? null;


    if (!stationSurvival) {

        throw new Error(
            "Ce jet n'est pas rattaché à un jet de Survie de Station."
        );

    }


    if (!YZERollChat.isFinalized(message)) {

        throw new Error(
            "Le jet doit être verrouillé (« Accepter le "
            + "résultat ») avant d'être appliqué à la Station."
        );

    }


    if (stationSurvival.applied === true) {

        throw new Error(
            "Ce jet a déjà été appliqué à la Station."
        );

    }


    const station =
        await fromUuid(
            stationSurvival.stationUuid
        );

    if (!station) {

        throw new Error(
            "La Station ciblée est introuvable."
        );

    }


    const currentLevel =
        Number(
            station.system?.resources?.[
                stationSurvival.resourceKey
            ]
            ?? 0
        );

    const newLevel =
        applyStationSurvivalRollSuccesses({
            currentLevel,
            successes:
                Number(
                    result.successes
                    ?? 0
                )
        });

    await station.update({
        [`system.resources.${stationSurvival.resourceKey}`]:
            newLevel
    });


    const updatedResult = {

        ...result,

        context: {

            ...result.context,

            stationSurvival: {

                ...stationSurvival,

                applied:
                    true

            }

        }

    };

    await YZERollChat.updateMessage(
        message,
        updatedResult
    );


    return updatedResult;

}


/**
 * Câble le bouton « Appliquer à la Station » d'une carte de
 * jet de Survie liée au système Station.
 */
export function bindStationSurvivalApplyChoice(
    message,
    html
) {

    const button =
        html?.querySelector?.(
            '[data-action="apply-station-survival"]'
        );

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            if (button.disabled) {
                return;
            }

            button.disabled =
                true;

            try {

                await applyStationSurvivalRollFromMessage(
                    message
                );

            }
            catch (error) {

                console.error(
                    "Metro 2033 | Impossible d'appliquer le jet de Survie à la Station",
                    error
                );

                ui.notifications.error(
                    error.message
                    ?? "Impossible d'appliquer le jet de Survie à la Station."
                );

                button.disabled =
                    false;

            }

        }
    );

}

export async function resolveFinalizedYZERollMessage(
    message,
    {
        getStoredResult,
        resolveRangedAttack
    } = {}
) {

    const result =
        getStoredResult(
            message
        );


    if (
        result?.context
            ?.attack
            ?.type !==
        "ranged"
    ) {
        return null;
    }


    return await resolveRangedAttack(
        message
    );

}

export async function finalizeYZERollMessage(
    message,
    {
        finalizeMessage,
        resolveFinalizedMessage,

        /*
         * Facultatif : appelé UNE fois après la finalisation et
         * la résolution (répartition des afflictions des jets
         * sans étape de dégâts/éclats, livre p.177). Ne peut
         * jamais empêcher la finalisation.
         */
        afterFinalize
    } = {}
) {

    await finalizeMessage(
        message
    );


    const resolved =
        await resolveFinalizedMessage(
            message
        );


    if (typeof afterFinalize === "function") {

        try {

            await afterFinalize(
                message
            );

        }
        catch (error) {

            console.error(
                "Metro 2033 | Afflictions : échec après la finalisation du jet",
                error
            );

        }

    }


    return resolved;

}


/**
 * Jets SANS étape de dégâts/éclats (compétence, attribut,
 * réaction...) : les afflictions se répartissent à la
 * finalisation du jet.
 *
 * Les jets d'attaque (context.attack) ont leur propre étape de
 * résolution (tir : « Résoudre les dégâts » ; mêlée : workflow) et
 * y ouvrent la répartition : on les ignore ici pour ne l'ouvrir
 * qu'une fois par jet.
 *
 * Dépend de l'API Foundry (fromUuid, game) : non testée
 * unitairement. L'idempotence est garantie par le service.
 */
export async function resolveAfflictionsForFinalizedGenericRoll(
    message
) {

    const result =
        YZERollChat.getStoredResult(
            message
        );

    if (
        !result
        || result.context?.attack
    ) {

        return null;

    }

    const actor =
        await resolveYZERollAttacker(
            result,
            {
                resolveUuid:
                    uuid =>
                        fromUuid(
                            uuid
                        ),

                getActorById:
                    actorId =>
                        game.actors.get(
                            actorId
                        )
            }
        );

    return await resolveAfflictionsForRoll({
        actor,
        result,
        message,
        rollLabel:
            getYZERollLabel(
                result
            )
    });

}


export async function finalizeRangedAttackMessage(
    message,
    {
        chooseStunts,
        finalizeMessage,
        resolveFinalizedMessage
    } = {}
) {

    const stuntAllocation =
        await chooseStunts(
            message
        );


    if (
        stuntAllocation === null
    ) {

        return null;

    }


    await finalizeMessage(
        message
    );


    return await resolveFinalizedMessage(
        message,
        {
            stuntAllocation
        }
    );

}

export async function finalizeYZERollMessageWithRangedPreparation(
    message,
    {
        getStoredResult,
        finalizeRangedAttack,
        finalizeGenericRoll
    } = {}
) {

    const storedResult =
        getStoredResult(
            message
        );


    const attackType =
        storedResult
            ?.context
            ?.attack
            ?.type
        ?? null;


    if (
        attackType === "ranged"
    ) {

        return await finalizeRangedAttack(
            message
        );

    }


    return await finalizeGenericRoll(
        message
    );

}

export function createRangedAttackMessageFinalization({
    getStoredResult,
    chooseStunts,
    finalizeMessage,
    resolveFinalizedMessage
} = {}) {

    return async message => {

        return await finalizeRangedAttackMessage(
            message,
            {
                chooseStunts:
                    currentMessage => {

                        const storedResult =
                            getStoredResult(
                                currentMessage
                            );


                        return chooseStunts(
                            storedResult
                        );

                    },

                finalizeMessage,

                resolveFinalizedMessage
            }
        );

    };

}

export function createFoundryRangedAttackStuntSelection({
    rangedStuntDialog,
    foundryDialog
} = {}) {

    const {
        chooseStunts
    } =
        createRangedAttackResolutionDependencies({
            rangedStuntDialog,
            foundryDialog,

            /*
             * Cette frontière ne compose que
             * la sélection des éclats.
             *
             * La résolution P5 sera raccordée
             * séparément dans le pipeline final.
             */
            rangedAttackResolutionService:
                null
        });


    return chooseStunts;

}

export function createRangedAttackPreparedFinalization({
    getStoredResult,
    chooseStunts,
    finalizeMessage,
    resolveConsequences,
    resolveFinalizedRangedAttack
} = {}) {

    return createRangedAttackMessageFinalization({
        getStoredResult,
        chooseStunts,
        finalizeMessage,

        resolveFinalizedMessage:
            (
                message,
                {
                    stuntAllocation
                } = {}
            ) =>
                resolveFinalizedRangedAttack(
                    message,
                    {
                        stuntAllocation,
                        resolveConsequences
                    }
                )
    });

}

export async function resolveYZERollTarget(
    result,
    {
        resolveUuid,
        getActorById
    } = {}
) {

    const target =
        result?.context
            ?.target
        ?? {};


    const actorUuid =
        target.actorUuid;


    if (actorUuid) {

        const actor =
            await resolveUuid(
                actorUuid
            );


        if (actor) {
            return actor;
        }

    }


    const actorId =
        target.actorId;


    if (actorId) {

        const actor =
            getActorById(
                actorId
            );


        if (actor) {
            return actor;
        }

    }


    return null;

}

export async function resolveYZERollAttacker(
    result,
    {
        resolveUuid,
        getActorById
    } = {}
) {

    const actorUuid =
        result?.context
            ?.actorUuid;


    if (actorUuid) {

        const actor =
            await resolveUuid(
                actorUuid
            );


        if (actor) {
            return actor;
        }

    }


    const actorId =
        result?.context
            ?.actorId;


    if (actorId) {

        const actor =
            getActorById(
                actorId
            );


        if (actor) {
            return actor;
        }

    }


    return null;

}

export function createRangedAttackChatRuntime({
    resolveUuid,
    getActorById,
    getCombatById,
    validateInitiativeSwap,
    scheduleInitiativeSwap,
    storeApplicationState,
    rerenderStoredMessage,
    resolveDisarmChoice
} = {}) {

    return {

        resolveTarget:
            result =>
                resolveYZERollTarget(
                    result,
                    {
                        resolveUuid,
                        getActorById
                    }
                ),

        resolveAttacker:
            result =>
                resolveYZERollAttacker(
                    result,
                    {
                        resolveUuid,
                        getActorById
                    }
                ),

        resolveCombat:
            result =>
                resolveYZERollCombat(
                    result,
                    {
                        getCombatById
                    }
                ),

        validateInitiativeSwap:
            (
                combat,
                attacker,
                target
            ) =>
                validateInitiativeSwap(
                    combat,
                    attacker,
                    target
                ),

        scheduleInitiativeSwap:
            (
                combat,
                attacker,
                target
            ) =>
                scheduleInitiativeSwap(
                    combat,
                    attacker,
                    target
                ),

        resolveProtectionChoice:
            ({
                ledger,
                protectionResult,
                target
            }) =>
                resolveRangedAttackProtectionChoice({
                    ledger,
                    protectionResult,
                    target
                }),

        resolveDisarmChoice,

        storeApplicationState:
            (
                message,
                applicationState
            ) =>
                storeApplicationState(
                    message,
                    applicationState
                ),

        rerenderStoredMessage:
            message =>
                rerenderStoredMessage(
                    message
                )

    };

}

export function createFoundryRangedAttackChatRuntime({
    resolveUuid,
    getActorById,
    getCombatById,
    storeRangedAttackApplication,
    rerenderStoredMessage,
    resolveDisarmChoice
} = {}) {

    return createRangedAttackChatRuntime({
        resolveUuid,

        getActorById,

        getCombatById,

        /*
         * InitiativeSwapService ne possède pas
         * d'opération validateSwap distincte.
         *
         * getParticipants() constitue ici la
         * prévalidation sans mutation :
         * elle vérifie que l'attaquant et la cible
         * participent bien au Combat et résout
         * leurs Combatants.
         */
        validateInitiativeSwap:
            (
                combat,
                attacker,
                target
            ) =>
                InitiativeSwapService
                    .getParticipants(
                        combat,
                        attacker,
                        target
                    ),

        /*
         * La mutation reste séparée de la validation.
         *
         * scheduleSwap() enregistre l'échange pour
         * le round suivant et utilise le contrat
         * positionnel réel du service.
         */
        scheduleInitiativeSwap:
            (
                combat,
                attacker,
                target
            ) =>
                InitiativeSwapService
                    .scheduleSwap(
                        combat,
                        attacker,
                        target
                    ),

        storeApplicationState:
            (
                message,
                applicationState
            ) =>
                storeRangedAttackApplication(
                    message,
                    applicationState
                ),

        rerenderStoredMessage:
            message =>
                rerenderStoredMessage(
                    message
                ),

        resolveDisarmChoice

    });

}

export function createRangedAttackFinalizationDependencies(
    runtime
) {

    return {

        storeApplicationState:
            (
                message,
                applicationState
            ) =>
                runtime
                    .storeApplicationState(
                        message,
                        applicationState
                    ),

        renderStoredMessage:
            message =>
                runtime
                    .rerenderStoredMessage(
                        message
                    )

    };

}


export function createRangedAttackResolutionDependencies({
    rangedStuntDialog,
    foundryDialog,
    rangedAttackResolutionService
} = {}) {

    return {

        chooseStunts:
            storedResult =>
                rangedStuntDialog
                    .chooseAllocation({
                        rollResult:
                            storedResult,

                        explosive:
                            storedResult
                                ?.context
                                ?.attack
                                ?.weapon
                                ?.explosive
                            ?? false,

                        dialog:
                            foundryDialog
                    }),

        resolveConsequences:
            (
                message,
                {
                    stuntAllocation
                } = {}
            ) =>
                rangedAttackResolutionService
                    .resolveMessage(
                        message,
                        {
                            stuntAllocation
                        }
                    )

    };

}

export async function resolveFinalizedRangedAttackMessage(
    message,
    {
        stuntAllocation:
            preparedStuntAllocation,

        chooseStunts =
            async () => ({}),

        resolveConsequences,
        getStoredResult,
        resolveTarget,
        resolveProtection,
        createApplicationPlan,
        createApplicationLedger,
        getBlockedOperations,
        storeApplicationState,
        renderStoredMessage,
        resolveCombat,
        resolveAttacker,
        validateInitiativeSwap,
        scheduleInitiativeSwap,
        applyApplicationLedger
    } = {}
) {

    const storedResult =
        getStoredResult(
            message
        );


    const stuntAllocation =
        preparedStuntAllocation
        !== undefined

            ? preparedStuntAllocation

            : await chooseStunts(
                storedResult
            );


    if (
        stuntAllocation === null
    ) {

        return null;

    }


    const consequenceResult =
        await resolveConsequences(
            message,
            {
                stuntAllocation
            }
        );


    const target =
        await resolveTarget(
            storedResult
        );


    const protectionResult =
        await resolveProtection({
            consequenceResult,
            target
        });


    const applicationPlan =
        createApplicationPlan({
            consequenceResult,
            protectionResult
        });


    const disarmChoices =
        getRangedAttackDisarmChoices(
            target
        );


    const applicationLedger =
        createApplicationLedger({
            applicationPlan,
            protectionResult,
            disarmChoices
        });


    const blockedOperations =
        getBlockedOperations({
            ledger:
                applicationLedger
        });


    /*
     * Harmonisation UX du Tir sur le gabarit du
     * Corps-à-corps (Bible v0.9.3 §163, décision D2) :
     * l'application n'a plus jamais lieu automatiquement
     * ici, même en l'absence de tout blocage — la carte
     * est systématiquement stockée/rerendue dans l'état
     * READY, et n'est appliquée qu'au clic explicite sur
     * « Résoudre les dégâts » (cf. applyReadyRangedAttackLedger).
     */
    const status =
        resolveRangedAttackApplicationStatus({
            blockedOperations
        });


    await storeApplicationState(
        message,
        {
            status,

            protectionResult,
            applicationLedger,
            blockedOperations
        }
    );


    await renderStoredMessage(
        message
    );


    return {
        consequenceResult,
        protectionResult,
        applicationPlan,
        applicationLedger,
        blockedOperations
    };

}


export function resolveRangedAttackChatMessageHtml(
    message,
    {
        root = document
    } = {}
) {

    if (!message?.id) {
        return null;
    }


    return root.querySelector(
        `[data-message-id="${message.id}"]`
    );

}

export function createFoundryRangedAttackChatDependencies({
    getRangedAttackApplication,
    getStoredResult
} = {}) {

    return {

        getRangedAttackApplication:
            message =>
                getRangedAttackApplication(
                    message
                ),

        getStoredResult:
            message =>
                getStoredResult(
                    message
                )

    };

}

export function createFoundryRangedAttackFinalizationRuntime({
    resolveUuid,
    getActorById,
    getCombatById,

    storeRangedAttackApplication,
    rerenderStoredMessage,

    getRangedAttackApplication,
    getStoredResult,

    resolveDisarmChoice,

    resumeProtectionChoice =
        resolveRangedAttackProtectionChoiceFromMessage,

    resumeDisarmChoice =
        resolveRangedAttackDisarmChoiceFromMessage
} = {}) {

    const runtime =
        createFoundryRangedAttackChatRuntime({
            resolveUuid,
            getActorById,
            getCombatById,
            storeRangedAttackApplication,
            rerenderStoredMessage,
            resolveDisarmChoice
        });


    const finalizationDependencies =
        createRangedAttackFinalizationDependencies(
            runtime
        );


    const resolveProtectionChoiceFromMessage =
        (
            message,
            protectionTarget
        ) =>
            resumeProtectionChoice(
                message,
                {
                    protectionTarget,

                    getApplicationState:
                        currentMessage =>
                            getRangedAttackApplication(
                                currentMessage
                            ),

                    getStoredResult:
                        currentMessage =>
                            getStoredResult(
                                currentMessage
                            ),

                    resolveTarget:
                        storedResult =>
                            runtime.resolveTarget(
                                storedResult
                            ),

                    resolveAttacker:
                        storedResult =>
                            runtime.resolveAttacker(
                                storedResult
                            ),

                    resolveCombat:
                        storedResult =>
                            runtime.resolveCombat(
                                storedResult
                            ),

                    resumeApplication:
                        resumeRangedAttackApplicationAfterProtectionChoice,

                    resolveProtectionChoice:
                        runtime.resolveProtectionChoice,

                    getBlockedOperations:
                        ({
                            ledger
                        }) =>
                            getRangedAttackBlockedOperations({
                                ledger
                            }),

                    applyApplicationLedger:
                        ({
                            ledger,
                            actor,
                            combat,
                            attacker,
                            validateInitiativeSwap,
                            scheduleInitiativeSwap
                        }) =>
                            applyRangedAttackApplicationLedger({
                                ledger,
                                actor,
                                combat,
                                attacker,
                                validateInitiativeSwap,
                                scheduleInitiativeSwap
                            }),

                    validateInitiativeSwap:
                        runtime.validateInitiativeSwap,

                    scheduleInitiativeSwap:
                        runtime.scheduleInitiativeSwap,

                    storeApplicationState:
                        (
                            currentMessage,
                            applicationState
                        ) =>
                            runtime
                                .storeApplicationState(
                                    currentMessage,
                                    applicationState
                                ),

                    renderStoredMessage:
                        currentMessage =>
                            runtime
                                .rerenderStoredMessage(
                                    currentMessage
                                )
                }
            );


    const resolveDisarmChoiceFromMessage =
        (
            message,
            itemId
        ) =>
            resumeDisarmChoice(
                message,
                {
                    itemId,

                    getApplicationState:
                        currentMessage =>
                            getRangedAttackApplication(
                                currentMessage
                            ),

                    getStoredResult:
                        currentMessage =>
                            getStoredResult(
                                currentMessage
                            ),

                    resolveTarget:
                        storedResult =>
                            runtime.resolveTarget(
                                storedResult
                            ),

                    resolveAttacker:
                        storedResult =>
                            runtime.resolveAttacker(
                                storedResult
                            ),

                    resolveCombat:
                        storedResult =>
                            runtime.resolveCombat(
                                storedResult
                            ),

                    resumeApplication:
                        resumeRangedAttackApplicationAfterDisarmChoice,

                    resolveDisarmChoice:
                        runtime.resolveDisarmChoice,

                    getBlockedOperations:
                        ({
                            ledger
                        }) =>
                            getRangedAttackBlockedOperations({
                                ledger
                            }),

                    applyApplicationLedger:
                        ({
                            ledger,
                            actor,
                            combat,
                            attacker,
                            validateInitiativeSwap,
                            scheduleInitiativeSwap
                        }) =>
                            applyRangedAttackApplicationLedger({
                                ledger,
                                actor,
                                combat,
                                attacker,
                                validateInitiativeSwap,
                                scheduleInitiativeSwap
                            }),

                    validateInitiativeSwap:
                        runtime.validateInitiativeSwap,

                    scheduleInitiativeSwap:
                        runtime.scheduleInitiativeSwap,

                    storeApplicationState:
                        (
                            currentMessage,
                            applicationState
                        ) =>
                            runtime
                                .storeApplicationState(
                                    currentMessage,
                                    applicationState
                                ),

                    renderStoredMessage:
                        currentMessage =>
                            runtime
                                .rerenderStoredMessage(
                                    currentMessage
                                )
                }
            );


    const resolveApplyChoiceFromMessage =
        message =>
            applyReadyRangedAttackLedger(
                message,
                {
                    getApplicationState:
                        currentMessage =>
                            getRangedAttackApplication(
                                currentMessage
                            ),

                    getStoredResult:
                        currentMessage =>
                            getStoredResult(
                                currentMessage
                            ),

                    resolveTarget:
                        storedResult =>
                            runtime.resolveTarget(
                                storedResult
                            ),

                    resolveAttacker:
                        storedResult =>
                            runtime.resolveAttacker(
                                storedResult
                            ),

                    resolveCombat:
                        storedResult =>
                            runtime.resolveCombat(
                                storedResult
                            ),

                    applyApplicationLedger:
                        ({
                            ledger,
                            actor,
                            combat,
                            attacker,
                            validateInitiativeSwap,
                            scheduleInitiativeSwap
                        }) =>
                            applyRangedAttackApplicationLedger({
                                ledger,
                                actor,
                                combat,
                                attacker,
                                validateInitiativeSwap,
                                scheduleInitiativeSwap
                            }),

                    validateInitiativeSwap:
                        runtime.validateInitiativeSwap,

                    scheduleInitiativeSwap:
                        runtime.scheduleInitiativeSwap,

                    storeApplicationState:
                        (
                            currentMessage,
                            applicationState
                        ) =>
                            runtime
                                .storeApplicationState(
                                    currentMessage,
                                    applicationState
                                ),

                    renderStoredMessage:
                        currentMessage =>
                            runtime
                                .rerenderStoredMessage(
                                    currentMessage
                                ),

                    /*
                     * Après « Résoudre les dégâts » : répartition
                     * des afflictions du jet du tireur.
                     */
                    afterApply:
                        async ({
                            message: appliedMessage,
                            storedResult,
                            attacker,
                            target,
                            ledger
                        }) => {

                            /*
                             * Venin d'une arme naturelle (ex. jet de
                             * salive du vodianoï) : au moins 1 point
                             * de dégâts à la Vigueur de la cible.
                             */
                            await triggerWeaponVenom(
                                attacker?.items?.get(
                                    storedResult?.context?.weapon?.id
                                ),
                                target,
                                (ledger?.operations ?? [])
                                    .filter(
                                        operation =>
                                            operation.type === "attribute-damage"
                                            && operation.attribute === "vigor"
                                    )
                                    .reduce(
                                        (total, operation) =>
                                            total + Number(operation.amount ?? 0),
                                        0
                                    )
                            );

                            return resolveAfflictionsForRoll({
                                actor:
                                    attacker,
                                result:
                                    storedResult,
                                message:
                                    appliedMessage,
                                rollLabel:
                                    getYZERollLabel(
                                        storedResult
                                    )
                            });

                        }
                }
            );


    return {
        ...runtime,
        ...finalizationDependencies,

        resolveProtectionChoiceFromMessage,
        resolveDisarmChoiceFromMessage,
        resolveApplyChoiceFromMessage
    };

}

export function createFoundryRangedAttackProductionRuntime({
    resolveUuid,
    getActorById,
    getCombatById,

    storeRangedAttackApplication,
    rerenderStoredMessage,

    getRangedAttackApplication,
    getStoredResult,

    getMessageHtml,
    bindMessageInteractions,

    resolveDisarmChoice,

    resumeProtectionChoice
} = {}) {

    const chatDependencies =
        createFoundryRangedAttackChatDependencies({
            getRangedAttackApplication,
            getStoredResult
        });


    const rerenderInteractiveMessage =
        message =>
            rerenderRangedAttackChatMessage(
                message,
                {
                    rerenderStoredMessage,

                    getMessageHtml,

                    bindMessageInteractions
                }
            );


    return createFoundryRangedAttackFinalizationRuntime({
        resolveUuid,
        getActorById,
        getCombatById,

        storeRangedAttackApplication,

        rerenderStoredMessage:
            rerenderInteractiveMessage,

        getRangedAttackApplication:
            chatDependencies
                .getRangedAttackApplication,

        getStoredResult:
            chatDependencies
                .getStoredResult,

        resolveDisarmChoice,

        resumeProtectionChoice
    });

}

export async function resolveRangedAttackProtectionChoiceAction(
    message,
    button,
    runtime
) {

    if (
        button.disabled
    ) {
        return null;
    }


    button.disabled =
        true;


    const protectionTarget =
        button.dataset
            ?.protectionTarget
        ?? null;


    try {

        return await runtime
            .resolveProtectionChoiceFromMessage(
                message,
                protectionTarget
            );

    }
    catch (error) {

        button.disabled =
            false;


        throw error;

    }

}

export function bindRangedAttackProtectionChoice(
    message,
    html,
    runtime,
    {
        resolveAction =
            resolveRangedAttackProtectionChoiceAction,

        reportError =
            error => {

                console.error(
                    "Metro 2033 | Impossible de résoudre le choix de Protection",
                    error
                );


                ui.notifications.error(
                    error.message
                    ?? "Impossible de résoudre le choix de Protection."
                );

            }
    } = {}
) {

    const protectionButtons =
        html.querySelectorAll(
            '[data-action="resolve-ranged-protection"]'
        );


    if (
        protectionButtons.length === 0
    ) {
        return;
    }


    for (
        const protectionButton
        of protectionButtons
    ) {

        protectionButton.addEventListener(
            "click",
            async event => {

                event.preventDefault();


                try {

                    await resolveAction(
                        message,
                        protectionButton,
                        runtime
                    );

                }
                catch (error) {

                    reportError(
                        error
                    );

                }

            }
        );

    }

}

export async function rerenderRangedAttackChatMessage(
    message,
    {
        rerenderStoredMessage,
        getMessageHtml,
        bindMessageInteractions
    } = {}
) {

    if (!message) {

        throw new TypeError(
            "Un ChatMessage est requis."
        );

    }


    if (
        typeof rerenderStoredMessage
        !== "function"
    ) {

        throw new TypeError(
            "Une fonction de rerendu du ChatMessage est requise."
        );

    }


    if (
        typeof getMessageHtml
        !== "function"
    ) {

        throw new TypeError(
            "Une fonction de résolution du HTML du ChatMessage est requise."
        );

    }


    if (
        typeof bindMessageInteractions
        !== "function"
    ) {

        throw new TypeError(
            "Une fonction de raccordement des interactions du ChatMessage est requise."
        );

    }


    await rerenderStoredMessage(
        message
    );


    const html =
        getMessageHtml(
            message
        );


    if (html) {

        bindMessageInteractions(
            message,
            html
        );

    }


    return message;

}

export function bindRangedAttackDisarmChoice(
    message,
    html,
    runtime
) {

    const buttons =
        html?.querySelectorAll?.(
            '[data-action="resolve-ranged-disarm"]'
        )
        ?? [];


    for (
        const button
        of buttons
    ) {

        button.addEventListener(
            "click",
            async event => {

                event.preventDefault();


                const itemId =
                    button.dataset?.itemId;


                if (
                    typeof itemId !==
                        "string"
                    ||
                    itemId.length === 0
                ) {
                    throw new Error(
                        "L'identifiant de l'arme à désarmer est manquant."
                    );
                }


                button.disabled =
                    true;


                try {

                    await runtime
                        .resolveDisarmChoiceFromMessage(
                            message,
                            itemId
                        );

                }
                catch (error) {

                    button.disabled =
                        false;

                    throw error;

                }

            }
        );

    }

}


export function bindRangedAttackProtectionChoiceOnRender(
    message,
    html,
    runtime,
    {
        bindProtectionChoice =
            bindRangedAttackProtectionChoice
    } = {}
) {

    bindProtectionChoice(
        message,
        html,
        runtime
    );

}


/**
 * Câble le bouton « Résoudre les dégâts » (harmonisation UX
 * du Tir, Bible v0.9.3 §163, décision D2) : affiché à l'état
 * READY, systématiquement — y compris un Tir simple n'ayant
 * jamais eu à bloquer sur une Protection ou un désarmement.
 */
export function bindRangedAttackApplyChoice(
    message,
    html,
    runtime
) {

    const buttons =
        html?.querySelectorAll?.(
            '[data-action="apply-ranged-attack"]'
        )
        ?? [];


    for (
        const button
        of buttons
    ) {

        button.addEventListener(
            "click",
            async event => {

                event.preventDefault();


                if (
                    button.disabled
                ) {
                    return;
                }


                button.disabled =
                    true;


                try {

                    await runtime
                        .resolveApplyChoiceFromMessage(
                            message
                        );

                }
                catch (error) {

                    button.disabled =
                        false;

                    throw error;

                }

            }
        );

    }

}


export function bindRangedAttackChatMessageInteractions(
    message,
    html,
    runtime,
    {
        bindProtectionChoiceOnRender =
            bindRangedAttackProtectionChoiceOnRender,

        bindDisarmChoice =
            bindRangedAttackDisarmChoice,

        bindApplyChoice =
            bindRangedAttackApplyChoice
    } = {}
) {

    bindProtectionChoiceOnRender(
        message,
        html,
        runtime
    );


    bindDisarmChoice(
        message,
        html,
        runtime
    );


    bindApplyChoice(
        message,
        html,
        runtime
    );

}

export function createRangedAttackChatInteractionDependencies(
    runtime,
    {
        resolveMessageHtml =
            resolveRangedAttackChatMessageHtml,

        bindInteractions =
            bindRangedAttackChatMessageInteractions
    } = {}
) {

    return {

        getMessageHtml:
            message =>
                resolveMessageHtml(
                    message
                ),

        bindMessageInteractions:
            (
                message,
                html
            ) =>
                bindInteractions(
                    message,
                    html,
                    runtime
                )

    };

}

export function createFoundryRangedAttackProductionRuntimeWithInteractions({
    resolveUuid,
    getActorById,
    getCombatById,

    storeRangedAttackApplication,
    rerenderStoredMessage,

    getRangedAttackApplication,
    getStoredResult,

    resolveMessageHtml =
        resolveRangedAttackChatMessageHtml,

    bindInteractions =
        bindRangedAttackChatMessageInteractions,

    resolveDisarmChoice,

    resumeProtectionChoice
} = {}) {

    let runtime =
        null;


    runtime =
        createFoundryRangedAttackProductionRuntime({
            resolveUuid,
            getActorById,
            getCombatById,

            storeRangedAttackApplication,
            rerenderStoredMessage,

            getRangedAttackApplication,
            getStoredResult,

            getMessageHtml:
                message =>
                    resolveMessageHtml(
                        message
                    ),

            bindMessageInteractions:
                (
                    message,
                    html
                ) =>
                    bindInteractions(
                        message,
                        html,
                        runtime
                    ),

            resolveDisarmChoice,

            resumeProtectionChoice
        });


    return runtime;

}

export function createRegisteredRangedAttackRuntime({
    resolveUuid,
    getActorById,
    getCombatById,

    storeRangedAttackApplication,
    rerenderStoredMessage,

    getRangedAttackApplication,
    getStoredResult,

    resolveMessageHtml =
        resolveRangedAttackChatMessageHtml,

    bindInteractions =
        bindRangedAttackChatMessageInteractions,

    resolveDisarmChoice,

    resumeProtectionChoice
} = {}) {

    return createFoundryRangedAttackProductionRuntimeWithInteractions({
        resolveUuid,
        getActorById,
        getCombatById,

        storeRangedAttackApplication,
        rerenderStoredMessage,

        getRangedAttackApplication,
        getStoredResult,

        resolveMessageHtml,
        bindInteractions,

        resolveDisarmChoice,

        resumeProtectionChoice
    });

}


export async function resumeRangedAttackApplicationAfterProtectionChoice(
    {
        protectionResult,
        applicationLedger
    },
    {
        protectionTarget,
        target,
        combat,
        attacker,
        resolveProtectionChoice,
        getBlockedOperations,
        applyApplicationLedger,
        validateInitiativeSwap,
        scheduleInitiativeSwap
    } = {}
) {

    const resolvedLedger =
        resolveProtectionChoice({
            ledger:
                applicationLedger,

            protectionResult,

            target:
                protectionTarget
        });


    const blockedOperations =
        getBlockedOperations({
            ledger:
                resolvedLedger
        });


    /*
     * Harmonisation UX du Tir (cf. resolveFinalizedRangedAttackMessage) :
     * même le dernier blocage levé n'applique plus
     * automatiquement le ledger — la carte repasse à
     * l'état READY et attend le clic sur
     * « Résoudre les dégâts ».
     */


    return {
        applicationLedger:
            resolvedLedger,

        blockedOperations
    };

}

export async function resolveRangedAttackProtectionChoiceFromMessage(
    message,
    {
        protectionTarget,

        getApplicationState,
        getStoredResult,

        resolveTarget,
        resolveAttacker,
        resolveCombat,

        resumeApplication,

        resolveProtectionChoice,
        getBlockedOperations,
        applyApplicationLedger,

        validateInitiativeSwap,
        scheduleInitiativeSwap,

        storeApplicationState,
        renderStoredMessage
    }
) {

    const applicationState =
        getApplicationState(
            message
        );


    if (
        applicationState?.status ===
            "applied"
    ) {
        throw new Error(
            "L'application de l'attaque à distance est déjà terminée."
        );
    }


    const storedResult =
        getStoredResult(
            message
        );


    const target =
        await resolveTarget(
            storedResult
        );


    const attacker =
        await resolveAttacker(
            storedResult
        );


    const combat =
        resolveCombat(
            storedResult
        );


    const result =
        await resumeApplication(
            {
                protectionResult:
                    applicationState.protectionResult,

                applicationLedger:
                    applicationState.applicationLedger
            },
            {
                protectionTarget,

                target,

                attacker,

                combat,

                resolveProtectionChoice,
                getBlockedOperations,
                applyApplicationLedger,

                validateInitiativeSwap,
                scheduleInitiativeSwap
            }
        );


    const hasBlockedOperations =
        result.blockedOperations.length > 0;


    await storeApplicationState(
        message,
        {
            status:
                hasBlockedOperations
                    ? RANGED_ATTACK_APPLICATION_STATUSES.BLOCKED
                    : RANGED_ATTACK_APPLICATION_STATUSES.READY,

            protectionResult:
                applicationState.protectionResult,

            applicationLedger:
                result.applicationLedger,

            blockedOperations:
                result.blockedOperations
        }
    );


    await renderStoredMessage(
        message
    );


    return result;

}

export async function resolveRangedAttackDisarmChoiceFromMessage(
    message,
    {
        itemId,

        getApplicationState,
        getStoredResult,

        resolveTarget,
        resolveAttacker,
        resolveCombat,

        resumeApplication,

        resolveDisarmChoice,
        getBlockedOperations,
        applyApplicationLedger,

        validateInitiativeSwap,
        scheduleInitiativeSwap,

        storeApplicationState,
        renderStoredMessage
    }
) {

    const applicationState =
        getApplicationState(
            message
        );


    if (
        applicationState?.status ===
            "applied"
    ) {
        throw new Error(
            "L'application de l'attaque à distance est déjà terminée."
        );
    }


    const storedResult =
        getStoredResult(
            message
        );


    const target =
        await resolveTarget(
            storedResult
        );


    const attacker =
        await resolveAttacker(
            storedResult
        );


    const combat =
        resolveCombat(
            storedResult
        );


    const result =
        await resumeApplication(
            {
                applicationLedger:
                    applicationState.applicationLedger
            },
            {
                itemId,

                target,

                attacker,

                combat,

                resolveDisarmChoice,
                getBlockedOperations,
                applyApplicationLedger,

                validateInitiativeSwap,
                scheduleInitiativeSwap
            }
        );


    const hasBlockedOperations =
        result.blockedOperations.length > 0;


    await storeApplicationState(
        message,
        {
            status:
                hasBlockedOperations
                    ? RANGED_ATTACK_APPLICATION_STATUSES.BLOCKED
                    : RANGED_ATTACK_APPLICATION_STATUSES.READY,

            protectionResult:
                applicationState.protectionResult,

            applicationLedger:
                result.applicationLedger,

            blockedOperations:
                result.blockedOperations
        }
    );


    await renderStoredMessage(
        message
    );


    return result;

}

export async function resumeRangedAttackApplicationAfterDisarmChoice(
    {
        applicationLedger
    },
    {
        itemId,
        target,
        combat,
        attacker,
        resolveDisarmChoice,
        getBlockedOperations,
        applyApplicationLedger,
        validateInitiativeSwap,
        scheduleInitiativeSwap
    } = {}
) {

    const resolvedLedger =
        resolveDisarmChoice({
            ledger:
                applicationLedger,

            itemId
        });


    const blockedOperations =
        getBlockedOperations({
            ledger:
                resolvedLedger
        });


    /*
     * Harmonisation UX du Tir (cf. resolveFinalizedRangedAttackMessage) :
     * même le dernier blocage levé n'applique plus
     * automatiquement le ledger — la carte repasse à
     * l'état READY et attend le clic sur
     * « Résoudre les dégâts ».
     */


    return {
        applicationLedger:
            resolvedLedger,

        blockedOperations
    };

}


/**
 * Applique réellement un ledger d'attaque à distance à
 * l'état READY (plus aucune opération bloquée, application
 * encore en attente du clic de validation manuelle).
 *
 * Harmonisation UX du Tir sur le gabarit du Corps-à-corps
 * (Bible v0.9.3 §163, décision D2) : c'est désormais le SEUL
 * chemin par lequel un ledger d'attaque à distance est
 * effectivement appliqué — ni la résolution initiale ni la
 * résolution d'un choix de Protection/Désarmement n'appliquent
 * plus jamais le ledger elles-mêmes (cf. les fonctions
 * ci-dessus).
 *
 * Rejette si l'état n'est pas READY (déjà appliqué, ou encore
 * bloqué par un choix de Protection/Désarmement non résolu).
 */
export async function applyReadyRangedAttackLedger(
    message,
    {
        getApplicationState,
        getStoredResult,

        resolveTarget,
        resolveAttacker,
        resolveCombat,

        applyApplicationLedger,
        validateInitiativeSwap,
        scheduleInitiativeSwap,

        storeApplicationState,
        renderStoredMessage,

        /*
         * Facultatif : appelé UNE fois, après l'application du
         * ledger et le rendu de la carte (répartition des
         * afflictions du jet du tireur, livre p.177). Ne peut
         * jamais empêcher la résolution des dégâts.
         */
        afterApply
    } = {}
) {

    const applicationState =
        getApplicationState(
            message
        );


    if (
        applicationState?.status
        === RANGED_ATTACK_APPLICATION_STATUSES.APPLIED
    ) {

        throw new Error(
            "L'application de l'attaque à distance est déjà terminée."
        );

    }


    if (
        applicationState?.status
        !== RANGED_ATTACK_APPLICATION_STATUSES.READY
    ) {

        throw new Error(
            "Les dégâts ne peuvent pas être appliqués dans l'état actuel."
        );

    }


    const storedResult =
        getStoredResult(
            message
        );


    const target =
        await resolveTarget(
            storedResult
        );


    const attacker =
        await resolveAttacker(
            storedResult
        );


    const combat =
        resolveCombat(
            storedResult
        );


    await applyApplicationLedger({
        ledger:
            applicationState.applicationLedger,

        actor:
            target,

        combat,

        attacker,

        validateInitiativeSwap,

        scheduleInitiativeSwap
    });


    await storeApplicationState(
        message,
        {
            ...applicationState,

            status:
                RANGED_ATTACK_APPLICATION_STATUSES.APPLIED
        }
    );


    await renderStoredMessage(
        message
    );


    if (typeof afterApply === "function") {

        try {

            await afterApply({
                message,
                storedResult,
                attacker,
                target,
                ledger:
                    applicationState.applicationLedger
            });

        }
        catch (error) {

            console.error(
                "Metro 2033 | Afflictions : échec après la résolution des dégâts du tir",
                error
            );

        }

    }


    return applicationState;

}


export function getRangedAttackDisarmChoices(
    target
) {

    if (
        !target?.items
        ||
        typeof target.items[
            Symbol.iterator
        ] !== "function"
    ) {
        return [];
    }


    return Array
        .from(
            target.items
        )
        .filter(
            item =>
                item?.type ===
                    "weapon"
                &&
                item.system?.equipped ===
                    true
        )
        .map(
            item => ({
                itemId:
                    item.id,

                name:
                    item.name
            })
        );

}

/**
 * Retrouve le Combat Foundry associé
 * à un résultat YZE sérialisé.
 *
 * Le résultat conserve uniquement
 * l'identifiant du Combat.
 *
 * Fonction sans dépendance directe
 * à game.combats afin de rester
 * testable hors de Foundry.
 */
export function resolveYZERollCombat(
    result,
    {
        getCombatById
    } = {}
) {

    const combatId =
        result?.context
            ?.combatId;


    if (!combatId) {
        return null;
    }


    return (
        getCombatById(
            combatId
        )
        ?? null
    );

}

export function registerYZERollChatHooks() {

    const rangedAttackRuntime =
        createRegisteredRangedAttackRuntime({
            resolveUuid:
                uuid =>
                    fromUuid(
                        uuid
                    ),

            getActorById:
                actorId =>
                    game.actors.get(
                        actorId
                    )
                    ?? null,

            getCombatById:
                combatId =>
                    game.combats.get(
                        combatId
                    )
                    ?? null,

            storeRangedAttackApplication:
                (
                    message,
                    applicationState
                ) =>
                    YZERollChat
                        .storeRangedAttackApplication(
                            message,
                            applicationState
                        ),

            rerenderStoredMessage:
                message =>
                    YZERollChat
                        .rerenderStoredMessage(
                            message
                        ),

            getRangedAttackApplication:
                message =>
                    YZERollChat
                        .getRangedAttackApplication(
                            message
                        ),

            getStoredResult:
                message =>
                    YZERollChat
                        .getStoredResult(
                            message
                        ),

            resolveDisarmChoice:
                resolveRangedAttackDisarmChoice
        });


    const chooseRangedStunts =
        createFoundryRangedAttackStuntSelection({
            rangedStuntDialog:
                RangedStuntDialog,

            foundryDialog:
                FoundryRangedStuntDialog
        });


    const {
        resolveConsequences:
            resolveRangedAttackConsequences
    } =
        createRangedAttackResolutionDependencies({
            rangedStuntDialog:
                RangedStuntDialog,

            foundryDialog:
                FoundryRangedStuntDialog,

            rangedAttackResolutionService:
                RangedAttackResolutionService
        });


    const resolvePreparedRangedAttack =
        (
            rangedMessage,
            {
                stuntAllocation,
                resolveConsequences
            } = {}
        ) =>
            resolveFinalizedRangedAttackMessage(
                rangedMessage,
                {
                    stuntAllocation,

                    resolveConsequences,

                    getStoredResult:
                        currentMessage =>
                            YZERollChat
                                .getStoredResult(
                                    currentMessage
                                ),

                    resolveTarget:
                        storedResult =>
                            rangedAttackRuntime
                                .resolveTarget(
                                    storedResult
                                ),

                    resolveProtection:
                        ({
                            consequenceResult,
                            target
                        }) =>
                            RangedAttackResolutionService
                                .resolveProtection({
                                    consequenceResult,
                                    target
                                }),

                    createApplicationPlan:
                        ({
                            consequenceResult,
                            protectionResult
                        }) =>
                            createRangedAttackApplicationPlan({
                                consequenceResult,
                                protectionResult
                            }),

                    createApplicationLedger:
                        ({
                            applicationPlan,
                            protectionResult,
                            disarmChoices
                        }) =>
                            createRangedAttackApplicationLedger({
                                applicationPlan,
                                protectionResult,
                                disarmChoices
                            }),

                    getBlockedOperations:
                        ({
                            ledger
                        }) =>
                            getRangedAttackBlockedOperations({
                                ledger
                            }),

                    storeApplicationState:
                        (
                            currentMessage,
                            applicationState
                        ) =>
                            rangedAttackRuntime
                                .storeApplicationState(
                                    currentMessage,
                                    applicationState
                                ),

                    renderStoredMessage:
                        currentMessage =>
                            rangedAttackRuntime
                                .renderStoredMessage(
                                    currentMessage
                                ),

                    resolveCombat:
                        storedResult =>
                            rangedAttackRuntime
                                .resolveCombat(
                                    storedResult
                                ),

                    resolveAttacker:
                        storedResult =>
                            rangedAttackRuntime
                                .resolveAttacker(
                                    storedResult
                                ),

                    validateInitiativeSwap:
                        (
                            combat,
                            attacker,
                            target
                        ) =>
                            rangedAttackRuntime
                                .validateInitiativeSwap(
                                    combat,
                                    attacker,
                                    target
                                ),

                    scheduleInitiativeSwap:
                        (
                            combat,
                            attacker,
                            target
                        ) =>
                            rangedAttackRuntime
                                .scheduleInitiativeSwap(
                                    combat,
                                    attacker,
                                    target
                                ),

                    applyApplicationLedger:
                        ({
                            ledger,
                            actor,
                            combat,
                            attacker,
                            validateInitiativeSwap,
                            scheduleInitiativeSwap
                        }) =>
                            applyRangedAttackApplicationLedger({
                                ledger,
                                actor,
                                combat,
                                attacker,
                                validateInitiativeSwap,
                                scheduleInitiativeSwap
                            })
                }
            );


    const finalizePreparedRangedAttack =
        createRangedAttackPreparedFinalization({
            getStoredResult:
                currentMessage =>
                    YZERollChat
                        .getStoredResult(
                            currentMessage
                        ),

            chooseStunts:
                chooseRangedStunts,

            finalizeMessage:
                currentMessage =>
                    YZERollChat
                        .finalizeMessage(
                            currentMessage
                        ),

            resolveConsequences:
                resolveRangedAttackConsequences,

            resolveFinalizedRangedAttack:
                resolvePreparedRangedAttack
        });


    const finalizeGenericRoll =
        currentMessage =>
            finalizeYZERollMessage(
                currentMessage,
                {
                    afterFinalize:
                        resolveAfflictionsForFinalizedGenericRoll,

                    finalizeMessage:
                        messageToFinalize =>
                            YZERollChat
                                .finalizeMessage(
                                    messageToFinalize
                                ),

                    resolveFinalizedMessage:
                        finalizedMessage =>
                            resolveFinalizedYZERollMessage(
                                finalizedMessage,
                                {
                                    getStoredResult:
                                        storedMessage =>
                                            YZERollChat
                                                .getStoredResult(
                                                    storedMessage
                                                ),

                                    resolveRangedAttack:
                                        rangedMessage =>
                                            resolveFinalizedRangedAttackMessage(
                                                rangedMessage,
                                                {
                                                    resolveConsequences:
                                                        resolveRangedAttackConsequences,

                                                    getStoredResult:
                                                        storedMessage =>
                                                            YZERollChat
                                                                .getStoredResult(
                                                                    storedMessage
                                                                ),

                                                    resolveTarget:
                                                        storedResult =>
                                                            rangedAttackRuntime
                                                                .resolveTarget(
                                                                    storedResult
                                                                ),

                                                    resolveProtection:
                                                        ({
                                                            consequenceResult,
                                                            target
                                                        }) =>
                                                            RangedAttackResolutionService
                                                                .resolveProtection({
                                                                    consequenceResult,
                                                                    target
                                                                }),

                                                    createApplicationPlan:
                                                        ({
                                                            consequenceResult,
                                                            protectionResult
                                                        }) =>
                                                            createRangedAttackApplicationPlan({
                                                                consequenceResult,
                                                                protectionResult
                                                            }),

                                                    createApplicationLedger:
                                                        ({
                                                            applicationPlan,
                                                            protectionResult,
                                                            disarmChoices
                                                        }) =>
                                                            createRangedAttackApplicationLedger({
                                                                applicationPlan,
                                                                protectionResult,
                                                                disarmChoices
                                                            }),

                                                    getBlockedOperations:
                                                        ({
                                                            ledger
                                                        }) =>
                                                            getRangedAttackBlockedOperations({
                                                                ledger
                                                            }),

                                                    storeApplicationState:
                                                        (
                                                            messageToStore,
                                                            applicationState
                                                        ) =>
                                                            rangedAttackRuntime
                                                                .storeApplicationState(
                                                                    messageToStore,
                                                                    applicationState
                                                                ),

                                                    renderStoredMessage:
                                                        messageToRender =>
                                                            rangedAttackRuntime
                                                                .renderStoredMessage(
                                                                    messageToRender
                                                                ),

                                                    resolveCombat:
                                                        storedResult =>
                                                            rangedAttackRuntime
                                                                .resolveCombat(
                                                                    storedResult
                                                                ),

                                                    resolveAttacker:
                                                        storedResult =>
                                                            rangedAttackRuntime
                                                                .resolveAttacker(
                                                                    storedResult
                                                                ),

                                                    validateInitiativeSwap:
                                                        (
                                                            combat,
                                                            attacker,
                                                            target
                                                        ) =>
                                                            rangedAttackRuntime
                                                                .validateInitiativeSwap(
                                                                    combat,
                                                                    attacker,
                                                                    target
                                                                ),

                                                    scheduleInitiativeSwap:
                                                        (
                                                            combat,
                                                            attacker,
                                                            target
                                                        ) =>
                                                            rangedAttackRuntime
                                                                .scheduleInitiativeSwap(
                                                                    combat,
                                                                    attacker,
                                                                    target
                                                                ),

                                                    applyApplicationLedger:
                                                        ({
                                                            ledger,
                                                            actor,
                                                            combat,
                                                            attacker,
                                                            validateInitiativeSwap,
                                                            scheduleInitiativeSwap
                                                        }) =>
                                                            applyRangedAttackApplicationLedger({
                                                                ledger,
                                                                actor,
                                                                combat,
                                                                attacker,
                                                                validateInitiativeSwap,
                                                                scheduleInitiativeSwap
                                                            })
                                                }
                                            )
                                }
                            )
                }
            );


    Hooks.on(
        "renderChatMessageHTML",
        (
            message,
            html
        ) => {

            // ====================================================
            // INTERACTIONS BLOQUÉES — ATTAQUE À DISTANCE
            // ====================================================

            bindRangedAttackChatMessageInteractions(
                message,
                html,
                rangedAttackRuntime
            );


            // ====================================================
            // JET DE SURVIE — SYSTÈME STATION
            // ====================================================

            bindStationSurvivalApplyChoice(
                message,
                html
            );


            // ====================================================
            // PREMIER PUSH
            // ====================================================

            const pushButton =
                html.querySelector(
                    '[data-action="push-yze-roll"]'
                );


            if (pushButton) {

                pushButton.addEventListener(
                    "click",
                    async event => {

                        event.preventDefault();


                        if (
                            pushButton.disabled
                        ) {
                            return;
                        }


                        pushButton.disabled =
                            true;


                        try {

                            await YZERollChat
                                .pushMessage(
                                    message
                                );

                        }
                        catch (error) {

                            console.error(
                                "Metro 2033 | Impossible de forcer le jet",
                                error
                            );


                            ui.notifications.error(
                                error.message
                                ?? "Impossible de forcer le jet."
                            );


                            /*
                             * Si le Push échoue,
                             * le joueur doit pouvoir
                             * réessayer.
                             */
                            pushButton.disabled =
                                false;

                        }

                    }
                );

            }


            // ====================================================
            // SECOND PUSH — STRESS
            // ====================================================

            const stressPushButton =
                html.querySelector(
                    '[data-action="push-yze-roll-with-stress"]'
                );


            if (stressPushButton) {

                stressPushButton.addEventListener(
                    "click",
                    async event => {

                        event.preventDefault();


                        if (
                            stressPushButton.disabled
                        ) {
                            return;
                        }


                        stressPushButton.disabled =
                            true;


                        try {

                            await YZERollChat
                                .pushMessage(
                                    message,
                                    {
                                        useStress:
                                            true
                                    }
                                );

                        }
                        catch (error) {

                            console.error(
                                "Metro 2033 | Impossible d'effectuer le second Push",
                                error
                            );


                            ui.notifications.error(
                                error.message
                                ?? "Impossible d'effectuer le second Push."
                            );


                            /*
                             * Si le second Push échoue,
                             * le joueur doit pouvoir
                             * réessayer.
                             */
                            stressPushButton.disabled =
                                false;

                        }

                    }
                );

            }


            // ====================================================
            // FINALISATION DU RÉSULTAT
            // ====================================================

            const finalizeButton =
                html.querySelector(
                    '[data-action="finalize-yze-roll"]'
                );


            if (finalizeButton) {

                finalizeButton.addEventListener(
                    "click",
                    async event => {

                        event.preventDefault();


                        if (
                            finalizeButton.disabled
                        ) {
                            return;
                        }


                        finalizeButton.disabled =
                            true;


                        try {

                            const finalizationResult =
                                await finalizeYZERollMessageWithRangedPreparation(
                                    message,
                                    {
                                        getStoredResult:
                                            currentMessage =>
                                                YZERollChat
                                                    .getStoredResult(
                                                        currentMessage
                                                    ),

                                        finalizeRangedAttack:
                                            finalizePreparedRangedAttack,

                                        finalizeGenericRoll
                                    }
                                );


                            /*
                             * Une annulation du choix des éclats
                             * n'est pas une erreur.
                             *
                             * Le message n'a pas été finalisé :
                             * le joueur doit pouvoir relancer
                             * la finalisation.
                             */
                            if (
                                finalizationResult ===
                                null
                            ) {

                                const storedResult =
                                    YZERollChat
                                        .getStoredResult(
                                            message
                                        );


                                if (
                                    storedResult
                                        ?.context
                                        ?.attack
                                        ?.type ===
                                    "ranged"
                                ) {

                                    finalizeButton.disabled =
                                        false;

                                }

                            }

                        }
                        catch (error) {

                            console.error(
                                "Metro 2033 | Impossible de finaliser le résultat",
                                error
                            );


                            ui.notifications.error(
                                error.message
                                ?? "Impossible de finaliser le résultat."
                            );


                            finalizeButton.disabled =
                                false;

                        }

                    }
                );

            }

        }
    );

}
