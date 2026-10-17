/**
 * Assistant de création de PNJ (réservé au MJ).
 *
 * Construit conjointement avec le porteur du projet le
 * 28/09/2026 : le livre de base ne prévoit aucun process dédié
 * à la création de PNJ (« Les personnages non joueurs utilisent
 * leurs compétences de la même façon que les PJ », p.193). Cet
 * assistant reprend donc celui du PJ
 * (character-creation-wizard-application.mjs), moins les étapes
 * de roleplay entre PJ (Fierté/Honte/Liens avec les autres PJ)
 * qui n'ont pas de sens pour un PNJ créé par le MJ.
 *
 * Étapes : Archétype, Âge, Attributs, Compétences, Talents,
 * Équipement, Apparence, Nom, puis un récapitulatif qui crée
 * l'Actor « npc » (avec ses Items Talent — aucun Item Archétype,
 * cf. npc-creation-actor-builder.mjs).
 *
 * Mêmes bornes/budgets stricts que pour un PJ (décision actée
 * avec le porteur du projet) : le MJ reste libre de saisir
 * n'importe quelle valeur à tout moment, l'assistant se
 * contente d'avertir si le budget de la catégorie d'âge n'est
 * pas respecté, exactement comme pour un PJ.
 */

import {
    NPC_CREATION_STEPS,
    createInitialNpcDraft,
    buildNpcCreationViewModel,
    randomizeAttributeAllocation,
    randomizeSkillAllocation,
    pickRandomTalents
} from "../npc-creation/npc-creation-wizard-view-model.mjs";

import {
    buildNpcCreationActorData
} from "../../data/seed/npc-creation-actor-builder.mjs";


const {
    HandlebarsApplicationMixin,
    ApplicationV2
} = foundry.applications.api;


export class NpcCreationWizardApplication
    extends HandlebarsApplicationMixin(ApplicationV2) {


    static DEFAULT_OPTIONS = {

        id: "metro-npc-creation-wizard",

        classes: ["metro-2033", "metro-npc-creation-wizard"],

        window: {
            title: "Création de PNJ",
            icon: "fa-solid fa-user-gear",
            resizable: true
        },

        position: {
            width: 640,
            height: 720
        }

    };


    static PARTS = {
        main: {
            template: "systems/metro-2033-yze/templates/applications/npc-creation-wizard.hbs",
            scrollable: [""]
        }
    };


    constructor(options = {}) {

        super(options);

        this._draft = createInitialNpcDraft();
    }


    get title() {
        return "Création de PNJ";
    }


    /** @override */
    async _prepareContext(options) {

        const context = await super._prepareContext(options);

        Object.assign(context, buildNpcCreationViewModel(this._draft));

        return context;
    }


    /** @override */
    _onRender(context, options) {

        super._onRender(context, options);

        this._bindClick('[data-action="wizard-back"]', this._onBack);
        this._bindClick('[data-action="wizard-next"]', this._onNext);
        this._bindClick('[data-action="wizard-select-archetype"]', this._onSelectArchetype);
        this._bindClick('[data-action="wizard-select-soldier-attribute"]', this._onSelectSoldierAttribute);
        this._bindClick('[data-action="wizard-select-soldier-skill"]', this._onSelectSoldierSkill);
        this._bindClick('[data-action="wizard-randomize-attributes"]', this._onRandomizeAttributes);
        this._bindClick('[data-action="wizard-randomize-skills"]', this._onRandomizeSkills);
        this._bindClick('[data-action="wizard-randomize-talents"]', this._onRandomizeTalents);
        this._bindClick('[data-action="wizard-fill-name"]', this._onFillName);
        this._bindClick('[data-action="wizard-create-npc"]', this._onCreateNpc);

        this._bindChange('[data-role="wizard-age-input"]', this._onAgeChange);
        this._bindChange('[data-role="wizard-attribute-input"]', this._onAttributeChange);
        this._bindChange('[data-role="wizard-skill-input"]', this._onSkillChange);
        this._bindChange('[data-role="wizard-talent-checkbox"]', this._onTalentToggle);
        this._bindChange('[data-role="wizard-name-input"]', this._onNameChange);

        this._bindActivationKeys('[role="button"]');
    }


    _bindClick(selector, handler) {

        this.element.querySelectorAll(selector).forEach((element) => {
            element.addEventListener("click", handler.bind(this));
        });
    }


    _bindActivationKeys(selector) {

        this.element.querySelectorAll(selector).forEach((element) => {
            element.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    element.click();
                }
            });
        });
    }


    _bindChange(selector, handler) {

        this.element.querySelectorAll(selector).forEach((element) => {
            element.addEventListener("change", handler.bind(this));
        });
    }


    /* ============================================================
     * NAVIGATION
     * ============================================================ */

    _onBack(event) {

        event.preventDefault();

        if (this._draft.step > 0) {
            this._draft.step -= 1;
            this.render();
        }
    }


    _onNext(event) {

        event.preventDefault();

        const viewModel = buildNpcCreationViewModel(this._draft);

        if (!viewModel.canAdvance) {
            ui.notifications?.warn(
                "Cette étape n'est pas encore complète : vérifiez les indications à l'écran."
            );
            return;
        }

        if (this._draft.step < NPC_CREATION_STEPS.length - 1) {
            this._draft.step += 1;
            this.render();
        }
    }


    /* ============================================================
     * ÉTAPE — ARCHÉTYPE
     * ============================================================ */

    _onSelectArchetype(event) {

        event.preventDefault();

        const archetypeKey = event.currentTarget.dataset.archetypeKey;

        if (this._draft.archetypeKey === archetypeKey) {
            return;
        }

        this._draft.archetypeKey = archetypeKey;
        this._draft.soldierAttributeChoice = "";
        this._draft.soldierSkillChoice = "";
        this._draft.talents = [];

        this.render();
    }


    _onSelectSoldierAttribute(event) {

        event.preventDefault();
        this._draft.soldierAttributeChoice = event.currentTarget.dataset.attributeKey;
        this.render();
    }


    _onSelectSoldierSkill(event) {

        event.preventDefault();
        this._draft.soldierSkillChoice = event.currentTarget.dataset.skillKey;
        this.render();
    }


    /* ============================================================
     * ÉTAPE — ÂGE
     * ============================================================ */

    _onAgeChange(event) {

        const value = Number.parseInt(event.currentTarget.value, 10);

        if (Number.isInteger(value) && value >= 0) {
            this._draft.age = value;
        }

        this.render();
    }


    /* ============================================================
     * ÉTAPES — ATTRIBUTS / COMPÉTENCES
     *
     * Le bouton « Aléatoire » régénère l'ensemble de la
     * répartition (toujours valide, cf.
     * domain/rules/character-creation.mjs#randomizeAttributeAllocation
     * / #randomizeSkillAllocation) ; la saisie manuelle reste
     * possible ensuite, champ par champ, exactement comme avant.
     * ============================================================ */

    _onAttributeChange(event) {

        const key = event.currentTarget.dataset.attributeKey;
        const value = Number.parseInt(event.currentTarget.value, 10);

        if (Number.isInteger(value)) {
            this._draft.attributes[key] = value;
        }

        this.render();
    }


    _onRandomizeAttributes(event) {

        event.preventDefault();

        const viewModel = buildNpcCreationViewModel(this._draft);

        this._draft.attributes = randomizeAttributeAllocation({
            age: this._draft.age,
            archetypeAttributes: viewModel.archetypeAttributeKeys
        });

        this.render();
    }


    _onSkillChange(event) {

        const key = event.currentTarget.dataset.skillKey;
        const value = Number.parseInt(event.currentTarget.value, 10);

        if (Number.isInteger(value)) {
            this._draft.skills[key] = value;
        }

        this.render();
    }


    _onRandomizeSkills(event) {

        event.preventDefault();

        const viewModel = buildNpcCreationViewModel(this._draft);

        this._draft.skills = randomizeSkillAllocation({
            age: this._draft.age,
            archetypeSkills: viewModel.archetypeSkillKeys
        });

        this.render();
    }


    /* ============================================================
     * ÉTAPE — TALENTS
     *
     * « Choix aléatoire (1) » / « Choix aléatoire (2) » : pioche
     * 1 ou 2 Talents au hasard dans le groupe cliqué (archétype
     * ou général) et remplace la sélection de CE groupe
     * uniquement — la sélection de l'autre groupe n'est jamais
     * touchée. Le MJ garde toujours la main pour décocher/recocher
     * ensuite.
     * ============================================================ */

    _onTalentToggle(event) {

        const name = event.currentTarget.dataset.talentName;
        const checked = event.currentTarget.checked;

        const selected = new Set(this._draft.talents);

        if (checked) {
            selected.add(name);
        } else {
            selected.delete(name);
        }

        this._draft.talents = [...selected];

        this.render();
    }


    _onRandomizeTalents(event) {

        event.preventDefault();

        const group = event.currentTarget.dataset.group;
        const count = Number.parseInt(event.currentTarget.dataset.count, 10);

        const viewModel = buildNpcCreationViewModel(this._draft);

        const groupNames = group === "archetype"
            ? viewModel.archetypeTalentNames
            : viewModel.generalTalentNames;

        const otherGroupNames = group === "archetype"
            ? viewModel.generalTalentNames
            : viewModel.archetypeTalentNames;

        const keptFromOtherGroup = (this._draft.talents ?? [])
            .filter((name) => otherGroupNames.includes(name));

        const picked = pickRandomTalents(groupNames, count);

        this._draft.talents = [...keptFromOtherGroup, ...picked];

        this.render();
    }


    /* ============================================================
     * ÉTAPE — NOM
     * ============================================================ */

    _onFillName(event) {

        event.preventDefault();
        this._draft.name = event.currentTarget.dataset.text;
        this.render();
    }


    _onNameChange(event) {
        this._draft.name = event.currentTarget.value;
    }


    /* ============================================================
     * RÉCAPITULATIF — CRÉATION DE L'ACTOR
     * ============================================================ */

    async _onCreateNpc(event) {

        event.preventDefault();

        const viewModel = buildNpcCreationViewModel(this._draft);

        const incompleteSteps = NPC_CREATION_STEPS
            .filter((step) => step !== "review")
            .filter((step) => !viewModel.stepValidity[step]);

        if (incompleteSteps.length > 0) {
            ui.notifications?.error(
                "Certaines étapes ne sont pas complètes. Revenez en arrière pour les terminer."
            );
            return;
        }

        const { actorData, itemsData, warnings } = buildNpcCreationActorData(this._draft);

        for (const warning of warnings) {
            console.warn("Métro 2033 | Création de PNJ —", warning);
        }

        const actor = await Actor.create(actorData);

        if (!actor) {
            ui.notifications?.error("La création du PNJ a échoué.");
            return;
        }

        if (itemsData.length > 0) {
            await actor.createEmbeddedDocuments("Item", itemsData);
        }

        ui.notifications?.info(
            `PNJ « ${actor.name} » créé.`
            + (warnings.length > 0
                ? ` (${warnings.length} avertissement(s), voir la console.)`
                : "")
        );

        await actor.sheet.render({ force: true });

        this.close();
    }

}
