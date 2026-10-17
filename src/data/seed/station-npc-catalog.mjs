/**
 * PNJ notables des Stations (chapitre 10 du livre de règles,
 * pages 248-280 : Petchatniki, Doubrovka, Kojoukhovskaya). Même
 * structure que `bestiary-npc-catalog.mjs` et
 * `faction-npc-catalog.mjs`, réutilisable telle quelle par
 * `buildNpcActorData()` (cf. bestiary-actor-builder.mjs).
 *
 * Comme pour les PNJ de Factions, ces personnalités n'ont dans
 * le livre ni arme ni protection chiffrées : seuls l'Archétype
 * (repris en texte dans `role`, absent du schéma NpcDataModel),
 * les Attributs/Compétences, les Talents et un paragraphe de
 * Crainte sont fournis. `weapons` est donc volontairement vide
 * pour toutes ces entrées.
 *
 * Les Talents notés « (S) » dans le livre sont au niveau
 * Supérieur (mêmes conventions que les catalogues précédents).
 */

function attribute(value) {
    return { value, max: value };
}

function talentRef(name, { advanced = false } = {}) {
    return { name, advanced };
}


export const STATION_NPCS = [

    // ================= PETCHATNIKI =================

    {
        key: "station-npc-galina-mamouchka-botcharova",
        name: "Galina « Mamouchka » Botcharova",
        role: "Chef du triumvirat de Petchatniki — Archétype Diplomate",
        page: 256,
        attributes: { vigor: attribute(2), agility: attribute(2), spirit: attribute(4), empathy: attribute(5) },
        skills: { repair: 2, comprehension: 3, observation: 2, analysis: 3, manipulation: 3 },
        weapons: [],
        talents: [
            talentRef("Compassion", { advanced: true }),
            talentRef("Maîtrise de soi")
        ],
        special: "<p><strong>Crainte :</strong> Mamouchka est plus qu'inquiète concernant la surpopulation de la station. Elle craint de voir le pouvoir repasser dans les mains de Stanislav, qu'elle sait trop impulsif pour ne pas mener la station à la catastrophe.</p>"
    },

    {
        key: "station-npc-stanislav-vorobiov",
        name: "Stanislav Vorobiov",
        role: "Conseiller sécurité, défense et exploration de Petchatniki — Archétype Soldat",
        page: 257,
        attributes: { vigor: attribute(4), agility: attribute(4), spirit: attribute(3), empathy: attribute(3) },
        skills: { closeCombat: 3, stealth: 1, reaction: 2, shooting: 2, observation: 1, survival: 2 },
        weapons: [],
        talents: [
            talentRef("Arme de prédilection"),
            talentRef("Brute"),
            talentRef("Dur à cuire")
        ],
        special: "<p><em>Arme de prédilection : matraque.</em></p><p><strong>Crainte :</strong> Stanislav a peur. Mais il a la peur plus proche de celle du sanglier que de celle du lièvre. Il est convaincu que Vedernikov prépare un mauvais coup et qu'il n'a qu'une idée en tête : attaquer le premier pour ne pas être massacré. Il ne veut pas agir sans soutien, aussi travaille-t-il à réunir des volontaires.</p>"
    },

    {
        key: "station-npc-oleg-dmitriev",
        name: "Oleg Dmitriev",
        role: "Intendant et comptable de Petchatniki — Archétype Trafiquant",
        page: 258,
        attributes: { vigor: attribute(2), agility: attribute(3), spirit: attribute(5), empathy: attribute(4) },
        skills: { stealth: 2, reaction: 1, comprehension: 2, observation: 3, analysis: 2 },
        weapons: [],
        talents: [
            talentRef("Forte tête"),
            talentRef("Inquisiteur", { advanced: true }),
            talentRef("Temporisation", { advanced: true })
        ],
        special: "<p><strong>Crainte :</strong> Oleg est convaincu que sa survie ne dépend que de son utilité. Il sait aussi qu'il ne s'en sort que parce qu'il a la chance d'être allié à un commandement pacifique. Samuel Vedernikov l'effraie au point de lui donner des cauchemars. Si Stanislav parvient à lui prouver que l'attaque est la meilleure façon de se prémunir d'une conquête violente des hommes de Vedernikov, il se laissera sans doute convaincre.</p>"
    },

    {
        key: "station-npc-ekaterina-boutourlina",
        name: "Ekaterina Boutourlina",
        role: "Jeune espionne au service de Mamouchka, à Petchatniki — Archétype Infiltrateur",
        page: 259,
        attributes: { vigor: attribute(3), agility: attribute(5), spirit: attribute(4), empathy: attribute(3) },
        skills: { stealth: 3, reaction: 1, observation: 2, analysis: 1, manipulation: 1 },
        weapons: [],
        talents: [
            talentRef("Courage"),
            talentRef("Fantôme", { advanced: true })
        ],
        special: "<p><strong>Crainte :</strong> Ekaterina a terriblement peur de décevoir Mamouchka tant elle se sent honorée d'être si proche d'elle. Comme elle a beaucoup de mal à refuser un défi, on imagine aisément dans quel état elle peut se trouver, ayant été récemment approchée par Stanislav pour espionner Kojoukhovskaya, une mission qu'elle n'a pas encore acceptée ni refusée.</p>"
    },

    {
        key: "station-npc-leonid-brahmane-silaiev",
        name: "Leonid Brahmane Silaïev",
        role: "Mythomane charmeur récemment arrivé à Petchatniki, prétendu brahmane de Polis — Archétype Diplomate",
        page: 260,
        attributes: { vigor: attribute(2), agility: attribute(3), spirit: attribute(4), empathy: attribute(5) },
        skills: { stealth: 1, comprehension: 2, observation: 2, analysis: 2, manipulation: 4 },
        weapons: [],
        talents: [
            talentRef("Compassion", { advanced: true }),
            talentRef("Hésitation", { advanced: true }),
            talentRef("Imperturbable")
        ],
        special: "<p><strong>Crainte :</strong> Leonid a trouvé sa place à Petchatniki et il est persuadé qu'il le doit à la fausse personnalité qu'il a créée. Il est tellement inquiet à l'idée que les gens de sa station d'adoption puissent le rejeter, s'ils découvraient qu'il n'a jamais mis les pieds à Polis, qu'il se sent enfermé dans son rôle.</p>"
    },

    {
        key: "station-npc-matvei",
        name: "Matveï",
        role: "Mécanicien muet et bourru de Petchatniki — Archétype Mécanicien",
        page: 261,
        attributes: { vigor: attribute(5), agility: attribute(3), spirit: attribute(4), empathy: attribute(2) },
        skills: { repair: 3, closeCombat: 2, endurance: 1, shooting: 1, comprehension: 1, observation: 1, survival: 1 },
        weapons: [],
        talents: [
            talentRef("Amélioration"),
            talentRef("As de la bricole", { advanced: true }),
            talentRef("Brute")
        ],
        special: "<p><strong>Crainte :</strong> Matveï a survécu à une excursion à la surface avec un groupe de stalkers. Il s'est retrouvé enfermé dans la réserve d'un petit supermarché pendant près de six mois, traqué par des chiens et un ptérodactyle. Il a failli perdre complètement la raison et sa sortie de la réserve était plus une tentative de suicide qu'une réelle volonté de survivre. Matveï ne veut plus jamais retourner à la surface et sa réaction serait aussi physique que brutale si on cherchait à l'y convaincre.</p>"
    },

    {
        key: "station-npc-rate",
        name: "Rate",
        role: "Diseuse de bonne aventure et guérisseuse excentrique de Petchatniki — Archétype Médecin",
        page: 262,
        attributes: { vigor: attribute(3), agility: attribute(3), spirit: attribute(4), empathy: attribute(4) },
        skills: { repair: 1, endurance: 1, observation: 1, survival: 2, analysis: 2, medicine: 3 },
        weapons: [],
        talents: [
            talentRef("Compassion", { advanced: true })
        ],
        special: "<p><strong>Crainte :</strong> rien ne terrifie plus Rate que la combinaison de la solitude, des ténèbres et du silence. Si elle devait revivre une telle chose, elle hurlerait, se griffferait le visage et ferait tout pour mettre le plus rapidement possible un terme à ses jours.</p>"
    },

    // ================= DOUBROVKA =================

    {
        key: "station-npc-mikhail-aksakov",
        name: "Mikhaïl Aksakov",
        role: "Chef de la station Doubrovka — Archétype Stratège",
        page: 266,
        attributes: { vigor: attribute(3), agility: attribute(3), spirit: attribute(4), empathy: attribute(4) },
        skills: { repair: 1, shooting: 1, comprehension: 2, observation: 2, analysis: 2, manipulation: 2 },
        weapons: [],
        talents: [
            talentRef("Exaltation", { advanced: true }),
            talentRef("Maîtrise de soi", { advanced: true }),
            talentRef("Temporisation", { advanced: true })
        ],
        special: "<p><strong>Crainte :</strong> la plus grande crainte de Mikhaïl est qu'il arrive malheur à sa fille Fedora. Pour signifier à quel point cette inquiétude l'habite, lorsqu'il craint véritablement pour la vie de sa fille, il ne peut plus bénéficier du talent Maîtrise de soi.</p>"
    },

    {
        key: "station-npc-fedora-aksakova",
        name: "Fedora Aksakova",
        role: "Fille de Mikhaïl Aksakov, clé de l'accord commercial de Doubrovka avec la Hanse — Archétype Infiltrateur",
        page: 267,
        attributes: { vigor: attribute(3), agility: attribute(3), spirit: attribute(4), empathy: attribute(5) },
        skills: { closeCombat: 2, stealth: 1, comprehension: 1, observation: 1, analysis: 2, manipulation: 3 },
        weapons: [],
        talents: [
            talentRef("Compassion", { advanced: true }),
            talentRef("Hésitation", { advanced: true })
        ],
        special: "<p><strong>Crainte :</strong> la violence physique pétrifie littéralement Fedora. Elle ne sait absolument pas réagir devant une situation de ce type et a tendance à fuir lorsqu'elle y est confrontée. Aussi, est-elle particulièrement perméable aux menaces et à l'intimidation si son intégrité physique est en jeu.</p>"
    },

    {
        key: "station-npc-revaz-averine",
        name: "Revaz Averine",
        role: "Président de la ligue des colporteurs de Doubrovka — Archétype Trafiquant",
        page: 268,
        attributes: { vigor: attribute(4), agility: attribute(2), spirit: attribute(5), empathy: attribute(3) },
        skills: { closeCombat: 2, endurance: 1, comprehension: 2, observation: 2, analysis: 1, manipulation: 2 },
        weapons: [],
        talents: [
            talentRef("Brute"),
            talentRef("Forte tête"),
            talentRef("Psychologie"),
            talentRef("Tuyau")
        ],
        special: "<p><strong>Crainte :</strong> Revaz sait qu'il joue un jeu dangereux. Et il dort mal la nuit. Il est terrifié à l'idée d'être exilé comme Nemtsov. Loin de son influence et du confort qui l'accompagne, il ne serait plus qu'une proie et cette idée le tourmente littéralement.</p>"
    },

    {
        key: "station-npc-vera-zadornova",
        name: "Vera Zadornova",
        role: "« La Mère Bougon », ancienne chanteuse d'opéra, conteuse appréciée des enfants de Doubrovka — Archétype Diplomate",
        page: 269,
        attributes: { vigor: attribute(2), agility: attribute(2), spirit: attribute(4), empathy: attribute(5) },
        skills: { stealth: 1, comprehension: 3, observation: 2, analysis: 3, manipulation: 3 },
        weapons: [],
        talents: [
            talentRef("Compassion", { advanced: true }),
            talentRef("Hésitation"),
            talentRef("Temporisation", { advanced: true })
        ],
        special: "<p><strong>Crainte :</strong> Vera ne possède pas de crainte. Ce qu'elle redoutait le plus est déjà arrivé et c'est pour cela qu'elle est brisée. Elle a déjà perdu sa gloire, sa voix et l'admiration de son entourage. On pourrait pourtant la détruire définitivement si on la privait de la compagnie des enfants qui lui donnent encore un semblant d'admiration.</p>"
    },

    // ================= KOJOUKHOVSKAYA =================

    {
        key: "station-npc-samuel-vedernikov",
        name: "Samuel Vedernikov",
        role: "Chef de la station Kojoukhovskaya, ancien membre de la Bratva — Archétype Stratège",
        page: 274,
        attributes: { vigor: attribute(4), agility: attribute(3), spirit: attribute(5), empathy: attribute(2) },
        skills: { closeCombat: 2, reaction: 1, shooting: 1, observation: 2, survival: 2, manipulation: 2 },
        weapons: [],
        talents: [
            talentRef("Arme de prédilection", { advanced: true }),
            talentRef("Discipline de groupe"),
            talentRef("Dur à cuire"),
            talentRef("Impitoyable"),
            talentRef("Menaçant", { advanced: true })
        ],
        special: "<p><em>Arme de prédilection : couteau.</em></p><p><strong>Crainte :</strong> parmi ses hommes de confiance, il est un jeune loup qui inquiète Samuel. Celui que tout le monde appelle « Mujāhid » possède cette même lueur dans le regard. Lui aussi est un survivant féroce et Samuel est hanté par l'idée qu'il subira le même sort que son prédécesseur. Pire, il se reconnaît tant dans le jeune homme qu'il n'arrive pas à se résoudre à l'éliminer.</p>"
    },

    {
        key: "station-npc-mujahid",
        name: "Mujāhid",
        role: "Exécuteur des basses œuvres de Samuel Vedernikov, à Kojoukhovskaya — Archétype Infiltrateur",
        page: 275,
        attributes: { vigor: attribute(4), agility: attribute(5), spirit: attribute(4), empathy: attribute(2) },
        skills: { closeCombat: 2, stealth: 3, reaction: 1, observation: 1, survival: 1 },
        weapons: [],
        talents: [
            talentRef("Arme de prédilection", { advanced: true }),
            talentRef("Fantôme", { advanced: true }),
            talentRef("Impitoyable")
        ],
        special: "<p><em>Arme de prédilection : couteau.</em></p><p><strong>Crainte :</strong> mourir. Devant une invincible menace, un incendie, une inondation ou un trop grand nombre d'adversaires, Mujāhid reniera tout et tout le monde pour s'en tirer.</p>"
    },

    {
        key: "station-npc-khamzat-gouriev",
        name: "Khamzat Gouriev",
        role: "Homme de main de Samuel Vedernikov, organisateur des combats rituels de Kojoukhovskaya — Archétype Soldat",
        page: 276,
        attributes: { vigor: attribute(5), agility: attribute(4), spirit: attribute(2), empathy: attribute(3) },
        skills: { closeCombat: 4, endurance: 2, reaction: 1, shooting: 2, observation: 1 },
        weapons: [],
        talents: [
            talentRef("Arme de prédilection", { advanced: true }),
            talentRef("Brute"),
            talentRef("Dur à cuire", { advanced: true }),
            talentRef("Résistance")
        ],
        special: "<p><em>Arme de prédilection : mains nues.</em></p><p><strong>Crainte :</strong> Khamzat a une peur panique des rats. C'est plus fort que lui, complètement irrationnel et incontrôlable, mais, en présence de rats, il perd tous ses moyens et cherche à fuir la source de sa phobie au plus vite.</p>"
    },

    {
        key: "station-npc-la-lyuba",
        name: "La Lyuba",
        role: "Tenancière du lupanar de Kojoukhovskaya — Archétype Trafiquant",
        page: 277,
        attributes: { vigor: attribute(2), agility: attribute(3), spirit: attribute(4), empathy: attribute(5) },
        skills: { closeCombat: 1, stealth: 1, shooting: 1, comprehension: 1, observation: 1, analysis: 2, manipulation: 3 },
        weapons: [],
        talents: [
            talentRef("Forte tête"),
            talentRef("Imperturbable"),
            talentRef("Sens du danger")
        ],
        special: "<p><strong>Crainte :</strong> rien n'inquiète plus la Lyuba que de vieillir ou de voir une jeune et fraîche beauté éclipser sa splendeur. Cette crainte a tendance à la rendre paranoïaque et particulièrement agressive à l'encontre des jeunes femmes charmantes.</p>"
    }

];
