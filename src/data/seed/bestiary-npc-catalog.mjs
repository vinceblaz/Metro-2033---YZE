/**
 * PNJ notables du bestiaire « MET-06 Monstres v3 » : bien que
 * cités dans un chapitre de créatures, Le Brahmane, La Ksatriya
 * (chapitre « Les errants », p.124) et le Kot Baïoun (p.133)
 * utilisent l'échelle humaine (Attributs/Compétences 0-5) et
 * possèdent des Talents — ils sont donc catalogués comme `npc`
 * (NpcDataModel), pas comme `creature`, conformément au principe
 * déjà acté du projet (distinction technique, pas narrative).
 *
 * Les Talents cités sont référencés par leur nom (voir
 * `talent-archetype-catalog.mjs`) ; seul le nom est embarqué
 * comme Item Talent minimal ici (sans texte d'effet dupliqué),
 * le MJ pouvant glisser le Talent complet depuis le compendium
 * Talents/Archétypes s'il souhaite le détail. Les Talents notés
 * « (S) » dans le livre sont au niveau Supérieur.
 */

function attribute(value) {
    return { value, max: value };
}

function attack(name, { bonus = 0, damage = 0, special = "" } = {}) {
    return { name, bonus, damage, special };
}

function talentRef(name, { advanced = false, weaponType = "" } = {}) {
    return { name, advanced, weaponType };
}


export const BESTIARY_NPCS = [

    {
        key: "npc-le-brahmane",
        name: "Le Brahmane",
        role: "Errant — figure spirituelle",
        page: 124,
        attributes: {
            vigor: attribute(2),
            agility: attribute(3),
            spirit: attribute(4),
            empathy: attribute(5)
        },
        skills: { closeCombat: 2, endurance: 3, stealth: 3, reaction: 2, shooting: 1, comprehension: 2, observation: 4, survival: 1, analysis: 4, manipulation: 4 },
        armor: { name: "Veste renforcée", protection: 3 },
        weapons: [
            attack("Couteau", { bonus: 1, damage: 2 }),
            attack("Pistolet léger", { bonus: 2, damage: 2 })
        ],
        talents: [
            talentRef("Compassion", { advanced: true }),
            talentRef("Hésitation", { advanced: true }),
            talentRef("Imperturbable"),
            talentRef("Maîtrise de soi")
        ],
        special: ""
    },

    {
        key: "npc-la-ksatriya",
        name: "La Ksatriya",
        role: "Errante — garde du corps du Brahmane",
        page: 124,
        attributes: {
            vigor: attribute(4),
            agility: attribute(4),
            spirit: attribute(4),
            empathy: attribute(3)
        },
        skills: { closeCombat: 2, endurance: 2, stealth: 3, reaction: 2, shooting: 4, comprehension: 1, observation: 2, survival: 2, analysis: 2, medicine: 1 },
        armor: { name: "Gilet pare-balles", protection: 4, resilience: true },
        weapons: [
            attack("Couteau", { bonus: 1, damage: 2 }),
            attack("Pistolet", { bonus: 1, damage: 2 }),
            attack("Grenade", { bonus: 0, damage: 6, special: "(E) — dégâts d'explosion." })
        ],
        talents: [
            talentRef("Garde du corps", { advanced: true }),
            talentRef("Nerfs d'acier"),
            talentRef("Réflexes éclair"),
            talentRef("Spécialiste en armement", { weaponType: "ranged" }),
            talentRef("Tenace", { advanced: true }),
            talentRef("Tireur instinctif")
        ],
        special: ""
    },

    {
        key: "npc-kot-baioun",
        name: "Kot Baïoun",
        role: "Errant — figure légendaire (chat mutant intelligent)",
        page: 133,
        attributes: {
            vigor: attribute(4),
            agility: attribute(5),
            spirit: attribute(4),
            empathy: attribute(5)
        },
        skills: { repair: 3, closeCombat: 2, endurance: 3, stealth: 5, reaction: 4, shooting: 1, comprehension: 3, observation: 4, survival: 4, analysis: 4, manipulation: 4, medicine: 1 },
        armor: { name: "Veste renforcée", protection: 3 },
        weapons: [
            attack("Couteau", { bonus: 1, damage: 2 }),
            attack("Pistolet lourd", { bonus: 2, damage: 2 })
        ],
        talents: [
            talentRef("Bête de somme"),
            talentRef("Chanceux"),
            talentRef("Compassion", { advanced: true }),
            talentRef("Esquive"),
            talentRef("Fantôme", { advanced: true }),
            talentRef("Imperturbable"),
            talentRef("Maîtrise de soi", { advanced: true }),
            talentRef("Sens du danger"),
            talentRef("Yeux de la nuit", { advanced: true })
        ],
        special: "<p>Figure légendaire du folklore slave, réinterprétée en chat mutant intelligent et loquace.</p>"
    }
];
