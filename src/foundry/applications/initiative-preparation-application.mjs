/**
 * Fenêtre MJ de Préparation de l'initiative
 * (A4.7, bible §115, amendée après revue UI
 * du 23 septembre 2026).
 *
 * Trois zones aux sémantiques distinctes :
 *
 * A. Composition (BROUILLON, Annuler/Valider)
 *    Former ou dissoudre des groupes parmi
 *    les Combatants non résolus. Rien n'est
 *    persisté tant que Valider n'a pas été
 *    cliqué (bible §115 : « Une fermeture/
 *    annulation avant validation ne doit pas
 *    modifier l'état persisté »). Au Valider,
 *    chaque groupe créé/modifié/dissous est
 *    appliqué, puis tout groupe se retrouvant
 *    à drawCount = 1 est résolu automatiquement
 *    (aucun choix MJ n'est nécessaire pour une
 *    candidate unique).
 *
 * B. Unités en attente de résolution multiple
 *    (IMMÉDIAT) Unités déjà persistées dont la
 *    résolution nécessite un choix MJ parmi
 *    plusieurs candidates (drawCount > 1), ou
 *    dont la résolution automatique a échoué
 *    (paquet saturé au moment du Valider).
 *
 * C. Initiatives résolues (IMMÉDIAT)
 *    Liste des attributions résolues, avec
 *    rattachement de renfort et extraction
 *    individuelle. Ces opérations dépendent de
 *    la disponibilité d'une carte au moment
 *    exact de leur exécution : elles ne peuvent
 *    pas être mises en brouillon.
 *
 * Cette fenêtre n'applique aucune règle de jeu
 * par elle-même : elle orchestre uniquement les
 * services déjà testés du domaine/Foundry.
 */


import {
    buildInitiativePreparationViewModel
} from "../initiative/metro-initiative-preparation-view-model.mjs";

import {
    createCombatInitiativePendingUnit,
    modifyCombatInitiativePendingUnit,
    dissolveCombatInitiativePendingUnit
} from "../initiative/metro-initiative-pending-unit-application.mjs";

import {
    resolveCombatInitiativePendingUnit
} from "../initiative/metro-initiative-pending-unit-resolution.mjs";

import {
    attachCombatantsToInitiativeAssignment,
    extractCombatantFromInitiativeAssignment
} from "../initiative/metro-initiative-assignment-reinforcement.mjs";

import {
    listUngroupedCombatantIds,
    shouldDefaultToIndividualGroups
} from "../../domain/rules/initiative-individual-groups.mjs";

import {
    getOrCreateFoundryMetroInitiativeDeck
} from "../initiative/metro-initiative-deck.mjs";


const {
    HandlebarsApplicationMixin,
    ApplicationV2
} = foundry.applications.api;


function createDraftGroupKey() {

    if (
        typeof crypto?.randomUUID
            === "function"
    ) {

        return crypto.randomUUID();

    }


    return `draft-${Date.now()}-${Math.random()}`;

}


/* ============================================================
 * SOUS-FENÊTRES DE CHOIX MJ
 * ============================================================ */


/**
 * Choix MJ parmi les cartes candidates
 * tirées pour une résolution à
 * drawCount > 1.
 *
 * Retourne le cardId choisi, ou null si le
 * MJ ferme la fenêtre (X). Aucun bouton
 * Annuler n'est proposé : le choix d'une
 * candidate est la seule action attendue
 * de cette fenêtre.
 *
 * memberNames : noms d'acteurs déjà
 * résolus par l'appelant (Section B ne
 * dispose que des identifiants de
 * Combatants côté domaine).
 */
async function promptCandidateChoice(
    candidates,
    memberNames
) {

    const membersRows =
        (
            memberNames
            ?? []
        )
            .map(
                name =>
                    `<li>${foundry.utils.escapeHTML(name)}</li>`
            )
            .join(
                ""
            );


    return new Promise(
        resolve => {

            let settled =
                false;


            const finish =
                value => {

                    if (settled) {

                        return;

                    }


                    settled =
                        true;


                    resolve(
                        value
                    );

                };


            const candidateButtons =
                candidates.map(
                    candidate => ({

                        action:
                            `candidate-${candidate.cardId}`,

                        icon:
                            "fa-solid fa-cards",

                        label:
                            `${candidate.initiative}`,

                        callback:
                            async (
                                event,
                                button,
                                currentDialog
                            ) => {

                                finish(
                                    candidate.cardId
                                );


                                await currentDialog
                                    .close();


                                return candidate.cardId;

                            }

                    })
                );


            const buttons =
                candidateButtons;


            const dialog =
                new foundry.applications.api
                    .DialogV2({

                        window: {

                            title:
                                "Choix de la carte d'initiative"

                        },


                        content:
                            `
                                <div class="metro2033 metro-initiative-candidate-prompt">
                                    <p>
                                        Plusieurs cartes ont été tirées pour :
                                    </p>
                                    <ul class="metro-initiative-candidate-members">
                                        ${membersRows}
                                    </ul>
                                    <p>
                                        Choisissez celle à attribuer :
                                    </p>
                                </div>
                            `,


                        buttons

                    });


            dialog.addEventListener(
                "close",
                () => {

                    finish(
                        null
                    );

                },
                {
                    once:
                        true
                }
            );


            dialog.render({
                force:
                    true
            });

        }
    );

}


/**
 * Sélection MJ des Combatants non
 * configurés à rattacher à une
 * attribution résolue.
 *
 * Retourne un tableau de combatantIds
 * (peut être vide), ou null si le MJ
 * annule.
 */
async function promptReinforcementSelection(
    unconfiguredCombatants,
    assignmentLabel
) {

    const rows =
        unconfiguredCombatants
            .map(
                combatant =>
                    `
                        <label class="metro-initiative-reinforcement-row">
                            <input
                                type="checkbox"
                                name="reinforcement.${foundry.utils.escapeHTML(
                                    combatant.id
                                )}"
                                value="${foundry.utils.escapeHTML(
                                    combatant.id
                                )}"
                            />
                            <span>
                                ${foundry.utils.escapeHTML(
                                    combatant.name
                                )}
                            </span>
                        </label>
                    `
            )
            .join(
                ""
            );


    const content =
        `
            <div class="metro2033 metro-initiative-reinforcement-prompt">
                <p>
                    Rattacher à
                    <strong>${foundry.utils.escapeHTML(assignmentLabel)}</strong> :
                </p>
                <div class="metro-initiative-reinforcement-list">
                    ${rows}
                </div>
            </div>
        `;


    return new Promise(
        resolve => {

            let settled =
                false;


            const finish =
                value => {

                    if (settled) {

                        return;

                    }


                    settled =
                        true;


                    resolve(
                        value
                    );

                };


            const dialog =
                new foundry.applications.api
                    .DialogV2({

                        window: {

                            title:
                                "Rattacher un renfort"

                        },


                        form: {

                            closeOnSubmit:
                                false

                        },


                        content,


                        buttons: [

                            {

                                action:
                                    "cancel",

                                label:
                                    "Annuler",

                                callback:
                                    async (
                                        event,
                                        button,
                                        currentDialog
                                    ) => {

                                        finish(
                                            null
                                        );


                                        await currentDialog
                                            .close();


                                        return null;

                                    }

                            },

                            {

                                action:
                                    "confirm",

                                label:
                                    "Rattacher",

                                default:
                                    true,

                                callback:
                                    async (
                                        event,
                                        button,
                                        currentDialog
                                    ) => {

                                        const form =
                                            button.form;

                                        const selected =
                                            unconfiguredCombatants
                                                .filter(
                                                    combatant =>
                                                        form?.elements[
                                                            `reinforcement.${combatant.id}`
                                                        ]?.checked
                                                        === true
                                                )
                                                .map(
                                                    combatant =>
                                                        combatant.id
                                                );


                                        if (
                                            selected.length
                                            === 0
                                        ) {

                                            ui.notifications.warn(
                                                "Sélectionnez au moins un Combatant à rattacher."
                                            );


                                            return null;

                                        }


                                        finish(
                                            selected
                                        );


                                        await currentDialog
                                            .close();


                                        return selected;

                                    }

                            }

                        ]

                    });


            dialog.addEventListener(
                "close",
                () => {

                    finish(
                        null
                    );

                },
                {
                    once:
                        true
                }
            );


            dialog.render({
                force:
                    true
            });

        }
    );

}


/* ============================================================
 * FENÊTRE PRINCIPALE
 * ============================================================ */


export class InitiativePreparationApplication
    extends HandlebarsApplicationMixin(
        ApplicationV2
    ) {


    static DEFAULT_OPTIONS = {

        id:
            "metro-initiative-preparation",

        classes: [
            "metro-2033",
            "metro-initiative-preparation"
        ],

        window: {

            title:
                "Préparation de l'initiative",

            icon:
                "fa-solid fa-cards",

            resizable:
                true

        },

        position: {

            width:
                560

        }

    };


    static PARTS = {

        main: {
            template:
                "systems/metro-2033-yze/templates/applications/initiative-preparation.hbs"
        }

    };


    constructor(
        options = {}
    ) {

        super(
            options
        );


        this.combat =
            options.combat
            ?? null;


        /*
         * Brouillon de composition (Section A).
         *
         * null tant que non initialisé ou après
         * Annuler/Valider : force un réensemencement
         * depuis l'état persisté au prochain rendu.
         */
        this._draft =
            null;

        this._individualGroups =
            undefined;

    }


    get title() {

        return "Préparation de l'initiative";

    }


    /**
     * Réensemence le brouillon de composition
     * depuis l'état réellement persisté du
     * Combat.
     */
    _seedDraft() {

        const viewModel =
            buildInitiativePreparationViewModel(
                this.combat
            );


        const allCombatants =
            [
                ...viewModel.unconfiguredCombatants,

                ...viewModel.pendingUnits.flatMap(
                    pendingUnit =>
                        pendingUnit.members
                )
            ];


        const groups =
            viewModel.pendingUnits.map(
                pendingUnit => ({

                    key:
                        pendingUnit.combatantIds[0],

                    combatantIds:
                        [...pendingUnit.combatantIds],

                    drawCount:
                        pendingUnit.drawCount,

                    reason:
                        pendingUnit.reason,

                    persisted:
                        true,

                    originalCombatantIds:
                        [...pendingUnit.combatantIds],

                    originalDrawCount:
                        pendingUnit.drawCount,

                    originalReason:
                        pendingUnit.reason

                })
            );


        this._draft = {

            allCombatants,

            groups,

            deletedPersistedAnchors:
                []

        };

    }


    /** @override */
    async _prepareContext(
        options
    ) {

        const context =
            await super._prepareContext(
                options
            );


        if (!this.combat) {

            context.noCombat =
                true;

            return context;

        }


        context.noCombat =
            false;


        if (!this._draft) {

            this._seedDraft();

        }


        const groupedCombatantIds =
            new Set(
                this._draft.groups.flatMap(
                    group =>
                        group.combatantIds
                )
            );


        context.draftGroups =
            this._draft.groups.map(
                group => ({

                    key:
                        group.key,

                    drawCount:
                        group.drawCount,

                    reason:
                        group.reason
                        ?? "",

                    members:
                        group.combatantIds.map(
                            combatantId =>
                                this._draft.allCombatants.find(
                                    combatant =>
                                        combatant.id
                                        === combatantId
                                )
                                ?? {
                                    id:
                                        combatantId,

                                    name:
                                        combatantId
                                }
                        )

                })
            );


        context.ungroupedCombatants =
            this._draft.allCombatants.filter(
                combatant =>
                    !groupedCombatantIds.has(
                        combatant.id
                    )
            );


        context.hasUngrouped =
            context.ungroupedCombatants.length
            > 0;

        context.individualGroupsAvailable =
            context.ungroupedCombatants.length > 0;

        context.individualGroupsCount =
            context.ungroupedCombatants.length;

        context.individualGroupsChecked =
            this._individualGroups
            ?? shouldDefaultToIndividualGroups(
                context.ungroupedCombatants.length
            );

        context.hasDraftGroups =
            context.draftGroups.length
            > 0;


        /*
         * Section B — unités en attente de
         * résolution multiple, lues directement
         * depuis l'état persisté (indépendant
         * du brouillon).
         */
        const viewModel =
            buildInitiativePreparationViewModel(
                this.combat
            );


        context.pendingResolution =
            viewModel.pendingUnits.map(
                pendingUnit => ({

                    firstCombatantId:
                        pendingUnit.combatantIds[0],

                    membersLabel:
                        pendingUnit.members
                            .map(
                                member =>
                                    member.name
                            )
                            .join(
                                ", "
                            ),

                    drawCountLabel:
                        `${pendingUnit.drawCount} carte${
                            pendingUnit.drawCount > 1
                                ? "s"
                                : ""
                        }`,

                    needsChoice:
                        pendingUnit.drawCount > 1

                })
            );

        context.hasPendingResolution =
            context.pendingResolution.length
            > 0;


        /*
         * Section C — initiatives résolues.
         */
        context.assignments =
            viewModel.assignments.map(
                assignment => ({

                    cardId:
                        assignment.cardId,

                    initiative:
                        assignment.initiative,

                    membersLabel:
                        assignment.members
                            .map(
                                member =>
                                    member.name
                            )
                            .join(
                                ", "
                            ),

                    canExtract:
                        assignment.members.length
                        > 1,

                    members:
                        assignment.members

                })
            );

        context.hasAssignments =
            context.assignments.length
            > 0;

        context.hasUnconfiguredForReinforcement =
            viewModel.unconfiguredCombatants.length
            > 0;


        return context;

    }


    /** @override */
    _onRender(
        context,
        options
    ) {

        super._onRender(
            context,
            options
        );


        this._bindClick(
            '[data-action="draft-create-group"]',
            this._onDraftCreateGroup
        );

        this._bindClick(
            '[data-action="draft-dissolve-group"]',
            this._onDraftDissolveGroup
        );

        this._bindClick(
            '[data-action="draft-cancel"]',
            this._onDraftCancel
        );

        this._bindClick(
            '[data-action="draft-validate"]',
            this._onDraftValidate
        );

        this.element
            .querySelector('[data-role="individual-groups"]')
            ?.addEventListener(
                "change",
                event => {
                    this._individualGroups =
                        event.currentTarget.checked;
                }
            );

        this._bindClick(
            '[data-action="resolve-pending"]',
            this._onResolvePending
        );

        this._bindClick(
            '[data-action="attach-reinforcement"]',
            this._onAttachReinforcement
        );

        this._bindClick(
            '[data-action="extract-member"]',
            this._onExtractMember
        );


        this.element
            .querySelectorAll(
                '[data-role="group-member-checkbox"]'
            )
            .forEach(
                checkbox => {

                    checkbox.addEventListener(
                        "change",
                        this._onDraftMemberToggle.bind(
                            this
                        )
                    );

                }
            );

    }


    _bindClick(
        selector,
        handler
    ) {

        this.element
            .querySelectorAll(
                selector
            )
            .forEach(
                element => {

                    element.addEventListener(
                        "click",
                        handler.bind(
                            this
                        )
                    );

                }
            );

    }


    /* ============================================================
     * SECTION A — COMPOSITION (BROUILLON)
     * ============================================================ */


    /**
     * Talent général Réflexes éclair : suggère un drawCount
     * de 2 (ou 3 au niveau supérieur) pour un groupe d'un seul
     * Combattant dont l'Actor possède ce Talent. Retourne 1
     * dans tous les autres cas (groupe multiple, pas de Talent,
     * Combattant/Actor introuvable).
     */
    _suggestDraftDrawCount(
        combatantIds
    ) {

        if (
            combatantIds.length
                !== 1
        ) {

            return 1;

        }


        const combatant =
            this.combat
                ?.combatants
                ?.get(
                    combatantIds[0]
                );

        const actor =
            combatant?.actor;

        if (!actor) {

            return 1;

        }


        const quickReflexesTalent =
            actor.items?.find(
                item =>
                    item.type === "talent"
                    && item.system?.key
                        === "quickReflexes"
            );

        if (!quickReflexesTalent) {

            return 1;

        }


        const advanced =
            Number(
                quickReflexesTalent.system
                    ?.level
                ?? 1
            )
            >= 2;


        return advanced
            ? 3
            : 2;

    }


    _onDraftCreateGroup(
        event
    ) {

        event.preventDefault();


        const checkboxes =
            this.element.querySelectorAll(
                '[data-role="ungrouped-checkbox"]:checked'
            );

        const combatantIds =
            Array.from(
                checkboxes
            ).map(
                checkbox =>
                    checkbox.value
            );


        if (
            combatantIds.length
            === 0
        ) {

            ui.notifications.warn(
                "Sélectionnez au moins un Combatant pour former un groupe."
            );


            return;

        }


        this._draft.groups.push({

            key:
                createDraftGroupKey(),

            combatantIds,

            /*
             * Talent général Réflexes éclair (livre, p.167) :
             * "Vous pouvez piocher deux cartes au lieu d'une
             * seule [...]. Supérieur : [...] trois cartes."
             *
             * Simple suggestion de valeur par défaut pour un
             * groupe d'un seul Combattant possédant ce Talent —
             * le MJ reste entièrement libre de la modifier
             * (champ déjà éditable, cf. _onDraftDrawCountChange).
             * Un groupe de plusieurs Combattants n'a pas
             * d'interprétation évidente du livre (le Talent est
             * individuel) : la valeur par défaut reste alors 1.
             */
            drawCount:
                this._suggestDraftDrawCount(
                    combatantIds
                ),

            reason:
                null,

            persisted:
                false,

            originalCombatantIds:
                null,

            originalDrawCount:
                null,

            originalReason:
                null

        });


        this.render();

    }


    _onDraftDissolveGroup(
        event
    ) {

        event.preventDefault();


        const key =
            event.currentTarget
                .dataset
                .groupKey;

        const index =
            this._draft.groups.findIndex(
                group =>
                    group.key === key
            );


        if (index === -1) {

            return;

        }


        const [removed] =
            this._draft.groups.splice(
                index,
                1
            );


        if (removed.persisted) {

            this._draft.deletedPersistedAnchors.push(
                removed.originalCombatantIds[0]
            );

        }


        this.render();

    }


    _onDraftMemberToggle(
        event
    ) {

        if (
            event.currentTarget.checked
        ) {

            return;

        }


        const key =
            event.currentTarget
                .dataset
                .groupKey;

        const combatantId =
            event.currentTarget
                .dataset
                .combatantId;

        const group =
            this._draft.groups.find(
                candidate =>
                    candidate.key === key
            );


        if (!group) {

            return;

        }


        group.combatantIds =
            group.combatantIds.filter(
                existingId =>
                    existingId
                    !== combatantId
            );


        if (
            group.combatantIds.length
            === 0
        ) {

            this._draft.groups =
                this._draft.groups.filter(
                    candidate =>
                        candidate.key
                        !== key
                );


            if (group.persisted) {

                this._draft.deletedPersistedAnchors.push(
                    group.originalCombatantIds[0]
                );

            }

        }


        this.render();

    }


    _onDraftCancel(
        event
    ) {

        event.preventDefault();


        this._draft =
            null;


        this.render();

    }


    async _onDraftValidate(
        event
    ) {

        event.preventDefault();


        const liveGroups =
            this._draft.groups.map(
                group => {

                    const reasonInput =
                        this.element.querySelector(
                            `[data-role="group-reason"][data-group-key="${CSS.escape(group.key)}"]`
                        );

                    const drawCountInput =
                        this.element.querySelector(
                            `[data-role="group-draw-count"][data-group-key="${CSS.escape(group.key)}"]`
                        );

                    const trimmedReason =
                        reasonInput?.value
                            ?.trim()
                        ?? "";


                    return {

                        ...group,

                        reason:
                            trimmedReason.length
                            > 0
                                ? trimmedReason
                                : null,

                        drawCount:
                            Number(
                                drawCountInput?.value
                                ?? group.drawCount
                                ?? 1
                            )

                    };

                }
            );


        /*
         * Composition rapide : un groupe individuel par
         * Combatant non groupé (case cochée dans la fenêtre).
         */
        const individualCheckbox =
            this.element.querySelector(
                '[data-role="individual-groups"]'
            );

        if (individualCheckbox?.checked) {

            const ungroupedIds =
                listUngroupedCombatantIds(
                    this._draft.allCombatants.map(
                        combatant => combatant.id
                    ),
                    liveGroups
                );

            for (const combatantId of ungroupedIds) {

                liveGroups.push({

                    key:
                        createDraftGroupKey(),

                    combatantIds:
                        [combatantId],

                    drawCount:
                        this._suggestDraftDrawCount(
                            [combatantId]
                        ),

                    reason:
                        null,

                    persisted:
                        false,

                    originalCombatantIds:
                        null,

                    originalDrawCount:
                        null,

                    originalReason:
                        null

                });

            }

        }


        const deletedPersistedAnchors =
            [
                ...this._draft.deletedPersistedAnchors
            ];


        let failureCount =
            0;


        for (
            const anchorCombatantId
            of deletedPersistedAnchors
        ) {

            try {

                await dissolveCombatInitiativePendingUnit({
                    combat:
                        this.combat,

                    combatantId:
                        anchorCombatantId
                });

            }
            catch (error) {

                failureCount += 1;


                console.error(
                    "Metro 2033 | Impossible de dissoudre une unité d'initiative en attente lors de la validation.",
                    error
                );

            }

        }


        for (
            const group
            of liveGroups
        ) {

            try {

                let anchorCombatantId =
                    group.combatantIds[0];


                if (!group.persisted) {

                    await createCombatInitiativePendingUnit({
                        combat:
                            this.combat,

                        combatantIds:
                            group.combatantIds,

                        drawCount:
                            group.drawCount,

                        reason:
                            group.reason
                    });

                }
                else {

                    const sortedOriginal =
                        [...group.originalCombatantIds]
                            .sort();

                    const sortedCurrent =
                        [...group.combatantIds]
                            .sort();

                    const compositionChanged =
                        JSON.stringify(sortedOriginal)
                        !== JSON.stringify(sortedCurrent);

                    const drawCountChanged =
                        group.originalDrawCount
                        !== group.drawCount;

                    const reasonChanged =
                        (
                            group.originalReason
                            ?? null
                        )
                        !== (
                            group.reason
                            ?? null
                        );


                    if (
                        compositionChanged
                        || drawCountChanged
                        || reasonChanged
                    ) {

                        await modifyCombatInitiativePendingUnit({
                            combat:
                                this.combat,

                            combatantId:
                                group.originalCombatantIds[0],

                            combatantIds:
                                group.combatantIds,

                            drawCount:
                                group.drawCount,

                            reason:
                                group.reason
                        });

                    }

                }


                /*
                 * Une candidate unique ne
                 * nécessite aucun choix MJ :
                 * résolution automatique.
                 */
                if (
                    group.drawCount
                    === 1
                ) {

                    const deck =
                        await getOrCreateFoundryMetroInitiativeDeck();


                    await resolveCombatInitiativePendingUnit({
                        combat:
                            this.combat,

                        deck,

                        combatantId:
                            anchorCombatantId
                    });

                }

            }
            catch (error) {

                failureCount += 1;


                console.error(
                    "Metro 2033 | Échec de validation d'un groupe d'initiative.",
                    error
                );

            }

        }


        this._draft =
            null;


        this.render();


        if (failureCount > 0) {

            ui.notifications.error(
                `${failureCount} opération(s) ont échoué pendant la validation. Voir la console pour le détail.`
            );

        }
        else {

            ui.notifications.info(
                "Composition de l'initiative validée."
            );

        }

    }


    /* ============================================================
     * SECTION B — RÉSOLUTION (IMMÉDIAT)
     * ============================================================ */


    async _onResolvePending(
        event
    ) {

        event.preventDefault();


        const combatantId =
            event.currentTarget
                .dataset
                .combatantId;


        try {

            const deck =
                await getOrCreateFoundryMetroInitiativeDeck();


            await resolveCombatInitiativePendingUnit({
                combat:
                    this.combat,

                deck,
                combatantId,

                chooseCandidateCardId:
                    async (
                        candidates,
                        pendingUnit
                    ) => {

                        const memberNames =
                            (
                                pendingUnit?.combatantIds
                                ?? []
                            )
                                .map(
                                    memberCombatantId =>
                                        this.combat
                                            ?.combatants
                                            ?.get(
                                                memberCombatantId
                                            )
                                            ?.name
                                        ?? memberCombatantId
                                );


                        const chosenCardId =
                            await promptCandidateChoice(
                                candidates,
                                memberNames
                            );


                        if (!chosenCardId) {

                            throw new Error(
                                "Résolution annulée : aucune carte choisie."
                            );

                        }


                        return chosenCardId;

                    }
            });


            this.render();

        }
        catch (error) {

            console.error(
                "Metro 2033 | Impossible de résoudre l'unité d'initiative en attente.",
                error
            );


            ui.notifications.error(
                error?.message
                ?? "Impossible de résoudre cette unité d'initiative en attente."
            );

        }

    }


    /* ============================================================
     * SECTION C — INITIATIVES RÉSOLUES (IMMÉDIAT)
     * ============================================================ */


    async _onAttachReinforcement(
        event
    ) {

        event.preventDefault();


        const cardId =
            event.currentTarget
                .dataset
                .cardId;


        const viewModel =
            buildInitiativePreparationViewModel(
                this.combat
            );


        if (
            viewModel.unconfiguredCombatants.length
            === 0
        ) {

            ui.notifications.warn(
                "Aucun Combatant non configuré à rattacher."
            );


            return;

        }


        const assignment =
            viewModel.assignments.find(
                candidate =>
                    candidate.cardId
                    === cardId
            );

        const assignmentLabel =
            assignment
                ? assignment.members
                    .map(
                        member =>
                            member.name
                    )
                    .join(
                        ", "
                    )
                : "cette unité";


        const selectedCombatantIds =
            await promptReinforcementSelection(
                viewModel.unconfiguredCombatants,
                assignmentLabel
            );


        if (
            !selectedCombatantIds
            || selectedCombatantIds.length
                === 0
        ) {

            return;

        }


        try {

            await attachCombatantsToInitiativeAssignment({
                combat:
                    this.combat,

                cardId,

                combatantIds:
                    selectedCombatantIds
            });


            this.render();

        }
        catch (error) {

            console.error(
                "Metro 2033 | Impossible de rattacher ce renfort.",
                error
            );


            ui.notifications.error(
                error?.message
                ?? "Impossible de rattacher ce renfort."
            );

        }

    }


    async _onExtractMember(
        event
    ) {

        event.preventDefault();


        const combatantId =
            event.currentTarget
                .dataset
                .combatantId;


        try {

            const deck =
                await getOrCreateFoundryMetroInitiativeDeck();


            await extractCombatantFromInitiativeAssignment({
                combat:
                    this.combat,

                deck,
                combatantId
            });


            this.render();

        }
        catch (error) {

            console.error(
                "Metro 2033 | Impossible d'extraire ce Combatant.",
                error
            );


            ui.notifications.error(
                error?.message
                ?? "Impossible d'extraire ce Combatant."
            );

        }

    }


}
