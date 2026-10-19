import { MetroActor }
    from "./foundry/documents/actor.mjs";

import { CharacterDataModel }
    from "./data/actors/character-model.mjs";

import { CreatureDataModel }
    from "./data/actors/creature-model.mjs";

import { VehicleDataModel }
    from "./data/actors/vehicle-model.mjs";

import { NpcDataModel }
    from "./data/actors/npc-model.mjs";

import { WeaponDataModel }
    from "./data/items/weapon-model.mjs";

import { ArmorDataModel }
    from "./data/items/armor-model.mjs";

import { AmmunitionDataModel }
    from "./data/items/ammunition-model.mjs";

import { TalentDataModel }
    from "./data/items/talent-model.mjs";

import { ArchetypeDataModel }
    from "./data/items/archetype-model.mjs";    

import { CriticalInjuryDataModel }
    from "./data/items/critical-injury-model.mjs";

import { PsychologicalTraumaDataModel }
    from "./data/items/psychological-trauma-model.mjs";

import { FactionDataModel }
    from "./data/items/faction-model.mjs";

import { StationDataModel }
    from "./data/items/station-model.mjs";

import { PoisonDataModel }
    from "./data/items/poison-model.mjs";

import { CriticalInjurySheet }
    from "./foundry/sheets/critical-injury-sheet.mjs";

import { PsychologicalTraumaSheet }
    from "./foundry/sheets/psychological-trauma-sheet.mjs";

import { PoisonSheet }
    from "./foundry/sheets/poison-sheet.mjs";

import { FactionSheet }
    from "./foundry/sheets/faction-sheet.mjs";

import { StationSheet }
    from "./foundry/sheets/station-sheet.mjs";

import { CharacterSheet }
    from "./foundry/sheets/character-sheet.mjs";

import { NpcSheet }
    from "./foundry/sheets/npc-sheet.mjs";

import { CreatureSheet }
    from "./foundry/sheets/creature-sheet.mjs";

import { VehicleSheet }
    from "./foundry/sheets/vehicle-sheet.mjs";

import { TalentSheet } 
    from "./foundry/sheets/talent-sheet.mjs";

import { SKILL_DEFINITIONS }
    from "./domain/rules/skills.mjs";

import { registerCombatHooks }
    from "./combat/combat-hooks.mjs";

import {
    registerMeleeAttackChatHooks
} from "./combat/melee-attack-chat-hooks.mjs";

import {
    registerYZERollChatHooks
} from "./foundry/chat/yze-roll-chat-hooks.mjs";

import {
    registerMetroChatScrollHooks
} from "./foundry/chat/metro-chat-scroll.mjs";

import {
    registerItemChatHooks
} from "./foundry/chat/item-chat-hooks.mjs";

import { WeaponSheet }
    from "./foundry/sheets/weapon-sheet.mjs";

import { EquipmentDataModel }
    from "./data/items/equipment-model.mjs";

import { WeaponModDataModel }
    from "./data/items/weapon-mod-model.mjs";

import { ConsumableDataModel }
    from "./data/items/consumable-model.mjs";

import { EquipmentSheet }
    from "./foundry/sheets/equipment-sheet.mjs";

import { WeaponModSheet }
    from "./foundry/sheets/weapon-mod-sheet.mjs";

import { ArchetypeSheet }
    from "./foundry/sheets/archetype-sheet.mjs";   

import { AmmunitionSheet }
    from "./foundry/sheets/ammunition-sheet.mjs";

import { ArmorSheet }
    from "./foundry/sheets/armor-sheet.mjs";

import { ConsumableSheet }
    from "./foundry/sheets/consumable-sheet.mjs";

import { MetroItem }
    from "./foundry/documents/item.mjs";    

import { MetroCombat }
    from "./documents/metro-combat.mjs";

import {
    registerInitiativePreparationHooks
} from "./foundry/initiative/metro-initiative-preparation-hooks.mjs";

import {
    registerCharacterCreationHooks,
    openCharacterCreationWizard
} from "./foundry/character-creation/metro-character-creation-hooks.mjs";

import {
    registerNpcCreationHooks,
    openNpcCreationWizard
} from "./foundry/npc-creation/metro-npc-creation-hooks.mjs";

import {
    registerTerrorRollHooks,
    openTerrorRollDialog
} from "./foundry/terror-roll/metro-terror-roll-hooks.mjs";

import {
    registerTerrorRollChatHooks
} from "./foundry/chat/terror-roll-chat-hooks.mjs";

import {
    registerCoupDeGraceHooks,
    openCoupDeGraceDialog
} from "./foundry/coup-de-grace/metro-coup-de-grace-hooks.mjs";

import {
    registerCoupDeGraceChatHooks
} from "./foundry/chat/coup-de-grace-chat-hooks.mjs";

import {
    registerGMMessageRelay
} from "./foundry/chat/gm-message-relay.mjs";

import {
    registerMeleeWorkflowRelay
} from "./combat/melee-workflow-relay.mjs";

import {
    registerComposureHooks
} from "./foundry/composure/metro-composure-hooks.mjs";

import {
    registerBrokenAttributeHooks
} from "./foundry/composure/metro-broken-attribute-hooks.mjs";

import {
    BROKEN_ATTRIBUTE_STATUS_EFFECTS
} from "./domain/rules/broken-attribute-status.mjs";

import {
    registerTalentNameHooks
} from "./foundry/talents/metro-talent-name-hooks.mjs";

import {
    COMPOSURE_BROKEN_STATUS_EFFECT
} from "./domain/rules/composure-break.mjs";

import {
    registerAsphyxiationHooks,
    openAsphyxiationRollDialog
} from "./foundry/asphyxiation/metro-asphyxiation-hooks.mjs";

import {
    ASPHYXIATION_STATUS_EFFECT
} from "./domain/rules/asphyxiation.mjs";

import {
    registerAsphyxiationRollChatHooks
} from "./foundry/chat/asphyxiation-roll-chat-hooks.mjs";

import {
    registerFireHooks,
    openFireRollDialog
} from "./foundry/fire/metro-fire-hooks.mjs";

import {
    registerFireRollChatHooks
} from "./foundry/chat/fire-roll-chat-hooks.mjs";

import {
    FIRE_STATUS_EFFECT
} from "./domain/rules/fire.mjs";

import {
    registerPoisonHooks,
    openPoisonRollDialog
} from "./foundry/poison/metro-poison-hooks.mjs";

import {
    POISON_STATUS_EFFECT
} from "./domain/rules/poison.mjs";

import {
    registerPoisonRollChatHooks
} from "./foundry/chat/poison-roll-chat-hooks.mjs";

import {
    registerIllnessHooks,
    openIllnessRollDialog
} from "./foundry/illness/metro-illness-hooks.mjs";

import {
    ILLNESS_STATUS_EFFECT
} from "./domain/rules/illness.mjs";

import {
    registerIllnessRollChatHooks
} from "./foundry/chat/illness-roll-chat-hooks.mjs";

import {
    seedEquipmentCompendium
} from "./foundry/setup/seed-equipment-compendium.mjs";

import {
    seedWeaponModCompendium
} from "./foundry/setup/seed-weapon-mod-compendium.mjs";

import {
    seedTalentArchetypeCompendium
} from "./foundry/setup/seed-talent-archetype-compendium.mjs";

import { registerMetroFonts } from "./foundry/ui/metro-fonts.mjs";
import { registerSettingsLogoHook } from "./foundry/ui/metro-settings-logo.mjs";

import {
    seedCreatureTraitCompendium
} from "./foundry/setup/seed-creature-trait-compendium.mjs";

import {
    seedBestiaryCompendium
} from "./foundry/setup/seed-bestiary-compendium.mjs";

import {
    seedFactionCompendium
} from "./foundry/setup/seed-faction-compendium.mjs";

import {
    seedFactionNpcCompendium
} from "./foundry/setup/seed-faction-npc-compendium.mjs";

import {
    seedStationCompendium
} from "./foundry/setup/seed-station-compendium.mjs";

import {
    seedStationNpcCompendium
} from "./foundry/setup/seed-station-npc-compendium.mjs";

import {
    seedCriticalInjuryCompendium
} from "./foundry/setup/seed-critical-injury-compendium.mjs";

import {
    seedPsychologicalTraumaCompendium
} from "./foundry/setup/seed-psychological-trauma-compendium.mjs";

import {
    seedCriticalInjuryRollTable
} from "./foundry/setup/seed-critical-injury-roll-table.mjs";

import {
    seedPsychologicalTraumaRollTable
} from "./foundry/setup/seed-psychological-trauma-roll-table.mjs";

import {
    seedVehicleCompendium
} from "./foundry/setup/seed-vehicle-compendium.mjs";

import {
    seedVehicleBreakdownRollTable
} from "./foundry/setup/seed-vehicle-breakdown-roll-table.mjs";

import {
    registerInitializationSetting,
    registerInitializationHooks
} from "./foundry/setup/initialize-system.mjs";

console.log(
    "Métro 2033 | system.mjs chargé"
);


Hooks.once("init",
    () => {

        registerInitializationSetting();

        console.log(
            "Métro 2033 | init"
        );


        CONFIG.Actor.documentClass =
            MetroActor;

        CONFIG.Item.documentClass =
            MetroItem;

        CONFIG.Combat.documentClass =
            MetroCombat;


        /*
         * États homebrew propres à Métro 2033 (Asphyxié, et
         * futurs Poison/Maladie...) : ajoutés au catalogue
         * Foundry pour apparaître comme icône sur le Token et
         * rester activables/désactivables depuis le Token HUD,
         * comme n'importe quel état natif (« dead », etc.).
         *
         * Conservés à part dans METRO_TRACKED_STATUS_EFFECTS
         * (plutôt que relus depuis le catalogue Foundry complet,
         * qui contient aussi la soixantaine d'états natifs sans
         * rapport avec le système) pour que la fiche Personnage
         * (onglet Survie) puisse les lister explicitement, sans
         * avoir à les distinguer des états natifs de Foundry.
         */
        const METRO_TRACKED_STATUS_EFFECTS = [
            ASPHYXIATION_STATUS_EFFECT,
            POISON_STATUS_EFFECT,
            ILLNESS_STATUS_EFFECT
        ];

        CONFIG.statusEffects.push(
            ...METRO_TRACKED_STATUS_EFFECTS,
            COMPOSURE_BROKEN_STATUS_EFFECT,
            ...BROKEN_ATTRIBUTE_STATUS_EFFECTS.map(
                ({ id, name, img }) => ({ id, name, img })
            )
        );


        /*
         * Feu : l'état « burning » existe déjà dans Foundry (état
         * natif). On le renomme en français plutôt que d'en créer
         * un doublon dans le Token HUD ; s'il venait à manquer, on
         * l'ajoute.
         */
        const nativeFireStatus =
            CONFIG.statusEffects.find(
                effect =>
                    effect.id === FIRE_STATUS_EFFECT.id
            );

        if (nativeFireStatus) {

            nativeFireStatus.name =
                FIRE_STATUS_EFFECT.name;

        }
        else {

            CONFIG.statusEffects.push(
                {
                    ...FIRE_STATUS_EFFECT
                }
            );

        }


        /*
         * « En feu » est aussi listé dans l'onglet Survie de la fiche
         * Personnage, à côté d'Asphyxié, Empoisonné et Malade
         * (activable / désactivable). Il s'agit du même état que celui
         * du Token HUD : seule la liste affichée est complétée, sans
         * créer de doublon dans CONFIG.statusEffects.
         */
        const fireStatusForSheet =
            CONFIG.statusEffects.find(
                effect =>
                    effect.id === FIRE_STATUS_EFFECT.id
            )
            ?? FIRE_STATUS_EFFECT;

        METRO_TRACKED_STATUS_EFFECTS.push(
            {
                id:
                    fireStatusForSheet.id,

                name:
                    fireStatusForSheet.name
                    ?? FIRE_STATUS_EFFECT.name,

                img:
                    fireStatusForSheet.img
                    ?? FIRE_STATUS_EFFECT.img
            }
        );


        Object.assign(
            CONFIG.Actor.dataModels,
            {
                character:
                    CharacterDataModel,

                creature:
                    CreatureDataModel,

                vehicle:
                    VehicleDataModel,

                npc:
                    NpcDataModel
            }
        );


        Object.assign(
            CONFIG.Item.dataModels,
            {
                weapon:
                    WeaponDataModel,

                armor:
                    ArmorDataModel,

                ammunition:
                    AmmunitionDataModel,

                equipment:
                    EquipmentDataModel,

                weaponMod:
                    WeaponModDataModel,

                consumable:
                    ConsumableDataModel,

                talent:
                    TalentDataModel,

                archetype:
                    ArchetypeDataModel,

                criticalInjury:
                    CriticalInjuryDataModel,

                psychologicalTrauma:
                    PsychologicalTraumaDataModel,

                poison:
                    PoisonDataModel,

                faction:
                    FactionDataModel,

                station:
                    StationDataModel
            }
        );


        /*
         * Fiche Item dédiée aux Blessures critiques.
         *
         * Foundry VTT v14 :
         * enregistrement via DocumentSheetConfig.
         */
        foundry.applications.apps.DocumentSheetConfig.registerSheet(
            Item,
            "metro-2033-yze",
            CriticalInjurySheet,
            {
                types: [
                    "criticalInjury"
                ],

                makeDefault: true,

                label:
                    "Métro 2033 — Blessure critique"
            }
        );


        /*
         * Fiche Item dédiée aux Traumatismes psychologiques.
         */
        foundry.applications.apps.DocumentSheetConfig.registerSheet(
            Item,
            "metro-2033-yze",
            PsychologicalTraumaSheet,
            {
                types: [
                    "psychologicalTrauma"
                ],

                makeDefault: true,

                label:
                    "Métro 2033 — Traumatisme psychologique"
            }
        );


        /*
         * Fiche Item dédiée aux Poisons.
         */
        foundry.applications.apps.DocumentSheetConfig.registerSheet(
            Item,
            "metro-2033-yze",
            PoisonSheet,
            {
                types: [
                    "poison"
                ],

                makeDefault: true,

                label:
                    "Métro 2033 — Poison"
            }
        );


        /*
         * Fiche Actor dédiée aux personnages.
         *
         * Foundry VTT v14 :
         * enregistrement via DocumentSheetConfig.
         */
        foundry.applications.apps.DocumentSheetConfig.registerSheet(
            Actor,
            "metro-2033-yze",
            CharacterSheet,
            {
                types: [
                    "character"
                ],

                makeDefault: true,

                label:
                    "Métro 2033 — Personnage"
            }
        );


        /*
         * Fiche Actor dédiée aux PNJ.
         *
         * Foundry VTT v14 :
         * enregistrement via DocumentSheetConfig.
         */
        foundry.applications.apps.DocumentSheetConfig.registerSheet(
            Actor,
            "metro-2033-yze",
            NpcSheet,
            {
                types: [
                    "npc"
                ],

                makeDefault: true,

                label:
                    "Métro 2033 — PNJ"
            }
        );


        /*
         * Fiche Actor dédiée aux Créatures.
         *
         * Foundry VTT v14 :
         * enregistrement via DocumentSheetConfig.
         */
        foundry.applications.apps.DocumentSheetConfig.registerSheet(
            Actor,
            "metro-2033-yze",
            CreatureSheet,
            {
                types: [
                    "creature"
                ],

                makeDefault: true,

                label:
                    "Métro 2033 — Créature"
            }
        );


        /*
         * Fiche Actor dédiée aux Véhicules.
         *
         * Foundry VTT v14 :
         * enregistrement via DocumentSheetConfig.
         */
        foundry.applications.apps.DocumentSheetConfig.registerSheet(
            Actor,
            "metro-2033-yze",
            VehicleSheet,
            {
                types: [
                    "vehicle"
                ],

                makeDefault: true,

                label:
                    "Métro 2033 — Véhicule"
            }
        );


        /*
         * Fiche Item dédiée aux Armes.
         *
         * Foundry VTT v14 :
         * enregistrement via DocumentSheetConfig.
         */
        foundry.applications.apps.DocumentSheetConfig.registerSheet(
            Item,
            "metro-2033-yze",
            WeaponSheet,
            {
                types: [
                    "weapon"
                ],

                makeDefault: true,

                label:
                    "Métro 2033 — Arme"
            }
        );


        /*
         * Fiche Item dédiée aux Munitions.
         *
         * Foundry VTT v14 :
         * enregistrement via DocumentSheetConfig.
         */
        foundry.applications.apps.DocumentSheetConfig.registerSheet(
            Item,
            "metro-2033-yze",
            AmmunitionSheet,
            {
                types: [
                    "ammunition"
                ],

                makeDefault: true,

                label:
                    "Métro 2033 — Munition"
            }
        );


        /*
         * Fiche Item dédiée aux Outils
         * (matériel apportant un bonus à un test).
         */
        foundry.applications.apps.DocumentSheetConfig.registerSheet(
            Item,
            "metro-2033-yze",
            EquipmentSheet,
            {
                types: [
                    "equipment"
                ],

                makeDefault: true,

                label:
                    "Métro 2033 — Outil"
            }
        );


        /*
         * Fiche Item dédiée aux Améliorations d'équipement.
         */
        foundry.applications.apps.DocumentSheetConfig.registerSheet(
            Item,
            "metro-2033-yze",
            WeaponModSheet,
            {
                types: [
                    "weaponMod"
                ],

                makeDefault: true,

                label:
                    "Métro 2033 — Amélioration d'équipement"
            }
        );


        /*
         * Fiche Item dédiée aux Protections
         * (armures et casques).
         */
        foundry.applications.apps.DocumentSheetConfig.registerSheet(
            Item,
            "metro-2033-yze",
            ArmorSheet,
            {
                types: [
                    "armor"
                ],

                makeDefault: true,

                label:
                    "Métro 2033 — Protection"
            }
        );


        /*
         * Fiche Item dédiée aux Objets
         * (quantité/doses : trousses, doses, vestiges...).
         */
        foundry.applications.apps.DocumentSheetConfig.registerSheet(
            Item,
            "metro-2033-yze",
            ConsumableSheet,
            {
                types: [
                    "consumable"
                ],

                makeDefault: true,

                label:
                    "Métro 2033 — Objet"
            }
        );


        /*
         * Fiche Item dédiée aux Talents.
         */
        foundry.documents.collections.Items.registerSheet(
            "metro-2033-yze",
            TalentSheet,
            {
                types: [
                    "talent"
                ],

                makeDefault: true,

                label:
                    "Métro 2033 — Talent"
            }
        );


        /*
         * Fiche Item dédiée aux Factions.
         *
         * Foundry VTT v14 :
         * enregistrement via DocumentSheetConfig.
         */
        foundry.applications.apps.DocumentSheetConfig.registerSheet(
            Item,
            "metro-2033-yze",
            FactionSheet,
            {
                types: [
                    "faction"
                ],

                makeDefault: true,

                label:
                    "Métro 2033 — Faction"
            }
        );


        /*
         * Fiche Item dédiée aux Stations.
         *
         * Foundry VTT v14 :
         * enregistrement via DocumentSheetConfig.
         */
        foundry.applications.apps.DocumentSheetConfig.registerSheet(
            Item,
            "metro-2033-yze",
            StationSheet,
            {
                types: [
                    "station"
                ],

                makeDefault: true,

                label:
                    "Métro 2033 — Station"
            }
        );


        CONFIG.Metro2033 =
            Object.freeze({
                skillDefinitions:
                    SKILL_DEFINITIONS,

                seedEquipmentCompendium,

                seedWeaponModCompendium,

                seedTalentArchetypeCompendium,

                seedCreatureTraitCompendium,

                seedBestiaryCompendium,

                seedFactionCompendium,

                seedFactionNpcCompendium,

                seedStationCompendium,

                seedStationNpcCompendium,

                seedCriticalInjuryCompendium,

                seedPsychologicalTraumaCompendium,

                seedCriticalInjuryRollTable,

                seedPsychologicalTraumaRollTable,

                seedVehicleCompendium,

                seedVehicleBreakdownRollTable,

                openCharacterCreationWizard,

                openNpcCreationWizard,

                openTerrorRollDialog,

                openCoupDeGraceDialog,

                openAsphyxiationRollDialog,

                openFireRollDialog,

                openPoisonRollDialog,

                openIllnessRollDialog,

                trackedStatusEffects:
                    METRO_TRACKED_STATUS_EFFECTS
            });


        console.log(
            "Métro 2033 | Actor class :",
            CONFIG.Actor.documentClass.name
        );

        console.log(
            "Métro 2033 | Combat class :",
            CONFIG.Combat.documentClass.name
        );


        /*
         * Fiche Item dédiée aux Archétypes.
         *
         * Foundry VTT v14 :
         * enregistrement via DocumentSheetConfig.
         */
        foundry.applications.apps.DocumentSheetConfig.registerSheet(
            Item,
            "metro-2033-yze",
            ArchetypeSheet,
            {
                types: [
                    "archetype"
                ],

                makeDefault: true,

                label:
                    "Métro 2033 — Archétype"
            }
        );

    }
);


Hooks.once("ready",
    () => {

        registerInitializationHooks();

        registerCombatHooks();

        registerMeleeAttackChatHooks();

        registerMetroChatScrollHooks();        

        registerYZERollChatHooks();

        registerItemChatHooks();

        registerInitiativePreparationHooks();

        registerCharacterCreationHooks();

        registerNpcCreationHooks();

        registerTerrorRollHooks();

        registerTerrorRollChatHooks();

        registerCoupDeGraceHooks();

        registerCoupDeGraceChatHooks();

        registerGMMessageRelay();

        registerMeleeWorkflowRelay();

        registerComposureHooks();
        registerBrokenAttributeHooks();
        registerSettingsLogoHook();
        registerMetroFonts();

        registerTalentNameHooks();

        registerAsphyxiationHooks();

        registerAsphyxiationRollChatHooks();

        registerFireHooks();

        registerFireRollChatHooks();

        registerPoisonHooks();

        registerPoisonRollChatHooks();

        registerIllnessHooks();

        registerIllnessRollChatHooks();

    }
);