/**
 * Fenêtre de lancement du Jet de Population hebdomadaire
 * (système Station, règles p.218-221).
 *
 * Ouverte depuis le bouton dédié de la fiche Item Station
 * (`StationSheet`, réservé au MJ). Entièrement manuelle : rien
 * n'est automatique ni périodique (décision du MJ, chantier
 * d'automatisation du système Station).
 *
 * Déroulement :
 *
 *  1. Phase "intro" : état actuel de la Station. Le bouton
 *     "Lancer les dés" déclenche, dans l'ordre, le jet du
 *     Personnel de soutien puis celui de Population (règles
 *     p.219-221) — `station-population-roll-workflow.mjs`,
 *     déjà testé.
 *  2. Si au moins un "6" a été obtenu sur le pool de base, la
 *     fenêtre passe en phase "choices" : le MJ choisit, pour
 *     chaque "6", la ressource qui augmente (jamais les
 *     Médicaments). Sans "6", l'application se fait aussitôt.
 *  3. "Valider et appliquer" résout le contrecoup, met à jour
 *     l'Item Station (ressources, Population, dés de Moral
 *     programmés, personnel de soutien mort) et poste le
 *     message de Chat récapitulatif
 *     (`postStationPopulationRecapMessage`), puis ferme la
 *     fenêtre.
 *
 * Toute la résolution des règles est déléguée à des modules
 * purs et testés (domain/rules/station-population*.mjs,
 * foundry/station/station-population-view-model.mjs) : cette
 * classe se contente d'orchestrer l'état du jet en cours, le
 * rendu, et les événements DOM — elle n'est pas unit-testée
 * (convention du projet pour tout ce qui dépend des API
 * Foundry).
 */

import {
    rollStationSupportPersonnel,
    rollStationPopulationDice,
    applyStationPopulationWeek
} from "../../domain/rules/station-population-roll-workflow.mjs";

import {
    buildStationPopulationLauncherViewModel
} from "../station/station-population-view-model.mjs";

import {
    postStationPopulationRecapMessage
} from "../chat/station-population-chat.mjs";


const {
    HandlebarsApplicationMixin,
    ApplicationV2
} = foundry.applications.api;


export class StationPopulationLauncherApplication
    extends HandlebarsApplicationMixin(ApplicationV2) {


    static DEFAULT_OPTIONS = {

        id: "metro-station-population-launcher-{id}",

        classes: ["metro-2033", "metro-station-population-launcher-app"],

        window: {
            title: "Jet de Population hebdomadaire",
            icon: "fa-solid fa-dice",
            resizable: true
        },

        position: {
            width: 480,
            height: "auto"
        }

    };


    static PARTS = {
        main: {
            template:
                "systems/metro-2033-yze/templates/applications/station-population-launcher.hbs"
        }
    };


    constructor(item, options = {}) {

        super(options);

        this._item = item;

        this._phase = "intro";
        this._rollOutcome = null;
        this._resourceChoicesForSixes = [];

    }


    get title() {

        return `Jet de Population — ${this._item?.name ?? ""}`;

    }


    /** @override */
    async _prepareContext(options) {

        const context =
            await super._prepareContext(options);

        const system =
            this._item.system;

        Object.assign(
            context,
            buildStationPopulationLauncherViewModel({

                stationName:
                    this._item.name,

                resources:
                    system.resources,

                supportPersonnel:
                    system.supportPersonnel,

                population:
                    system.population,

                phase:
                    this._phase,

                rollOutcome:
                    this._rollOutcome,

                resourceChoicesForSixes:
                    this._resourceChoicesForSixes

            })
        );

        return context;

    }


    /** @override */
    _onRender(context, options) {

        super._onRender(context, options);

        this.element
            .querySelectorAll('[data-action="roll-station-population"]')
            .forEach(
                button => button.addEventListener(
                    "click",
                    this._onRollDice.bind(this)
                )
            );

        this.element
            .querySelectorAll('[data-action="apply-station-population"]')
            .forEach(
                button => button.addEventListener(
                    "click",
                    this._onApply.bind(this)
                )
            );

        this.element
            .querySelectorAll(".metro-station-population-six-select")
            .forEach(
                select => select.addEventListener(
                    "change",
                    this._onSixChoiceChange.bind(this)
                )
            );

    }


    _onSixChoiceChange(event) {

        const index =
            Number(
                event.currentTarget.dataset.sixIndex
            );

        this._resourceChoicesForSixes[index] =
            event.currentTarget.value;

        this.render();

    }


    async _onRollDice(event) {

        event.preventDefault();

        const system =
            this._item.system;

        const supportResults =
            rollStationSupportPersonnel({
                supportPersonnel:
                    system.supportPersonnel
            });


        /*
         * Les gains du Personnel de soutien s'appliquent aux
         * ressources AVANT de calculer les dés de Stress dus
         * aux ressources à 0 pour le jet de Population
         * lui-même (règles p.219).
         */
        const resourcesAfterPersonnel = {
            ...system.resources
        };

        for (
            const [key, result]
            of Object.entries(supportResults)
        ) {

            if (!result) {
                continue;
            }

            resourcesAfterPersonnel[key] =
                Math.min(
                    10,
                    resourcesAfterPersonnel[key] + result.resourceGain
                );

        }


        const populationDice =
            rollStationPopulationDice({
                resources:
                    resourcesAfterPersonnel,

                populationLevel:
                    system.population.level,

                pendingMoralStressDice:
                    system.population.pendingMoralStressDice
            });


        this._rollOutcome = {
            supportResults,
            resourcesAfterPersonnel,
            populationDice
        };

        this._resourceChoicesForSixes =
            new Array(populationDice.baseSixes).fill("");


        if (populationDice.baseSixes === 0) {

            await this._applyWeek();
            return;

        }


        this._phase = "choices";

        this.render();

    }


    async _onApply(event) {

        event.preventDefault();

        const viewModel =
            buildStationPopulationLauncherViewModel({
                resources:
                    this._item.system.resources,

                supportPersonnel:
                    this._item.system.supportPersonnel,

                population:
                    this._item.system.population,

                phase:
                    this._phase,

                rollOutcome:
                    this._rollOutcome,

                resourceChoicesForSixes:
                    this._resourceChoicesForSixes
            });

        if (!viewModel.canValidate) {

            ui.notifications?.warn(
                "Choisissez une ressource pour chaque \"6\" obtenu."
            );

            return;

        }


        await this._applyWeek();

    }


    /**
     * Résout le contrecoup, met à jour l'Item Station et poste
     * le récapitulatif — commun aux deux chemins (avec ou sans
     * "6" à choisir).
     */
    async _applyWeek() {

        const system =
            this._item.system;

        const {
            supportResults,
            resourcesAfterPersonnel,
            populationDice
        } =
            this._rollOutcome;


        const weekResult =
            applyStationPopulationWeek({

                resources:
                    resourcesAfterPersonnel,

                members:
                    system.population.members,

                baseOnes:
                    populationDice.baseOnes,

                baseSixes:
                    populationDice.baseSixes,

                stressOnes:
                    populationDice.stressOnes,

                resourceChoicesForSixes:
                    this._resourceChoicesForSixes

            });


        const updatedSupportPersonnel = {
            ...system.supportPersonnel
        };

        for (
            const [key, result]
            of Object.entries(supportResults)
        ) {

            if (result?.personnelDied) {

                updatedSupportPersonnel[key] =
                    Math.max(
                        0,
                        updatedSupportPersonnel[key] - 1
                    );

            }

        }


        await this._item.update({

            "system.resources":
                weekResult.newResources,

            "system.population.level":
                weekResult.newLevel,

            "system.population.members":
                weekResult.newMembers,

            "system.population.pendingMoralStressDice":
                weekResult.nextWeekMoralStressDice,

            "system.supportPersonnel":
                updatedSupportPersonnel

        });


        await postStationPopulationRecapMessage({

            stationName:
                this._item.name,

            resourcesBefore:
                system.resources,

            supportResults,

            populationDice,

            resourceChoicesForSixes:
                this._resourceChoicesForSixes,

            membersBefore:
                system.population.members,

            levelBefore:
                system.population.level,

            weekResult

        });


        this.close();

    }

}
