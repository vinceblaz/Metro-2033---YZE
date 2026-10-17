/**
 * PNJ notables des Factions (chapitre 2 du livre de règles,
 * pages 14-65 : Polis, la Hanse, la Ligne Rouge, le Quatrième
 * Reich). Même structure que `bestiary-npc-catalog.mjs`,
 * réutilisable telle quelle par `buildNpcActorData()`
 * (cf. bestiary-actor-builder.mjs).
 *
 * Ces personnalités n'ont, dans le livre, ni arme ni protection
 * chiffrées (contrairement aux PNJ du bestiaire) : seuls
 * l'Archétype (repris en texte dans `role`, absent du schéma
 * NpcDataModel), les Attributs/Compétences, les Talents et un
 * paragraphe de Crainte sont fournis. `weapons` est donc
 * volontairement vide pour toutes ces entrées.
 *
 * Absente de ce catalogue : Natasha Kniazeva (Ligne Rouge, "camarade"
 * stalker légendaire). Le livre précise explicitement qu'elle
 * n'existe pas — c'est un outil de propagande, sans statistiques
 * ni existence réelle — elle n'est donc pas catalogée comme un
 * Actor PNJ (cf. faction-catalog.mjs, description de la Ligne
 * Rouge).
 *
 * Les Talents notés « (S) » dans le livre sont au niveau
 * Supérieur (mêmes conventions que bestiary-npc-catalog.mjs).
 */

function attribute(value) {
    return { value, max: value };
}

function talentRef(name, { advanced = false } = {}) {
    return { name, advanced };
}


export const FACTION_NPCS = [

    // ================= POLIS =================

    {
        key: "faction-npc-vitaly-misko",
        name: "Vitaly Misko",
        role: "Président du Conseil, chef de Polis — Archétype Stratège",
        page: 23,
        attributes: { vigor: attribute(2), agility: attribute(3), spirit: attribute(5), empathy: attribute(4) },
        skills: { endurance: 1, reaction: 1, shooting: 1, comprehension: 4, observation: 3, analysis: 2, manipulation: 2 },
        weapons: [],
        talents: [
            talentRef("Courage", { advanced: true }),
            talentRef("Inquisiteur", { advanced: true }),
            talentRef("Mental d'acier")
        ],
        special: "<p><strong>Crainte :</strong> Vitaly sait que, tôt ou tard, l'humanité finira par disparaître. Il est terrorisé à l'idée que trop de gens en viennent à la même conclusion que lui, car le désespoir peut transformer l'homme en bête en un clin d'œil.</p>"
    },

    {
        key: "faction-npc-le-doyen",
        name: "Le Doyen",
        role: "Membre le plus influent des brahmanes de Polis — Archétype Diplomate",
        page: 23,
        attributes: { vigor: attribute(2), agility: attribute(2), spirit: attribute(4), empathy: attribute(5) },
        skills: { comprehension: 3, observation: 3, analysis: 4, manipulation: 4 },
        weapons: [],
        talents: [
            talentRef("Compassion", { advanced: true }),
            talentRef("Hésitation"),
            talentRef("Imperturbable"),
            talentRef("Inquisiteur", { advanced: true })
        ],
        special: "<p><strong>Crainte :</strong> le Doyen nourrit tant d'espoir dans les découvertes que pourrait receler le Livre qu'il est proprement terrifié à l'idée que quelqu'un puisse le dénicher avant lui. Il fait donc garder le secret qui entoure l'ouvrage sacré avec une détermination zélée.</p>"
    },

    {
        key: "faction-npc-feodor-jouravliov",
        name: "Féodor Jouravliov",
        role: "Général en chef des ksatriyas de Polis — Archétype Stratège",
        page: 24,
        attributes: { vigor: attribute(3), agility: attribute(3), spirit: attribute(5), empathy: attribute(3) },
        skills: { closeCombat: 1, reaction: 1, shooting: 3, comprehension: 2, observation: 2, analysis: 2, manipulation: 3 },
        weapons: [],
        talents: [
            talentRef("Courage"),
            talentRef("Inquisiteur"),
            talentRef("Mental d'acier"),
            talentRef("Spécialiste en armement")
        ],
        special: "<p><strong>Crainte :</strong> dans un moment d'ivresse, Jouravliov s'est effondré devant Ivachov. Il a fondu en larmes et s'est mis à pleurer comme un gamin parce que tous ses proches lui manquaient. Il vit dans une peur terrible qu'Ivachov vende la mèche et qu'il devienne la risée de ses hommes.</p>"
    },

    {
        key: "faction-npc-commandant-ivachov",
        name: "Commandant Ivachov",
        role: "Responsable de la sécurité de l'ensemble des stations de Polis — Archétype Stratège",
        page: 25,
        attributes: { vigor: attribute(4), agility: attribute(3), spirit: attribute(4), empathy: attribute(3) },
        skills: { closeCombat: 2, endurance: 2, reaction: 1, shooting: 2, comprehension: 3, observation: 3, analysis: 1, manipulation: 2 },
        weapons: [],
        talents: [
            talentRef("Courage", { advanced: true }),
            talentRef("Discipline de groupe"),
            talentRef("Exaltation"),
            talentRef("Mental d'acier"),
            talentRef("Spécialiste en armement")
        ],
        special: "<p><strong>Crainte :</strong> Ivachov a assisté un soir au spectacle de son général ivre mort pleurant comme un enfant. Il a découvert à ce moment que le chef de l'ensemble des ksatriyas était un homme brisé ; il craint depuis que celui-ci ne craque au plus mauvais moment.</p>"
    },

    {
        key: "faction-npc-colonel-melnikov",
        name: "Colonel Melnikov (Melnik)",
        role: "Stalker légendaire, guide de Polis — Archétype Soldat",
        page: 25,
        attributes: { vigor: attribute(3), agility: attribute(4), spirit: attribute(4), empathy: attribute(4) },
        skills: { closeCombat: 1, endurance: 1, stealth: 4, reaction: 1, shooting: 2, comprehension: 1, observation: 1, survival: 3, manipulation: 1 },
        weapons: [],
        talents: [
            talentRef("Courage"),
            talentRef("Dur à cuire"),
            talentRef("Maîtrise de soi"),
            talentRef("Nerfs d'acier"),
            talentRef("Spécialiste en armement", { advanced: true }),
            talentRef("Téméraire"),
            talentRef("Tir rapide")
        ],
        special: "<p><strong>Crainte :</strong> Melnikov connaît la nature de ce qui pèse sur VDNKh. Il est très angoissé à l'idée que cette menace puisse se répandre dans le métro.</p>"
    },

    {
        key: "faction-npc-danila",
        name: "Danila",
        role: "Jeune brahmane de la Borovitskaya (Polis) — Archétype Diplomate",
        page: 26,
        attributes: { vigor: attribute(2), agility: attribute(3), spirit: attribute(4), empathy: attribute(5) },
        skills: { comprehension: 3, observation: 3, analysis: 4, manipulation: 2 },
        weapons: [],
        talents: [
            talentRef("Compassion", { advanced: true }),
            talentRef("Investigateur")
        ],
        special: "<p><strong>Crainte :</strong> Danila sait qu'il est trop bavard. Il a déjà laissé sa langue révéler trop de choses qu'il n'aurait pas dû partager et il vit aujourd'hui dans la peur que son indiscrétion finisse par être connue de ses pairs.</p>"
    },

    {
        key: "faction-npc-hunter",
        name: "Hunter",
        role: "Éclaireur énigmatique, proche de Polis — Archétype Éclaireur",
        page: 27,
        attributes: { vigor: attribute(3), agility: attribute(5), spirit: attribute(4), empathy: attribute(2) },
        skills: { endurance: 1, stealth: 4, reaction: 1, shooting: 2, comprehension: 1, observation: 3, survival: 2 },
        weapons: [],
        talents: [
            talentRef("Maître du terrain"),
            talentRef("Nerfs d'acier"),
            talentRef("Téméraire", { advanced: true }),
            talentRef("Vigilant", { advanced: true }),
            talentRef("Yeux de la nuit")
        ],
        special: "<p><strong>Crainte :</strong> Hunter est un homme d'action, il ne craint pas la mort, il craint peu de choses en réalité. Mais il espère mourir avant de devenir impotent, car, le jour où il ne pourra plus se déplacer pour une raison ou une autre, ce sera pour lui pire que la mort.</p>"
    },

    // ================= LA HANSE =================

    {
        key: "faction-npc-vladislav-zvorykine",
        name: "Vladislav Ilitch Zvorykine",
        role: "Président de la Hanse — Archétype Diplomate",
        page: 36,
        attributes: { vigor: attribute(2), agility: attribute(2), spirit: attribute(4), empathy: attribute(5) },
        skills: { repair: 1, stealth: 1, reaction: 1, shooting: 1, comprehension: 3, observation: 3, analysis: 3, manipulation: 3 },
        weapons: [],
        talents: [
            talentRef("Forte tête"),
            talentRef("Imperturbable"),
            talentRef("Investigateur", { advanced: true }),
            talentRef("Maîtrise de soi", { advanced: true })
        ],
        special: "<p><strong>Crainte :</strong> Zvorykine n'a jamais quitté les frontières de l'Anneau. Mais il sait ce qui se trame au-dehors. Il est persuadé de n'être absolument pas taillé pour les menaces qui sévissent à l'extérieur, et il n'y a rien qui soit plus à même de l'effrayer que l'exil ou la vie dans une station moins protégée que Komsomolskaya.</p>"
    },

    {
        key: "faction-npc-bogdan-khoudiakov",
        name: "Bogdan Khoudiakov",
        role: "Chef de l'État-major de la Hanse — Archétype Stratège",
        page: 36,
        attributes: { vigor: attribute(4), agility: attribute(3), spirit: attribute(3), empathy: attribute(4) },
        skills: { repair: 3, closeCombat: 3, endurance: 2, stealth: 1, reaction: 2, shooting: 2, comprehension: 2, observation: 2, survival: 3, analysis: 1, manipulation: 2 },
        weapons: [],
        talents: [
            talentRef("Courage", { advanced: true }),
            talentRef("Dur à cuire", { advanced: true }),
            talentRef("Exaltation", { advanced: true }),
            talentRef("Second souffle")
        ],
        special: "<p><strong>Crainte :</strong> Khoudiakov est porteur d'une maladie dont il ignore tout. Elle l'affaiblit par moment, lui provoque des quintes de toux et des difficultés respiratoires. Depuis peu, d'étranges lésions sont apparues sur son corps ; pire, elles s'étendent. Il sait qu'il devrait en parler, mais il craint qu'on ne l'exile par crainte de la contagion.</p>"
    },

    {
        key: "faction-npc-milovan-bajenov",
        name: "Milovan Bajenov",
        role: "Ministre de l'Économie de la Hanse — Archétype Diplomate",
        page: 37,
        attributes: { vigor: attribute(2), agility: attribute(3), spirit: attribute(5), empathy: attribute(3) },
        skills: { stealth: 2, reaction: 1, shooting: 1, comprehension: 4, observation: 3, analysis: 3, manipulation: 1 },
        weapons: [],
        talents: [
            talentRef("Hésitation", { advanced: true }),
            talentRef("Temporisation", { advanced: true })
        ],
        special: "<p><strong>Crainte :</strong> dans ce monde, ce grand solitaire ignoré de tous est devenu quelqu'un. Timide maladif, faible du fait de son physique, Bajenov a toujours été transparent. Aujourd'hui, les choses sont différentes, toute une faction compte sur ses compétences, il possède du pouvoir. Sa seule crainte, c'est de le perdre et de redevenir l'être insignifiant qu'il a toujours été.</p>"
    },

    {
        key: "faction-npc-grigori-astafiev",
        name: "Grigori Astafiev",
        role: "Ministre des Affaires courantes de la Hanse — Archétype Trafiquant",
        page: 38,
        attributes: { vigor: attribute(3), agility: attribute(4), spirit: attribute(4), empathy: attribute(3) },
        skills: { repair: 2, endurance: 1, stealth: 1, reaction: 2, shooting: 1, comprehension: 3, observation: 2, survival: 1, analysis: 2, manipulation: 3 },
        weapons: [],
        talents: [
            talentRef("Chanceux"),
            talentRef("Forte tête"),
            talentRef("Inquisiteur", { advanced: true }),
            talentRef("Psychologie")
        ],
        special: "<p><strong>Crainte :</strong> Astafiev mesure pleinement la chance qu'ont ses deux filles. Il fera tout pour que la réalité du métro en dehors de la Hanse les épargne. Néanmoins, il a de fréquents cauchemars dans lesquels sa famille est obligée de survivre hors de l'Anneau et, à force de rêver, il craint que tout cela n'ait un sens.</p>"
    },

    {
        key: "faction-npc-pavel-nikonov",
        name: "Pavel Nikonov",
        role: "Administrateur de la Paveletskaya (Hanse) — Archétype Diplomate",
        page: 38,
        attributes: { vigor: attribute(4), agility: attribute(2), spirit: attribute(3), empathy: attribute(4) },
        skills: { endurance: 1, shooting: 1, comprehension: 1, observation: 3, survival: 1, analysis: 1, manipulation: 3 },
        weapons: [],
        talents: [
            talentRef("Imperturbable"),
            talentRef("Inquisiteur")
        ],
        special: "<p><strong>Crainte :</strong> très déprimé à la mort de sa femme, Nikonov s'est adonné avec outrance aux courses de rats. Aussi bête que puisse paraître ce moyen de compenser, cela a fonctionné. Or, la nouvelle direction que semble prendre la Hanse l'inquiète fortement, car il craint que tôt ou tard son passe-temps favori finisse par être interdit.</p>"
    },

    // ================= LA LIGNE ROUGE =================

    {
        key: "faction-npc-camarade-moskvine",
        name: "Camarade Moskvine",
        role: "Secrétaire général du Parti, tyran de la Ligne Rouge — Archétype Stratège",
        page: 48,
        attributes: { vigor: attribute(3), agility: attribute(2), spirit: attribute(4), empathy: attribute(4) },
        skills: { closeCombat: 1, endurance: 2, stealth: 2, reaction: 1, shooting: 2, comprehension: 3, observation: 3, analysis: 2, manipulation: 4 },
        weapons: [],
        talents: [
            talentRef("Dur à cuire"),
            talentRef("Impitoyable"),
            talentRef("Inquisiteur", { advanced: true }),
            talentRef("Maîtrise de soi", { advanced: true })
        ],
        special: "<p><strong>Crainte :</strong> Moskvine vit un déni profond. Il est convaincu de faire ce qu'il y a de mieux pour celles et ceux qui se trouvent sous sa bienveillante tutelle. Aussi ignore-t-il sa Crainte. Il ne sait pas que rien ne le terrifierait plus qu'une démonstration implacable de l'absurdité de son régime. S'il parvenait un jour à lui prouver qu'il se fourvoie complètement dans la poursuite de son idéal, il sombrerait très certainement dans la folie.</p>"
    },

    {
        key: "faction-npc-camarade-dourov",
        name: "Camarade Dourov",
        role: "Chef de Komsomolskaya (Ligne Rouge) — Archétype Trafiquant",
        page: 48,
        attributes: { vigor: attribute(3), agility: attribute(3), spirit: attribute(5), empathy: attribute(4) },
        skills: { closeCombat: 2, endurance: 1, stealth: 3, reaction: 2, shooting: 2, comprehension: 2, observation: 3, analysis: 4, manipulation: 3 },
        weapons: [],
        talents: [
            talentRef("Arme de prédilection", { advanced: true }),
            talentRef("Imperturbable"),
            talentRef("Psychologie")
        ],
        special: "<p><em>Arme de prédilection : pistolet.</em></p><p><strong>Crainte :</strong> Dourov ne craint pas d'être découvert. Il croit sincèrement qu'il parviendrait à convaincre ses accusateurs qu'il fait ce qu'il fait dans l'intérêt de la Rouge. En revanche, il est dévoré d'angoisse à l'idée qu'on découvre la relation qu'il entretient avec un homme. Car si les autorités l'apprenaient, il y a fort à parier qu'il se retrouverait avec son amant dans les plus obscures geôles de la Loubyanka.</p>"
    },

    {
        key: "faction-npc-camarade-pavlenko",
        name: "Camarade Pavlenko",
        role: "Chef de la station Loubyanka, chef bourreau de la Ligne Rouge — Archétype Diplomate",
        page: 49,
        attributes: { vigor: attribute(4), agility: attribute(3), spirit: attribute(4), empathy: attribute(3) },
        skills: { closeCombat: 1, endurance: 3, reaction: 1, shooting: 2, comprehension: 2, observation: 2, analysis: 2, manipulation: 3 },
        weapons: [],
        talents: [
            talentRef("Courage"),
            talentRef("Inquisiteur", { advanced: true }),
            talentRef("Menaçant")
        ],
        special: "<p><strong>Crainte :</strong> la torture hante les cauchemars de Pavlenko. Il espère de tout son cœur ne jamais subir le traitement qu'il fait couramment infliger à tant d'autres…</p>"
    },

    {
        key: "faction-npc-docteur-mucheniya",
        name: "Docteur Mucheniya",
        role: "Tortionnaire de la Loubyanka (Ligne Rouge) — Archétype Médecin",
        page: 49,
        attributes: { vigor: attribute(2), agility: attribute(3), spirit: attribute(4), empathy: attribute(5) },
        skills: { repair: 1, stealth: 1, reaction: 1, shooting: 1, comprehension: 2, observation: 2, analysis: 4, manipulation: 3, medicine: 4 },
        weapons: [],
        talents: [
            talentRef("Compassion"),
            talentRef("Imperturbable"),
            talentRef("Présence rassurante"),
            talentRef("Urgentiste", { advanced: true })
        ],
        special: "<p><strong>Crainte :</strong> le docteur Mucheniya est un hypocondriaque discret, mais profondément atteint. Depuis qu'il a vu la population d'une station décimée par une épidémie, il est terrifié à l'idée de tomber gravement malade. Malgré l'aspect salissant de son travail, il fait preuve d'une hygiène irréprochable.</p>"
    },

    // ================= LE QUATRIÈME REICH =================

    {
        key: "faction-npc-le-fuhrer",
        name: "Le Führer (Evgeny Petrovitch)",
        role: "Dirigeant autocratique du Quatrième Reich — Archétype Diplomate",
        page: 57,
        attributes: { vigor: attribute(2), agility: attribute(3), spirit: attribute(5), empathy: attribute(4) },
        skills: { repair: 1, endurance: 1, stealth: 1, reaction: 1, shooting: 2, comprehension: 3, observation: 3, survival: 1, analysis: 2, manipulation: 3 },
        weapons: [],
        talents: [
            talentRef("Arme de prédilection", { advanced: true }),
            talentRef("Hésitation", { advanced: true }),
            talentRef("Temporisation")
        ],
        special: "<p><em>Arme de prédilection : Luger.</em></p><p><strong>Crainte :</strong> le Führer craint d'être la cible d'une conspiration. Il est persuadé de n'être entouré que de traîtres et d'incapables et, en dépit des apparences, il se méfie même de Vetrov. Le dictateur vit dans une angoisse permanente, et la disparition de sa femme n'arrange en rien les choses.</p>"
    },

    {
        key: "faction-npc-stanislas-vetrov",
        name: "Stanislas Vetrov",
        role: "Commandant de la Pouchkinskaya, homme de confiance du Führer — Archétype Stratège",
        page: 58,
        attributes: { vigor: attribute(3), agility: attribute(3), spirit: attribute(4), empathy: attribute(4) },
        skills: { repair: 2, closeCombat: 2, endurance: 2, stealth: 1, reaction: 1, shooting: 3, comprehension: 2, observation: 2, analysis: 2, manipulation: 2 },
        weapons: [],
        talents: [
            talentRef("Dur à cuire"),
            talentRef("Impitoyable"),
            talentRef("Mental d'acier")
        ],
        special: "<p><strong>Crainte :</strong> Vetrov voit bien que le Führer est dévoré par la haine et la peur. Malgré sa profonde admiration pour lui, il redoute une crise de démence à venir, car la folie du chef du Reich serait à coup sûr meurtrière.</p>"
    },

    {
        key: "faction-npc-iegor-sadykov",
        name: "Iegor Sadykov",
        role: "Commandant de la Tverskaya, dit « Barbe bleue » — Archétype Soldat",
        page: 58,
        attributes: { vigor: attribute(4), agility: attribute(2), spirit: attribute(3), empathy: attribute(3) },
        skills: { repair: 2, closeCombat: 1, endurance: 2, reaction: 1, shooting: 3, comprehension: 2, observation: 1, analysis: 2, manipulation: 2 },
        weapons: [],
        talents: [
            talentRef("Brute"),
            talentRef("Dur à cuire", { advanced: true }),
            talentRef("Menaçant")
        ],
        special: "<p><strong>Crainte :</strong> Sadykov a des appétits d'ogre, dans tous les domaines, il ne sait ni s'abstenir ni se tempérer. Le commandant vit dans une telle peur de manquer qu'il fait des excès en tout. Lubrique, ivrogne et d'un appétit glouton, il craint la disette et les restrictions plus que personne.</p>"
    },

    {
        key: "faction-npc-boris-rochtchine",
        name: "Boris Rochtchine",
        role: "Commandant de la Tchekhovskaya, imposteur peu convaincu par la doctrine — Archétype Trafiquant",
        page: 59,
        attributes: { vigor: attribute(2), agility: attribute(3), spirit: attribute(5), empathy: attribute(4) },
        skills: { closeCombat: 1, stealth: 4, reaction: 2, shooting: 2, comprehension: 3, observation: 2, analysis: 3, manipulation: 4 },
        weapons: [],
        talents: [
            talentRef("Forte tête"),
            talentRef("Inquisiteur", { advanced: true }),
            talentRef("Psychologie")
        ],
        special: "<p><strong>Crainte :</strong> sans surprise, la plus grande crainte de Rochtchine est d'être découvert. Il vendrait n'importe qui à sa place pour sauver sa peau.</p>"
    },

    {
        key: "faction-npc-iouri-sobolevski",
        name: "Iouri Sobolevski",
        role: "Général des armées du Quatrième Reich — Archétype Stratège",
        page: 59,
        attributes: { vigor: attribute(4), agility: attribute(3), spirit: attribute(3), empathy: attribute(4) },
        skills: { closeCombat: 2, endurance: 1, stealth: 2, reaction: 3, shooting: 3, comprehension: 2, observation: 2, survival: 2, analysis: 1, manipulation: 1 },
        weapons: [],
        talents: [
            talentRef("Discipline de groupe"),
            talentRef("Exaltation"),
            talentRef("Maîtrise de soi", { advanced: true })
        ],
        special: "<p><strong>Crainte :</strong> la haine de Sobolevski pour les Caucasiens vient d'une peur viscérale. Il fait souvent de terribles cauchemars dans lesquels il tombe aux mains de ces gens et en devient le jouet. Pour éviter que cela arrive, il dissimule toujours une lame de rasoir sur lui pour pouvoir s'ouvrir la gorge au cas où il se ferait capturer par l'ennemi.</p>"
    },

    {
        key: "faction-npc-inna-kharlamova",
        name: "Inna Kharlamova",
        role: "Veuve, instigatrice discrète d'une révolte des femmes du Quatrième Reich — Archétype Trafiquant",
        page: 60,
        attributes: { vigor: attribute(2), agility: attribute(3), spirit: attribute(3), empathy: attribute(5) },
        skills: { repair: 2, endurance: 2, stealth: 4, reaction: 1, comprehension: 3, observation: 3, analysis: 4, manipulation: 3, medicine: 1 },
        weapons: [],
        talents: [
            talentRef("Courage"),
            talentRef("Imperturbable"),
            talentRef("Tuyau")
        ],
        special: "<p><strong>Crainte :</strong> Inna ne craint pas pour elle-même, elle craint pour ses enfants. Elle ne veut pas les voir devenir les monstres que sont les habitants du Quatrième Reich.</p>"
    }
];
