/**
 * Catalogue des Talents et Archétypes extrait du livre de
 * règles (Chapitre 8 — Les règles, pages 163-189).
 *
 * Donnée pure, aucune dépendance Foundry.
 *
 * Convention de `key` (identifiant mécanique) :
 * 6 Talents ont déjà une implémentation mécanique réelle dans
 * `domain/rules/talents.mjs` (bonus automatisés) — on réutilise
 * alors leur clé existante (favoriteWeapon, brute, weakPoint,
 * weaponSpecialist, rapidFire, sharpshooter). Tous les autres
 * Talents reçoivent une clé stable générée mais NE SONT PAS
 * automatisés : leur effet reste décrit en texte (`effect`),
 * à appliquer manuellement à la table, comme pour les
 * améliorations d'armes du compendium Équipement.
 *
 * Un Talent d'archétype partagé par plusieurs archétypes
 * (ex : Imperturbable, disponible pour Diplomate/Médecin/
 * Trafiquant) est décliné en un Item par archétype éligible
 * (même clé mécanique, `archetypeId` différent), car le schéma
 * `TalentDataModel.archetypeId` est une chaîne unique et non
 * une liste.
 */


function slugToCamelCase(name) {
    const ascii = name
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z0-9\s]/g, " ");

    const words = ascii
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    return words
        .map((word, index) => {
            const lower = word.toLowerCase();
            return index === 0
                ? lower
                : lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join("");
}


// ============================================================
// TALENTS GÉNÉRAUX (22)
// ============================================================

const GENERAL_TALENT_SOURCE = [
    { name: "Arme de prédilection", mechanicalKey: "favoriteWeapon", maxLevel: 2, effect: "Vous êtes un expert dans le maniement d'une catégorie d'armes en particulier (pistolet, pistolet lourd, fusil à pompe, épée, hache, couteau, etc.). Lorsque vous utilisez une telle arme, vous obtenez un modificateur de +1. Vous pouvez développer ce talent indépendamment pour chaque catégorie d'arme. Ne se cumule pas avec le talent d'archétype Spécialiste en armement. Supérieur : le modificateur passe à +2." },
    { name: "Bête de somme", mechanicalKey: "beastOfBurden", maxLevel: 1, effect: "Vous pouvez transporter deux fois plus d'équipement sans être encombré." },
    { name: "Brute", mechanicalKey: "brute", maxLevel: 2, effect: "Vous gagnez un modificateur de +1 sur votre jet de CORPS À CORPS si vous sacrifiez votre action rapide pour le round. Supérieur : le modificateur passe à +2." },
    { name: "Carbochimiste", mechanicalKey: "energyForager", maxLevel: 2, effect: "Le modificateur s'appliquant à vos jets de SURVIE afin d'augmenter les ressources en énergie de votre station n'est que de –1. Supérieur : vous ne subissez plus de modificateur négatif aux jets de Survie pour augmenter les ressources en énergie." },
    { name: "Chanceux", maxLevel: 1, effect: "Lorsque vous faites un jet pour déterminer votre blessure critique, vous pouvez refaire ce jet et choisir entre les deux résultats celui que vous préférez." },
    { name: "Chasseur-cueilleur", mechanicalKey: "foodForager", maxLevel: 2, effect: "Le modificateur s'appliquant à vos jets de SURVIE afin d'augmenter les ressources en nourriture de votre station n'est que de –1. Supérieur : vous ne subissez plus de modificateur négatif aux jets de SURVIE pour augmenter les ressources de nourriture." },
    { name: "Courage", mechanicalKey: "courage", maxLevel: 2, effect: "Lorsque vous êtes la cible d'une attaque de Terreur, les réussites de ce dernier sont réduites de 1 pour vous. Supérieur : seule la moitié (arrondie à l'inférieur) de vos dés de Stress s'ajoute aux attaques de Terreur." },
    { name: "Dégainé rapide", maxLevel: 2, effect: "Vous pouvez dégainer votre arme si vite que cela ne vous coûte aucune action. Supérieur : recharger une arme est pour vous une action rapide." },
    { name: "Dénicheur", mechanicalKey: "equipmentForager", maxLevel: 1, effect: "Vous ne subissez plus de modificateur négatif aux jets de SURVIE pour augmenter les ressources d'équipement de votre station." },
    { name: "Dur à cuire", maxLevel: 2, effect: "Une fois par session de jeu, vous pouvez choisir d'ignorer 1 point de dégâts à la VIGUEUR ou à l'AGILITÉ infligé par une attaque adverse, ou une action d'éclat donnée par un jet réussi de VIGUEUR ou d'AGILITÉ à votre encontre. Supérieur : vous pouvez recourir à ce talent deux fois par session de jeu au lieu d'une seule." },
    { name: "Esquive", mechanicalKey: "dodge", maxLevel: 1, effect: "Lorsque vous bloquez une attaque en combat rapproché, vous pouvez bloquer avec votre AGILITÉ plutôt que votre VIGUEUR (au choix)." },
    { name: "Guérison accélérée", maxLevel: 1, effect: "La période de rémission nécessaire pour vous remettre de vos blessures critiques est divisée par deux (arrondie au supérieur). Si vous bénéficiez également de soins, la période de rémission est arrondie à l'inférieur." },
    { name: "Impitoyable", mechanicalKey: "ruthless", maxLevel: 1, effect: "Vous pouvez réaliser un coup de grâce sans faire de jet d'EMPATHIE (vous subissez toujours 1 point de dégâts à l'EMPATHIE, mais vous ne devez plus cocher une case de sang-froid)." },
    { name: "Maîtrise de soi", mechanicalKey: "selfControl", maxLevel: 2, effect: "Votre maximum de sang-froid passe à 6. Supérieur : votre maximum de sang-froid passe à 7." },
    { name: "Menaçant", mechanicalKey: "intimidating", maxLevel: 2, effect: "Vous pouvez (si vous le souhaitez) faire vos jets de MANIPULATION sous la VIGUEUR plutôt que sous l'EMPATHIE lorsque vous menacez quelqu'un afin qu'il fasse ce que vous voulez. Si vous réussissez, votre adversaire ne peut rien exiger en retour de votre part (il peut toujours choisir de vous attaquer). Supérieur : vous pouvez faire vos jets de MANIPULATION sous la VIGUEUR plutôt que sous l'EMPATHIE en toutes circonstances." },
    { name: "Pharmacologiste", mechanicalKey: "medicineForager", maxLevel: 2, effect: "Le modificateur s'appliquant à vos jets de SURVIE afin d'augmenter vos ressources en médicaments n'est que de –3. Supérieur : le modificateur passe à –2." },
    { name: "Réflexes éclair", mechanicalKey: "quickReflexes", maxLevel: 2, effect: "Vous pouvez piocher deux cartes au lieu d'une seule durant la phase de tirage de l'initiative, et choisir celle que vous souhaitez utiliser. Supérieur : vous pouvez piocher trois cartes au lieu de deux." },
    { name: "Second souffle", mechanicalKey: "secondWind", maxLevel: 1, effect: "Lorsque vous êtes Brisé par suite d'une VIGUEUR réduite à 0, vous pouvez vous remettre sur pied immédiatement sans aide. Faites un jet d'ENDURANCE en n'utilisant que les dés de compétence (non forçable). Pour chaque réussite, vous récupérez 1 point de VIGUEUR perdu. Utilisable une seule fois lorsque vous êtes Brisé ; aucun effet sur les blessures critiques." },
    { name: "Sens du danger", mechanicalKey: "dangerSense", maxLevel: 1, effect: "Vous pouvez (si vous le souhaitez) faire vos jets d'OBSERVATION sous l'EMPATHIE plutôt que sous l'ESPRIT." },
    { name: "Sourcier", mechanicalKey: "waterForager", maxLevel: 2, effect: "Le modificateur s'appliquant à vos jets de SURVIE afin d'augmenter vos ressources en eau n'est que de –2. Supérieur : le modificateur passe à –1." },
    { name: "Temporisation", maxLevel: 2, effect: "Une fois par session de jeu, vous pouvez annuler une affliction (un « 1 ») sur un jet forcé. Supérieur : vous pouvez annuler jusqu'à deux afflictions par session de jeu sur un jet forcé." },
    { name: "Tireur instinctif", mechanicalKey: "instinctiveShooter", maxLevel: 2, effect: "Lorsque vous tirez à couvert, le modificateur appliqué à vos jets de TIR n'est que de –1 au lieu de –2. Supérieur : vous ne subissez plus de modificateur négatif au TIR lorsque vous faites feu depuis un abri ; vous ne subissez pas non plus le modificateur de –1 lorsque vous tirez depuis un véhicule en mouvement." }
];


// ============================================================
// TALENTS D'ARCHÉTYPE (33 talents, déclinés par archétype
// éligible — voir note en tête de fichier)
// ============================================================

const ARCHETYPE_TALENT_SOURCE = [
    { name: "Amélioration", archetypes: ["mechanic"], maxLevel: 2, effect: "Choisissez l'un de vos équipements offrant un bonus de +1 ou +2 : le bonus augmente de +1 de façon permanente. Si vous perdez l'équipement, vous pouvez le remplacer (un quart par équipement) ; le bonus ne fonctionne que pour le propriétaire. Supérieur : vous pouvez choisir un second équipement dont le bonus augmente ; si les deux équipements ont un score de Fiabilité, celui-ci augmente de 1." },
    { name: "Artificier", archetypes: ["soldier"], maxLevel: 2, effect: "Vos jets de TIR bénéficient d'un modificateur de +2 lorsque vous lancez des grenades ou utilisez un lance-roquette ou un mortier. Supérieur : en cas de succès, toutes les cibles à portée courte (mais pas au contact) subissent 1 point de dégâts de VIGUEUR (ou d'ESPRIT pour une grenade étourdissante) supplémentaire." },
    { name: "As de la bricole", archetypes: ["mechanic"], maxLevel: 2, effect: "Vous bénéficiez d'un modificateur de +2 sur votre jet de BRICOLAGE pour réparer quelque chose (et uniquement réparer). Supérieur : le modificateur passe à +3." },
    { name: "Assassin", archetypes: ["infiltrator"], maxLevel: 1, effect: "Lorsque votre ennemi subit une blessure critique, vous pouvez intervertir les résultats du D66 (le dé des unités devient celui des dizaines et inversement). Utilisable uniquement sur les humains." },
    { name: "Compassion", archetypes: ["diplomat", "medic"], maxLevel: 2, effect: "Vous pouvez forcer n'importe quel jet de compétence lié à l'EMPATHIE une seconde fois, mais vous ne pouvez pas relancer les « 1 » (ni les « 6 »). Les afflictions éventuelles ne s'appliquent qu'après ce second jet forcé. Supérieur : vous pouvez à présent relancer les « 1 » obtenus sur le premier jet forcé." },
    { name: "Discipline de groupe", archetypes: ["strategist"], maxLevel: 1, effect: "Lors d'un jet de FURTIVITÉ de groupe ou lorsque vous préparez une embuscade en groupe, vous pouvez choisir de faire le jet de FURTIVITÉ vous-même à la place du PJ ayant le score le plus faible." },
    { name: "Exaltation", archetypes: ["strategist"], maxLevel: 2, effect: "Une fois par combat, au prix d'une action rapide, faites un jet de MANIPULATION (non forçable). En cas de réussite, chaque autre PJ pouvant vous entendre est Exalté jusqu'à la fin du combat : ses dés de Stress obtenant un « 6 » sont éliminés mais produisent une réussite avant de disparaître. Supérieur : le jet de MANIPULATION peut être forcé ; vous pouvez décider que les « 6 » de Stress ne sont plus éliminés pour les PJ qui le demandent." },
    { name: "Fantôme", archetypes: ["infiltrator"], maxLevel: 2, effect: "Lorsque vous vous déplacez discrètement, vos jets de FURTIVITÉ bénéficient d'un modificateur de +2. Supérieur : le modificateur passe à +3." },
    { name: "Forte tête", archetypes: ["trader"], maxLevel: 2, effect: "Lorsque l'on tente de vous Manipuler, vous bénéficiez d'un modificateur de +2 sur votre jet d'ANALYSE pour résister. Supérieur : si vous subissez une MANIPULATION de groupe et que vous n'êtes ni le chef du groupe ni son porte-parole, celui-ci bénéficie de votre modificateur de +2 sur son jet d'ANALYSE s'il le souhaite ; vos facteurs de négociation ne sont jamais altérés par le fait d'être moins nombreux que le groupe adverse." },
    { name: "Garde du corps", archetypes: ["soldier"], maxLevel: 2, effect: "Une fois par round, si quelqu'un à portée courte de vous subit une attaque au contact, vous pouvez vous précipiter pour prendre le coup à sa place (jet de RÉACTION, ne compte pas comme une action, peut être forcé). Supérieur : vous pouvez intercepter une attaque à distance et prendre le projectile à la place de la cible initiale." },
    { name: "Hésitation", archetypes: ["diplomat"], maxLevel: 2, effect: "Jusqu'à deux fois par session de jeu, lorsqu'un adversaire vous attaque au contact ou à courte portée, vous pouvez le faire hésiter en subissant un dé de Stress : il subit alors un modificateur de –2 à son jet d'attaque. Supérieur : lors d'une MANIPULATION réussie, vous pouvez subir un dé de Stress pour forcer votre adversaire à accepter votre proposition (raisonnable) plutôt que de vous attaquer." },
    { name: "Imperturbable", mechanicalKey: "unflappable", archetypes: ["diplomat", "medic", "trader"], maxLevel: 1, effect: "Vous pouvez ignorer une affliction (« 1 ») sur tous vos jets forcés dépendant de l'attribut EMPATHIE." },
    { name: "Inquisiteur", archetypes: ["diplomat", "strategist", "trader"], maxLevel: 2, effect: "Vous pouvez forcer n'importe quel jet de compétence lié à l'ESPRIT une seconde fois, mais vous ne pouvez pas relancer les « 1 » (ni les « 6 »). Les afflictions éventuelles ne s'appliquent qu'après ce second jet forcé. Supérieur : vous pouvez à présent relancer les « 1 » obtenus sur le premier jet forcé." },
    { name: "Investigateur", archetypes: ["diplomat"], maxLevel: 2, effect: "Lorsque vous réussissez un jet de COMPRÉHENSION, pour chaque réussite excédentaire vous obtenez la réponse à l'une des questions d'enquête convenues à la table (ce qui s'est passé, ce qui manque ou a été ajouté, où se trouve un objet caché...). Supérieur : +1 en COMPRÉHENSION lorsque vous concentrez votre attention sur une scène ; +1 en ANALYSE lorsque vous interrogez quelqu'un." },
    { name: "Maître du terrain", archetypes: ["scout"], maxLevel: 2, effect: "Vous n'avez pas besoin de faire de jet de RÉACTION en pénétrant dans une zone encombrée. Une fois par combat, vous mettre à couvert dans votre propre zone ne vous coûte pas d'action. Supérieur : à couvert derrière un abri, vous lancez deux dés supplémentaires pour réduire les dégâts des attaques à distance vous ciblant, tant que la Protection de l'abri n'est pas réduite à 0." },
    { name: "Mental d'acier", mechanicalKey: "steelMind", archetypes: ["strategist", "trader"], maxLevel: 1, effect: "Vous pouvez ignorer une affliction (« 1 ») sur tous vos jets forcés dépendant de l'attribut ESPRIT." },
    { name: "Nerfs d'acier", mechanicalKey: "steelNerves", archetypes: ["scout", "infiltrator", "soldier"], maxLevel: 1, effect: "Vous pouvez ignorer une affliction (« 1 ») sur tous vos jets forcés dépendant de l'attribut AGILITÉ." },
    { name: "Neutralisation", archetypes: ["diplomat"], maxLevel: 2, effect: "Lorsque vous attaquez au contact à mains nues (CORPS À CORPS), vous pouvez déclarer une tentative de neutralisation : +2 à l'attaque, et en cas de réussite vous n'infligez pas de dégâts mais saisissez l'adversaire (règles de saisie). Supérieur : le modificateur passe à +3 ; si les réussites excédentaires suffiraient à réduire la VIGUEUR adverse à 0, la cible tombe inconsciente jusqu'à la fin du tour suivant (sans blessure critique)." },
    { name: "Pilote", mechanicalKey: "pilot", archetypes: ["scout", "mechanic", "strategist"], maxLevel: 2, effect: "Modificateur de +1 sur vos jets de RÉACTION pour piloter un véhicule ; vous ignorez automatiquement une affliction lorsque vous forcez un tel jet. Supérieur : vous pouvez conduire dans une zone encombrée sans réduire la valeur de Déplacement du véhicule ; le modificateur de pilotage passe à +2." },
    { name: "Point faible", archetypes: ["medic"], maxLevel: 2, effect: "Modificateur de +2 pour vos attaques au couteau. Supérieur : les dégâts de vos couteaux passent à 3 au lieu de 2." },
    { name: "Présence rassurante", archetypes: ["medic"], maxLevel: 2, effect: "Une fois par session de jeu, réduisez de moitié (arrondi à l'inférieur) le nombre de dés de Stress d'un autre personnage qui peut vous voir et vous entendre. Supérieur : le personnage peut aussi décocher deux cases de sang-froid ; un traumatisme psychologique en cours pour avoir repoussé ses limites prend immédiatement fin." },
    { name: "Psychologie", archetypes: ["trader"], maxLevel: 1, effect: "Vous pouvez effectuer vos jets de MANIPULATION avec l'attribut ESPRIT plutôt qu'avec l'EMPATHIE si vous le souhaitez." },
    { name: "Ravitaillement", archetypes: ["mechanic"], maxLevel: 2, effect: "Lorsque vous faites un jet de réserve, vous pouvez ignorer un « 1 ». Supérieur : une fois par session de jeu, pour un objet simple que vous seriez susceptible de transporter, un jet de BRICOLAGE réussi (non forçable) signifie que vous l'avez sur vous." },
    { name: "Résistance", mechanicalKey: "resilience", archetypes: ["mechanic", "soldier"], maxLevel: 1, effect: "Vous pouvez ignorer une affliction (« 1 ») sur tous vos jets forcés dépendant de l'attribut VIGUEUR." },
    { name: "Spécialiste en armement", mechanicalKey: "weaponSpecialist", archetypes: ["soldier", "strategist"], maxLevel: 2, effect: "Vous êtes un expert dans le maniement d'un type d'armes (de mêlée, à distance ou lourdes). Lorsque vous utilisez ce type d'armes, vous obtenez un modificateur de +1. Vous pouvez développer ce talent indépendamment pour chaque type d'arme ; ne se cumule pas avec Arme de prédilection. Supérieur : le modificateur passe à +2." },
    { name: "Téméraire", archetypes: ["scout", "infiltrator", "soldier"], maxLevel: 2, effect: "Vous pouvez forcer n'importe quel jet de compétence lié à l'AGILITÉ une seconde fois, mais vous ne pouvez pas relancer les « 1 » (ni les « 6 »). Les afflictions éventuelles ne s'appliquent qu'après ce second jet forcé. Supérieur : vous pouvez à présent relancer les « 1 » obtenus sur le premier jet forcé." },
    { name: "Tenace", archetypes: ["mechanic", "soldier"], maxLevel: 2, effect: "Vous pouvez forcer n'importe quel jet de compétence lié à la VIGUEUR une seconde fois, mais vous ne pouvez pas relancer les « 1 » (ni les « 6 »). Les afflictions éventuelles ne s'appliquent qu'après ce second jet forcé. Supérieur : vous pouvez à présent relancer les « 1 » obtenus sur le premier jet forcé." },
    { name: "Tir rapide", mechanicalKey: "rapidFire", archetypes: ["soldier"], maxLevel: 2, effect: "Vous pouvez tirer avec une arme à feu (non lourde) en utilisant une action rapide plutôt qu'une action lente, mais vous subissez un modificateur de –3 au jet de TIR. Vous ne pouvez pas bénéficier de l'action « viser ». Supérieur : le modificateur passe à –2." },
    { name: "Tireur d'élite", mechanicalKey: "sharpshooter", archetypes: ["infiltrator"], maxLevel: 2, effect: "En position de surveillance, vous disposez d'un modificateur de +1 au TIR. Supérieur : lorsque vous visez, vous disposez d'un modificateur supplémentaire de +1 au TIR." },
    { name: "Toxicologiste", archetypes: ["medic"], maxLevel: 2, effect: "Dès lors que quelqu'un est empoisonné, faites un jet de SOINS avec un modificateur de –1. En cas de succès, vous avez sur vous une dose d'antidote. Utilisable une seule fois par session de jeu. Supérieur : le modificateur devient +1 et vous pouvez utiliser ce talent deux fois par session de jeu." },
    { name: "Tuyau", archetypes: ["trader"], maxLevel: 2, effect: "Lorsque vous recherchez quelque chose (information, objet, personne...) et y avez consacré un quart, faites un jet d'OBSERVATION : en cas de réussite, vous savez où trouver cette chose. Supérieur : si l'objet ou l'information recherchés ne sont pas extrêmement rares ou inconnus des gens que vous fréquentez, la chose entre en votre possession (à la discrétion du MJ)." },
    { name: "Urgentiste", archetypes: ["medic"], maxLevel: 2, effect: "Lorsque vous pratiquez des soins d'urgence sur un patient ayant subi une blessure critique fatale, vous bénéficiez d'un modificateur de +2 sur votre jet de SOINS. Supérieur : pratiquer des soins d'urgence est pour vous une action rapide." },
    { name: "Vigilant", archetypes: ["scout", "infiltrator"], maxLevel: 2, effect: "Modificateur de +2 sur vos jets d'OBSERVATION lorsque vous tentez d'anticiper une attaque surprise. Supérieur : le modificateur passe à +3." },
    { name: "Yeux de la nuit", archetypes: ["scout"], maxLevel: 2, effect: "Vous ne subissez plus le modificateur de –1 lorsque la luminosité est faible, et le modificateur dû à l'obscurité passe à –1. Supérieur : vous ne subissez plus de modificateur négatif dans l'obscurité (mais vous ne pouvez toujours pas voir au-delà de la zone concernée)." }
];


/**
 * Talents généraux, prêts à l'emploi (un Item par Talent).
 */
export const GENERAL_TALENTS = GENERAL_TALENT_SOURCE.map(
    (talent) => ({
        key: `talent-general-${slugToCamelCase(talent.name)}`,
        name: talent.name,
        mechanicalKey: talent.mechanicalKey ?? slugToCamelCase(talent.name),
        archetypeId: "",
        maxLevel: talent.maxLevel,
        effect: talent.effect
    })
);

/**
 * Talents d'archétype, déclinés en un Item par archétype
 * éligible (cf. note en tête de fichier).
 */
export const ARCHETYPE_TALENTS = ARCHETYPE_TALENT_SOURCE.flatMap(
    (talent) => talent.archetypes.map(
        (archetypeId) => ({
            key: `talent-archetype-${slugToCamelCase(talent.name)}-${archetypeId}`,
            name: talent.name,
            mechanicalKey: talent.mechanicalKey ?? slugToCamelCase(talent.name),
            archetypeId,
            maxLevel: talent.maxLevel,
            effect: talent.effect
        })
    )
);


// ============================================================
// ARCHÉTYPES (8)
//
// Reprend le texte de présentation, l'attribut/les compétences
// d'archétype, la liste des Talents d'archétype et l'équipement
// de départ. Les Talents eux-mêmes existent comme Items séparés
// (ci-dessus) ; ce texte les liste ici à titre de référence
// pour le joueur/MJ au moment de la création de personnage.
//
// Fierté / Honte / Liens avec les autres PJ (propres à la
// création de personnage) ne sont pas repris ici : ils relèvent
// du futur chantier « Création de PJ ».
// ============================================================

export const ARCHETYPES = [
    {
        key: "diplomat",
        name: "Diplomate",
        flavor: "Le monde est déjà assez dur comme ça pour ne pas s'entretuer avec le premier voisin venu ou même au sein de votre communauté. Votre rôle consiste à arrondir les angles et à trouver des solutions pacifiques (ou le moins létales possible) aux problèmes.",
        attribute: "Empathie",
        skills: "Analyse, Compréhension, Manipulation.",
        talents: "Compassion, Hésitation, Imperturbable, Inquisiteur, Investigateur, Neutralisation.",
        startingEquipment: "2 grenades étourdissantes. 2 paires de menottes. La photo d'un être cher (bonus d'équipement de +2 sur les jets de Manipulation faisant appel à l'empathie de la cible ; ne fonctionne pas en combat). Masque à gaz. Pistolet (+2 chargeurs). Veste renforcée."
    },
    {
        key: "scout",
        name: "Éclaireur",
        flavor: "Vous êtes la personne à laquelle on fait appel pour repérer les lieux et lorsqu'il s'agit d'accompagner un groupe dans une zone dangereuse. Vous prenez votre tâche très au sérieux, car vous savez à quel point la survie de vos camarades dépend de vous.",
        attribute: "Agilité",
        skills: "Furtivité, Observation, Survie.",
        talents: "Maître du terrain, Nerfs d'acier, Pilote, Téméraire, Vigilant, Yeux de la nuit.",
        startingEquipment: "Boussole (bonus d'équipement de +2 sur les jets de Survie visant à s'orienter). Couteau. Fusil avec silencieux (+2 chargeurs). Jumelles. Lampe torche. Masque à gaz."
    },
    {
        key: "infiltrator",
        name: "Infiltrateur",
        flavor: "Vous êtes doué(e) pour vous infiltrer, même dans les lieux les mieux gardés. Au-delà de la simple reconnaissance et de la récupération d'informations ou de matériel chez l'ennemi, on vous demande parfois « d'éliminer » un problème.",
        attribute: "Agilité",
        skills: "Corps à corps, Furtivité, Tir.",
        talents: "Assassin, Fantôme, Nerfs d'acier, Téméraire, Tireur d'élite, Vigilant.",
        startingEquipment: "Couteau. Fusil avec lunette de visée (x4) (+2 chargeurs). Lampe torche. Masque à gaz. Pistolet avec silencieux (+1 chargeur). Veste renforcée et casque léger."
    },
    {
        key: "mechanic",
        name: "Mécanicien",
        flavor: "Vous avez des doigts de fée et aucun matériel, aucun engin ni aucune machine n'a de secret pour vous. À une époque où les ressources sont devenues si rares et où le matériel doit être entretenu et préservé, vous êtes aussi vital(e) que les meilleurs médecins.",
        attribute: "Vigueur",
        skills: "Bricolage, Compréhension, Réaction.",
        talents: "Amélioration, As de la bricole, Pilote, Ravitaillement, Résistance, Tenace.",
        startingEquipment: "Boîte à outils (autorise les jets de Bricolage). Couteau. Hache. Lampe torche. Pistolet (+2 chargeurs). Vieille moto (motocross)."
    },
    {
        key: "medic",
        name: "Médecin",
        flavor: "Dans un monde où il ne reste plus d'infrastructures médicales dignes de ce nom, vous êtes une perle rare. Vous savez suturer des plaies et réduire des fractures avec ce que vous avez sous la main.",
        attribute: "Empathie",
        skills: "Analyse, Compréhension, Soins.",
        talents: "Compassion, Imperturbable, Point faible, Présence rassurante, Toxicologiste, Urgentiste.",
        startingEquipment: "3 doses d'antipoison. Couteau. Masque à gaz. Pistolet (+2 chargeurs). Trousse de soins (autorise les jets de Soins sans modificateur négatif). Veste renforcée."
    },
    {
        key: "soldier",
        name: "Soldat",
        flavor: "Vous êtes un(e) guerrier(ère). Vous vous entraînez dur, car vous savez que si les choses tournent mal, vous devrez répondre présent(e).",
        attribute: "Agilité ou Vigueur (choix du joueur).",
        skills: "Corps à corps ou Endurance (choix du joueur), Réaction, Tir.",
        talents: "Artificier, Garde du corps, Nerfs d'acier (ou Résistance*), Spécialiste en armement, Téméraire (ou Tenace*), Tir rapide. * Choisir Résistance ou Tenace remplace respectivement Nerfs d'acier ou Téméraire dans la liste des Talents d'archétype accessibles.",
        startingEquipment: "Couteau. Fusil d'assaut (+2 chargeurs). Gilet pare-balles et casque lourd. Lampe torche. Masque à gaz. Pistolet lourd (+2 chargeurs)."
    },
    {
        key: "strategist",
        name: "Stratège",
        flavor: "Vos trucs, ce sont l'anticipation et l'adaptation. Un problème a toujours une solution, et c'est à vous de la trouver. Vous savez exalter vos camarades et votre formation de soldat fait de vous un élément indispensable, même sous le feu ennemi.",
        attribute: "Esprit",
        skills: "Compréhension, Manipulation, Observation.",
        talents: "Discipline de groupe, Exaltation, Inquisiteur, Mental d'acier, Pilote, Spécialiste en armement.",
        startingEquipment: "2 talkies-walkies appareillés. Gilet pare-balles. Jumelles. Lampe torche. Masque à gaz. Pistolet (+2 chargeurs)."
    },
    {
        key: "trader",
        name: "Trafiquant",
        flavor: "Vous avez du bagout, mais c'est surtout votre sens de l'observation et votre volonté qui impressionnent les autres. Vous avez également le chic pour trouver ce que les gens recherchent.",
        attribute: "Esprit",
        skills: "Corps à corps, Manipulation, Observation.",
        talents: "Forte tête, Imperturbable, Inquisiteur, Mental d'acier, Psychologie, Tuyau.",
        startingEquipment: "Couteau. Matraque (objet contondant). Outils de crochetage (bonus d'équipement de +2 sur les jets de Bricolage pour crocheter les serrures). Pistolet (+1 chargeur). Un autre objet au choix. Veste renforcée."
    }
];
