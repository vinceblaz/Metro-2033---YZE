/**
 * Catalogue du bestiaire, extrait de « MET-06 Monstres v3 »
 * (fourni par l'utilisateur, pages 119-145 du livre).
 *
 * Donnée pure, aucune dépendance Foundry.
 *
 * Chaque créature devient un Actor de type `creature`
 * (CreatureDataModel), avec ses attaques comme Items `weapon`
 * embarqués. Les capacités spéciales qui ne sont pas des
 * attaques (vol, grimpeur, vision thermique...) sont regroupées
 * dans `system.special`.
 *
 * Note de classification : le Kot Baïoun, Le Brahmane et La
 * Ksatriya (chapitre « Les errants ») utilisent l'échelle
 * humaine (Attributs/Compétences 0-5) et possèdent des Talents
 * — ils sont donc catalogués séparément comme `npc`
 * (bestiary-npc-catalog.mjs), conformément au principe déjà
 * acté du projet : la distinction PNJ/Créature est technique
 * (échelle + moteur de Talents), pas narrative.
 *
 * Les Lucioles (p.137) n'ont volontairement aucune statistique
 * dans le livre (effet purement narratif, jet d'ANALYSE) : elles
 * ne sont donc pas reprises comme Actor ici.
 */


function attribute(value) {
    return { value, max: value };
}


/**
 * Une attaque devient un Item `weapon` embarqué.
 * `special` porte le texte de venin/effet particulier propre
 * à cette attaque (le cas échéant).
 */
function attack(name, { bonus = 0, damage = 0, special = "", venom = null } = {}) {
    return { name, bonus, damage, special, venom };
}


export const CREATURES = [

    {
        key: "creature-bibliothecaire",
        name: "Bibliothécaire",
        species: "Créature mutante — grand primate agressif",
        page: 119,
        attributes: {
            vigor: attribute(5),
            agility: attribute(4),
            spirit: attribute(2),
            empathy: attribute(1)
        },
        skills: { closeCombat: 4, endurance: 4, stealth: 3, reaction: 3, observation: 3, survival: 3, analysis: 1 },
        naturalProtection: { value: 6, resilience: true, resilienceCondition: "" },
        weapons: [
            attack("Griffes", { bonus: 2, damage: 2 }),
            attack("Morsure", { bonus: 1, damage: 2 })
        ],
        special: "<p><strong>Pénétration :</strong> les attaques de griffes et de crocs d'un bibliothécaire sont si puissantes que les armures n'appliquent pas leur éventuel trait Résilience.</p>"
    },

    {
        key: "creature-domovoi",
        name: "Domovoï",
        species: "Créature mutante — petit mammifère souterrain",
        page: 121,
        attributes: {
            vigor: attribute(3),
            agility: attribute(1),
            spirit: attribute(1),
            empathy: attribute(0)
        },
        skills: { closeCombat: 1, endurance: 3, stealth: 4, observation: 2, survival: 2 },
        naturalProtection: { value: 3, resilience: true, resilienceCondition: "Contre les attaques perforantes, y compris les balles ; tant que le domovoï est roulé en boule, sa Protection naturelle passe à 5." },
        weapons: [
            attack("Barbillons rétractables (au contact)", { bonus: 0, damage: 1, special: "Le domovoï ne porte pas réellement d'attaque, mais être en contact avec lui (ou le frapper à mains nues, même avec des gants) inflige une attaque à 6D (dégâts 1) causée par ses barbillons rétractables (il est impossible d'esquiver ou de parer cette attaque auto-infligée et les protections ne sont d'aucune utilité contre ces dégâts)." })
        ],
        special: "<p><strong>Vision thermique :</strong> le domovoï repère ses cibles dans l'obscurité totale.</p><p><strong>Grimpeur :</strong> le domovoï peut escalader n'importe quelle paroi sans avoir besoin de faire de jet. Il peut même rester fixé au plafond.</p><p><strong>Spores :</strong> le domovoï peut relâcher un nuage de spores affectant toutes les créatures se trouvant à portée courte. Si ces dernières ne portent pas de masque à gaz, elles doivent réussir un jet d'ENDURANCE avec un modificateur de –1 (ce modificateur disparaît si une quelconque protection couvre le nez et la bouche de la victime potentielle, comme une écharpe, un foulard ou un masque chirurgical). En cas d'échec au jet d'ENDURANCE, la victime subit 1 point de dégâts à l'ESPRIT et à l'EMPATHIE et elle doit faire un nouveau jet au round suivant. En cas de réussite, les spores cessent d'infliger des dégâts à l'ESPRIT et à l'EMPATHIE ; dans le cas contraire, un nouveau point de dégâts est infligé aux deux attributs. Si l'ESPRIT de la cible tombe à 0, celle-ci s'endort durant un quart et ne peut être réveillée (ce qui est bien suffisant au domovoï pour lui faire don de petits souvenirs sous-cutanés). Chaque fois que le domovoï utilise ses spores, jetez un D6. À moins d'obtenir un « 6 », il ne pourra pas reproduire celles-ci avant un quart.</p>"
    },

    {
        key: "creature-enfant-du-parc",
        name: "Enfant du parc",
        species: "Créature mutante — enfant psychique",
        page: 123,
        attributes: {
            vigor: attribute(1),
            agility: attribute(2),
            spirit: attribute(3),
            empathy: attribute(2)
        },
        skills: { endurance: 1, stealth: 3, reaction: 1, observation: 2, survival: 2, analysis: 1, manipulation: 3 },
        naturalProtection: { value: 0, resilience: false, resilienceCondition: "" },
        weapons: [],
        special: "<p><strong>Attaque psychique – désespoir (action lente) :</strong> la cible d'une attaque psychique d'enfant du parc doit réussir un jet d'ANALYSE en opposition avec la MANIPULATION de la créature (qui ne peut pas forcer son jet). Pour chaque réussite excédentaire de l'enfant du parc, sa victime subit 1 point de dégâts à l'EMPATHIE. Si l'EMPATHIE de la cible tombe à 0, celle-ci tente par tous les moyens de mettre fin à ses jours (et continuera d'essayer jusqu'à ce qu'elle ait récupéré au moins 1 point d'EMPATHIE). Jusqu'à trois autres enfants du parc peuvent aider celui qui lance son attaque psychique (selon les mêmes règles que « Aider les autres », page 178). Résister à cette attaque (en ne subissant aucune perte d'EMPATHIE) permet d'être immunisé à l'attaque psychique des enfants du parc durant un tour.</p>"
    },

    {
        key: "creature-fouisseur",
        name: "Fouisseur",
        species: "Créature mutante — arachnide géant",
        page: 126,
        attributes: {
            vigor: attribute(6),
            agility: attribute(6),
            spirit: attribute(1),
            empathy: attribute(0)
        },
        skills: { closeCombat: 4, endurance: 4, stealth: 5, reaction: 4, observation: 3, survival: 3 },
        naturalProtection: { value: 6, resilience: true, resilienceCondition: "" },
        weapons: [
            attack("Chélicères", { bonus: 1, damage: 3, special: "Si le fouisseur inflige au moins 1 point de dégâts à sa cible avec ses chélicères, il lui inocule un très puissant venin (Toxicité 7, poison létal).", venom: { effectType: "lethal", toxicity: 7 } }),
            attack("Pattes", { bonus: 1, damage: 2 })
        ],
        special: "<p><strong>Grimpeur :</strong> le fouisseur peut escalader n'importe quelle paroi sans avoir besoin de faire de jet. Il peut même rester fixé au plafond.</p>"
    },

    {
        key: "creature-tisseur",
        name: "Tisseur",
        species: "Créature mutante — arachnide géant",
        page: 126,
        attributes: {
            vigor: attribute(5),
            agility: attribute(6),
            spirit: attribute(1),
            empathy: attribute(0)
        },
        skills: { closeCombat: 3, endurance: 3, stealth: 4, reaction: 4, observation: 3, survival: 2 },
        naturalProtection: { value: 5, resilience: true, resilienceCondition: "" },
        weapons: [
            attack("Chélicères", { bonus: 1, damage: 2, special: "Si le tisseur inflige au moins 1 point de dégâts à sa cible avec ses chélicères, il lui inocule son venin (Toxicité 5, poison létal).", venom: { effectType: "lethal", toxicity: 5 } }),
            attack("Pattes", { bonus: 1, damage: 1 })
        ],
        special: "<p><strong>Grimpeur :</strong> le tisseur peut escalader n'importe quelle paroi sans avoir besoin de faire de jet. Il peut même rester fixé au plafond.</p><p><strong>Toile :</strong> quiconque est pris dans la toile d'un tisseur doit réussir un jet de VIGUEUR pour se dégager. Il est possible de réaliser un jet par round. Tant que la victime est prise dans la toile, elle est incapable de bouger et ne peut ni attaquer ni se défendre.</p>"
    },

    {
        key: "creature-excavateur",
        name: "Excavateur",
        species: "Créature mutante — arachnide géant",
        page: 126,
        attributes: {
            vigor: attribute(6),
            agility: attribute(5),
            spirit: attribute(1),
            empathy: attribute(0)
        },
        skills: { closeCombat: 3, endurance: 5, stealth: 4, reaction: 3, observation: 3, survival: 3 },
        naturalProtection: { value: 7, resilience: true, resilienceCondition: "" },
        weapons: [
            attack("Chélicères", { bonus: 1, damage: 2, special: "Si l'excavateur inflige au moins 1 point de dégâts à sa cible avec ses chélicères, il lui inocule son venin (Toxicité 5, poison paralysant).", venom: { effectType: "paralyzing", toxicity: 5 } }),
            attack("Pattes", { bonus: 1, damage: 2 })
        ],
        special: "<p><strong>Grimpeur :</strong> l'excavateur peut escalader n'importe quelle paroi sans avoir besoin de faire de jet. Il peut même rester fixé au plafond.</p>"
    },

    {
        key: "creature-fourmi-vorace",
        name: "Fourmi vorace",
        species: "Créature mutante — insecte géant",
        page: 129,
        attributes: {
            vigor: attribute(3),
            agility: attribute(3),
            spirit: attribute(1),
            empathy: attribute(0)
        },
        skills: { closeCombat: 2, endurance: 3, stealth: 3, reaction: 2, shooting: 2, observation: 2, survival: 2 },
        naturalProtection: { value: 3, resilience: true, resilienceCondition: "" },
        weapons: [
            attack("Mandibules", { bonus: 1, damage: 1 }),
            attack("Jet d'acide (portée courte, TIR)", { bonus: 1, damage: 3, special: "Ignore la résilience des protections. Chaque fois que la fourmi vorace utilise son jet d'acide, jetez un D6. À moins d'obtenir un « 6 », elle ne pourra pas réutiliser son jet d'acide avant un quart." })
        ],
        special: ""
    },

    {
        key: "creature-frelon-chasseur",
        name: "Frelon chasseur",
        species: "Créature mutante — insecte volant géant",
        page: 130,
        attributes: {
            vigor: attribute(2),
            agility: attribute(2),
            spirit: attribute(1),
            empathy: attribute(0)
        },
        skills: { closeCombat: 2, endurance: 2, stealth: 1, reaction: 3, observation: 1 },
        naturalProtection: { value: 3, resilience: false, resilienceCondition: "" },
        weapons: [
            attack("Mandibules", { bonus: 1, damage: 1 }),
            attack("Dard", { bonus: 1, damage: 2, special: "Si le frelon chasseur inflige au moins 1 point de dégâts à sa cible avec son dard, il lui inocule un puissant venin (Toxicité 5, poison létal). Une injection d'adrénaline permet de stopper les effets du venin, comme un antidote.", venom: { effectType: "lethal", toxicity: 5 } })
        ],
        special: "<p><strong>Vol :</strong> le frelon chasseur dispose d'un modificateur de +2 à ses jets de RÉACTION pour fuir un combat. En outre, il n'est pas affecté par l'encombrement des zones et peut se déplacer de deux zones avec une action rapide.</p>"
    },

    {
        key: "creature-freux",
        name: "Freux",
        species: "Créature mutante — corvidé charognard",
        page: 132,
        attributes: {
            vigor: attribute(5),
            agility: attribute(2),
            spirit: attribute(1),
            empathy: attribute(0)
        },
        skills: { closeCombat: 1, endurance: 2, stealth: 3, reaction: 2, observation: 2, survival: 2 },
        naturalProtection: { value: 0, resilience: false, resilienceCondition: "" },
        weapons: [
            attack("Ailes", { bonus: 1, damage: 1 }),
            attack("Bec", { bonus: 0, damage: 1 })
        ],
        special: "<p>Lorsque la Vigueur d'un groupe de freux tombe à 0, celui-ci se disperse. En outre, les armes à dispersion (fusil à pompe, lance-flammes) offrent un bonus de +2 aux attaques dirigées contre un groupe de freux.</p><p><strong>Vol :</strong> les freux sont capables de voler, ce qui leur permet de fuir très rapidement… ou de fondre tout aussi rapidement sur leurs proies. Les freux disposent d'un bonus de +2 à leurs jets de RÉACTION pour fuir un combat. En outre, ils ne sont pas affectés par l'encombrement des zones et peuvent se déplacer de deux zones avec une action rapide.</p>"
    },

    {
        key: "creature-lichen",
        name: "Lichen",
        species: "Créature mutante — organisme végétal carnivore",
        page: 135,
        attributes: {
            vigor: attribute(6),
            agility: attribute(0),
            spirit: attribute(1),
            empathy: attribute(0)
        },
        skills: {},
        naturalProtection: { value: 3, resilience: false, resilienceCondition: "" },
        weapons: [
            attack("Tentacules végétaux (portée courte)", { bonus: 0, damage: 1, special: "Ignore les protections." })
        ],
        special: "<p><strong>Saisie :</strong> si une victime subit des dégâts de la part d'un des tentacules du lichen, elle est considérée comme saisie et devra se libérer en réussissant un jet de CORPS À CORPS ou de RÉACTION (action lente) en opposition avec le jet de VIGUEUR du lichen (la victime saisie peut être aidée). En cas de réussite, la victime se dégage. En cas d'échec, l'étreinte se resserre (ce qui ne demande aucune action au lichen) et la victime subit automatiquement 1 point de dégâts à sa Vigueur (ignorant toujours les protections).</p><p><strong>Note :</strong> le lichen ne peut attaquer qu'une seule fois par round avec l'un de ses tentacules. Cependant, une personne saisie qui ne parvient pas à se dégager subit automatiquement 1 point de dégâts à sa Vigueur, sans que cela ne demande la moindre action au lichen.</p>"
    },

    {
        key: "creature-pterodactyle",
        name: "Ptérodactyle",
        species: "Créature mutante — reptile volant",
        page: 138,
        attributes: {
            vigor: attribute(7),
            agility: attribute(2),
            spirit: attribute(1),
            empathy: attribute(0)
        },
        skills: { closeCombat: 2, endurance: 3, stealth: 2, reaction: 1, observation: 2, survival: 2 },
        naturalProtection: { value: 4, resilience: true, resilienceCondition: "" },
        weapons: [
            attack("Griffes", { bonus: 1, damage: 3 }),
            attack("Morsure", { bonus: 0, damage: 2 })
        ],
        special: "<p><strong>Vol :</strong> les ptérodactyles sont capables de voler. Ils disposent d'un modificateur de +2 à leurs jets de RÉACTION pour fuir un combat et ne sont pas affectés par l'encombrement des zones.</p>"
    },

    {
        key: "creature-sentinelle",
        name: "Sentinelle",
        species: "Créature mutante — humanoïde féral",
        page: 140,
        attributes: {
            vigor: attribute(4),
            agility: attribute(3),
            spirit: attribute(1),
            empathy: attribute(0)
        },
        skills: { closeCombat: 1, endurance: 2, stealth: 3, reaction: 3, observation: 2, survival: 2 },
        naturalProtection: { value: 3, resilience: false, resilienceCondition: "" },
        weapons: [
            attack("Griffes", { bonus: 1, damage: 1, special: "Vicieuse : si la sentinelle réussit une attaque de griffes, elle peut immédiatement faire une attaque de morsure sur la même cible." }),
            attack("Morsure", { bonus: 1, damage: 1 })
        ],
        special: "<p><strong>Vicieuse :</strong> si la sentinelle réussit une attaque de griffes, elle peut immédiatement faire une attaque de morsure sur la même cible.</p>"
    },

    {
        key: "creature-ver-sanguin",
        name: "Ver sanguin",
        species: "Créature mutante — annélide géant",
        page: 141,
        attributes: {
            vigor: attribute(6),
            agility: attribute(2),
            spirit: attribute(1),
            empathy: attribute(0)
        },
        skills: { endurance: 3, stealth: 3, reaction: 2, survival: 2 },
        naturalProtection: { value: 6, resilience: true, resilienceCondition: "Contre les attaques perforantes, y compris les balles." },
        weapons: [
            attack("Anneaux constricteurs", { bonus: 1, damage: 2, special: "Ignorent les protections." }),
            attack("Dents", { bonus: 0, damage: 1 })
        ],
        special: "<p><strong>Léthargie :</strong> un ver sanguin qui est rassasié subit un modificateur de –2 sur tous ses jets visant à attaquer ou fuir.</p><p><strong>Morsure :</strong> si une victime subit au moins 1 point de dégâts de la part des anneaux constricteurs du ver sanguin, elle est considérée comme saisie et devra se libérer en réussissant un jet de CORPS À CORPS ou de RÉACTION (action lente) en opposition avec le jet de VIGUEUR du ver (la cible saisie peut être aidée). En cas de réussite, la victime se dégage. En cas d'échec, l'étreinte se poursuit et le ver utilisera sa prochaine action lente pour mordre sa proie avec un modificateur de +2 à son jet d'attaque.</p><p><strong>Perception des vibrations :</strong> le ver sanguin ressent précisément (et automatiquement) tout ce qui bouge à portée moyenne de lui.</p>"
    },

    {
        key: "creature-vodianoi",
        name: "Vodianoï",
        species: "Créature mutante — amphibien géant",
        page: 143,
        attributes: {
            vigor: attribute(5),
            agility: attribute(1),
            spirit: attribute(1),
            empathy: attribute(0)
        },
        skills: { closeCombat: 1, endurance: 3, stealth: 1, reaction: 2, shooting: 2, observation: 1, survival: 2 },
        naturalProtection: { value: 3, resilience: false, resilienceCondition: "" },
        weapons: [
            attack("Langue", { bonus: 1, damage: 1 }),
            attack("Jet de salive (portée courte, TIR)", { bonus: 1, damage: 1, special: "+ venin (voir Venin). Ignore les protections ne recouvrant pas l'intégralité du corps, visage inclus. Chaque fois que le vodianoï utilise son jet de salive, jetez un D6. À moins d'obtenir un « 6 », il ne pourra pas réutiliser son jet avant un tour.", venom: { effectType: "paralyzing", toxicity: 6 } })
        ],
        special: "<p><strong>Photosensible :</strong> si le vodianoï est exposé à une lumière vive, il subit un modificateur de –2 sur ses jets de Corps à corps, de Réaction, de Tir et d'Observation.</p><p><strong>Venin :</strong> si le vodianoï inflige au moins 1 point de dégâts à sa cible avec son jet de salive, il lui inocule un puissant venin (Toxicité 6, poison paralysant). Si le jet d'ENDURANCE contre le venin échoue, la victime est également frappée de cécité durant un quart.</p><p><strong>Corruption de l'eau :</strong> l'eau corrompue par les larves et les têtards du vodianoï compte comme un poison létal de Toxicité 3. Si l'eau est consommée régulièrement, la Toxicité passe à 5. Les effets de la toxine ne prennent effet qu'au bout de 1D6 jours après absorption.</p>"
    },

    {
        key: "creature-voyageur",
        name: "Voyageur",
        species: "Créature mutante — humanoïde nocturne",
        page: 145,
        attributes: {
            vigor: attribute(3),
            agility: attribute(4),
            spirit: attribute(1),
            empathy: attribute(0)
        },
        skills: { closeCombat: 2, endurance: 3, stealth: 3, reaction: 4, comprehension: 1, observation: 1, survival: 2 },
        naturalProtection: { value: 2, resilience: false, resilienceCondition: "" },
        weapons: [
            attack("Griffes", { bonus: 1, damage: 1 })
        ],
        special: ""
    }
];
