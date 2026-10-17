# Métro 2033 — Year Zero Engine pour Foundry VTT
Guide d'installation et de premiers pas (bêta publique 0.9.0).

> Œuvre de fan non officielle, non approuvée par l'éditeur (Arkhane Asylum) ni par les titulaires des droits de Métro 2033. Les illustrations du livre ne sont pas incluses. Version bêta : des défauts sont attendus, merci de les signaler (§7).

## 1. Installation

**Prérequis :** Foundry VTT v14.

**Installation en un clic (recommandée) :**
1. Dans Foundry, onglet *Systèmes de jeu* → *Installer un système*.
2. Collez dans le champ « URL du manifeste » :
   `https://github.com/vinceblaz/Metro-2033---YZE/releases/latest/download/system.json`
3. Cliquez sur *Installer*, puis créez un monde en choisissant « Métro 2033 — Year Zero Engine ».

**Installation manuelle (secours) :**
1. Téléchargez `metro-2033-yze.zip` depuis la page des *Releases* du dépôt : https://github.com/vinceblaz/Metro-2033---YZE/releases
2. Décompressez-le dans un dossier nommé `metro-2033-yze` placé dans `Data/systems/` (dans le dossier de données de Foundry).
3. Relancez Foundry et créez un monde avec ce système.

## 2. Première ouverture du monde (MJ)

À la première connexion, un message vous demande de lancer la macro **« Métro 2033 — Initialiser le système »** (placée sur votre barre de raccourcis). Elle crée en une fois tous les compendiums (équipement, améliorations d'arme, talents et archétypes, bestiaire, factions, stations, blessures critiques, traumatismes, véhicules) et les tables de tirage, puis poste un rapport dans le Chat.

- Vous pouvez la relancer à tout moment : elle met à jour les compendiums **sans toucher** aux personnages et objets déjà présents dans le monde.
- En cas d'échec d'une étape, le rapport l'indique ; corrigez puis relancez.

## 3. Mettre à jour le système

1. Sauvegardez le monde (copie du dossier `Data/worlds/<monde>`).
2. Mise à jour en un clic : onglet *Systèmes de jeu* → *Mettre à jour* (installation par manifeste). En installation manuelle : remplacez le dossier `Data/systems/metro-2033-yze` par la nouvelle version.
3. Relancez Foundry et ouvrez le monde : le rappel d'initialisation réapparaît (la version a changé) → relancez la macro d'initialisation.
4. Les fiches existantes gardent leurs données ; les nouveaux champs prennent leur valeur par défaut. Si un comportement semble incohérent après mise à jour, signalez-le avec la version et le message de la console (F12).

## 4. Macros du MJ

Elles sont créées automatiquement sur votre barre de raccourcis :

| Macro | Usage |
|---|---|
| Initialiser le système | Crée / met à jour les compendiums |
| Créer un Personnage / un PNJ | Assistants de création |
| Attaque de Terreur | Jet de Terreur sur des personnages choisis |
| Coup de grâce | Lance un coup de grâce (carte résolue par le joueur concerné) |
| Jet d'Asphyxie · de Poison · de Maladie | Une carte de jet par personnage exposé |
| Feu | Cibles + Intensité ; la carte de chaque joueur se résout au clic ; en combat, le feu rejoue chaque round (+1 d'Intensité) |

Chaque jet de survie arrive sous forme de **carte dans le Chat** que le joueur propriétaire du personnage résout lui-même. **Un MJ doit être connecté** pour que la carte se mette à jour.

## 5. Combat

- **Initiative** : l'assistant de préparation s'ouvre depuis le combat.
- **Attaques des PJ** : boutons *Frapper* / *Tirer* / *Rafale* de la fiche (cible = jeton ciblé).
- **Attaques des PNJ et Créatures** : équipez l'arme (icône main) puis cliquez *Frapper* / *Tirer* sur la fiche. La mêlée demande un Combat actif.
- **Mêlée contre un joueur** : le joueur choisit *Bloquer* / *Encaisser* et fait son blocage ; le MJ clique ensuite *Résoudre les dommages / effets*.
- **Afflictions** : après un jet forcé, une fenêtre permet au joueur de répartir ses afflictions (attribut, sang-froid, équipement, Stress).
- **Brisé** : un personnage dont le sang-froid atteint le maximum reçoit le statut « Brisé » (icône sur le jeton).

## 6. Ce que le système laisse volontairement au MJ

Le système n'automatise pas ce qui relève de l'arbitrage à la table : conséquences narratives du sang-froid, modificateurs de tir et d'abri, évasion d'une saisie, jet de Trépas (un avertissement s'affiche), extinction du feu par un camarade (le MJ lance le jet en sélectionnant son jeton), statuts hors combat (Asphyxié, En feu… : le MJ les retire).

## 7. Signaler un problème

Signalez-le sur https://github.com/vinceblaz/Metro-2033---YZE/issues en indiquant : la version du système, ce que vous faisiez, le message d'erreur affiché, et la sortie de la console (touche F12, onglet *Console*). Précisez si le problème survient avec un compte joueur ou avec le MJ.

## 8. Limites connues de cette version

- Les tests en conditions réelles (compte joueur) sont en cours : voir le plan de recette fourni.
- Un joueur qui **attaque** en mêlée (et non plus seulement se défend) ou qui résout seul sa Protection n'est pas encore pris en charge : le MJ clique à sa place.
- Lance-flammes, explosion de réservoir et véhicules ne déclenchent pas encore automatiquement le Feu.
