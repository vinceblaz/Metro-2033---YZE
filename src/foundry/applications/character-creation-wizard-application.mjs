/**
 * Assistant de création de Personnage joueur.
 *
 * Suit pas à pas « Les 10 étapes de la création de
 * personnages » (livre de règles p.163) :
 *
 *  1. Archétype           6. Fierté / Honte
 *  2. Âge                 7. Liens avec les autres PJ
 *  3. Attributs            8. Équipement de départ
 *  4. Compétences          9. Apparence
 *  5. Talents             10. Nom
 *
 * suivies d'une 11e étape de récapitulatif, qui crée
 * effectivement l'Actor « character » (avec son Item
 * Archétype et ses 2 Items Talent) une fois confirmée.
 *
 * Toute la logique de règles (budgets, bornes, résolution des
 * choix du Soldat, assemblage des données d'Actor/Item) est
 * déléguée à des modules purs et testés
 * (domain/rules/character-creation.mjs,
 * foundry/character-creation/character-creation-wizard-view-model.mjs,
 * data/seed/character-creation-actor-builder.mjs) : cette
 * classe se contente d'orchestrer l'état du brouillon, le
 * rendu, et les événements DOM.
 *
 * Étape 8 (Équipement) : le texte du livre est affiché tel
 * quel, à ajouter manuellement (glisser-déposer depuis un
 * compendium) — aucun rapprochement automatique avec un Item
 * n'est tenté, pour ne jamais risquer d'attacher au
 * personnage un objet incorrect.
 */

import {
    CREATION_STEPS,
    createInitialDraft,
    buildCharacterCreationViewModel
} from "../character-creation/character-creation-wizard-view-model.mjs";

import {
    buildCharacterCreationActorData
} from "../../data/seed/character-creation-actor-builder.mjs";


const {
    HandlebarsApplicationMixin,
    ApplicationV2
} = foundry.applications.api;


function getOtherPlayerCharacters() {

    return (game.actors ?? [])
        .filter((actor) => actor.type === "character")
        .map((actor) => ({ id: actor.uuid, name: actor.name }));
}


export class CharacterCreationWizardApplication
    extends HandlebarsApplicationMixin(ApplicationV2) {


    static DEFAULT_OPTIONS = {

        id: "metro-character-creation-wizard",

        classes: ["metro-2033", "metro-character-creation-wizard"],

        window: {
            title: "Création de Personnage",
            icon: "fa-solid fa-user-plus",
            resizable: true
        },

        position: {
            width: 640,
            height: 720
        }

    };


    static PARTS = {
        main: {
            template: "systems/metro-2033-yze/templates/applications/character-creation-wizard.hbs",
            /*
             * Le contenu (jusqu'à 11 étapes, certaines longues)
             * dépasse la hauteur fixe de la fenêtre : Foundry
             * gère lui-même l'ascenseur de cette partie et
             * restaure sa position de défilement après chaque
             * ré-affichage (this.render(), déclenché à chaque
             * interaction).
             */
            scrollable: [""]
        }
    };


    constructor(options = {}) {

        super(options);

        this._draft = createInitialDraft();
    }


    get title() {
        return "Création de Personnage";
    }


    /** @override */
    async _prepareContext(options) {

        const context = await super._prepareContext(options);

        Object.assign(
            context,
            buildCharacterCreationViewModel(this._draft, {
                otherCharacters: getOtherPlayerCharacters()
            })
        );

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
        this._bindClick('[data-action="wizard-fill-pride"]', this._onFillPride);
        this._bindClick('[data-action="wizard-fill-shame"]', this._onFillShame);
        this._bindClick('[data-action="wizard-fill-bond-add-text"]', this._onFillBondAddText);
        this._bindClick('[data-action="wizard-add-bond"]', this._onAddBond);
        this._bindClick('[data-action="wizard-remove-bond"]', this._onRemoveBond);
        this._bindClick('[data-action="wizard-fill-name"]', this._onFillName);
        this._bindClick('[data-action="wizard-create-character"]', this._onCreateCharacter);

        this._bindChange('[data-role="wizard-age-input"]', this._onAgeChange);
        this._bindChange('[data-role="wizard-attribute-input"]', this._onAttributeChange);
        this._bindChange('[data-role="wizard-skill-input"]', this._onSkillChange);
        this._bindChange('[data-role="wizard-talent-checkbox"]', this._onTalentToggle);
        this._bindChange('[data-role="wizard-pride-text"]', this._onPrideChange);
        this._bindChange('[data-role="wizard-shame-text"]', this._onShameChange);
        this._bindChange('[data-role="wizard-appearance-text"]', this._onAppearanceChange);
        this._bindChange('[data-role="wizard-gender-input"]', this._onGenderChange);
        this._bindChange('[data-role="wizard-name-input"]', this._onNameChange);

        this._bindActivationKeys('[role="button"]');
    }


    _bindClick(selector, handler) {

        this.element.querySelectorAll(selector).forEach((element) => {
            element.addEventListener("click", handler.bind(this));
        });
    }


    /**
     * Les cartes d'archétype sont des `<div role="button">` (et
     * non des `<button>`, cf. le commentaire du template) : le
     * clavier (Entrée/Espace) n'active pas nativement un `<div>`
     * comme un vrai bouton, contrairement à la souris. On le
     * rétablit explicitement pour l'accessibilité.
     */
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

        const viewModel = buildCharacterCreationViewModel(this._draft, {
            otherCharacters: getOtherPlayerCharacters()
        });

        if (!viewModel.canAdvance) {
            ui.notifications?.warn(
                "Cette étape n'est pas encore complète : vérifiez les indications à l'écran."
            );
            return;
        }

        if (this._draft.step < CREATION_STEPS.length - 1) {
            this._draft.step += 1;
            this.render();
        }
    }


    /* ============================================================
     * ÉTAPE 1 — ARCHÉTYPE
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
     * ÉTAPE 2 — ÂGE
     * ============================================================ */

    _onAgeChange(event) {

        const value = Number.parseInt(event.currentTarget.value, 10);

        if (Number.isInteger(value) && value >= 0) {
            this._draft.age = value;
        }

        this.render();
    }


    /* ============================================================
     * ÉTAPES 3/4 — ATTRIBUTS / COMPÉTENCES
     * ============================================================ */

    _onAttributeChange(event) {

        const key = event.currentTarget.dataset.attributeKey;
        const value = Number.parseInt(event.currentTarget.value, 10);

        if (Number.isInteger(value)) {
            this._draft.attributes[key] = value;
        }

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


    /* ============================================================
     * ÉTAPE 5 — TALENTS
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


    /* ============================================================
     * ÉTAPE 6 — FIERTÉ / HONTE
     * ============================================================ */

    _onFillPride(event) {

        event.preventDefault();
        this._draft.pride = event.currentTarget.dataset.text;
        this.render();
    }


    _onFillShame(event) {

        event.preventDefault();
        this._draft.shame = event.currentTarget.dataset.text;
        this.render();
    }


    _onPrideChange(event) {
        this._draft.pride = event.currentTarget.value;
    }


    _onShameChange(event) {
        this._draft.shame = event.currentTarget.value;
    }


    /* ============================================================
     * ÉTAPE 7 — LIENS AVEC LES AUTRES PJ
     *
     * Flux « Ajouter / Supprimer » : le formulaire d'ajout
     * (acteur choisi + texte du lien) n'est lu qu'au moment du
     * clic sur « Ajouter » — il n'existe pas dans le brouillon
     * tant qu'il n'a pas été validé.
     * ============================================================ */

    _onFillBondAddText(event) {

        event.preventDefault();

        const textarea = this.element.querySelector('[data-role="wizard-bond-add-text"]');

        if (textarea) {
            textarea.value = event.currentTarget.dataset.text;
        }
    }


    _onAddBond(event) {

        event.preventDefault();

        const actorSelect = this.element.querySelector('[data-role="wizard-bond-add-actor"]');
        const textArea = this.element.querySelector('[data-role="wizard-bond-add-text"]');

        const actorId = actorSelect?.value;
        const text = textArea?.value?.trim() ?? "";

        if (!actorId || !text) {
            ui.notifications?.warn("Choisissez un Personnage et décrivez le lien avant de l'ajouter.");
            return;
        }

        this._draft.bonds ??= [];
        this._draft.bonds = this._draft.bonds.filter((bond) => bond.actorId !== actorId);
        this._draft.bonds.push({ actorId, text });

        this.render();
    }


    _onRemoveBond(event) {

        event.preventDefault();

        const actorId = event.currentTarget.dataset.actorId;

        this._draft.bonds = (this._draft.bonds ?? []).filter((bond) => bond.actorId !== actorId);

        this.render();
    }


    /* ============================================================
     * ÉTAPE 9 — APPARENCE
     * ============================================================ */

    _onAppearanceChange(event) {
        this._draft.appearance = event.currentTarget.value;
    }


    _onGenderChange(event) {
        this._draft.gender = event.currentTarget.value;
    }


    /* ============================================================
     * ÉTAPE 10 — NOM
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

    async _onCreateCharacter(event) {

        event.preventDefault();

        const viewModel = buildCharacterCreationViewModel(this._draft, {
            otherCharacters: getOtherPlayerCharacters()
        });

        const incompleteSteps = CREATION_STEPS
            .filter((step) => step !== "review")
            .filter((step) => !viewModel.stepValidity[step]);

        if (incompleteSteps.length > 0) {
            ui.notifications?.error(
                "Certaines étapes ne sont pas complètes. Revenez en arrière pour les terminer."
            );
            return;
        }

        const { actorData, itemsData, warnings } = buildCharacterCreationActorData(this._draft);

        for (const warning of warnings) {
            console.warn("Métro 2033 | Création de Personnage —", warning);
        }

        const actor = await Actor.create(actorData);

        if (!actor) {
            ui.notifications?.error("La création du Personnage a échoué.");
            return;
        }

        if (itemsData.length > 0) {
            await actor.createEmbeddedDocuments("Item", itemsData);
        }

        ui.notifications?.info(
            `Personnage « ${actor.name} » créé.`
            + (warnings.length > 0
                ? ` (${warnings.length} avertissement(s), voir la console.)`
                : "")
        );

        await actor.sheet.render({ force: true });

        this.close();
    }

}
