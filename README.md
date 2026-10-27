# Métro 2033 — Year Zero Engine pour Foundry VTT

Système Foundry VTT (v14) pour le jeu de rôle **Métro 2033** (Year Zero Engine) : fiches de Personnage, PNJ, Créature, Véhicule, Armes / Protections / Améliorations d'équipement, Talents, jets YZE (Push, Stress, afflictions), combat de mêlée et de tir, Terreur, Poison, Maladie, Asphyxie, Feu, Stations et Factions.

> **Version bêta publique 0.9.9.** Des défauts sont attendus ; plusieurs fonctions n'ont pas encore été validées en conditions réelles avec un compte joueur. Merci de les signaler dans les [Issues](https://github.com/vinceblaz/Metro-2033---YZE/issues).

> **Œuvre de fan non officielle**, non approuvée par l'éditeur (Arkhane Asylum, https://www.arkhane-asylum.fr) ni par les titulaires des droits de Métro 2033. Aucune illustration du livre n'est incluse. Voir [LICENSE](LICENSE).

> **Fan non official game**, This game is not affiliated with,sponsored, or endorsed by Fria Ligan AB. The Year Zero Engine System Reference Document is used under Fria Ligan AB’s Free Tabletop License. (https://freeleaguepublishing.com/wp-content/uploads/2026/03/Year-Zero-Engine-License-Agreement-version-1.1.pdf)

## Installation

Dans Foundry : *Systèmes de jeu* → *Installer un système* → URL du manifeste :

```
https://github.com/vinceblaz/Metro-2033---YZE/releases/latest/download/system.json
```

Puis créez un monde avec ce système, et lancez, en tant que MJ, la macro **« Métro 2033 — Initialiser le système »** (elle crée les compendiums dans le monde).

Guide complet : [docs/guide-installation-utilisation.md](docs/guide-installation-utilisation.md).

## Principe

Foundry assiste la résolution de Métro 2033 ; il ne remplace ni le MJ ni la conversation à la table. Ce qui relève de l'arbitrage à la table (couverture, modificateurs de tir, conséquences narratives…) n'est volontairement pas automatisé.

## Développement

Les tests de la logique de domaine s'exécutent avec Node 20+ :

```
node --test $(find tests -name '*.test.mjs')
```

Le code qui dépend de Foundry (feuilles, hooks, dialogues) n'est vérifié que par contrôle de syntaxe ; il se valide en conditions réelles avec le [plan de recette](docs/recette-foundry.md).

## Publier une version

1. Mettre à jour `CHANGELOG.md` (le numéro de `system.json` est réécrit par le workflow à partir de l'étiquette).
2. Créer une *Release* GitHub avec l'étiquette `vX.Y.Z` (ex. `v0.9.0`) : le workflow `.github/workflows/release.yml` lance les tests, construit `metro-2033-yze.zip` et joint `system.json` + l'archive à la Release.

## Licence

MIT pour le code et les fichiers originaux de ce dépôt (voir [LICENSE](LICENSE)). Les marques, textes, règles et illustrations de tiers restent la propriété de leurs titulaires.
