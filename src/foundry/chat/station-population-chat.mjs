/**
 * Message de Chat récapitulatif du Jet de Population
 * hebdomadaire (système Station, règles p.218-221).
 *
 * Simple rendu + publication : toute la mise en forme des
 * données est déléguée à
 * `buildStationPopulationRecapViewModel`
 * (foundry/station/station-population-view-model.mjs, pur et
 * testé). Ce module n'est pas unit-testé (convention du projet
 * pour tout ce qui dépend des API Foundry : ChatMessage,
 * renderTemplate).
 */

import {
    buildStationPopulationRecapViewModel
} from "../station/station-population-view-model.mjs";


const TEMPLATE =
    "systems/metro-2033-yze/templates/chat/station-population-recap.hbs";


export async function postStationPopulationRecapMessage({
    stationName,
    resourcesBefore,
    supportResults,
    populationDice,
    resourceChoicesForSixes,
    membersBefore,
    levelBefore,
    weekResult
} = {}) {

    const viewModel =
        buildStationPopulationRecapViewModel({
            stationName,
            resourcesBefore,
            supportResults,
            populationDice,
            resourceChoicesForSixes,
            membersBefore,
            levelBefore,
            weekResult
        });


    const content =
        await foundry.applications.handlebars.renderTemplate(
            TEMPLATE,
            viewModel
        );


    return ChatMessage.create({

        speaker:
            ChatMessage.getSpeaker(),

        content

    });

}
