/**
 * Transforme les entrées des catalogues de bestiaire
 * (creature-catalog.mjs, bestiary-npc-catalog.mjs) en données
 * d'Actor Foundry conformes aux DataModels du système
 * (creature, npc), avec leurs attaques/armures/Talents comme
 * Items embarqués.
 *
 * Fonctions pures : aucune dépendance à `foundry.*`.
 */

import { GENERAL_TALENTS, ARCHETYPE_TALENTS }
    from "./talent-archetype-catalog.mjs";

import { composeSpecialistName }
    from "../../domain/rules/weapon-talent-type.mjs";

import { extractCreatureTraits, slugifyTraitName }
    from "./creature-traits.mjs";

export const DEFAULT_ACTOR_IMAGE = "icons/svg/mystery-man.svg";
export const DEFAULT_ITEM_IMAGE = "icons/svg/item-bag.svg";

const SEED_FLAG_SCOPE = "metro-2033-yze";
const SEED_FLAG_KEY = "seedKey";


function seedFlags(key) {
    return {
        [SEED_FLAG_SCOPE]: {
            [SEED_FLAG_KEY]: key
        }
    };
}


function isRangedAttack(name) {
    return /portée|TIR/i.test(name);
}


/**
 * Construit un Item `weapon` embarqué à partir d'une attaque
 * de créature/PNJ (cf. `attack()` dans les catalogues).
 */
function buildAttackWeaponItemData(attackEntry) {

    const ranged = isRangedAttack(attackEntry.name);

    return {
        name: attackEntry.name,
        type: "weapon",
        img: DEFAULT_ITEM_IMAGE,
        system: {
            category: ranged ? "ranged" : "melee",
            weaponCategory: "",
            grip: "none",
            equipped: true,
            bonus: {
                current: attackEntry.bonus ?? 0,
                max: attackEntry.bonus ?? 0
            },
            repairable: false,
            damage: attackEntry.damage ?? 0,
            reliability: 0,
            range: ranged ? "short" : "contact",
            usesAmmunition: false,
            ammunitionReferenceUuid: "",
            ammunitionType: "",
            allowsMilitaryAmmunition: false,
            magazine: {
                loaded: false,
                ammoType: "",
                consumptionMode: "container",
                containerType: "magazine",
                quality: "standard",
                protectionReduction: 0,
                ignoresResilience: false,
                sourceAmmoItemId: ""
            },
            weight: 0,
            automatic: false,
            heavy: false,
            explosive: false,
            explosionPower: 0,
            price: { buy: 0, sell: 0 },
            description: "",
            special: attackEntry.special ?? "",
            gmNotes: "",
            venom: {
                active: Boolean(attackEntry.venom),
                effectType: attackEntry.venom?.effectType ?? "lethal",
                toxicity: attackEntry.venom?.toxicity ?? 3,
                sourceLabel: attackEntry.venom ? attackEntry.name : ""
            }
        }
    };
}


/**
 * Item `talent` représentant un trait de Créature (texte du livre
 * des Monstres) : listé sur la fiche, rappelé dans le Chat.
 */
function buildCreatureTraitItemData(trait) {

    return {
        name: trait.name,
        type: "talent",
        img: DEFAULT_ITEM_IMAGE,
        system: {
            key: `creature-trait-${slugifyTraitName(trait.name)}`,
            maxLevel: 1,
            level: 1,
            hasAdvancedLevel: false,
            archetypeId: "",
            description: "",
            effect: trait.effect,
            gmNotes: "",
            configuration: {
                weaponCategory: "", weaponType: "", skill: "", attribute: "", custom: ""
            }
        }
    };
}


/**
 * Items « talent » des traits de Créature, dédupliqués par nom, pour
 * le compendium dédié (distinct des Talents et Archétypes humains).
 */
export function buildCreatureTraitCompendiumItems(creatures) {

    const bySlug = new Map();

    for (const entry of creatures ?? []) {

        for (const trait of extractCreatureTraits(entry.special).traits) {

            const slug = slugifyTraitName(trait.name);

            if (bySlug.has(slug)) continue;

            const item = buildCreatureTraitItemData(trait);

            item.flags = {
                [SEED_FLAG_SCOPE]: {
                    [SEED_FLAG_KEY]: `creature-trait:${slug}`,
                    creatureTrait: true
                }
            };

            bySlug.set(slug, item);
        }
    }

    return [...bySlug.values()];
}



/**
 * Actor `creature`.
 */
export function buildCreatureActorData(entry) {

    const { traits, remainder } =
        extractCreatureTraits(entry.special);

    return {
        name: entry.name,
        type: "creature",
        img: DEFAULT_ACTOR_IMAGE,
        flags: seedFlags(entry.key),
        system: {
            identity: {
                species: entry.species ?? "",
                description: entry.page ? `<p>Source : livre des Monstres, p.${entry.page}.</p>` : ""
            },
            attributes: entry.attributes,
            skills: {
                repair: 0, closeCombat: 0, endurance: 0, stealth: 0, reaction: 0,
                shooting: 0, comprehension: 0, observation: 0, survival: 0,
                analysis: 0, manipulation: 0, medicine: 0,
                ...entry.skills
            },
            conditions: {
                hungry: false, dehydrated: false, exhausted: false, frozen: false, prone: false
            },
            naturalProtection: entry.naturalProtection,
            special: remainder,
            gmNotes: ""
        },
        items: [
            ...(entry.weapons ?? []).map(buildAttackWeaponItemData),
            ...traits.map(buildCreatureTraitItemData)
        ]
    };
}


function resolveTalentReference(name) {

    const found =
        GENERAL_TALENTS.find((talent) => talent.name === name)
        ?? ARCHETYPE_TALENTS.find((talent) => talent.name === name);

    return {
        mechanicalKey: found?.mechanicalKey ?? name,
        maxLevel: found?.maxLevel ?? 1,
        archetypeId: found?.archetypeId ?? "",
        effect: found?.effect ?? ""
    };
}


/**
 * Item `talent` minimal référençant un Talent déjà défini dans
 * le catalogue Talents/Archétypes (même clé mécanique et même
 * texte d'effet, pour rester cohérent si consulté isolément).
 */
function buildTalentReferenceItemData(talentRef) {

    const resolved = resolveTalentReference(talentRef.name);

    return {
        name: composeSpecialistName(
            talentRef.name,
            talentRef.weaponType
        ),
        type: "talent",
        img: DEFAULT_ITEM_IMAGE,
        system: {
            key: resolved.mechanicalKey,
            maxLevel: resolved.maxLevel,
            level: talentRef.advanced ? Math.min(2, resolved.maxLevel) : 1,
            hasAdvancedLevel: resolved.maxLevel >= 2,
            archetypeId: resolved.archetypeId,
            description: "",
            effect: resolved.effect,
            gmNotes: "",
            configuration: {
                weaponCategory: "", weaponType: talentRef.weaponType ?? "", skill: "", attribute: "", custom: ""
            }
        }
    };
}


function buildArmorItemData(armorEntry) {

    if (!armorEntry) {
        return null;
    }

    return {
        name: armorEntry.name,
        type: "armor",
        img: DEFAULT_ITEM_IMAGE,
        system: {
            category: "body",
            equipped: true,
            protection: {
                current: armorEntry.protection ?? 0,
                max: armorEntry.protection ?? 0
            },
            resilience: armorEntry.resilience ?? false,
            resilienceLost: false,
            weight: 0,
            modifiers: { agility: 0, observation: 0 },
            price: { buy: 0, sell: 0 },
            description: "",
            gmNotes: "",
            special: ""
        }
    };
}


/**
 * Actor `npc`.
 */
export function buildNpcActorData(entry) {

    const items = [
        ...(entry.weapons ?? []).map(buildAttackWeaponItemData),
        ...(entry.talents ?? []).map(buildTalentReferenceItemData)
    ];

    const armorItem = buildArmorItemData(entry.armor);
    if (armorItem) {
        items.push(armorItem);
    }

    return {
        name: entry.name,
        type: "npc",
        img: DEFAULT_ACTOR_IMAGE,
        flags: seedFlags(entry.key),
        system: {
            identity: {
                role: entry.role ?? "",
                description: entry.page ? `<p>Source : livre des Monstres, p.${entry.page}.</p>` : ""
            },
            attributes: entry.attributes,
            skills: {
                repair: 0, closeCombat: 0, endurance: 0, stealth: 0, reaction: 0,
                shooting: 0, comprehension: 0, observation: 0, survival: 0,
                analysis: 0, manipulation: 0, medicine: 0,
                ...entry.skills
            },
            special: entry.special ?? "",
            gmNotes: ""
        },
        items
    };
}


/**
 * Construit la liste complète des données d'Actor du bestiaire.
 *
 * @param {object} catalog
 * @param {object[]} catalog.creatures
 * @param {object[]} catalog.npcs
 */
export function buildAllBestiaryActorsData(catalog) {

    const { creatures = [], npcs = [] } = catalog;

    return [
        ...creatures.map(buildCreatureActorData),
        ...npcs.map(buildNpcActorData)
    ];
}
