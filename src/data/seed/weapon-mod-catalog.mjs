/**
 * Catalogue des Améliorations d'arme extrait du livre de règles
 * (p.213-214, section « AMÉLIORATIONS D'ARMES »).
 *
 * Ce fichier est une donnée pure : aucune dépendance Foundry.
 * Chaque entrée reprend fidèlement le texte du livre (nom et
 * description, verbatim — ne jamais reformuler).
 *
 * `key` est un identifiant technique stable, utilisé par le
 * script d'import pour éviter les doublons lors des ré-imports
 * (flags.metro-2033-yze.seedKey).
 *
 * `resourceId` / `resourceAmount` :
 * d'après l'encart du livre p.214 « RÉSERVE D'ÉNERGIE ET
 * AMÉLIORATIONS D'ARME », seules 3 des 11 Améliorations d'arme
 * nécessitent une ressource (la réserve d'Énergie de l'Actor,
 * system.survival.energy) : le Pointeur laser, le Système de
 * vision nocturne et le Viseur point rouge. Les 8 autres ne
 * nécessitent aucune ressource (resourceId: "").
 *
 * `applicableTypes` :
 * les 11 entrées de ce catalogue sont toutes des Améliorations
 * d'ARME au sens strict du livre (p.213-214) : elles valent
 * toutes ["weapon"]. Le livre ne définit aucune Amélioration de
 * Protection — ne jamais en ajouter une ici.
 */

export const WEAPON_MODS = [

    {
        key: "improvement-bipied",
        name: "Amélioration d'arme — Bipied",
        description: "Se monte sur les fusils et fusils d'assaut. En position de surveillance, le porteur ne perd pas l'avantage lorsqu'il subit des dégâts (sauf attaque au contact).",
        weight: 0,
        resourceId: "",
        resourceAmount: 1,
        applicableTypes: ["weapon"]
    },

    {
        key: "improvement-crosse-pliable",
        name: "Amélioration d'arme — Crosse pliable",
        description: "Adaptable sur tous les types de fusils. Permet de dissimuler plus facilement l'arme (à la discrétion du MJ, malus possible de –1 au jet d'OBSERVATION d'un guetteur). Une fouille au corps révèle immédiatement l'arme.",
        weight: 0,
        resourceId: "",
        resourceAmount: 1,
        applicableTypes: ["weapon"]
    },

    {
        key: "improvement-frein-de-bouche",
        name: "Amélioration d'arme — Frein de bouche",
        description: "S'adapte aux fusils d'assaut et pistolets mitrailleurs. Lors d'un tir en rafale avec une arme automatique équipée, le tireur bénéficie d'un modificateur supplémentaire de +1.",
        weight: 0,
        resourceId: "",
        resourceAmount: 1,
        applicableTypes: ["weapon"]
    },

    {
        key: "improvement-lunette-x4",
        name: "Amélioration d'arme — Lunette de visée (x4)",
        description: "Se monte sur les fusils et fusils d'assaut. Permet de tirer jusqu'à portée extrême. Ne se cumule pas avec un viseur point rouge ; peut s'accompagner d'un pointeur laser (effet limité à portée longue).",
        weight: 0,
        resourceId: "",
        resourceAmount: 1,
        applicableTypes: ["weapon"]
    },

    {
        key: "improvement-lunette-x8",
        name: "Amélioration d'arme — Lunette de visée (x8) (Vestige)",
        description: "Vestige — non fabricable, doit être trouvée. Se monte sur les fusils et fusils d'assaut. Permet de tirer jusqu'à portée extrême et accorde +1 au jet de TIR après l'action « viser ». Ne se cumule pas avec un viseur point rouge ; peut s'accompagner d'un pointeur laser (effet jusqu'à portée extrême).",
        weight: 0,
        resourceId: "",
        resourceAmount: 1,
        applicableTypes: ["weapon"]
    },

    {
        key: "improvement-mire-amelioree",
        name: "Amélioration d'arme — Mire améliorée",
        description: "Se monte sur les revolvers et pistolets. Après l'action « viser », +1 supplémentaire au jet de TIR. Ne se cumule pas avec une lunette, un viseur point rouge ou un pointeur laser.",
        weight: 0,
        resourceId: "",
        resourceAmount: 1,
        applicableTypes: ["weapon"]
    },

    {
        key: "improvement-poignee-verticale",
        name: "Amélioration d'arme — Poignée verticale",
        description: "Améliore la stabilité des armes automatiques : permet de tirer en rafale jusqu'à longue portée, avec un modificateur de –1 au jet de TIR (en plus du modificateur de portée).",
        weight: 0,
        resourceId: "",
        resourceAmount: 1,
        applicableTypes: ["weapon"]
    },

    {
        key: "improvement-pointeur-laser",
        name: "Amélioration d'arme — Pointeur laser (Vestige)",
        description: "Vestige — non fabricable, doit être trouvé. S'adapte à tout pistolet, revolver, fusil ou fusil d'assaut. Permet de tirer en utilisant l'ESPRIT plutôt que l'AGILITÉ. Visible : la cible peut effectuer un jet d'OBSERVATION à –2 pour s'en apercevoir et réagir (se mettre à couvert).",
        weight: 0,
        resourceId: "energy",
        resourceAmount: 1,
        applicableTypes: ["weapon"]
    },

    {
        key: "improvement-silencieux",
        name: "Amélioration d'arme — Silencieux",
        description: "S'adapte aux pistolets, revolvers, fusils, fusils d'assaut et fusils à pompe. Rend le tir moins visible et moins bruyant (malus de –2 au jet d'OBSERVATION pour en déterminer l'origine). Détruit si l'arme tire en rafale.",
        weight: 0,
        resourceId: "",
        resourceAmount: 1,
        applicableTypes: ["weapon"]
    },

    {
        key: "improvement-vision-nocturne",
        name: "Amélioration d'arme — Système de vision nocturne (Vestige)",
        description: "Vestige — non fabricable, doit être trouvé. Se fixe sur une lunette. Ignore les modificateurs dus à la luminosité faible ou à l'obscurité, mais inflige un modificateur de –1 aux jets de TIR lorsqu'il est utilisé.",
        weight: 0,
        resourceId: "energy",
        resourceAmount: 1,
        applicableTypes: ["weapon"]
    },

    {
        key: "improvement-viseur-point-rouge",
        name: "Amélioration d'arme — Viseur point rouge (Vestige)",
        description: "Vestige — non fabricable, doit être trouvé. Se monte sur les fusils et fusils d'assaut. Le porteur ne perd pas l'avantage de visée s'il est blessé, et bénéficie de +1 supplémentaire après l'action « viser ». Ne se cumule ni avec une lunette de visée ni avec un pointeur laser.",
        weight: 0,
        resourceId: "energy",
        resourceAmount: 1,
        applicableTypes: ["weapon"]
    }

];
