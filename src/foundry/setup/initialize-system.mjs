/**
 * Initialisation du système en une seule action (MJ).
 *
 * Lance, dans le bon ordre, tous les imports de compendiums
 * (équipement, améliorations d'arme, talents et archétypes,
 * bestiaire, factions, stations, blessures critiques,
 * traumatismes, véhicules, tables de tirage). Chaque import est
 * idempotent : relancer la macro après une mise à jour du
 * système met les compendiums à jour sans toucher aux Acteurs
 * et Items déjà présents dans le monde.
 *
 * À la première installation, et après toute mise à jour du
 * système, le MJ reçoit un rappel de lancer la macro.
 *
 * Dépend de l'API Foundry : non testé unitairement (la logique
 * d'enchaînement est dans domain/rules/seed-sequence.mjs).
 */

import {
    needsInitialization,
    runSeedSequence,
    summarizeSeedReport
} from "../../domain/rules/seed-sequence.mjs";

import { seedEquipmentCompendium } from "./seed-equipment-compendium.mjs";
import { seedWeaponModCompendium } from "./seed-weapon-mod-compendium.mjs";
import { seedTalentArchetypeCompendium } from "./seed-talent-archetype-compendium.mjs";
import { seedCreatureTraitCompendium } from "./seed-creature-trait-compendium.mjs";
import { seedBestiaryCompendium } from "./seed-bestiary-compendium.mjs";
import { seedFactionCompendium } from "./seed-faction-compendium.mjs";
import { seedFactionNpcCompendium } from "./seed-faction-npc-compendium.mjs";
import { seedStationCompendium } from "./seed-station-compendium.mjs";
import { seedStationNpcCompendium } from "./seed-station-npc-compendium.mjs";
import { seedCriticalInjuryCompendium } from "./seed-critical-injury-compendium.mjs";
import { seedPsychologicalTraumaCompendium } from "./seed-psychological-trauma-compendium.mjs";
import { seedCriticalInjuryRollTable } from "./seed-critical-injury-roll-table.mjs";
import { seedPsychologicalTraumaRollTable } from "./seed-psychological-trauma-roll-table.mjs";
import { seedVehicleCompendium } from "./seed-vehicle-compendium.mjs";
import { seedVehicleBreakdownRollTable } from "./seed-vehicle-breakdown-roll-table.mjs";


const SYSTEM_ID =
    "metro-2033-yze";

const VERSION_SETTING =
    "initializedVersion";

const MACRO_NAME =
    "Métro 2033 — Initialiser le système";

const MACRO_COMMAND =
    "game.metro2033.initializeSystem();";


const STEPS = [
    { key: "equipment", label: "Équipement de base", run: seedEquipmentCompendium },
    { key: "weaponMods", label: "Améliorations d'arme", run: seedWeaponModCompendium },
    { key: "talents", label: "Talents et archétypes", run: seedTalentArchetypeCompendium },
    { key: "creatureTraits", label: "Traits de créature", run: seedCreatureTraitCompendium },
    { key: "bestiary", label: "Bestiaire", run: seedBestiaryCompendium },
    { key: "factions", label: "Factions", run: seedFactionCompendium },
    { key: "factionNpcs", label: "PNJ des factions", run: seedFactionNpcCompendium },
    { key: "stations", label: "Stations", run: seedStationCompendium },
    { key: "stationNpcs", label: "PNJ des stations", run: seedStationNpcCompendium },
    { key: "injuries", label: "Blessures critiques", run: seedCriticalInjuryCompendium },
    { key: "traumas", label: "Traumatismes psychologiques", run: seedPsychologicalTraumaCompendium },
    {
        key: "injuryTable",
        label: "Table des blessures critiques",
        requires: ["injuries"],
        run: seedCriticalInjuryRollTable
    },
    {
        key: "traumaTable",
        label: "Table des traumatismes",
        requires: ["traumas"],
        run: seedPsychologicalTraumaRollTable
    },
    { key: "vehicles", label: "Véhicules", run: seedVehicleCompendium },
    { key: "breakdownTable", label: "Table des pannes de véhicule", run: seedVehicleBreakdownRollTable }
];


const STATUS_LABEL = {
    ok: "OK",
    error: "ÉCHEC",
    skipped: "Ignorée"
};


function escapeHTML(value) {

    return foundry.utils.escapeHTML(
        String(value ?? "")
    );

}


/**
 * À appeler dans le hook « init » : mémorise la version avec
 * laquelle le monde a été initialisé.
 */
export function registerInitializationSetting() {

    game.settings.register(
        SYSTEM_ID,
        VERSION_SETTING,
        {
            scope: "world",
            config: false,
            type: String,
            default: ""
        }
    );

}


/**
 * Lance toutes les importations.
 *
 * @returns {Promise<Array>} le rapport par étape.
 */
export async function initializeSystem() {

    if (!game.user?.isGM) {

        throw new Error(
            "Métro 2033 | Seul le MJ peut initialiser le système."
        );

    }

    ui.notifications?.info(
        "Métro 2033 : initialisation en cours, cela peut prendre une minute…"
    );

    const report =
        await runSeedSequence(
            STEPS,
            {
                onStep: (step, index, total) =>
                    console.log(
                        `Métro 2033 | Initialisation ${index + 1}/${total} : ${step.label}`
                    )
            }
        );

    const summary =
        summarizeSeedReport(report);

    if (summary.success) {

        try {

            await game.settings.set(
                SYSTEM_ID,
                VERSION_SETTING,
                game.system.version
            );

        }
        catch (error) {

            console.warn(
                "Métro 2033 | Version d'initialisation non mémorisée.",
                error
            );

        }

    }

    const rows =
        report
            .map(
                entry =>
                    `<li><strong>${escapeHTML(entry.label)}</strong> : `
                    + `${escapeHTML(STATUS_LABEL[entry.status])}`
                    + (
                        entry.error
                            ? ` — ${escapeHTML(entry.error)}`
                            : ""
                    )
                    + "</li>"
            )
            .join("");

    await ChatMessage.create({
        whisper:
            [game.user.id],
        content: `
            <div class="metro-chat-survival-card">
                <header class="metro-chat-survival-card-header">
                    <strong>Initialisation du système</strong>
                </header>
                <div class="metro-chat-survival-card-summary">
                    ${summary.success
                        ? "Terminée : compendiums et tables à jour."
                        : "Terminée avec des erreurs : corrigez-les puis relancez la macro."}
                </div>
                <ul>${rows}</ul>
            </div>
        `
    });

    if (summary.success) {

        ui.notifications?.info(
            "Métro 2033 : initialisation terminée."
        );

    }
    else {

        ui.notifications?.error(
            "Métro 2033 : initialisation terminée avec des erreurs (voir le Chat)."
        );

    }

    return report;

}


async function ensureInitializationMacro() {

    if (!game.user?.isGM) {
        return;
    }

    try {

        let macro =
            game.macros?.find(
                candidate =>
                    candidate.name === MACRO_NAME
                    && candidate.command === MACRO_COMMAND
            );

        if (!macro) {

            macro = await Macro.create({
                name: MACRO_NAME,
                type: "script",
                img: "icons/svg/book.svg",
                command: MACRO_COMMAND,
                scope: "global"
            });

        }

        if (!macro) {
            return;
        }

        const hotbar =
            game.user?.hotbar ?? {};

        if (Object.values(hotbar).includes(macro.id)) {
            return;
        }

        const firstEmptySlot =
            Array.from(
                { length: 50 },
                (unused, index) => index + 1
            )
                .find(slot => !hotbar[slot]);

        if (firstEmptySlot) {

            await game.user.assignHotbarMacro(
                macro,
                firstEmptySlot
            );

        }

    }
    catch (error) {

        console.warn(
            "Métro 2033 | Impossible de créer la macro d'initialisation.",
            error
        );

    }

}


/**
 * À appeler dans le hook « ready » : expose la commande, crée la
 * macro du MJ et rappelle de l'exécuter à la première
 * installation ou après une mise à jour du système.
 */
export function registerInitializationHooks() {

    game.metro2033 = game.metro2033 ?? {};
    game.metro2033.initializeSystem = initializeSystem;

    if (!game.user?.isGM) {
        return;
    }

    ensureInitializationMacro();

    let installedVersion = "";

    try {

        installedVersion =
            game.settings.get(
                SYSTEM_ID,
                VERSION_SETTING
            );

    }
    catch {
        // Réglage absent : traité comme une première installation.
    }

    if (
        needsInitialization({
            installedVersion,
            currentVersion:
                game.system?.version
        })
    ) {

        ui.notifications?.warn(
            "Métro 2033 : système installé ou mis à jour. "
            + `Lancez la macro « ${MACRO_NAME} » (barre de raccourcis) `
            + "pour créer ou mettre à jour les compendiums.",
            { permanent: true }
        );

    }

}
