# Journal des modifications

## 0.9.7 — retours de tests : initiative rapide, traits de créature, habillage (octobre 2026)

- Préparation de l'initiative : case « À la validation, créer un groupe individuel pour chacun des N Combatants non groupés » (cochée par défaut quand il y a moins de 10 non groupés). Un seul clic sur Valider crée et résout un groupe par personnage non affecté ; les groupes déjà composés sont conservés.
- Nouveau compendium « Métro 2033 — Traits de Créatures » (Vicieuse, Vol, Photosensible…), distinct des Talents et Archétypes : ces traits ne sont plus proposés pour les personnages et PNJ humains. Relancer la macro d'initialisation pour le créer ; réimporter les Créatures pour que Vicieuse apparaisse sur la fiche.
- Fiche Personnage, onglet Survie : icône lit devant « Repos ».
- Journal : feuille `styles/metro-journal.css` : nom de page et Titre 1 en Special Elite rouge ; Titre 2 avec étoile rouge, Courier Prime noir ; Titre 3 et 4 en Courier Prime ; lignes rouges sous les titres 1 à 3. Polices dans `fonts/`, déclarées par @font-face et dans le menu de police de l'éditeur.
- Habillage (best effort, non validé sur instance) : Journal (fond parchemin, texte Courier New, titres sans empattement en rouge Métro (#7e1d1d), fond parchemin (`parchment-texture.webp`) et bordure de papier déchiré (`hook-border.webp`) sur chaque page affichée, hors saisie, uniquement sur l'affichage d'une page ; la liste des pages garde l'affichage standard de Foundry), page Paramètres (logo Métro 2033 inséré sous le titre Foundry, menus et intitulés réduits pour tout afficher), icône de Pause (engrenage et marteau). Nouvelle feuille `styles/metro-journal-settings.css`.

## 0.9.6 — le Chat transcrit les règles (octobre 2026)

- Mêlée : l'attaque et le blocage affichent désormais le pool détaillé (Attribut, Compétence, Équipement, Stress, Bonus, Malus), les dés lancés (dés de Stress : 6 éliminé, 1 affliction), le nombre de Push, les dés de Stress éliminés, les afflictions, ainsi que les décisions de préparation (difficulté, sources cochées, modificateur, Stress volontaire).
- Mêlée : les traits de Créature de l'attaquant sont rappelés dans la carte (menu repliable).
- Tir : « Dégâts appliqués » détaille maintenant les effets (dégâts de Vigueur / Esprit, Protection dégradée, désarmement, renversement, initiative, explosion).
- Correction : « Subir 1 Stress pour +3 dés » était ignoré lors d'un blocage de mêlée ; il est maintenant pris en compte (+3 dés et 1 dé de Stress).
- Correction : le venin d'une arme à distance (jet de salive du vodianoï) se déclenche réellement lors de « Résoudre les dégâts ».

## 0.9.5 — venins de Créature (octobre 2026)

- Nouveau champ « Venin (arme naturelle) » sur les Armes (actif, type d'effet, Toxicité jusqu'à 12, source). Quand l'arme inflige au moins 1 point de dégâts réellement subis par la Vigueur de la cible, la carte de jet de Poison (opposition d'ENDURANCE contre la Toxicité, effets complets ou réduits) est publiée automatiquement. Le venin n'est jamais épuisé.
- Bestiaire : Fouisseur (Toxicité 7, létal), Tisseur (5, létal), Excavateur (5, paralysant), Frelon chasseur (5, létal), Vodianoï (jet de salive, 6, paralysant) portent leur venin. La cécité du vodianoï reste à la charge du MJ. Réimporter les Créatures pour en profiter.

## 0.9.4 — traits de Créature jouables (octobre 2026)

- Vicieuse (Sentinelle) : après une attaque de griffes réussie, la carte de mêlée propose au MJ « Attaquer avec Morsure » (nouvelle attaque de mêlée sur la même cible, une seule fois par attaque).
- Vol (+2 en Réaction pour fuir), Photosensible (−2 en Corps à corps, Réaction, Tir, Observation) et Léthargie (−2 pour attaquer ou fuir) apparaissent comme modificateurs proposés dans la fenêtre de préparation du jet, décochés : le MJ coche quand la circonstance s'applique.
- Les autres traits restent affichés avec leur texte sur la fiche (rappel), à appliquer par le MJ.

## 0.9.3 — objets, traits de créature, Chat transcrit (octobre 2026)

- Fiches PNJ / Créature : les objets, outils, consommables et améliorations déposés sont désormais listés (« Objets & outils », onglet Équipement), avec bouton Équiper pour l'Équipement.
- Créatures : les capacités du livre des Monstres (Vicieuse, Grimpeur, Spores, Vol, Photosensible…) deviennent des Talents embarqués, listés avec leur texte dans l'onglet Combat. Pour en profiter : relancer la macro d'initialisation puis réimporter les Créatures.
- Chat de jet : bloc « Décisions et modificateurs » (difficulté, arme / équipement / talent cochés avec leurs dés, modificateur manuel, Stress volontaire).
- Chat de mêlée : en-tête « attaquant → cible — arme » avec la capacité particulière de l'arme ; bloc « Éclats choisis ».
- Chat de tir : capacité particulière de l'arme.

## 0.9.2 — fiches PNJ / Créature en onglets (octobre 2026)

- Fiches PNJ et Créature en 4 onglets : Attributs & Compétences, Combat (Frapper, Tirer, Rafale pour les armes automatiques, munition affectée, protection), Équipement (armes, protections, munitions : équiper / déséquiper), Survie (états, dont « En feu »).
- Munitions : choix de la munition affectée directement sur la fiche d'un PNJ ou d'une Créature.
- Chat de mêlée : bloc « Effets appliqués » détaillant dégâts (avec valeurs avant / après), Protection dégradée, initiative, désarmement, renversement, lutte, contre-attaque de blocage.
- Token des PNJ et Créatures : état « Brisé » par attribut (Vigueur, Agilité, Esprit, Empathie) posé et retiré automatiquement selon la valeur de l'attribut. La mort d'un PNJ reste une décision du MJ.

## 0.9.1 — premiers retours de test (octobre 2026)

- Attaque de mêlée d'un Personnage : le Token attaquant est transmis au workflow (corrige « L'arme du workflow est introuvable » pour un Token non lié).
- Fiches PNJ / Créature : nom et vignette des armes, protections et talents cliquables (ouvrent la fiche) ; info-bulle décrivant l'arme (capacité particulière) ou le talent.
- Bestiaire : transcription corrigée d'après le livre (MET-06 v3) — trait « Vicieuse » de la Sentinelle ajouté ; textes des capacités (Domovoï, Ver sanguin, Vodianoï, Lichen, Fourmi vorace, Freux, Frelon…) ; compétences de 6 créatures ; Brahmane (Esprit, Observation, pistolet léger), Ksatriya (compétences, Tireur instinctif, Spécialiste en armement à distance), niveaux Supérieurs. Pour en profiter : relancer la macro d'initialisation, puis réimporter les acteurs concernés.
- Fenêtre de préparation d'un jet : boutons Annuler / Lancer harmonisés avec les autres fenêtres.
- Fiche Personnage : rappels des choix d'afflictions (onglet Compétences), des éclats de réussite et des réussites de blocage (onglet Combat) ; état « En feu » activable dans l'onglet Survie.
- Afflictions : l'option « Équipement » est de nouveau proposée sur un jet forcé préparé (tir, jets de compétence) lorsque l'arme ou l'équipement coché a fourni des dés.

## 0.9.0 — bêta publique (octobre 2026)

Première version publiée.

- Fiches Personnage (5 onglets), PNJ, Créature, Véhicule (jalon 1), Faction, Station.
- Items : Armes, Protections, Munitions, Équipement, Améliorations d'équipement, Consommables, Talents, Archétypes, Blessures critiques, Traumatismes.
- Moteur Year Zero Engine : jets, Push, Stress (« Subir 1 Stress pour +3 »), afflictions avec fenêtre de répartition.
- Combat : initiative, mêlée (workflow attaque / blocage, relais MJ pour les joueurs), tir (rafale, munitions), agrippement, étourdissement, Protection.
- Situations récurrentes par macros MJ : Terreur, Poison (y compris poison de lame), Maladie, Asphyxie, Feu, Coup de grâce, Survie de station, peuplement de station.
- Talents automatisés (voir la Bible du projet) ; 7 Talents laissés à l'arbitrage du MJ.
- Compendiums créés dans le monde par la macro « Métro 2033 — Initialiser le système » (idempotente, rapport dans le Chat).
- Assistants de création de Personnage et de PNJ.

Limites connues : voir `docs/guide-installation-utilisation.md` §8. Fonctions livrées mais non encore validées avec un compte joueur : voir `docs/recette-foundry.md`.
