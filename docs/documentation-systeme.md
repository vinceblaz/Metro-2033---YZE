# Métro 2033 — Year Zero Engine pour Foundry VTT
## Documentation fonctionnelle du système (version 0.9.7)

> Œuvre de fan non officielle. Ce document décrit ce que le système **fait** dans cette version, d'après son code. Il complète le *Guide d'installation et de premiers pas* (installation, mise à jour, signalement) et le *Plan de recette*.
>
> **Statut : livré, non validé.** Le système n'a pas encore été éprouvé en conditions réelles sur une instance Foundry par une table complète. Les parties les plus sensibles sont signalées par « à valider en jeu ».

---

## Sommaire

1. Vue d'ensemble
2. Types de documents (Actors et Items)
3. Compendiums et tables de tirage
4. Macros du MJ
5. Créer des Actors et des Items
6. La fiche Personnage
7. Fiches PNJ et Créature
8. Le jet Year Zero Engine (réserve, Push, Stress)
9. Le combat, de l'initiative à l'application
10. Survie, dangers et récupération
11. La Station et les Véhicules
12. Statuts et indicateurs sur le jeton
13. Ce que le système laisse au MJ
14. Limites connues
15. Annexe : API disponible depuis la console

---

## 1. Vue d'ensemble

Le système transpose les règles de *Métro 2033* (moteur Year Zero Engine) dans Foundry VTT v14.

Principes de conception :

- **Le chat est une transcription claire des règles.** Chaque jet et chaque attaque affiche ses décisions (difficulté, sources cochées, modificateur, Stress volontaire), le pool de dés, le résultat, les Push, les afflictions, puis les effets réellement appliqués.
- **L'arbitrage narratif reste au MJ.** Le système n'automatise pas les circonstances (abri, distance, évasion d'une saisie, etc.) ; il les rappelle.
- **Le livre de règles fait foi.** Rien n'est inventé : quand une règle est ambiguë ou manquante, le système la laisse manuelle.
- **Peu de clics en combat** : les fenêtres ne s'ouvrent que quand un choix est nécessaire.
- Langue : français uniquement.

Un MJ doit être connecté pour que les cartes de jet se mettent à jour (les actions des joueurs sont relayées au MJ).

---

## 2. Types de documents

### Actors

| Type | Usage |
|---|---|
| `character` | Personnage joueur (fiche complète à onglets) |
| `npc` | Personnage non joueur (attributs, compétences, armes/protections/talents embarqués) |
| `creature` | Créature du bestiaire (mêmes mécaniques que le PNJ, plus protection naturelle et traits) |
| `vehicle` | Véhicule terrestre |

### Items

| Type | Usage |
|---|---|
| `weapon` | Arme de mêlée ou à distance (portée, bonus, dégâts, munitions, améliorations, venin…) |
| `armor` | Armure ou casque (Protection, Résilience, modificateurs, emplacements d'amélioration) |
| `ammunition` | Munitions (type, qualité, quantité, compatibilité) |
| `equipment` | Équipement et outils (bonus à une compétence/attribut, Fiabilité) |
| `consumable` | Consommables (quantité, unité) |
| `weaponMod` | Amélioration d'arme |
| `talent` | Talent (général, d'archétype, ou trait de Créature) |
| `archetype` | Archétype de personnage |
| `criticalInjury` | Blessure critique (effet, létalité, guérison) |
| `psychologicalTrauma` | Traumatisme psychologique |
| `faction` | Fiche de faction |
| `station` | Fiche de station (population, ressources, défenses…) |

Chaque type a sa propre fiche d'Item. Il n'existe pas d'Item « poison » à part dans les compendiums : le poison s'applique via une arme (lame empoisonnée ou **venin** natif) ou via la macro de Poison.

---

## 3. Compendiums et tables de tirage

Tous sont créés **dans le monde** (« Métro 2033 — … ») par la macro « Initialiser le système » (voir §4). Ils sont idempotents : les relancer met à jour le contenu sans toucher aux Actors ni Items déjà présents dans le monde.

| Compendium | Contenu | Effectif |
|---|---|---|
| Équipement de base | Armes de mêlée (5), armes à distance (16), armures (5), munitions (17), consommables (11), reliques (52) | 106 |
| Améliorations d'armes | Améliorations (11) | 11 |
| Talents et Archétypes | Archétypes (8 : Diplomate, Éclaireur, Infiltrateur, Mécanicien, Médecin, Soldat, Stratège, Trafiquant), talents généraux (22), talents d'archétype (50) | 80 |
| Traits de Créatures | Vicieuse, Vol, Photosensible, Léthargie, Spores… (dédupliqués) | selon bestiaire |
| Bestiaire | Créatures (15 : Bibliothécaire, Domovoï, Enfant du parc, Fouisseur, Tisseur, Excavateur, Fourmi vorace, Frelon chasseur, Freux, Lichen, Ptérodactyle, Sentinelle, Ver sanguin, Vodianoï, Voyageur) et PNJ (3 : Le Brahmane, La Ksatriya, Kot Baïoun) | 18 |
| Factions | Fiches de faction | 16 |
| PNJ des Factions | PNJ rattachés aux factions | 22 |
| Stations | Petchatniki, Doubrovka, Kojoukhovskaya | 3 |
| PNJ des Stations | PNJ rattachés aux stations | 15 |
| Blessures critiques | Table D66 | 36 |
| Traumatismes psychologiques | Table D66 | 17 |
| Véhicules | Moto tout-terrain, Jeep, 4x4, Camion, Véhicule blindé | 5 |

**Tables de tirage (RollTables)** : « Blessures critiques (D66) », « Traumatismes psychologiques (D66) » et « Véhicules hors d'état (D6) ». Les deux D66 sont liées aux compendiums correspondants.

**Séparation des talents de Créature.** Les traits de Créature sont des Items de type `talent` identifiés par une clé `creature-trait-<nom>`. Ils vivent dans leur compendium dédié, distinct de « Talents et Archétypes » : ils ne sont donc pas proposés quand on compose un personnage ou un PNJ humain. Sur une Créature, ils sont embarqués à l'import (ils s'affichent avec leur texte et certains déclenchent une règle, voir §9.6).

> Après une mise à jour du système, relancez la macro d'initialisation, puis **réimportez les Créatures** pour qu'elles reçoivent leurs nouveaux traits et venins.

---

## 4. Macros du MJ

Créées automatiquement sur la barre de raccourcis du MJ. Chacune appelle une fonction de `game.metro2033`.

| Macro | Fonction appelée | Effet |
|---|---|---|
| Initialiser le système | `initializeSystem()` | Crée ou met à jour tous les compendiums et tables (§3), poste un rapport dans le Chat. Rappelée à la première connexion et après chaque changement de version. |
| Créer un Personnage | `openCharacterCreationWizard()` | Assistant de création (étapes : archétype, âge, attributs, compétences, talents, Fierté/Honte, liens, équipement, apparence, nom, récapitulatif). |
| Créer un PNJ | `openNpcCreationWizard()` | Assistant de création de PNJ. |
| Attaque de Terreur | `openTerrorRollDialog()` | Choix des personnages exposés et de la valeur de Terreur ; une carte de jet par personnage (les dés de Stress s'ajoutent ; chaque réussite inflige 1 dégât à l'Esprit ; non forçable). |
| Coup de grâce | `openCoupDeGraceDialog()` | Coup de grâce sur un adversaire sans défense ; carte résolue par le joueur concerné (jet d'Empathie ; Impitoyable dispense du jet). |
| Jet d'Asphyxie | `openAsphyxiationRollDialog()` | Jet d'Endurance non forçable par personnage exposé ; l'échec inflige 1 dégât à la Vigueur et à l'Esprit. |
| Jet de Poison | `openPoisonRollDialog()` | Opposition d'Endurance contre la Toxicité, effets complets ou réduits selon le poison. |
| Jet de Maladie | `openIllnessRollDialog()` | Jet d'exposition initial (Malade oui/non). Le suivi de la maladie reste manuel. |
| Feu | `openFireRollDialog()` | Cibles et Intensité (8 par défaut) ; jet non forçable, 1 dégât à la Vigueur par réussite ; en combat, le feu rejoue à chaque round avec +1 d'Intensité. |

Les jets de survie arrivent sous forme de **carte dans le Chat** que le joueur propriétaire résout lui-même.

Deux lanceurs supplémentaires s'ouvrent depuis les fiches : le **Jet de Population** (fiche de Station) et le **Jet de SURVIE de station** (fiche Personnage), voir §11.

---

## 5. Créer des Actors et des Items

### 5.1 Personnage joueur
- **Assistant** (macro « Créer un Personnage ») : suit les étapes du livre (archétype, catégorie d'âge qui détermine les points d'attributs et de compétences, répartition validée par le système, deux talents de départ, Fierté/Honte, liens, équipement, apparence, nom).
- **Création manuelle** : *Créer un Acteur → Personnage*, puis remplir la fiche.

### 5.2 PNJ et Créatures
- **PNJ** : assistant (macro) ou création manuelle.
- **Créatures et PNJ du livre** : *glisser depuis le compendium Bestiaire* (ou PNJ des Factions / Stations) vers la liste des acteurs. Chaque entrée est déjà équipée : armes, protection naturelle, traits embarqués.

### 5.3 Items
- **Depuis un compendium** : glisser l'Item sur la fiche de l'Actor (ou dans la liste des Items du monde). Les armes, armures, munitions, consommables et équipement sont triables et empilables (les quantités identiques se cumulent).
- **Création manuelle** : *Créer un Objet* et choisir le type ; la fiche dédiée expose les champs du type (voir tableau ci-dessous).
- **Sur une fiche PNJ ou Créature** : on peut déposer armes, armures, munitions, équipement, outils, consommables et améliorations. Équiper une arme ou une protection se fait avec l'icône « main ».

Champs principaux par type :

| Type | Champs notables |
|---|---|
| Arme | catégorie, prise, portée, bonus, dégâts, Fiabilité, automatique (rafale), explosive et puissance d'explosion, munition (type, chargeur, mode de consommation), emplacements d'amélioration, capacité spéciale, lame empoisonnée, **venin** (actif, type d'effet, Toxicité jusqu'à 12, source), ignore la Résilience |
| Armure | catégorie, Protection (actuelle/max), Résilience (perdue), modificateurs (Agilité, Observation), emplacements d'amélioration, spécial |
| Munition | type, qualité, quantité, compatibilité, mode de consommation, protection réduite, ignore la Résilience |
| Équipement | bonus, compétence ou attribut concerné, Fiabilité (actuelle/max), réparable, équipé |
| Consommable | quantité, unité |
| Amélioration | types d'arme applicables, ressource et coût, objet auquel elle est attachée |
| Talent | clé, niveau / niveau maximum, niveau avancé, archétype, compétence/attribut/catégorie d'arme associés, effet |
| Blessure critique | effet, fatale, modificateur et intervalle du jet de Trépas, mort instantanée, formule de guérison, permanente, suivi de guérison/stabilisation |
| Traumatisme | plage D66, effet, formule de guérison, permanent, suivi |

---

## 6. La fiche Personnage

Cinq onglets :

1. **Compétences** : attributs (Vigueur, Agilité, Esprit, Empathie) et 12 compétences (Réparation, Combat rapproché, Endurance, Discrétion, Réaction, Tir, Compréhension, Observation, Survie, Analyse, Manipulation, Médecine). Un clic sur un attribut ou une compétence lance le jet. Progression par XP (augmentation de compétence, achat et progression des talents).
2. **Combat** : armes équipées (portée, bonus, **Frapper**, **Tirer**, **Rafale**), protections, talents de combat, rappels des choix possibles (afflictions, éclats de mêlée, de tir et de blocage).
3. **Équipement** : inventaire, empilement, encombrement (capacité normale = 2 × Vigueur, absolue 4 × Vigueur), munitions assignées aux armes, équiper/déséquiper, dégradation et réparation d'équipement et d'armure.
4. **Survie** : réserves (Eau, Nourriture, Énergie) et leurs jets, Radiation, boutons **Repos** (icône lit), **Second souffle**, **Jet de Trépas**, **Jet de SURVIE de station**, états (Affamé, Déshydraté, Épuisé, Gelé…).
5. **Biographie** : identité, Fierté, Honte, relations, notes.

Indicateurs permanents : **Stress** (pastilles de dés de Stress), **Sang-froid** (valeur actuelle/maximale, point de rupture), Vigueur/Agilité/Esprit/Empathie actuelles et maximales.

---

## 7. Fiches PNJ et Créature

Quatre onglets : **Attributs & Compétences**, **Combat**, **Équipement**, **Survie** (le détail varie légèrement entre PNJ et Créature).

- **Combat** : armes équipées avec *Frapper* / *Tirer* / *Rafale*, protections, talents/traits avec leur texte, **statuts** à activer (voir §12).
- **Créature** : protection naturelle, texte spécial, traits embarqués. Les traits connus du moteur déclenchent une règle (§9.6) ; les autres restent un rappel textuel pour le MJ.
- **Statuts « Brisé »** : un attribut à 0 pose automatiquement un statut visuel sur le jeton (PNJ et Créature).

---

## 8. Le jet Year Zero Engine

Tous les jets (compétence, attribut, attaque, survie…) partagent la même mécanique et la même carte de chat.

1. **Préparation** : une fenêtre propose, selon le contexte, la difficulté, l'arme et l'équipement utilisables, les talents applicables, un modificateur libre (bonus/malus en dés) et un **Stress volontaire**.
2. **Réserve** : Attribut + Compétence + bonus d'arme/équipement + dés de Stress.
3. **Résultat** : chaque 6 est une réussite. Les dés de Stress sont lancés avec les autres et peuvent produire des **afflictions**.
4. **Push** : relancer (maximum **deux** Push). Le Push peut coûter du Stress (bouton dédié « Push en subissant 1 Stress »). Une fois le jet « finalisé », il n'est plus modifiable.
5. **Afflictions** : après un jet, une fenêtre permet au joueur de **répartir** ses afflictions (attribut, sang-froid, équipement, Stress). Elle propose notamment de dégrader l'équipement pris en compte dans le jet.
6. Selon le type de jet, une **conséquence** est appliquée (dégâts, ressource de station, état…).

Certains jets sont **non forçables** (Terreur, Asphyxie, Feu, Population, Trépas, Second souffle) : le bouton de Push n'apparaît pas.

---

## 9. Le combat

### 9.1 Initiative

- Le système remplace l'initiative classique par un **paquet de 10 cartes** (Cards « Initiative Métro 2033 », valeurs 1 à 10 ; **la plus petite agit en premier**).
- Depuis le combat, la **fenêtre de Préparation de l'initiative** s'ouvre. Trois zones :
  - **A. Composition** (brouillon, *Annuler* / *Valider*) : on forme des groupes parmi les combattants non résolus. Un groupe partage une unité d'initiative ; on indique le nombre de cartes à piocher (1 par défaut, davantage avec *Réflexes éclair*, suggéré automatiquement pour un groupe d'un seul combattant) et un motif libre. Case **« À la validation, créer un groupe individuel pour chacun des N Combatants non groupés »** (cochée par défaut sous 10 non groupés) : un clic sur *Valider* crée un groupe par personnage restant.
  - **B. Unités en attente de résolution multiple** : les unités qui piochent plusieurs cartes demandent un choix du MJ parmi les candidates.
  - **C. Initiatives résolues** : rattachement d'un renfort à un groupe, extraction d'un membre.
- Au *Valider*, tout groupe d'une seule carte est résolu automatiquement (carte tirée du paquet). Rien n'est enregistré avant *Valider*.
- Les **échanges d'initiative** obtenus par un éclat sont appliqués au changement de round.

### 9.2 Principes communs

- La **cible** est le jeton ciblé (touche T) ; sans cible, l'attaque est refusée.
- **Hors combat**, aucune restriction d'action ; **en combat**, l'état de saisie (voir §9.5) peut interdire certaines actions.
- Les armes se **chargent** et se **consomment** : l'arme à distance garde un chargeur ; les munitions se choisissent et s'assignent à l'arme.
- Les attaques de **PNJ et Créatures** se lancent depuis leur fiche : équiper l'arme (icône main) puis *Frapper*, *Tirer* ou *Rafale*. La mêlée demande un Combat actif.

### 9.3 Mêlée — séquence complète

La carte de mêlée est le fil conducteur ; elle passe par ces états :

1. **Attaque lancée** (*Frapper*) : fenêtre de préparation (difficulté, arme, équipement, talents, modificateur, Stress volontaire). Le système crée un *workflow* attaquant/défenseur/arme, enregistré sur le combat.
2. **Décision de défense** : le défenseur choisit **Bloquer** ou **Encaisser** (refus).
   - Si le défenseur est un PJ, c'est le joueur qui répond ; le MJ garde la main sur le reste.
3. **Préparation et jet du blocage** (si *Bloquer*) : même fenêtre de préparation côté défenseur ; le blocage inclut le Stress volontaire et les dés de Stress supplémentaires.
4. **Éclats de blocage** : chaque réussite excédentaire du blocage peut être dépensée pour **annuler une réussite de l'attaquant**, **contre-attaquer** ou **désarmer l'attaquant** (chacun une fois).
5. **Jet d'attaque** : préparation, jet, Push éventuels, finalisation.
6. **Opposition attaque / blocage** : le résultat net détermine si l'attaque touche.
7. **Éclats d'attaque** (réussites excédentaires, une par éclat) : **+1 dégât à la Vigueur**, **+1 dégât à l'Agilité**, **échanger l'initiative**, **désarmer**, **faire tomber ou repousser**, **saisir** (voir l'avertissement §9.5 pour *Saisir*).
8. **Conséquences** calculées (dégâts, effets).
9. **Protection** : si la cible porte une protection, un jet de Protection réduit les dégâts (Résilience, munitions perforantes selon le cas).
10. **Application** : le MJ clique *Résoudre les dommages / effets*. Les dégâts, désarmement, renversement, échange d'initiative sont appliqués ; la carte affiche **« Effets appliqués »** (dégâts de Vigueur/Agilité/Esprit/Empathie, Protection dégradée, initiative, désarmement…).
11. **Dégradation des protections** : fenêtre de répartition si plusieurs protections sont touchées.
12. **Workflow terminé.**

La carte affiche aussi, repliables : les décisions de préparation de l'attaquant et du défenseur, le détail du pool (attribut, compétence, équipement, Stress, bonus, malus), les dés lancés, le nombre de Push, les afflictions, la capacité spéciale de l'arme et les **traits de la Créature** attaquante.

### 9.4 Tir — séquence complète

1. **Tir lancé** (*Tirer*, ou *Rafale* pour une arme automatique) : préparation (difficulté, arme, équipement, talents, modificateur, Stress volontaire). Les munitions sont décomptées du chargeur.
2. **Jet**, **Push** (avec ou sans Stress), **finalisation** sur la carte.
3. **Éclats de tir** (fenêtre dédiée, réussites excédentaires) : **dégâts supplémentaires à la Vigueur**, **à l'Esprit**, **échanger l'initiative**, **désarmer**, **faire tomber**, **grenade** (arme explosive : l'explosion touche les zones/personnes concernées).
4. **Protection** : bouton de jet de Protection de la cible ; le désarmement a son bouton de résolution.
5. **Application** (*Résoudre les dégâts*) : un registre d'opérations applique dégâts, Protection dégradée, désarmement, renversement, initiative, explosion ; la carte affiche **« Dégâts appliqués »** détaillés. Si l'arme porte un **venin** et que la cible subit au moins 1 dégât réel de Vigueur, la carte de jet de **Poison** est publiée automatiquement. Les afflictions éventuelles ouvrent ensuite leur fenêtre.

À valider en jeu : le déroulé exact côté joueur pour une attaque de PJ à distance contre un autre PJ.

### 9.5 États particuliers

- **Saisie** (*Saisir*, évasion) : action **narrative**. Le système n'automatise pas le jet d'évasion : il rappelle les choix possibles.
- **Renversement** (*Faire tomber*) : applique l'état à terre ; se relever est une action (`standUp`).
- **Désarmement** : retire l'arme équipée de la cible selon l'éclat choisi.
- **Étourdissement** et **grenade étourdissante** : effets traités (`stun-effect`, dégâts d'étourdissement).
- **Explosions** : dégâts répartis par distance et protection (Résilience ignorée selon le cas).
- **Poison de lame / venin** : le déclenchement est automatique quand les dégâts réels touchent la Vigueur de la cible.

### 9.6 Traits de Créature qui déclenchent une règle

| Trait | Effet dans le système |
|---|---|
| Vicieuse (Sentinelle) | Après une attaque de griffes réussie, la carte de mêlée propose au MJ un bouton **« Attaquer avec Morsure »** (une seule fois par attaque). |
| Vol | Modificateur proposé : +2 en Réaction pour fuir (décoché, à cocher par le MJ). |
| Photosensible | Modificateur proposé : −2 en Corps à corps, Réaction, Tir, Observation (décoché). |
| Léthargie | Modificateur proposé : −2 pour attaquer ou fuir (décoché). |
| Autres (Spores, Toile, Attaque psychique…, recharges D6…) | Rappel textuel sur la fiche et sur la carte ; **aucune automatisation**. |

Les **venins** natifs sont gérés par le champ « Venin » de l'arme : Fouisseur, Tisseur, Excavateur, Frelon chasseur, Vodianoï (jet de salive). La cécité du vodianoï reste à la charge du MJ.

### 9.7 Fin de round et effets récurrents

Au changement de round : application des échanges d'initiative, feu (rejoué avec +1 d'Intensité), poison, étourdissements et statuts récurrents.

---

## 10. Survie, dangers et récupération

| Élément | Fonctionnement |
|---|---|
| **Repos** (bouton lit) | Simule un quart de 5 à 10 h : Stress −2, Sang-froid −2 (jamais sous 0) ; chaque attribut revient à son maximum. Choix de conception volontaire : simplification de la règle de récupération par tour. |
| **Second souffle** | Talent : jet d'Endurance (dés de compétence seuls, non forçable) quand on est Brisé par la Vigueur à 0 ; 1 point de Vigueur récupéré par réussite. |
| **Jet de Trépas** | Endurance avec la Vigueur totale, modifié par la colonne « Fatal » de la blessure critique ; non forçable ; un échec signale la mort (avertissement ; le MJ tranche). |
| **Jet de réserve** | Eau, Nourriture, Énergie : on lance autant de dés que la réserve (5 maximum) ; chaque « 1 » baisse la réserve de 1. |
| **Radiation** | Doses emmagasinées et permanentes ; chaque dose déclenche un jet : chaque « 1 » inflige 1 dégât à la Vigueur (non convertible en Stress). |
| **Encombrement** | Capacité normale = 2 × Vigueur ; au-delà : trop encombré ; plafond absolu 4 × Vigueur. |
| **Fiabilité** | Jet de Fiabilité de l'équipement : un 6 suffit, non forçable ; l'équipement peut se dégrader. |
| **Réparation** | Équipement et armures : 1 réussite = +1 Protection (même depuis 0) ; un échec ne détruit rien ; la Protection ne dépasse jamais son maximum. |
| **Brisé (Sang-froid)** | Quand le Sang-froid atteint son maximum (5 par défaut, 6 ou 7 avec talents), statut « Brisé » sur le jeton. Les conséquences narratives restent au MJ. |
| **Blessures critiques / traumatismes** | Tirage D66 via la table, effet et suivi de guérison sur l'Item. |

---

## 11. La Station et les Véhicules

### Station
- La fiche **Station** (Item) décrit population (niveau, membres, dés de Stress moral en attente), ressources (Eau, Nourriture, Équipement, Énergie, Médecine), personnel de soutien, faction contrôlante, marché, défenses, connexions, PNJ notables.
- **Jet de Population hebdomadaire** : depuis la fiche, bouton « Jet de Population » ; non forçable ; chaque « 1 » baisse Eau, Nourriture et Énergie de 1 (l'Équipement n'est pas affecté) ; un récapitulatif est posté dans le Chat.
- **Jet de SURVIE de station** (fiche Personnage) : une semaine complète de recherche donne un jet de SURVIE non forçable avec un malus selon la ressource ; chaque réussite augmente la ressource de 1 (plafond 10), appliqué par un bouton de la carte.

### Véhicules
- Fiche **Véhicule** : type, déplacement, intégrité (valeur/max), Fiabilité, armure, occupants, conducteur, passagers, réduction en zone d'encombrement.
- Cinq véhicules dans le compendium ; table **« Véhicules hors d'état (D6) »**.
- Hors périmètre : les modificateurs de combat liés aux véhicules et le déclenchement automatique du feu par un véhicule.

---

## 12. Statuts et indicateurs sur le jeton

Statuts propres au système : **Brisé** (Sang-froid atteint son maximum), **Asphyxié**, **En feu**, **Empoisonné**, **Malade**, et quatre statuts d'**attribut Brisé** pour PNJ et Créatures (Vigueur, Agilité, Esprit ou Empathie à 0). L'état « à terre » s'appuie sur le statut natif de Foundry. Sur les fiches PNJ/Créature, une grille de statuts permet de les activer en un clic ; certains se rejouent au changement de round (feu, poison). Les statuts hors combat (Asphyxié, En feu…) sont retirés par le MJ.

---

## 13. Ce que le système laisse au MJ

- Conséquences narratives du Sang-froid.
- Modificateurs de tir et d'abri (portée, couvert) : le système en connaît le calcul mais ne les impose pas.
- Saisie, évasion, Toile, attaques psychiques, spores : narratifs.
- Jet de Trépas : un avertissement s'affiche, le MJ tranche.
- Extinction du feu par un camarade : le MJ lance le jet sur le jeton sélectionné.
- Cycle de maladie après le jet initial.
- Cécité du vodianoï et recharges aléatoires de créatures.

---

## 14. Limites connues

- Validation en conditions réelles (comptes joueurs) en cours.
- Le blocage et l'attaque d'une Créature/PNJ utilisent la Vigueur ; l'attribut alternatif de talents comme Esquive ou Menaçant n'est pas encore pris en compte (à trancher).
- Le rappel des traits de Créature n'apparaît pas sur la carte de tir.
- Lance-flammes, explosion de réservoir et véhicules ne déclenchent pas encore automatiquement le Feu.
- Un joueur qui attaque en mêlée seul ou résout seul sa Protection n'est pas totalement pris en charge ; le MJ peut cliquer à sa place.
- Habillage graphique (Journal, Paramètres, Pause) : *best effort*, à valider sur instance.

---

## 15. Annexe — API depuis la console

Les fonctions suivantes sont exposées dans `CONFIG.Metro2033` (et pour les lanceurs, dans `game.metro2033`) :

`seedEquipmentCompendium`, `seedWeaponModCompendium`, `seedTalentArchetypeCompendium`, `seedCreatureTraitCompendium`, `seedBestiaryCompendium`, `seedFactionCompendium`, `seedFactionNpcCompendium`, `seedStationCompendium`, `seedStationNpcCompendium`, `seedCriticalInjuryCompendium`, `seedPsychologicalTraumaCompendium`, `seedCriticalInjuryRollTable`, `seedPsychologicalTraumaRollTable`, `seedVehicleCompendium`, `seedVehicleBreakdownRollTable`, `openCharacterCreationWizard`, `openNpcCreationWizard`, `openTerrorRollDialog`, `openCoupDeGraceDialog`, `openAsphyxiationRollDialog`, `openFireRollDialog`, `openPoisonRollDialog`, `openIllnessRollDialog`.

Exemple (console, MJ) :

```js
await CONFIG.Metro2033.seedCreatureTraitCompendium();
game.metro2033.openFireRollDialog();
```
