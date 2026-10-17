/**
 * Stations du chapitre 10 du livre de règles (« Station de
 * départ », pages 248-280) : Petchatniki, Doubrovka et
 * Kojoukhovskaya.
 *
 * Chaque entrée correspond aux champs de `StationDataModel`
 * (cf. src/data/items/station-model.mjs). Comme pour les
 * Factions, `notableNPCs` est volontairement laissé vide : les
 * UUID des Actors PNJ ne sont pas connus au moment de la
 * construction du catalogue. Les personnalités notables sont
 * listées en toutes lettres dans `description`, et détaillées
 * en Actors dans `station-npc-catalog.mjs`.
 *
 * Le champ `line` n'est renseigné que lorsque le livre le
 * précise explicitement. Petchatniki est le terminus documenté
 * de la ligne Lyublinsko-Dmitrovskaya (vert clair) ; Doubrovka
 * et Kojoukhovskaya sont présentées comme des stations situées
 * au-delà de ce terminus, sans qu'aucune ligne officielle ne
 * leur soit assignée dans le texte — `line` reste donc vide
 * pour ces deux-là plutôt que d'inventer une donnée absente du
 * livre.
 */

function connection(station, dangerLevel, description) {
    return { station, dangerLevel, description };
}

export const STATIONS = [

    // ================= PETCHATNIKI =================

    {
        key: "station-petchatniki",
        name: "Petchatniki",
        page: 248,
        line: "Lyublinsko-Dmitrovskaya (vert clair) — terminus (les stations au-delà sont inondées)",
        population: { level: 4, members: 343 },
        resources: { water: 7, food: 5, equipment: 5, energy: 6, medicine: 5 },
        supportPersonnel: { water: 0, food: 0, equipment: 0, energy: 0, medicine: 0 },
        status: "Station indépendante, pénurie de Nourriture et d'Équipement (marquées « (P) » dans le livre). Dirigée par un triumvirat sous la houlette de Galina « Mamouchka » Botcharova (chef), assistée de Stanislav Vorobiov (conseiller sécurité, défense, exploration) et Oleg Dmitriev (intendant, comptable). Paix précaire et accord d'entraide officieux avec Kojoukhovskaya depuis la fin des pillages.",
        controllingFaction: "",
        description: `<p><strong>Petchatniki</strong> n'était autrefois qu'une des nombreuses stations de la ligne Lyublinsko-Dmitrovskaya (vert clair), mais elle en est désormais le terminus, les stations au-delà étant inondées (Lyublino intégralement immergée, Voljskaya et Bratislavskaya également sous les eaux). Rivale de VDNKh dans le roman de Dmitry Glukhovsky, elle est ici proposée comme station de départ clé en main pour les PJ.</p>
<p>Station « mille-pattes » à trois travées, quai de 13 m de large sur 160 m de long, colonnes de marbre rose, murs de marbre gris, sol de granit gris et rouge, plafond d'aluminium à néons morts. Architecture typique des stations peu profondes (5 m sous la surface).</p>
<p>Économie fondée sur l'élevage de poules, la culture de champignons (dans les tunnels, très prolifique grâce à l'humidité) et la fabrication d'un thé (moins réputé que celui de VDNKh mais moins cher) qui sert de véritable monnaie d'échange de la station, contre armes et porc.</p>
<p>La station dispose d'un accès sécurisé vers la surface (le dépôt de Petchatniki), riche en ressources exploitables (magasin de matériau de construction, garage automobile, magasin d'électronique, supermarché, pharmacies) mais dont l'exploitation reste risquée et se fait sur la base du volontariat des stalkers.</p>
<p><strong>Personnalités notables :</strong> Galina « Mamouchka » Botcharova (chef, Diplomate), Stanislav Vorobiov (conseiller sécurité, Soldat), Oleg Dmitriev (intendant, Trafiquant), Ekaterina Boutourlina (jeune espionne au service de Mamouchka, Infiltrateur), Leonid Brahmane Silaïev (mythomane charmeur récemment arrivé, se prétend brahmane de Polis, Diplomate), Matveï (mécanicien muet et bourru, Mécanicien), Rate (diseuse de bonne aventure et guérisseuse excentrique, Médecin).</p>
<p>La « Peine du Silence » est le châtiment le plus emblématique de Petchatniki : exclusion symbolique de deux à vingt-et-un jours (gilet orange, interdiction de parole), dernière extrémité avant l'exil.</p>`,
        market: "<p>Le thé de champignon est la véritable monnaie d'échange de Petchatniki (contre armes et porc, notamment avec Kojoukhovskaya). Le dépôt de surface offre un accès à un magasin de matériau de construction, un garage automobile, un magasin d'électronique, un supermarché et des pharmacies — exploités au fil du temps par les stalkers de la station.</p>",
        defenses: "<p>Deux accès à l'extérieur condamnés par de lourds rideaux métalliques rivés au sol, renforcés de morceaux de rail. Postes d'observation de fortune vers l'extérieur (petites ouvertures dans les corniches). Vigies improvisées côté Kojoukhovskaya. Les excursions à la surface nécessitent l'autorisation écrite du chef et ne se font jamais en solitaire. Les « stalkers du dimanche » de la station n'ont pas d'équipement propre : ils utilisent des combinaisons fournies par Kojoukhovskaya en échange de la revente de leurs trouvailles.</p>",
        connections: [
            connection(
                "",
                "Modéré (accord de paix précaire)",
                "Tunnel vers Kojoukhovskaya (~3 km) ; combats rituels organisés par Khamzat Gouriev pour les visiteurs de Petchatniki."
            ),
            connection(
                "",
                "Impraticable (station inondée)",
                "Escalier côté Kojoukhovskaya muré depuis longtemps ; côté Voljskaya, hall dégagé mais Voljskaya, Bratislavskaya et Lyublino sont sous les eaux au-delà."
            )
        ],
        notableNPCs: [],
        gmNotes: "<p>Pages 248-263 du livre. Encadré « La Peine du Silence » (p.250) et « Une épidémie ? » (p.253-254, référence au roman Métro 2033 et à l'Aviamotornaya — accroche scénaristique optionnelle, à situer plutôt dans le dernier trimestre de 2033 si utilisée). Accroches : rumeur de moustiques géants au-delà de la voie sud, tensions démographiques croissantes (records de naissances, stocks de compléments alimentaires épuisés), rivalité douce avec VDNKh sur la qualité du thé.</p>"
    },

    // ================= DOUBROVKA =================

    {
        key: "station-doubrovka",
        name: "Doubrovka",
        page: 264,
        line: "",
        population: { level: 5, members: 496 },
        resources: { water: 7, food: 8, equipment: 6, energy: 8, medicine: 6 },
        supportPersonnel: { water: 0, food: 0, equipment: 0, energy: 0, medicine: 0 },
        status: "Station indépendante prospère, pénurie d'Équipement et d'Énergie (marquées « (P) » dans le livre). Gouverneur : Mikhaïl Aksakov. Alliance commerciale avec la Hanse scellée par le mariage de sa fille Fedora Aksakova au gouverneur de la Tagansko-Krasnopresnenskaya (ligne violette). Militarisation récente et croissante (rumeur d'acquisition d'un lance-flammes).",
        controllingFaction: "",
        description: `<p><strong>Doubrovka</strong> a dû survivre au voisinage d'une station gérée par un groupe criminel (Kojoukhovskaya) et à l'état catastrophique de toutes les voies qui l'entourent : le commerce est devenu l'arme de survie de ses habitants. Il y a une dizaine d'années, alors moribonde, la station a bénéficié d'une chance incroyable lorsqu'un éclaireur de la Hanse, tombé sous le charme de Fedora Aksakova (fille du chef Mikhaïl), a convaincu son gouverneur de demander sa main. Mikhaïl a laissé sa fille libre de choisir, et Fedora a accepté à condition que la Hanse fasse de Doubrovka un comptoir commercial : un marché mensuel s'y tient désormais.</p>
<p>Architecture à trois voûtes, hall central encadré de larges piliers, style proche des stations du centre. Nombreuses habitations sur la plateforme (tentes et quelques structures en bois), portiques dégagés pour laisser place au commerce, quatre escaliers mécaniques (les deux du centre réservés aux vendeurs à la sauvette).</p>
<p>La station compte environ cinq cents habitants à temps complet (le double les jours de marché). Le commerce y est très libéral : les litiges se règlent par accord entre parties ou, à défaut, par l'arbitrage payant (25 cartouches) de Mikhaïl ou d'une personne désignée par lui — une justice qui commence à attiser les convoitises d'une « ligue des colporteurs » menée par Revaz Averine.</p>
<p><strong>Personnalités notables :</strong> Mikhaïl Aksakov (chef de la station, Stratège), Fedora Aksakova (sa fille, clé de voûte de l'accord commercial avec la Hanse, Infiltrateur), Revaz Averine (président de la ligue des colporteurs, responsable du commerce et des manufactures de textile, Trafiquant), Vera Zadornova (« la Mère Bougon », ancienne chanteuse d'opéra devenue conteuse appréciée des enfants, Diplomate).</p>`,
        market: "<p>Marché mensuel organisé avec la Hanse (accord scellé par le mariage de Fedora). Revaz Averine dirige les manufactures de textile (chemises, sous-vêtements) et la ligue des colporteurs. Taxes de passage et de commerce courantes ; les marchandises stratégiques (viande, armes, eau) peuvent être réquisitionnées en cas de besoin de pression sur les marchands.</p>",
        defenses: "<p>Militarisation sérieuse depuis quelques années grâce au soutien de la Hanse : soldats chargés d'escorter les convois, d'assurer la tranquillité de la station et de surveiller les échanges risqués, surtout les jours de marché. Rumeur (non confirmée) d'acquisition d'un lance-flammes. Zone de stockage dissimulée derrière une porte en acier renforcée et cadenassée. Passerelle offrant un poste d'observation sur le quai.</p>",
        connections: [
            connection(
                "",
                "Modéré (accord de paix négocié)",
                "Voisinage direct de Kojoukhovskaya ; accord de tranquillité négocié par Samuel Vedernikov."
            ),
            connection(
                "",
                "Faible (commerce actif mais voies dégradées)",
                "Voies vers Krestyanskaya Zastava et la Hanse détériorées sur plusieurs tronçons ; convois piétons nécessaires pour le commerce du thé."
            )
        ],
        notableNPCs: [],
        gmNotes: "<p>Pages 264-271 du livre. Plan de la station : stockage dissimulé, appartements de Fedora, de Mikhaïl et de Revaz, vendeurs à la sauvette, passerelle. Accroche : contre-pouvoir naissant de la ligue des colporteurs face à Mikhaïl, qui pourrait à terme déstabiliser l'accord avec la Hanse.</p>"
    },

    // ================= KOJOUKHOVSKAYA =================

    {
        key: "station-kojoukhovskaya",
        name: "Kojoukhovskaya",
        page: 272,
        line: "",
        population: { level: 4, members: 288 },
        resources: { water: 6, food: 6, equipment: 8, energy: 6, medicine: 6 },
        supportPersonnel: { water: 0, food: 0, equipment: 0, energy: 0, medicine: 0 },
        status: "Station criminelle indépendante, pénurie d'Équipement, d'Énergie et de Médicaments (marquées « (P) » dans le livre). Prise de pouvoir violente de Samuel Vedernikov, qui règne sur la station avec cinq hommes de main. Économie fondée sur la drogue (champignons hallucinogènes) et la prostitution. Accord de paix officieux avec Petchatniki et relation commerciale étroite avec Doubrovka.",
        controllingFaction: "",
        description: `<p><strong>Kojoukhovskaya</strong> a toujours été envahie par la pègre : seule la loi du plus fort y prévalait, et ceux qui venaient y marchander ne revenaient pas toujours chez eux. La station a gagné en stabilité et en organisation depuis la prise de pouvoir violente de Samuel Vedernikov, plus porté sur l'organisation à long terme que son prédécesseur.</p>
<p>Architecture étrangement dépouillée : plus de 160 mètres de quai sans colonnes, soutenus par une unique voûte. Quais très désordonnés, éclairage économisé, zones d'ombre entretenues pour les activités les moins licites. Le tunnel vers Petchatniki (condamné aux deux tiers) concentre la majeure partie de la réputation sulfureuse de la station : fabrication industrielle de drogue, lupanar (la Lyuba et une quinzaine de prostituées), et geôles où les prisonniers survivent parfois sans qu'on les nourrisse.</p>
<p>Une taxe de passage (1 cartouche par personne, jusqu'à 2 en cas de « comportement inapproprié ») s'applique à tous les visiteurs ; les commerçants s'acquittent en plus d'environ 5 % de leurs ventes (10 % pour les armes). Cette économie de la peur et de la dépendance repose sur un équilibre de terreur maintenu par Vedernikov et ses hommes.</p>
<p><strong>Personnalités notables :</strong> Samuel Vedernikov (chef de la station, ancien membre de la Bratva, Stratège), Mujāhid (son exécuteur froid et sans émotion, Infiltrateur), Khamzat Gouriev (homme de main, organisateur des combats rituels du tunnel de Petchatniki, Soldat), la Lyuba (tenancière du lupanar, manipulatrice redoutée, Trafiquant).</p>`,
        market: "<p>Économie fondée sur la drogue (champignons hallucinogènes, production quasi industrielle) et la prostitution (lupanar d'une quinzaine de prostituées). Taxe de passage d'1 à 2 cartouches par personne ; taxe commerçants d'environ 5 % des ventes (10 % pour les armes). Les cargaisons de valeur (viande, armes, eau) peuvent être réquisitionnées en partie sous la pression des hommes de Vedernikov.</p>",
        defenses: "<p>Bureau de Vedernikov entouré de vieux paravents, hommes en armes assurant la garde en permanence. Cinq hommes de main redoutés (dont Mujāhid et Khamzat Gouriev). Local d'interrogatoire à l'étage, suffisamment proche des quais pour que les cris servent d'avertissement. Geôles au bout du tunnel condamné vers Petchatniki.</p>",
        connections: [
            connection(
                "",
                "Modéré (accord de paix précaire)",
                "Tunnel vers Petchatniki (~3 km), condamné aux deux tiers ; combats rituels organisés par Khamzat Gouriev."
            ),
            connection(
                "",
                "Faible (voisinage direct, commerce actif)",
                "Accès direct à Doubrovka ; principal débouché commercial de la drogue et lieu où Vedernikov s'approvisionne en porc."
            )
        ],
        notableNPCs: [],
        gmNotes: "<p>Pages 272-278 du livre. Plan de la station : local d'interrogatoire, bureau de Vedernikov, réfectoire, lupanar, zone de fabrication des drogues, geôles, zone d'habitation de Vedernikov et de ses hommes de confiance. Accroche : rivalité larvée entre Khamzat et le jeune « Mujāhid », que Vedernikov redoute sans se résoudre à l'éliminer.</p>"
    }
];
