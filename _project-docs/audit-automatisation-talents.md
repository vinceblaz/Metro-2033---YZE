# Audit d'automatisation des Talents — Metro 2033 YZE (03/10/2026)

Audit demandé par le porteur du projet pour distinguer, parmi les ~55 Talents
du catalogue, ce qui peut raisonnablement être automatisé mécaniquement de ce
qui doit rester narratif ou à l'appréciation du MJ — **avant** toute
implémentation. Ce document est le constat factuel ; aucune priorité ni plan
d'implémentation n'y est encore arrêté.

## Méthode et périmètre

Analyse exhaustive de `src/data/seed/talent-archetype-catalog.mjs` (22
Talents généraux + 34 noms de Talents d'archétype distincts, déclinés par
archétype éligible), confrontée aux implémentations réelles de
`src/domain/rules/talents.mjs` (6 clés mécaniques : `favoriteWeapon`,
`brute`, `weakPoint`, `weaponSpecialist`, `rapidFire`, `sharpshooter`).

`src/domain/rules/talent-progression.mjs` ne concerne que le coût XP/
déblocage de niveau, jamais l'effet de jeu du Talent — il n'intervient donc
pas dans cette classification.

`src/data/items/talent-model.mjs` confirme l'architecture : chaque Talent a
un `key` (identifiant mécanique stable), un champ `effect` informatif (« La
logique mécanique réelle reste dans domain/rules/talents.mjs ») et un champ
`configuration` (weaponCategory/weaponType/skill/attribute/custom) déjà
prévu pour paramétrer les futurs Talents automatisés.

Chaque Talent non automatisé a été classé selon le texte **exact** de son
`effect` dans le catalogue, sans extrapolation. Quand l'effet contient une
partie mécanique claire et une partie à jugement, c'est signalé
explicitement plutôt que tranché arbitrairement.

## Tableau récapitulatif (état initial, avant implémentation)

| Catégorie | Nombre |
|---|---|
| Déjà automatisés (mécanique réelle existante) | 6 |
| Automatisable directement | 39 |
| Automatisable avec déclencheur manuel | 9 |
| Reste narratif / appréciation du MJ | 2 |
| **Total Talents (noms distincts)** | **56** |

(22 Talents généraux + 34 noms de Talents d'archétype distincts, certains
étant déclinés sur plusieurs archétypes sans changer de classification.)

> **Note de staleness (03/10/2026)** : ce tableau et les sections 1 à 4
> ci-dessous reflètent le classement **initial**, avant les lots
> d'implémentation et le ré-audit « automatisable vs appréciation narrative
> du MJ » menés ensuite avec le porteur du projet. Voir la section
> **« Mise à jour de clôture »** en fin de document pour l'état réel et
> définitif du chantier.

## 1. Déjà automatisés (6)

- **Arme de prédilection** (général) — `favoriteWeapon`
- **Brute** (général) — `brute`
- **Point faible** (Médecin) — `weakPoint`
- **Spécialiste en armement** (Soldat, Stratège) — `weaponSpecialist`
- **Tir rapide** (Soldat) — `rapidFire`
- **Tireur d'élite** (Infiltrateur) — `sharpshooter`

## 2. Automatisable directement (39)

Effet numérique/mécanique clair, contexte détectable objectivement (type
d'arme, type de jet, attribut, état de personnage), sans jugement narratif
requis.

### Talents généraux (17)

| Talent | Justification (fidèle au texte) |
|---|---|
| Bête de somme | Double la capacité d'équipement sans encombrement — valeur numérique fixe, sans condition. |
| Carbochimiste | Modificateur chiffré (–1 puis 0) sur un type de jet de SURVIE précis (ressources énergie). |
| Chanceux | Permet de refaire le jet de blessure critique et de choisir le résultat — règle fixe, roll d'un type de jet identifiable. |
| Chasseur-cueilleur | Modificateur chiffré (–1 puis 0) sur le jet de SURVIE (ressources nourriture). |
| Courage | Réduit de 1 les réussites d'une attaque de Terreur (ou retient la moitié des dés de Stress au niveau supérieur) — contexte d'action identifiable. |
| Dégainé rapide | Dégainer sans coût d'action, recharger en action rapide au niveau supérieur — règle de coût d'action fixe. |
| Dénicheur | Supprime le modificateur négatif sur le jet de SURVIE (ressources équipement) — sans condition. |
| Esquive | Permet de bloquer au choix avec AGILITÉ plutôt que VIGUEUR — choix libre du joueur sans condition narrative. |
| Guérison accélérée | Divise par deux (ou arrondit différemment selon soins reçus) la période de rémission — formule chiffrée. |
| Impitoyable | Supprime le jet d'EMPATHIE pour un coup de grâce — règle fixe (le coût en dégâts/sang-froid reste chiffré). |
| Maîtrise de soi | Augmente le maximum de sang-froid à 6 (puis 7) — simple modification de caractéristique. |
| Pharmacologiste | Modificateur chiffré (–3 puis –2) sur le jet de SURVIE (ressources médicaments). |
| Réflexes éclair | Pioche 2 (puis 3) cartes d'initiative au lieu d'une — règle de tirage fixe. |
| Second souffle | Jet d'ENDURANCE défini (dés de compétence seuls, non forçable) déclenché par un état détectable (Brisé, VIGUEUR à 0), récupération chiffrée par réussite. |
| Sens du danger | Permet au choix de faire les jets d'OBSERVATION sous EMPATHIE plutôt qu'ESPRIT — choix libre, sans condition narrative annexe. |
| Sourcier | Modificateur chiffré (–2 puis –1) sur le jet de SURVIE (ressources eau). |
| Tireur instinctif | Modificateur chiffré (–1 au lieu de –2, puis 0) lors d'un tir à couvert / depuis un véhicule — contexte d'action identifiable (couvert, véhicule). |

### Talents d'archétype (22)

| Talent | Archétype(s) | Justification |
|---|---|---|
| Amélioration | Mécanicien | Augmente de façon permanente et chiffrée (+1) le bonus d'un équipement choisi — modification de donnée, sans ambiguïté (agit sur l'objet d'équipement, pas sur le pool de dés d'une action). |
| Artificier | Soldat | Modificateur chiffré (+2) au TIR avec grenades/lance-roquette/mortier, dégât supplémentaire chiffré en cas de réussite — type d'arme identifiable. |
| As de la bricole | Mécanicien | Modificateur chiffré (+2 puis +3) au BRICOLAGE, limité à la réparation — sous-type d'action identifiable. |
| Assassin | Infiltrateur | Permet d'intervertir les dés du D66 sur une blessure critique infligée à un humain — règle fixe, condition (cible humaine) vérifiable. |
| Compassion | Diplomate, Médecin | Permet de forcer un jet lié à l'EMPATHIE une seconde fois avec restriction de relance précise — mécanique de forçage classique. |
| Fantôme | Infiltrateur | Modificateur chiffré (+2 puis +3) en FURTIVITÉ lors d'un déplacement discret — sous-type d'action identifiable. |
| Forte tête | Trafiquant | Modificateur chiffré (+2) en ANALYSE pour résister à une Manipulation ; effet avancé plus complexe (transfert du bonus au groupe, facteurs de négociation) mais toujours décrit en termes mécaniques précis. |
| Imperturbable | Diplomate, Médecin, Trafiquant | Ignore une affliction (« 1 ») sur tout jet forcé lié à EMPATHIE — règle fixe par attribut. |
| Inquisiteur | Diplomate, Stratège, Trafiquant | Force un jet lié à l'ESPRIT une seconde fois avec restriction de relance précise — même famille que Compassion/Téméraire/Tenace. |
| Maître du terrain | Éclaireur | Supprime un jet de RÉACTION en zone encombrée, coût d'action nul pour se couvrir, dés supplémentaires chiffrés pour réduire les dégâts à couvert — toutes conditions détectables (zone, couvert, Protection). |
| Mental d'acier | Stratège, Trafiquant | Ignore une affliction (« 1 ») sur tout jet forcé lié à l'ESPRIT. |
| Nerfs d'acier | Éclaireur, Infiltrateur, Soldat | Ignore une affliction (« 1 ») sur tout jet forcé lié à l'AGILITÉ. |
| Neutralisation | Diplomate | Modificateur chiffré (+2 puis +3) pour une attaque à mains nues déclarée « neutralisation », effet chiffré défini (saisie, K.O. sans blessure critique) — déclaration d'action identifiable. |
| Pilote | Éclaireur, Mécanicien, Stratège | Modificateur chiffré (+1 puis +2) en RÉACTION pour piloter, ignore automatiquement une affliction, règles de conduite en zone encombrée — contexte (pilotage) identifiable. |
| Psychologie | Trafiquant | Permet au choix de faire les jets de MANIPULATION sous ESPRIT plutôt qu'EMPATHIE — choix libre sans condition narrative annexe. |
| Résistance | Mécanicien, Soldat | Ignore une affliction (« 1 ») sur tout jet forcé lié à la VIGUEUR. |
| Téméraire | Éclaireur, Infiltrateur, Soldat | Force un jet lié à l'AGILITÉ une seconde fois avec restriction de relance précise. |
| Tenace | Mécanicien, Soldat | Force un jet lié à la VIGUEUR une seconde fois avec restriction de relance précise. |
| Toxicologiste | Médecin | Jet de SOINS à modificateur chiffré (–1 puis +1) déclenché par un état détectable (personnage empoisonné), résultat défini (dose d'antidote disponible). |
| Urgentiste | Médecin | Modificateur chiffré (+2) en SOINS sur soins d'urgence pour blessure critique fatale, coût d'action réduit au niveau supérieur — contexte identifiable. |
| Vigilant | Éclaireur, Infiltrateur | Modificateur chiffré (+2 puis +3) en OBSERVATION pour anticiper une attaque surprise — sous-type d'action identifiable. |
| Yeux de la nuit | Éclaireur | Supprime/réduit des modificateurs chiffrés liés à la luminosité/obscurité — condition d'éclairage objectivement détectable si modélisée par le moteur. |

## 3. Automatisable avec un déclencheur manuel (9)

Effet mécanique et chiffré, mais dépendant d'une limite d'usage (par
session/combat/round) ou d'une condition/déclaration que le code ne peut pas
vérifier seul — adapté à une case à cocher ou un bouton dans la fenêtre de
préparation.

### Talents généraux (3)

| Talent | Justification |
|---|---|
| Dur à cuire | « Une fois par session de jeu, vous pouvez choisir d'ignorer 1 point de dégâts... » — effet chiffré mais nécessite un compteur d'usage par session et une décision active au moment de subir le coup. |
| Menaçant | Le changement d'attribut (VIGUEUR au lieu d'EMPATHIE) est un choix mécanique simple, mais le texte ajoute un effet narratif non chiffré (« votre adversaire ne peut rien exiger en retour ») qui dépasse un simple modificateur de dés. |
| Temporisation | « Une fois par session de jeu, vous pouvez annuler une affliction... » — effet chiffré mais limité par un compteur de session et déclenché après le résultat du jet. |

### Talents d'archétype (6)

| Talent | Archétype(s) | Justification |
|---|---|---|
| Discipline de groupe | Stratège | Permet de se substituer au PJ ayant le score le plus faible pour un jet de groupe — substitution mécanique mais nécessitant une déclaration manuelle, pas un calcul automatique. |
| Exaltation | Stratège | « Une fois par combat »... statut de groupe (« Exalté ») avec portée auditive et gestion individuelle des dés de Stress jusqu'à la fin du combat, plus une clause d'opt-out au niveau supérieur — effet chiffré mais état/condition difficile à suivre automatiquement. |
| Garde du corps | Soldat | « Une fois par round... vous pouvez vous précipiter pour prendre le coup à sa place » — substitution de cible réactive nécessitant une déclaration manuelle au moment de l'attaque. |
| Hésitation | Diplomate | Effet chiffré (–2 à l'attaque adverse) mais déclenché manuellement (dé de Stress sacrifié), limité à deux fois par session ; la clause avancée ajoute une « proposition (raisonnable) » qui suppose un jugement du MJ. |
| Présence rassurante | Médecin | « Une fois par session de jeu, réduisez de moitié... » — effet chiffré mais limité par session et nécessitant de désigner manuellement la cible. |
| Ravitaillement | Mécanicien | Le premier palier (ignorer un « 1 » sur un jet de réserve) est quasi automatisable seul, mais le niveau supérieur dépend d'un « objet simple que vous seriez susceptible de transporter » — jugement de plausibilité laissé à la table. |

## 4. Reste narratif / appréciation du MJ (2)

| Talent | Archétype(s) | Justification |
|---|---|---|
| Investigateur | Diplomate | « Vous obtenez la réponse à l'une des questions d'enquête convenues à la table » — l'effet consiste à livrer une information narrative définie par le MJ, pas un modificateur de jeu. |
| Tuyau | Trafiquant | Le niveau de base révèle où trouver quelque chose (information narrative) ; le niveau supérieur précise explicitement « à la discrétion du MJ » pour faire apparaître l'objet/l'information recherchés. |

## Remarques méthodologiques (ambiguïtés signalées, sans trancher)

- **Amélioration**, **Bête de somme**, **Maîtrise de soi**, **Chanceux**,
  **Guérison accélérée**, **Second souffle** sont classés « Automatisable
  directement » mais n'opèrent pas sur le même sous-système que les 6
  Talents déjà câblés (ActionModifierService / pool de dés d'une action) :
  ils touchent respectivement l'équipement, l'encombrement, une
  caractéristique, la table de blessure critique, et la période de
  rémission. Mécaniquement non ambigus, mais une automatisation réelle
  suppose que ces sous-systèmes existent déjà ou soient développés.
- **Forte tête** et **Ravitaillement** ont une clause de base nette et
  chiffrée mais une clause avancée plus complexe (facteurs de négociation
  de groupe pour Forte tête ; plausibilité de l'objet pour Ravitaillement)
  — classés respectivement Direct et Partiel en tenant compte du poids de
  ces nuances.
- **Tireur instinctif**, **Yeux de la nuit**, **Courage** supposent que le
  moteur modélise des faits de contexte comparables à `overwatch`/`aiming`
  (déjà utilisés pour Tireur d'élite) — couvert, véhicule en mouvement,
  luminosité, attaque de Terreur. Le texte de leur effet est lui-même sans
  ambiguïté ; la faisabilité dépend de l'existence de ces faits de contexte
  dans le moteur.

## Mise à jour de clôture (03/10/2026)

Le chantier Talents est considéré clos à ce stade. Bilan final après
plusieurs lots d'implémentation et un ré-audit complet avec le porteur du
projet (distinguant automatisable / déclencheur manuel / appréciation
narrative du MJ) — **ce bilan remplace le tableau récapitulatif de la
section « Méthode et périmètre » ci-dessus, devenu obsolète** :

### Automatisés (23)

15 Talents génériques du moteur action-resolution (`domain/rules/talents.mjs`) :
Arme de prédilection, Brute, Point faible, Spécialiste en armement, Tir
rapide, Tireur d'élite, Sourcier, Chasseur-cueilleur, Carbochimiste,
Pharmacologiste, Dénicheur, Esquive, Sens du danger, Menaçant, Tireur
instinctif.

+ Courage (terror-roll-chat.mjs), Bête de somme (encombrement),
Maîtrise de soi (sang-froid), Réflexes éclair (initiative) — sous-systèmes
dédiés, accrochage direct sur `actor.items`.

+ Imperturbable, Mental d'acier, Nerfs d'acier, Résistance (famille
« ignorer une affliction », afflictions.mjs).

### Relèvent du MJ / narratif, pas d'automatisation pertinente (9)

Investigateur, Tuyau, Ravitaillement (palier 2 — plausibilité de l'objet),
Forte tête (clause avancée — facteurs de négociation de groupe),
Compassion, Inquisiteur, Téméraire, Tenace (famille 3e Push — la limite à
2 Push est une règle de table volontaire, pas une lacune technique ; y
déroger est une décision de MJ, pas un sous-système), et la notion de
session (Dur à cuire, Temporisation, Hésitation, Présence rassurante,
Toxicologiste — compteur par session laissé au MJ).

### Nécessitent un sous-système non cadré, non automatisables en l'état (9)

Audit d'infrastructure mené le 03/10/2026 (lecture du code existant,
aucune implémentation engagée) :

| Talent | Sous-système manquant |
|---|---|
| Second souffle | Statut « Brisé » détectable + fonction de soin de VIGUEUR (absente d'actor.mjs — `takeAttributeDamage` refuse les montants négatifs). Le jet ENDURANCE compétence-seule non forçable est, lui, déjà faisable avec l'infra existante (DicePool + pattern `canPush:false`). |
| Chanceux / Assassin | Le jet de blessure critique (D66) passe par une RollTable Foundry standard (`table.draw()`) ; aucun code n'intercepte/sépare les deux dés avant résolution pour permettre une relance ou une interversion dizaines/unités. |
| Guérison accélérée | Le modèle de données (`recovery.totalDays`/`remainingDays`) existe mais aucun service ne calcule ni ne décrémente la rémission ; rien à diviser par deux tant que ce calcul n'existe pas. |
| Impitoyable | Aucune mécanique de coup de grâce dans le code (ni jet d'EMPATHIE, ni case de sang-froid associée) — à construire intégralement. |
| Dégainé rapide | « Recharger » est déjà une action lente dans `combat-actions.mjs` (câblage direct possible pour le niveau supérieur) ; mais « dégainer » n'est pas une action répertoriée — en l'absence de règle de base confirmée sur son coût, impossible d'automatiser le niveau normal sans inventer une donnée. |
| Discipline de groupe | Aucune notion de « jet de groupe » dans le code. |
| Garde du corps | Aucun mécanisme de redirection de cible dans le pipeline d'attaque au contact. |
| Exaltation | Les statuts existants (`recurring-status-effect-registry.mjs`) sont individuels ; aucun statut d'équipe avec gestion de Stress par membre. |
| Pilote (volet pilotage) | Aucun système Véhicules (pas de modèle de données, pas de valeur de Déplacement) — lié au chantier Véhicules, non cadré. |

Chacun de ces 9 Talents resterait en l'état jusqu'à ce qu'un chantier dédié
soit cadré avec le porteur du projet (certains dépendent eux-mêmes d'un
autre grand chantier, comme Pilote/chantier Véhicules).
