/**
 * Catalogue d'équipement extrait du livre de règles
 * (Chapitre 8 — Les règles, tables pages 208-218).
 *
 * Ce fichier est une donnée pure : aucune dépendance Foundry.
 * Chaque entrée reprend fidèlement les valeurs du livre. Là où
 * le livre ne tranche pas (identifiants de munitions, images,
 * quelques poids de vestiges...), un choix par défaut a été fait
 * et signalé dans la documentation associée (Bible + réponse au
 * MJ) plutôt que dans ce fichier — à corriger librement depuis
 * les fiches Item une fois importées.
 *
 * `key` est un identifiant technique stable, utilisé par le
 * script d'import pour éviter les doublons lors des ré-imports
 * (flags.metro2033Yze.seedKey).
 */


// ============================================================
// ARMES DE MÊLÉE
// ============================================================

export const MELEE_WEAPONS = [
    { key: "melee-mains-nues", name: "Mains nues", weaponCategory: "unarmed", grip: "none", bonusMax: 0, damage: 1, reliability: 0, range: "contact", weight: 0 },
    { key: "melee-objet-contondant", name: "Objet contondant", weaponCategory: "bluntWeapon", grip: "1M", bonusMax: 1, damage: 1, reliability: 0, range: "contact", weight: 1 },
    { key: "melee-couteau", name: "Couteau", weaponCategory: "bladedWeapon", grip: "1M", bonusMax: 1, damage: 2, reliability: 2, range: "contact", weight: 0.5 },
    { key: "melee-hachette", name: "Hachette", weaponCategory: "bladedWeapon", grip: "1M", bonusMax: 1, damage: 2, reliability: 3, range: "contact", weight: 0.5 },
    { key: "melee-hache", name: "Hache", weaponCategory: "bladedWeapon", grip: "1M/2M", bonusMax: 2, damage: 2, reliability: 3, range: "contact", weight: 1 }
];


// ============================================================
// ARMES À DISTANCE
//
// Note (décision à vérifier) : le livre indique un Bonus de +5
// pour le Lance-roquette et le Mortier, mais le schéma actuel de
// WeaponDataModel plafonne bonus.max à 3. La valeur est donc
// bornée à 3 ici, et la valeur réelle du livre reportée dans
// `special` pour ne perdre aucune information.
// ============================================================

export const RANGED_WEAPONS = [
    { key: "ranged-pierre", name: "Pierre", weaponCategory: "", grip: "1M", bonusMax: 0, damage: 1, reliability: 0, range: "medium", weight: 0.25, usesAmmunition: false },

    { key: "ranged-grenade", name: "Grenade", weaponCategory: "explosiveWeapon", grip: "1M", bonusMax: 0, damage: 6, reliability: 0, range: "medium", weight: 0.25, explosive: true, explosionPower: 6, usesAmmunition: false, special: "Puissance 6. Se lance avec un jet de TIR ; une réussite place la grenade à courte portée de la cible." },

    { key: "ranged-arc", name: "Arc", weaponCategory: "", grip: "2M", bonusMax: 1, damage: 1, reliability: 1, range: "long", weight: 1, usesAmmunition: true, ammunitionType: "arrow" },

    { key: "ranged-arbalete", name: "Arbalète", weaponCategory: "", grip: "2M", bonusMax: 2, damage: 1, reliability: 1, range: "long", weight: 1, usesAmmunition: true, ammunitionType: "bolt" },

    { key: "ranged-pistolet", name: "Pistolet", weaponCategory: "pistol", grip: "1M", bonusMax: 1, damage: 2, reliability: 1, range: "medium", weight: 0.5, usesAmmunition: true, ammunitionType: "pistolStandard", allowsMilitaryAmmunition: true },

    { key: "ranged-revolver", name: "Revolver", weaponCategory: "revolver", grip: "1M", bonusMax: 1, damage: 2, reliability: 2, range: "medium", weight: 0.5, usesAmmunition: true, ammunitionType: "revolverStandard", allowsMilitaryAmmunition: true },

    { key: "ranged-pistolet-lourd", name: "Pistolet lourd", weaponCategory: "pistol", grip: "1M/2M", bonusMax: 2, damage: 2, reliability: 2, range: "medium", weight: 0.5, usesAmmunition: true, ammunitionType: "pistolStandard", allowsMilitaryAmmunition: true },

    { key: "ranged-revolver-lourd", name: "Revolver lourd", weaponCategory: "revolver", grip: "1M", bonusMax: 1, damage: 2, reliability: 3, range: "medium", weight: 0.5, usesAmmunition: true, ammunitionType: "revolverStandard", allowsMilitaryAmmunition: true },

    { key: "ranged-pistolet-mitrailleur", name: "Pistolet mitrailleur", weaponCategory: "submachineGun", grip: "1M/2M", bonusMax: 1, damage: 2, reliability: 1, range: "medium", weight: 0.5, automatic: true, usesAmmunition: true, ammunitionType: "submachineGunStandard", allowsMilitaryAmmunition: true },

    { key: "ranged-fusil", name: "Fusil", weaponCategory: "rifle", grip: "2M", bonusMax: 2, damage: 2, reliability: 2, range: "long", weight: 1, usesAmmunition: true, ammunitionType: "rifleStandard", allowsMilitaryAmmunition: true },

    { key: "ranged-fusil-a-pompe", name: "Fusil à pompe", weaponCategory: "shotgun", grip: "2M", bonusMax: 2, damage: 3, reliability: 3, range: "short", weight: 1, usesAmmunition: true, ammunitionType: "shotgunShell", allowsMilitaryAmmunition: false },

    { key: "ranged-fusil-assaut", name: "Fusil d'assaut", weaponCategory: "assaultRifle", grip: "2M", bonusMax: 2, damage: 2, reliability: 2, range: "long", weight: 1, automatic: true, usesAmmunition: true, ammunitionType: "assaultRifleStandard", allowsMilitaryAmmunition: true },

    { key: "ranged-mitrailleuse-lourde", name: "Mitrailleuse lourde", weaponCategory: "heavyMachineGun", grip: "2M", bonusMax: 2, damage: 4, reliability: 2, range: "long", weight: 2, automatic: true, heavy: true, usesAmmunition: true, ammunitionType: "heavyMachineGunBelt", allowsMilitaryAmmunition: false, special: "Arme lourde devant être montée sur trépied (ou sur un véhicule). Poids de 4 avec trépied." },

    { key: "ranged-lance-roquette", name: "Lance-roquette", weaponCategory: "rocketLauncher", grip: "2M", bonusMax: 3, damage: 6, reliability: 0, range: "long", weight: 2, heavy: true, explosive: true, explosionPower: 6, usesAmmunition: true, ammunitionType: "rocket", allowsMilitaryAmmunition: false, special: "Bonus livre : +5 (borné à +3 par le schéma actuel — à vérifier). Nécessite une action longue pour être rechargée. Bonus de +1 pour l'application d'une affliction (l'arme n'est pas immédiatement mise hors d'usage)." },

    { key: "ranged-mortier", name: "Mortier", weaponCategory: "", grip: "none", bonusMax: 3, damage: 5, reliability: 0, range: "extreme", weight: 2, heavy: true, explosive: true, explosionPower: 5, usesAmmunition: true, ammunitionType: "mortarShell", allowsMilitaryAmmunition: false, special: "Bonus livre : +5 (borné à +3 par le schéma actuel — à vérifier). Nécessite une action longue pour être rechargée. Bonus de +1 pour l'application d'une affliction (l'arme n'est pas immédiatement mise hors d'usage)." },

    { key: "ranged-lance-flammes", name: "Lance-flammes", weaponCategory: "incendiaryWeapon", grip: "2M", bonusMax: 0, damage: 0, reliability: 0, range: "medium", weight: 1, heavy: true, usesAmmunition: true, ammunitionType: "flamethrowerFuel", allowsMilitaryAmmunition: false, special: "Prise/portée non chiffrées telles quelles dans le livre (fonctionnement narratif : feu d'Intensité 10, -2/round, utilisable au contact avec risque pour le porteur) — grip/portée choisis par défaut, à vérifier. Action toujours lente. Explose sur la moindre affliction (le porteur subit alors un feu d'Intensité 10)." }
];


// ============================================================
// PROTECTIONS
// ============================================================

export const ARMORS = [
    { key: "armor-veste-renforcee", name: "Veste renforcée", category: "body", protectionMax: 3, resilience: false, weight: 0 },
    { key: "armor-gilet-pare-balles", name: "Gilet pare-balles", category: "body", protectionMax: 4, resilience: true, weight: 0 },
    { key: "armor-tenue-antiemeute", name: "Tenue antiémeute", category: "body", protectionMax: 6, resilience: true, weight: 1, modifiers: { agility: -1 }, special: "Impose un modificateur de –1 sur les jets liés à l'AGILITÉ. Seule protection comptant dans l'équipement transporté." },
    { key: "armor-casque-leger", name: "Casque léger", category: "helmet", protectionMax: 2, resilience: false, weight: 0 },
    { key: "armor-casque-integral", name: "Casque intégral", category: "helmet", protectionMax: 3, resilience: false, weight: 0, modifiers: { observation: -1 }, special: "Impose un modificateur de –1 sur les jets d'OBSERVATION." }
];


// ============================================================
// MUNITIONS
//
// Note (décision à vérifier) : le livre ne donne pas de calibre
// précis par arme dans ce chapitre. Les identifiants ci-dessous
// sont génériques par catégorie d'arme (un identifiant par type
// d'arme, pas par calibre réel). Les variantes "qualité militaire"
// ne sont pas générées dans cette première passe (rares dans le
// livre, absentes pour fusils à pompe/armes lourdes) — à ajouter
// plus tard si besoin, en dupliquant l'entrée standard avec
// quality:"military".
// ============================================================

export const AMMUNITION = [
    { key: "ammo-arrow", name: "Flèches (x10)", ammoType: "arrow", containerType: "arrow", consumptionMode: "unit", quantity: 10, compatibleWeaponTypes: [], weight: 0.5 },
    { key: "ammo-bolt", name: "Carreaux (x10)", ammoType: "bolt", containerType: "bolt", consumptionMode: "unit", quantity: 10, compatibleWeaponTypes: [], weight: 0.5 },
    { key: "ammo-pistol-standard", name: "Chargeur de munitions — Pistolet", ammoType: "pistolStandard", containerType: "magazine", consumptionMode: "container", quantity: 1, quality: "standard", compatibleWeaponTypes: ["pistol"], weight: 0.25 },
    { key: "ammo-pistol-military", name: "Chargeur de munitions de qualité militaire — Pistolet", ammoType: "pistolStandard", containerType: "magazine", consumptionMode: "container", quantity: 1, quality: "military", protectionReduction: 2, ignoresResilience: true, compatibleWeaponTypes: ["pistol"], weight: 0.25, special: "Munitions rares (« poulettes »). Réduit de 2 la Protection totale (armure + casque) de la cible et annule sa Résilience. Un seul chargeur à la fois, en général." },
    { key: "ammo-revolver-standard", name: "Munitions — Revolver", ammoType: "revolverStandard", containerType: "cylinder", consumptionMode: "container", quantity: 1, quality: "standard", compatibleWeaponTypes: ["revolver"], weight: 0.25 },
    { key: "ammo-revolver-military", name: "Munitions de qualité militaire — Revolver", ammoType: "revolverStandard", containerType: "cylinder", consumptionMode: "container", quantity: 1, quality: "military", protectionReduction: 2, ignoresResilience: true, compatibleWeaponTypes: ["revolver"], weight: 0.25, special: "Munitions rares (« poulettes »). Réduit de 2 la Protection totale (armure + casque) de la cible et annule sa Résilience. Un seul chargeur à la fois, en général." },
    { key: "ammo-submachine-gun-standard", name: "Chargeur de munitions — Pistolet mitrailleur", ammoType: "submachineGunStandard", containerType: "magazine", consumptionMode: "container", quantity: 1, quality: "standard", compatibleWeaponTypes: ["submachineGun"], weight: 0.25 },
    { key: "ammo-submachine-gun-military", name: "Chargeur de munitions de qualité militaire — Pistolet mitrailleur", ammoType: "submachineGunStandard", containerType: "magazine", consumptionMode: "container", quantity: 1, quality: "military", protectionReduction: 2, ignoresResilience: true, compatibleWeaponTypes: ["submachineGun"], weight: 0.25, special: "Munitions rares (« poulettes »). Réduit de 2 la Protection totale (armure + casque) de la cible et annule sa Résilience. Un seul chargeur à la fois, en général." },
    { key: "ammo-rifle-standard", name: "Chargeur de munitions — Fusil", ammoType: "rifleStandard", containerType: "magazine", consumptionMode: "container", quantity: 1, quality: "standard", compatibleWeaponTypes: ["rifle"], weight: 0.25 },
    { key: "ammo-rifle-military", name: "Chargeur de munitions de qualité militaire — Fusil", ammoType: "rifleStandard", containerType: "magazine", consumptionMode: "container", quantity: 1, quality: "military", protectionReduction: 2, ignoresResilience: true, compatibleWeaponTypes: ["rifle"], weight: 0.25, special: "Munitions rares (« poulettes »). Réduit de 2 la Protection totale (armure + casque) de la cible et annule sa Résilience. Un seul chargeur à la fois, en général." },
    { key: "ammo-assault-rifle-standard", name: "Chargeur de munitions — Fusil d'assaut", ammoType: "assaultRifleStandard", containerType: "magazine", consumptionMode: "container", quantity: 1, quality: "standard", compatibleWeaponTypes: ["assaultRifle"], weight: 0.25 },
    { key: "ammo-assault-rifle-military", name: "Chargeur de munitions de qualité militaire — Fusil d'assaut", ammoType: "assaultRifleStandard", containerType: "magazine", consumptionMode: "container", quantity: 1, quality: "military", protectionReduction: 2, ignoresResilience: true, compatibleWeaponTypes: ["assaultRifle"], weight: 0.25, special: "Munitions rares (« poulettes »). Réduit de 2 la Protection totale (armure + casque) de la cible et annule sa Résilience. Un seul chargeur à la fois, en général." },
    { key: "ammo-shotgun-shell", name: "Cartouches — Fusil à pompe", ammoType: "shotgunShell", containerType: "shell", consumptionMode: "unit", quantity: 8, compatibleWeaponTypes: ["shotgun"], weight: 0.25, special: "Il n'existe pas de munitions de qualité militaire pour le fusil à pompe." },
    { key: "ammo-heavy-machine-gun-belt", name: "Bande de munitions — Mitrailleuse lourde", ammoType: "heavyMachineGunBelt", containerType: "belt", consumptionMode: "container", quantity: 1, compatibleWeaponTypes: ["heavyMachineGun"], weight: 1, special: "Il n'existe pas de munitions de qualité militaire pour les armes lourdes." },
    { key: "ammo-rocket", name: "Roquette", ammoType: "rocket", containerType: "shell", consumptionMode: "unit", quantity: 1, compatibleWeaponTypes: ["rocketLauncher"], weight: 1, special: "Puissance 6 (8 contre structures/véhicules). Tir direct sur structure/véhicule : 3 dégâts automatiques au lieu de 2." },
    { key: "ammo-mortar-shell", name: "Obus de mortier", ammoType: "mortarShell", containerType: "shell", consumptionMode: "unit", quantity: 1, compatibleWeaponTypes: [], weight: 0.5, special: "Puissance 5 (7 contre structures/véhicules). Tir direct sur structure/véhicule : 3 dégâts automatiques au lieu de 2." },
    { key: "ammo-flamethrower-fuel", name: "Réservoir pour lance-flammes", ammoType: "flamethrowerFuel", containerType: "magazine", consumptionMode: "container", quantity: 1, compatibleWeaponTypes: [], weight: 1, special: "Alimente le Lance-flammes (feu d'Intensité 10, diminuant de 2 par round suivant)." }
];


// ============================================================
// AMÉLIORATIONS D'ARMES
//
// Déplacées vers le type Item dédié `weaponMod` (voir
// src/data/seed/weapon-mod-catalog.mjs), qui porte une vraie
// mécanique d'attachement à une arme précise et, le cas échéant,
// de consommation de ressource — contrairement au type `equipment`
// générique utilisé ici dans une première passe.
// ============================================================


// ============================================================
// CONSOMMABLES — explosifs posés / objets d'équipement divers
// ============================================================

export const CONSUMABLES = [
    { key: "cons-grenade-etourdissante", name: "Grenade étourdissante", quantity: 1, unitLabel: "grenades", weight: 0.25, special: "Puissance 5, dégâts à l'ESPRIT (aucun traumatisme si l'Esprit est déjà Brisé). Se lance comme une grenade classique (jet de TIR). 1 dégât automatique au contact. ≥2 dégâts Esprit subis : modificateur –2 sur tous les jets de compétence jusqu'à la fin du round suivant." },
    { key: "cons-charge-lourde", name: "Charge lourde", quantity: 1, unitLabel: "charges", weight: 1, special: "Puissance 7 (10 contre structures/véhicules). Doit être posée ; retardateur ou déclenchement à distance. Affecte toutes les personnes jusqu'à portée moyenne." },
    { key: "cons-mine-antipersonnel", name: "Mine antipersonnel", quantity: 1, unitLabel: "mines", weight: 1, special: "Puissance 6. Ignore les protections personnelles sauf la tenue antiémeute (1 dégât automatique à la VIGUEUR au contact). Doit être posée ; se déclenche au contact (jet d'OBSERVATION pour l'éviter si recherchée). Véhicule : jet de RÉACTION –2 (–1 si blindé) sous peine de tonneau." },
    { key: "cons-trousse-de-soins", name: "Trousse de soins", quantity: 1, unitLabel: "trousses", weight: 1 },
    { key: "cons-masque-a-gaz", name: "Masque à gaz", quantity: 1, unitLabel: "masques", weight: 0.5, special: "Inefficace contre la radioactivité ; protège des zones enfumées ou saturées par des gaz toxiques. Filtre à changer (jet de réserve) après exposition prolongée." },
    { key: "cons-combinaison-antiradiation", name: "Combinaison antiradiation", quantity: 1, unitLabel: "combinaisons", weight: 0, special: "Réduit d'un cran le niveau de radioactivité d'une zone. Incompatible avec un casque ou une tenue antiémeute. Protège aussi des maladies et des fumées/gaz toxiques. Filtres à changer régulièrement." },
    { key: "cons-lampe-torche", name: "Lampe torche", quantity: 1, unitLabel: "lampes", weight: 0.5 },
    { key: "cons-jumelles", name: "Paire de jumelles", quantity: 1, unitLabel: "paires", weight: 0.5 },
    { key: "cons-boite-a-outils", name: "Boîte à outils", quantity: 1, unitLabel: "boîtes", weight: 2 },
    { key: "cons-talkie-walkie", name: "Talkie-walkie", quantity: 1, unitLabel: "appareils", weight: 0.5 },
    { key: "cons-menottes", name: "Paire de menottes", quantity: 1, unitLabel: "paires", weight: 0.25 }
];


// ============================================================
// VESTIGES — objets de l'Ancien Monde (troc / narratif)
//
// Le livre ne donne ni poids ni prix chiffré pour ces objets :
// tous sont importés avec un poids par défaut de 0 (Minuscule)
// et un prix de 0 (à négocier librement à la table), ce qui est
// la convention la plus sûre à corriger a posteriori.
// ============================================================

const RELIC_NOTE =
    "Vestige de l'Ancien Monde — valeur de troc laissée à l'appréciation du MJ.";

const RELIC_NAMES = [
    "Accessoire de sport (ballon, raquette...)",
    "Appareil de prise de tension",
    "Bande dessinée",
    "Boîte à musique",
    "Boîte de crayons de couleur",
    "Boîte de Lego",
    "Boîte de trombones",
    "Boîte Palekh",
    "Bouteille de Chanel n°5",
    "Bouteille de Kvas",
    "Bouteille de vodka",
    "Café",
    "Cartes à jouer",
    "Carton plein de robes de Barbie",
    "Casque de Dark Vador avec modificateur de voix",
    "Caviar",
    "Chapeau ushanka",
    "Chaussures de sport neuves",
    "Collection de deux cents fèves",
    "Instrument de musique",
    "iPhone avec musique",
    "iPhone avec photos",
    "Jouet neuf",
    "Kombucha",
    "Livre de collection",
    "Livre pour enfant",
    "Livre scolaire",
    "Lot de chaussettes neuves",
    "Magazine sur les poneys",
    "Maillot du FK Spartak Moscou",
    "Matriochka",
    "Mug à l'effigie de Poutine sur son ours",
    "Paquet de cigarettes Jin Ling",
    "Paquet de thé",
    "Peluche Tchebourachka",
    "Playmobil en parfait état",
    "Poupée neuve",
    "Produits de beauté",
    "Pain pryanik",
    "Rame de papier imprimante sous plastique",
    "Rasoir électrique à piles",
    "Roman",
    "Sachet de décorations de Halloween",
    "Samovar",
    "Savonnette",
    "Souvenir de l'ère soviétique",
    "Statuette de Masha & Michka",
    "Tableau (œuvre d'art)",
    "Trois paquets de vignettes de foot",
    "Ukulélé avec deux cordes",
    "Vêtement de luxe",
    "Vêtement en cuir"
];

function slugify(name) {
    return name
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export const RELICS = RELIC_NAMES.map(
    (name) => ({
        key: `relic-${slugify(name)}`,
        name,
        quantity: 1,
        unitLabel: "objets",
        weight: 0,
        special: RELIC_NOTE
    })
);
