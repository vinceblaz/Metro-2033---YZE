/**
 * Catalogue des Factions extrait du chapitre 2 du livre de
 * règles (« Factions et PNJs », pages 14-65).
 *
 * Donnée pure, aucune dépendance Foundry. Une entrée par Faction
 * (grande ou mineure), conforme à `FactionDataModel`.
 *
 * `notableMembers` est volontairement laissé vide ici : le champ
 * attend un UUID d'Actor (cf. FactionDataModel._memberField()),
 * que l'on ne connaît pas de façon fiable au moment du seed. La
 * liste des personnalités liées à chaque Faction est donnée en
 * toutes lettres dans `description`, et les Actors PNJ
 * correspondants existent séparément dans le compendium
 * « pnj-des-factions » (cf. faction-npc-catalog.mjs) — à lier
 * manuellement via glisser-déposer si souhaité.
 */

function faction(key, name, { ideology = "", leader = "", description = "", resources = "" } = {}) {
    return { key, name, ideology, leader, description, resources };
}


export const FACTIONS = [

    faction("faction-polis", "Polis", {
        ideology: "Méritocratie savante — gouvernée par deux castes (brahmanes, ksatriyas)",
        leader: "Vitaly Misko, président du Conseil",
        description:
            "<p>Cité composée de quatre stations (Alexandrovski Sad, Bibliotéka iméni Lenina, "
            + "Borovitskaya, Arbatskaya), bâtie sous la Bibliothèque d'État de Russie et le "
            + "Ministère de la Défense. Considérée comme le dernier bastion de la civilisation "
            + "pré-apocalyptique : savants, ingénieurs, artistes et philosophes du métro s'y "
            + "retrouvent. Société castée (brahmanes = gardiens du savoir, ksatriyas = guerriers "
            + "et gardiens de l'ordre ; vaishyas = commerçants, sûdras = domestiques), gouvernée "
            + "par un Conseil de cinq brahmanes et cinq ksatriyas. La citoyenneté s'acquiert par "
            + "mérite (érudition, talent martial, biens rares) après une période d'essai.</p>"
            + "<p>Personnalités notables : Vitaly Misko (président du Conseil), Le Doyen (chef des "
            + "brahmanes), Féodor Jouravliov (général en chef des ksatriyas), Commandant Ivachov "
            + "(sécurité de Polis), Colonel Melnikov « Melnik » (stalker légendaire), Danila "
            + "(jeune brahmane), Hunter (éclaireur énigmatique).</p>",
        resources:
            "<p>Savoir, archives, technique, formation militaire d'élite (ksatriyas). Aucune "
            + "faction ne peut rivaliser avec Polis sur le plan intellectuel et scientifique. "
            + "Station considérée comme sanctuaire neutre : aucune faction n'a jamais osé "
            + "l'attaquer.</p>"
    }),

    faction("faction-hanse", "La Hanse", {
        ideology: "Capitalisme libéral — confédération marchande",
        leader: "Vladislav Ilitch Zvorykine, président (récemment élu, tournant puritain)",
        description:
            "<p>Alliance de vingt stations de la ligne marron (Anneau) et de stations radiales "
            + "raccordées, inspirée de la Ligue hanséatique. Économie libérale, propriété privée "
            + "sacrée, statut social défini par la richesse. Grande gagnante de la guerre contre "
            + "la Ligne Rouge (traité de paix il y a un an et demi). Chaque station est dirigée "
            + "par un administrateur ; Komsomolskaya, capitale de fait, héberge le président et "
            + "son cabinet (chef d'état-major, ministre du Commerce, ministre des Affaires "
            + "courantes). Armée régulière de 5000 soldats (un tiers de la population), la mieux "
            + "équipée du métro. Depuis l'arrivée du nouveau président, tournant puritain : "
            + "alcool, jeux d'argent et prostitution de plus en plus réprimés.</p>"
            + "<p>Personnalités notables : Vladislav Ilitch Zvorykine (président), Bogdan "
            + "Khoudiakov (chef d'état-major), Milovan Bajenov (ministre de l'Économie), Grigori "
            + "Astafiev (ministre des Affaires courantes), Pavel Nikonov (administrateur de la "
            + "Paveletskaya).</p>",
        resources:
            "<p>Richesse, confort, équipement de pointe, réseau commercial étendu (taxes de "
            + "séjour et de passage). Vend nourriture, vêtements, produits d'entretien, "
            + "divertissement — tout ce qui a un prix.</p>"
    }),

    faction("faction-ligne-rouge", "La Ligne Rouge (la Krasnaya)", {
        ideology: "Communisme bolchévique — régime totalitaire",
        leader: "Camarade Moskvine, Secrétaire général du Parti (Politburo de 10 chefs de station)",
        description:
            "<p>Coalition soviétique de la ligne Sokolnitcheskaya, née en réaction à l'expansion "
            + "de la Hanse. Collectivisme total, redistribution centralisée à Okhotniy Ryad, "
            + "propagande omniprésente, paranoïa et délation érigées en système (geôles de la "
            + "Loubyanka). Grande perdante (au moins moralement) de la guerre contre la Hanse ; "
            + "tensions croissantes désormais avec le Quatrième Reich. Stations emblématiques : "
            + "Preobrajenskaya Plochtchad (berceau du mouvement), Komsomolskaya (frontière avec "
            + "la Hanse), Loubyanka (geôles du KGB).</p>"
            + "<p>Personnalités notables : Camarade Moskvine (Secrétaire général), Camarade "
            + "Dourov (chef de Komsomolskaya, joue un double jeu avec la Hanse), Camarade "
            + "Pavlenko (chef de la Loubyanka, chef bourreau), Docteur Mucheniya (tortionnaire "
            + "de la Loubyanka). Natasha Kniazeva, « héroïne stalker » de la propagande, est "
            + "présentée explicitement dans le livre comme un personnage fictif — un outil de "
            + "propagande sans existence réelle, à ne pas incarner comme un vrai PNJ.</p>",
        resources:
            "<p>Nombre (nombreux habitants de la Krasnaya), mutualisation des ressources et des "
            + "munitions entre stations, importante réserve d'armes de la Grande Guerre "
            + "patriotique découverte près de la Loubyanka.</p>"
    }),

    faction("faction-quatrieme-reich", "Le Quatrième Reich", {
        ideology: "Néonazisme — suprémacisme racial et totalitarisme",
        leader: "Le Führer (Evgeny Petrovitch), dictateur autocratique",
        description:
            "<p>Trois stations extrêmement militarisées (Pouchkinskaya, Tchekhovskaya, "
            + "Tverskaya), fondées par d'anciens suprémacistes chassés de Pouchkinskaya avant de "
            + "revenir en force. Idéologie de haine envers tout ce qui n'est pas « slave, blanc "
            + "et fort » : Caucasiens, handicapés, homosexuels, communistes. Paradoxalement "
            + "germanophile (culte de l'Allemagne hitlérienne, langue et citations allemandes). "
            + "Ennemi juré de la Ligne Rouge ; guerre imminente à l'étude (« nouvelle "
            + "Blitzkrieg »). Expériences chimiques inquiétantes menées sur les prisonniers de "
            + "Tverskaya.</p>"
            + "<p>Personnalités notables : Le Führer / Evgeny Petrovitch (dictateur), Stanislas "
            + "Vetrov (commandant de la Pouchkinskaya, homme de confiance du Führer), Iegor "
            + "Sadykov (commandant de la Tverskaya, dit « Barbe bleue »), Boris Rochtchine "
            + "(commandant de la Tchekhovskaya, imposteur peu convaincu par la doctrine), Iouri "
            + "Sobolevski (général des armées), Inna Kharlamova (veuve, instigatrice discrète "
            + "d'une révolte des femmes).</p>",
        resources:
            "<p>Puissance militaire et discipline martiale (chaque citoyen est un soldat), "
            + "carburant de bonne qualité produit à Tchekhovskaya (monnaie d'échange "
            + "privilégiée).</p>"
    }),

    faction("faction-confederation-arbat", "La Confédération de l'Arbat", {
        ideology: "Fédération mineure, alliée de la Hanse et de Polis",
        description:
            "<p>Petite sœur de la Hanse. Comprend la station Smolenskaya et deux des trois "
            + "stations de la Kievskaya avec leurs correspondances. Sécurité de plus en plus "
            + "relative à la Kievskaya : disparitions inexpliquées, population désertant peu à "
            + "peu la station, responsable local Kolpakov dépassé. Aucun lien officiellement "
            + "établi avec le Quatrième Reich malgré les soupçons.</p>"
    }),

    faction("faction-confederation-1905", "La Confédération 1905", {
        ideology: "Petite alliance indépendante (ligne 7)",
        description:
            "<p>Ne compte plus que trois stations sur les cinq d'origine de la ligne 7 "
            + "(Octyabrskoë Pole, Begovaya, Oulitsa 1905 goda) : la Polejaïevskaya et une escouade "
            + "envoyée à son secours ont disparu sans laisser de trace, et les tunnels vers ces "
            + "stations ont été dynamités. Alliée à la Hanse (proche géographiquement) sans en "
            + "partager le confort ; collectivisme de façade, misère réelle notamment à "
            + "Begovaya.</p>"
    }),

    faction("faction-cite-emeraude", "La Cité d'Émeraude", {
        ideology: "Alliance intellectuelle et culturelle, quasi-mythique",
        description:
            "<p>Alliance de trois stations (Ouniversitet, Prospekt Vernadskogo, Yougo-Zapadnaya), "
            + "coupée du reste de la ligne Rouge depuis l'effondrement de la station aérienne "
            + "Vorobevy Gory. Élite d'enseignants, chercheurs et étudiants vivant en autonomie "
            + "complète : art, musique, science, tentatives de retour à la surface. Son "
            + "existence réelle est débattue — nul n'en revient jamais pour la confirmer ou "
            + "l'infirmer.</p>"
    }),

    faction("faction-trotskistes", "Les Trotskistes", {
        ideology: "Communisme révolutionnaire international, antifasciste",
        leader: "Camarade Roussakov (chef de la « Première Brigade rouge internationale Ernesto Che Guevara »)",
        description:
            "<p>Groupuscules épars ayant embrassé une lecture trotskiste et internationaliste du "
            + "communisme, opposés à la fois à la Krasnaya (jugée stalinienne) et au Quatrième "
            + "Reich. Basés notamment à Avtozavodskaya. La brigade du camarade Roussakov, la plus "
            + "active, harcèle les stations du Quatrième Reich avec une draisine motorisée ; "
            + "relations ambiguës avec la Ligne Rouge, qui les tolère et les arme "
            + "occasionnellement tout en niant officiellement tout lien.</p>"
    }),

    faction("faction-crime-organise", "Le Crime organisé (Kitaï-Gorod)", {
        ideology: "Aucune — loi du plus fort, racket et trafics",
        description:
            "<p>Stations sous contrôle criminel complet : Kitaï-Gorod (scindée entre les Frères "
            + "Slaves / Kalougiens sur la plateforme de la ligne 6, et les Caucasiens-Musulmans, "
            + "Azéris et Tchétchènes majoritairement, sur celle de la ligne 7 — une taxe de trois "
            + "cartouches s'applique au passage de l'une à l'autre), Tretiakovskaya et "
            + "Novokouznetskaya. Alcool frelaté, drogue, armes, filles, objets pillés sur les "
            + "cadavres.</p>"
    }),

    faction("faction-tour-des-gardiens", "La Tour des Gardiens", {
        ideology: "Secte apocalyptique quasi-religieuse",
        leader: "Doyen Yoann",
        description:
            "<p>Communauté installée dans une rame « Oka » aménagée, dans le tunnel entre "
            + "Serpoukhovskaya et Toulskaya (ligne 9). Dialectique proche des Témoins de Jéhovah : "
            + "l'holocauste nucléaire est vécu comme l'Armageddon annoncé, les survivants comme "
            + "les élus de Dieu. Prosélytisme charitable en façade (accueil, nourriture, "
            + "vêtements) mais dureté marquée envers ceux qui résistent à l'endoctrinement.</p>"
    }),

    faction("faction-satanistes", "Les Satanistes", {
        ideology: "Culte de l'Adversaire (existence non confirmée — rumeur tenace du métro)",
        description:
            "<p>Groupe dont l'existence même est incertaine : selon la rumeur, ils écumeraient "
            + "la Timiriazevskaya, réduiraient en esclavage ceux qui leur tombent entre les mains "
            + "et creuseraient un puits vers l'enfer. Décapitations rituelles évoquées pour ceux "
            + "qui refusent d'obtempérer ou faiblissent à la tâche. Le livre laisse volontairement "
            + "planer le doute sur leur réalité.</p>"
    }),

    faction("faction-culte-grand-ver", "Le Culte du Grand Ver", {
        ideology: "Anti-technologie, millénarisme vengeur",
        description:
            "<p>Groupe de cannibales guidé par des hiérophantes, installé à Park Pobedy derrière "
            + "les gravats du tunnel effondré de la Kievskaya. Considère la chute de l'humanité "
            + "comme la conséquence de l'usage démesuré de la technologie et voue un culte "
            + "vengeur au « Grand Ver ». Recrues sauvageonnes, quasi nues, front marqué d'une "
            + "ligne blanche ondulée, armées de sarbacanes empoisonnées. Dispose d'un accès "
            + "reconnu au réseau du « métro 2 » qui lui permet des incursions furtives (dont "
            + "l'enlèvement d'enfants) bien au-delà de sa station.</p>"
    }),

    faction("faction-vdnkh-alexeievskaya-rijskaya", "VDNKh, Alexeïevskaya, Rijskaya (confédération en devenir)", {
        ideology: "Fédération naissante, non encore constituée",
        description:
            "<p>Trois stations de la ligne 6 (entre Prospekt Mira et Botanitcheskiy Sad) qui "
            + "collaborent de plus en plus pour améliorer leur quotidien sans former, pour "
            + "l'instant, une véritable alliance officielle. VDNKh doit gérer l'apparition "
            + "récente des mutants dits « Noirs » et une surveillance accrue des cordons de "
            + "sécurité ; Rijskaya, proche de la Hanse, envisage une possible expansion.</p>"
    }),

    faction("faction-soeurs-de-la-charite", "Les Sœurs de la Charité", {
        ideology: "Ordre charitable laïc (proposition additionnelle du livre, non localisée)",
        description:
            "<p>Groupe de femmes de tous âges ayant fait le choix de vivre sans hommes pour "
            + "soigner les corps et les cœurs du métro : médecins, infirmières, psychologues, "
            + "sages-femmes. Restaurent, écoutent et soignent gratuitement ceux qui croisent leur "
            + "route ; en retour, nombre de factions leur doivent une forme de protectorat "
            + "tacite. Faction proposée par le livre pour être placée où le MJ le souhaite.</p>"
    }),

    faction("faction-chinatown", "Chinatown", {
        ideology: "Communauté d'exilés (proposition additionnelle du livre, non localisée)",
        description:
            "<p>Communauté formée par un groupe de touristes chinois surpris par l'holocauste "
            + "dans le métro, dont le déracinement fut plus brutal encore que celui des autres "
            + "survivants. Faction proposée par le livre pour être placée où le MJ le souhaite "
            + "(page 66, non entièrement fournie dans cet extrait).</p>"
    }),

    faction("faction-vaishnavistes", "Les Vaishnavistes", {
        ideology: "Secte religieuse d'inspiration hindouiste, prosélyte",
        description:
            "<p>Secte qui emprunterait largement à l'hindouisme, connue pour son prosélytisme et "
            + "sa doctrine douteuse depuis les premiers temps du métro. Anciennement installée à "
            + "Octyabrskoë Pole (confédération 1905) puis expulsée, elle serait restée dans les "
            + "tunnels adjacents. Rumeur récente : elle chercherait à faire sauter le réacteur "
            + "nucléaire de l'Institut Kourtchatov pour « offrir à tout le monde un accès direct "
            + "au nirvana ».</p>"
    })
];
