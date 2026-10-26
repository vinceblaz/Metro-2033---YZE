/**
 * Orchestration du Jet de SURVIE (système Station, règles p.219).
 *
 * Déclenché par un joueur depuis sa fiche de Personnage (onglet
 * Survie) : choix de la Station et de la ressource recherchée
 * (StationSurvivalLauncherDialog), puis jet de Compétence SURVIE
 * via la fenêtre de préparation universelle (ActionModifierDialog)
 * — avec le modificateur de la ressource (table p.219) déjà
 * prérempli comme pénalité manuelle, le joueur pouvant toujours
 * ajouter ses propres ajustements (Talents, équipement, « Subir 1
 * Stress pour +3 »...) par-dessus.
 *
 * Décision actée au cadrage de l'automatisation du système
 * Station : ce jet utilise le gabarit générique YZERollChat
 * plutôt qu'une carte de Chat dédiée — le bouton « Appliquer à la
 * Station » qui en résulte est déjà câblé depuis ce chantier
 * (yze-roll-chat-hooks.mjs, applyStationSurvivalRollFromMessage),
 * il ne manquait jusqu'ici qu'un moyen de LANCER ce jet, que ce
 * module fournit.
 *
 * Dépendant de l'API Foundry de bout en bout (fromUuid, game.items,
 * ActionModifierDialog, actor.rollSkill, ChatMessage) : non testé
 * unitairement par convention du projet. Les parties pures
 * utilisées ici (domain/rules/station-survival-roll.mjs,
 * StationSurvivalLauncherDialog.createContent/readSelection) sont
 * testées séparément.
 */

import {
    StationSurvivalLauncherDialog
} from "./station-survival-launcher-dialog.mjs";

import {
    STATION_RESOURCE_DEFINITIONS
} from "./station-population-view-model.mjs";

import {
    getStationSurvivalRollModifier
} from "../../domain/rules/station-survival-roll.mjs";

import {
    SkillRollPreparationService
} from "../../action-resolution/skill-roll-preparation-service.mjs";

import {
    ActionModifierDialog
} from "../applications/action-modifier-dialog.mjs";

import {
    YZERollChat
} from "../chat/yze-roll-chat.mjs";


/**
 * Station affiliée au Personnage : celle référencée dans sa fiche
 * (onglet Biographie, « Communauté / Station », system.affiliations.community).
 * Un Personnage n'a qu'une seule Station : aucune autre n'est proposée.
 *
 * Renvoie { options, reason } : `options` contient au plus une entrée ;
 * `reason` explique pourquoi la liste est vide.
 */
async function resolveAffiliatedStation(
    actor
) {

    const uuid =
        String(
            actor?.system?.affiliations?.community
            ?? ""
        ).trim();

    if (!uuid) {

        return {
            options: [],
            reason: `${actor?.name ?? "Ce personnage"} n'a aucune Station affiliée : renseignez « Communauté / Station » dans l'onglet Biographie.`
        };

    }

    let station = null;

    try {
        station = await fromUuid(uuid);
    }
    catch (error) {
        station = null;
    }

    if (!station || station.type !== "station") {

        return {
            options: [],
            reason: `La Station affiliée à ${actor.name} est introuvable ou n'est pas une Station (« Communauté / Station », onglet Biographie).`
        };

    }

    if (station.pack) {

        return {
            options: [],
            reason: `La Station « ${station.name} » est dans un compendium : importez-la dans le monde, puis affiliez le personnage à cette copie.`
        };

    }

    return {
        options: [{ value: station.uuid, label: station.name }],
        reason: ""
    };

}


function labelForResource(
    key
) {

    return STATION_RESOURCE_DEFINITIONS.find(
        definition => definition.key === key
    )
        ?.label
        ?? key;

}


/**
 * Lance un Jet de SURVIE pour l'Actor fourni (doit être le
 * Personnage lui-même, ou un MJ agissant pour lui). Renvoie le
 * résultat du jet, ou `null` si le joueur a annulé la fenêtre de
 * sélection de Station/ressource, ou la fenêtre de préparation du
 * jet.
 */
export async function rollStationSurvivalForActor(
    actor
) {

    if (!actor) {

        throw new TypeError(
            "Un Acteur est requis pour lancer un Jet de Survie."
        );

    }


    if (!actor.isOwner) {

        throw new Error(
            "Vous ne pouvez pas lancer ce jet pour cet Acteur."
        );

    }


    const { options: stationOptions, reason } =
        await resolveAffiliatedStation(actor);

    if (stationOptions.length === 0) {

        ui.notifications.warn(reason);

        return null;

    }

    const selection =
        await StationSurvivalLauncherDialog.prompt({
            stationOptions
        });

    if (!selection) {

        return null;

    }


    const station =
        await fromUuid(
            selection.stationUuid
        );

    if (!station) {

        throw new Error(
            "La Station sélectionnée est introuvable."
        );

    }


    const resourceLabel =
        labelForResource(
            selection.resourceKey
        );

    const modifier =
        getStationSurvivalRollModifier(
            selection.resourceKey
        );


    const {
        preparation
    } =
        SkillRollPreparationService.create(
            actor,
            {
                attribute:
                    "spirit",

                skill:
                    "survival",

                manualPenalty:
                    Math.abs(
                        modifier
                    ),

                metadata: {
                    resourceKey:
                        selection.resourceKey
                }
            }
        );


    const resolvedPreparation =
        await ActionModifierDialog.prompt(
            preparation,
            {
                title:
                    `${actor.name} — Jet de Survie `
                    + `(${resourceLabel}, ${station.name})`,

                confirmLabel:
                    "Lancer le jet"
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


    const result =
        await actor.rollSkill(
            "survival",
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
                        "station-survival-roll",

                    stationSurvival: {

                        stationUuid:
                            station.uuid,

                        stationName:
                            station.name,

                        resourceKey:
                            selection.resourceKey,

                        resourceLabel,

                        applied:
                            false

                    },

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


    await YZERollChat.createMessage(
        result
    );


    return result;

}
