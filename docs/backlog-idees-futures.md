# Backlog — idées à reprendre plus tard

Ce document consigne les pistes évoquées en discussion mais volontairement
mises de côté, pour ne pas les perdre d'une session à l'autre.

## Ordre de priorité des prochains chantiers (acté le 27/09/2026)

Décision explicite du porteur du projet, à respecter pour les prochains jalons :
1. **Assistants de création (PJ puis PNJ)** — **TERMINÉ (28/09/2026)**, les
   deux validés par l'utilisateur (cf. sections dédiées ci-dessous).
2. **Macros de situations récurrentes**, à commencer par le **jet de Terreur**
   (cf. section dédiée ci-dessous) — **en cours** : jet de Terreur **validé
   par l'utilisateur** (28/09/2026, avec un tour de retouches graphiques —
   cf. norme graphique commune actée ci-dessous). Jet d'Asphyxie **validé
   par l'utilisateur** (28/09/2026), complété le même jour par l'état
   « Asphyxié » et une mécanique homebrew de dégâts récurrents en combat
   (cf. section dédiée ci-dessous — absente du livre et de la Bible, actée
   sur demande explicite du porteur du projet). **Test de cette dernière
   extension explicitement mis en pause par le porteur du projet** (28/09/2026
   soir, cf. section dédiée ci-dessous). **Affichage/bascule des états
   Foundry en fiche de Personnage livré et validé par l'utilisateur en
   Foundry réel (02/10/2026)** — cf. section dédiée ci-dessous. À la demande
   du porteur du projet, un audit complet de la gestion round-par-round du
   Combat a ensuite été mené (02/10/2026) : refonte de l'automatisation de
   l'Asphyxie (Nocivité réellement choisie, cadence restreinte à l'Extrême,
   `CombatRoundCoordinator` idempotent) et ajout au moteur générique de
   l'option « Subir 1 Stress pour +3 » du livre (p.190) — cf. section dédiée
   ci-dessus. La pause de test de l'extension état/dégâts récurrents de
   l'Asphyxie reste formellement en vigueur tant qu'elle n'est pas
   explicitement levée par le porteur du projet. Suivront, un jet à la fois :
   Poison (désormais prévu comme Item intégré par instance plutôt que comme
   simple état booléen, pour permettre le cumul de plusieurs sources
   indépendantes) — **livré le 02/10/2026** (cf. section dédiée ci-dessous,
   validation Foundry réelle à confirmer) —, puis Maladie (exposition
   initiale uniquement). Un chantier transverse, demandé par le porteur
   du projet, est par ailleurs
   démarré (02/10/2026) : faire déclencher par chaque jet un véritable jet
   Foundry visible et animé dans le tchat plutôt qu'un calcul interne
   invisible (Math.random) — cf. section dédiée ci-dessous. Un jet pilote
   (Attribut/Compétence, initial et Push) est livré ; les autres jets du
   système seront migrés dans un second temps, une fois ce pilote validé
   en Foundry réel.
3. Automatisation du système Station (Point 3, extension) et/ou harmonisation
   UX du Tir (Point 2, optionnelle) — non ordonnées entre elles, à trancher
   au moment venu. **Harmonisation UX du Tir — VALIDÉE (03/10/2026)**, cf.
   section dédiée ci-dessous. **Automatisation du système Station — LIVRÉE
   (03/10/2026)**, cf. section dédiée ci-dessous.
4. **Véhicules — volontairement placé en dernier.** Le porteur du projet a
   explicitement demandé que ce chantier soit traité après tous les autres,
   et non selon l'ordre naturel de la feuille de route à 6 points.

**Détours ponctuels, chantiers terminés :**
- 27/09/2026 : extraction de 3 Stations + leurs PNJ notables (cf. section
  dédiée ci-dessous).
- 28/09/2026 : extraction des tables Blessures critiques et Traumatismes
  psychologiques + RollTables Foundry associées (cf. section dédiée
  ci-dessous).

## Règle de conception actée — tous les jets doivent utiliser un vrai jet Foundry (02-03/10/2026)

Décision du porteur du projet (03/10/2026, après validation fonctionnelle
du jet de Poison) : **tout nouveau développement impliquant un jet de dés
doit désormais déclencher un véritable jet Foundry** (via le mécanisme
`drawDie`/`rollPhysicalDice` posé par le chantier « Jets de dés réellement
animés dans Foundry », cf. section dédiée) **plutôt que de tirer en
interne via `Math.random()`**.

Deux précisions actées le même jour, pour éviter toute ambiguïté
d'application :
- **Le jet de Poison n'est PAS retouché rétroactivement.** Il vient d'être
  testé et confirmé fonctionnel par le porteur du projet (« le test me
  semble OK ») avec son implémentation actuelle (`Math.random` via
  `YZERoll.roll()`, comme tous les jets antérieurs au chantier des dés
  physiques) ; le migrer maintenant forcerait un nouveau test sans
  nécessité. Cette règle s'applique aux **prochains** développements, pas
  rétroactivement à l'existant.
- **Mise à jour du 04/10/2026 : le pilote est désormais validé** par le
  porteur du projet en conditions Foundry réelles (cf. section dédiée
  « Jets de dés réellement animés dans Foundry »). La règle ci-dessus
  s'applique donc désormais pleinement à tout nouveau développement
  impliquant un jet de dés. **La généralisation aux jets déjà existants**
  (migration du Corps-à-corps, du Tir, du Blocage, de la Terreur, de
  l'Asphyxie, du Trépas, etc. vers de vrais jets Foundry) **reste
  toutefois explicitement différée** : le porteur du projet a demandé de
  réactiver ce chantier seulement après la charte graphique en cours, pas
  dans l'immédiat.

**Précision actée le 03/10/2026, pour le chantier d'automatisation du
système Station (cf. section dédiée ci-dessous) :** le Jet de Population
hebdomadaire (Personnel de soutien, pool de base, dés de Stress, dés de
contrecoup) a été construit avec un `rollDie` interne (`Math.random()`
par défaut, injectable pour les tests), **pas** avec un vrai jet Foundry
visible — cohérent avec la règle ci-dessus, puisque le pilote des dés
physiques restait en pause et non validé au moment de ce chantier. Le Jet
de SURVIE (augmentation de ressource, réutilisant le gabarit générique
`YZERollChat`) utilise en revanche déjà un vrai jet Foundry, puisqu'il
passe par le moteur `YZERoll`/`actor.rollSkill()` commun à tout jet de
Compétence.

## Bible du projet — désormais document de référence consolidé (mis à jour le 02/10/2026)

À la demande explicite du porteur du projet (« il nous faut figer notre pas
uniquement avec des amendements mais dans une version globale »), la Bible
du projet (`bible/Metro_2033_Bible_v0.9.5_Amendement.pdf`, livrée le
02/10/2026) devient le document de référence prioritaire pour l'état
d'avancement, les décisions stratégiques et l'ordre de priorité des
chantiers — ce backlog continue d'exister comme journal de détail
(fichiers livrés, décisions fines de conception), mais en cas de
divergence, la Bible fait foi. Chaque futur jalon amendera cette Bible
plutôt que de laisser l'information vivre uniquement ici, conformément à
la méthode de travail actée (§178 de l'amendement v0.9.4, reconduite au
§188 de la v0.9.5).

## Chantier « Assistant de création de Personnage (PJ) » — STATUT : VALIDÉ (28/09/2026)

Construit à partir du chapitre 8 « Les Règles » du livre (p.163-175, « Les
10 étapes de la création de personnages »), fourni par le porteur du projet
sous forme de PDF dédié (`Metro_2033_Chap_Regles.zip`).

**Livré :**
- `domain/rules/character-creation.mjs` — règles pures : catégories d'âge
  (Jeune ≤25/Adulte 26-50/Aîné >50) et leurs budgets de points (p.172),
  validation de la répartition des Attributs (2-4, max 5 pour l'attribut
  d'archétype) et des Compétences (0-2, max 3 pour les compétences
  d'archétype), validation du choix des 2 Talents de départ, et résolution
  du cas particulier du Soldat (seul archétype à choix : Agilité OU Vigueur,
  Corps à corps OU Endurance). Complété le 28/09/2026 (cf. chantier PNJ
  ci-dessous) de trois fonctions de tirage aléatoire réutilisables
  (`randomizeAttributeAllocation`, `randomizeSkillAllocation`,
  `pickRandomTalents`), `rng` injectable pour des tests déterministes.
  20 tests.
- `data/seed/character-creation-catalog.mjs` — Fierté/Honte/Liens-avec-les-
  autres-PJ/Noms typiques pour les 8 archétypes, transcrits mot pour mot du
  livre (p.164-171). 3 tests.
- `data/seed/character-creation-actor-builder.mjs` — assemble les données
  finales de l'Actor « character » + ses Items embarqués (1 Archétype, 2
  Talents) à partir d'un brouillon complet. 7 tests.
- `foundry/character-creation/character-creation-wizard-view-model.mjs` —
  modèle de vue pur. 15 tests.
- `foundry/applications/character-creation-wizard-application.mjs` — la
  fenêtre `ApplicationV2` elle-même (non testée unitairement, par
  convention du projet), avec `templates/applications/character-creation-wizard.hbs`
  et `styles/metro-character-creation-wizard.css`.
- Enregistrée dans `system.mjs` : `game.metro2033.openCharacterCreationWizard()`.

**Corrections suite aux tests utilisateur — 1er et 2e tours (28/09/2026) :**
chevauchement des étapes (helpers Handlebars personnalisés peu fiables,
supprimés), chevauchement du texte des cartes d'archétype (`<button>` →
`<div role="button">`), ascenseur manquant (hauteur non bornée d'un enfant
flex, corrigée), Attributs/Compétences redessinés en liste verticale
groupée avec étoile d'archétype, Talents en grille à 2 colonnes avec
infobulle, étape Liens repensée en flux Ajouter/Supprimer facultatif,
étape Apparence réagencée (Genre+champ sur une ligne, textarea pleine
largeur), bouton « Suivant » figé sur saisie libre (dépendance à `disabled`
supprimée, revalidation au clic), Attributs valant 4/4 sur l'Actor créé
(`{value, max}` vs simple nombre, corrigé).

**Validation finale par l'utilisateur (28/09/2026) :** tous les correctifs
confirmés OK, **y compris l'archétype Soldat**, testé pour la première
fois à cette occasion. Chantier **fonctionnellement clos**.

**Décision actée — Équipement de départ (étape 8) :** aucun rapprochement
automatique n'est tenté entre le texte libre d'équipement de l'archétype
et le compendium Équipement — affiché tel quel, à glisser-déposer
manuellement. Pour ne jamais fabriquer/deviner une correspondance
incertaine.

**Bouton du répertoire des Actors — résolu autrement (28/09/2026) :**
la structure DOM exacte du répertoire en Foundry v14 n'a jamais pu être
vérifiée (pas d'accès à une instance Foundry réelle depuis cet
environnement de développement, et l'utilisateur n'a pas accès à
l'inspecteur du navigateur pour la relever). Plutôt que de continuer à
parier sur un sélecteur CSS, l'assistant est désormais rendu accessible
via une **Macro créée et assignée automatiquement à la barre de
raccourcis** au démarrage du monde (`ensureCharacterCreationMacro()` dans
`metro-character-creation-hooks.mjs`), mécanisme reposant uniquement sur
l'API officielle Foundry (`Macro.create`/`assignHotbarMacro`), donc
indépendant de toute structure DOM. Le bouton best-effort dans l'en-tête
du répertoire reste tenté en complément (silencieux s'il échoue). Limite
connue : la création de Macro de script est par défaut réservée au
MJ/Assistant-MJ (permission `MACRO_SCRIPT` du cœur Foundry) — un simple
Joueur sans cette permission n'aura pas la macro auto-assignée et devra
utiliser `game.metro2033.openCharacterCreationWizard()` en console, ou se
la faire partager par le MJ.

## Chantier « Assistant de création de PNJ » — STATUT : VALIDÉ (28/09/2026)

Le livre de base ne prévoit aucun process dédié à la création de PNJ
(« Les personnages non joueurs utilisent leurs compétences de la même
façon que les PJ », p.193) : cet assistant a donc été conçu **conjointement
avec le porteur du projet**, en reprenant celui du PJ.

**v1 — décisions initiales (échange du 28/09/2026) :**
- **Étapes narratives** : aucune Fierté/Honte/Liens (outils de roleplay
  entre PJ, sans objet pour un PNJ créé par le MJ).
- **Budgets de points (Attributs/Compétences)** : mêmes règles strictes
  que pour un PJ (mêmes catégories d'âge, mêmes bornes d'archétype),
  l'assistant avertit si le budget n'est pas respecté, exactement comme
  pour un PJ.
- **Étape Âge conservée** : sert uniquement au calcul du budget. L'âge ne
  fait pas partie du `NpcDataModel` (`data/actors/npc-model.mjs` :
  `identity.role`, `identity.description`, `attributes`, `skills`,
  `special`, `gmNotes` — aucun champ Âge) : rien ne le conserve donc sur le
  PNJ final.
- **Étape Équipement conservée**, même logique que le PJ (texte du livre
  affiché, à glisser-déposer manuellement).

**Point de conception clé :** `NpcDataModel` ne prévoit **aucun champ
Archétype**, cohérent avec les PNJ de Factions/Stations déjà en base qui
notent leur archétype en texte libre dans `role` (ex. « Chef du triumvirat
de Petchatniki — Archétype Diplomate »). L'assistant PNJ suit donc la même
convention : l'Archétype choisi sert pendant la création (budgets, Talents
proposés, texte d'équipement) mais n'est **pas** persisté comme Item
Archétype — juste noté `"Archétype : <nom>"` dans `system.identity.role`.

**v2 — ajustements du porteur du projet (échange du 28/09/2026, après
relecture de la v1) :**
- **Étape Attributs** : bouton **« Aléatoire »**. Répartit tous les points
  du budget au hasard, en respectant les bornes de la répartition (2-4, ou
  2-5 pour l'attribut d'archétype), avec une règle de préférence actée
  avec l'utilisateur : **l'attribut d'archétype ne descend jamais sous 4**.
  Toujours modifiable ensuite à la main, champ par champ.
- **Étape Compétences** : même principe, bouton **« Aléatoire »**, règle de
  préférence actée : **une compétence d'archétype ne descend jamais sous
  2**.
- **Étape Talents** : dans chacun des deux groupes (Talents d'archétype /
  Talents généraux), deux boutons **« Choix aléatoire (1) »** et
  **« Choix aléatoire (2) »**. Un clic pioche 1 ou 2 Talents au hasard
  *dans ce groupe uniquement* et remplace la sélection de ce groupe (celle
  de l'autre groupe n'est jamais touchée) ; le MJ garde la main pour
  décocher/recocher ensuite. Validation inchangée : exactement 2 Talents
  cochés au total pour passer à l'étape suivante.
- **Étape Apparence (Genre + texte libre) : supprimée entièrement.** Ces
  informations n'étant pas restituées sur la fiche PNJ, pas de raison de
  les collecter dans l'assistant.
- Étapes Archétype, Âge, Équipement et Nom : inchangées par rapport à la
  v1.

**Étapes finales de l'Assistant PNJ (v2) :** Archétype → Âge → Attributs →
Compétences → Talents → Équipement → Nom → Récapitulatif (8 étapes).

**Livré :**
- `domain/rules/character-creation.mjs` — 3 fonctions de tirage aléatoire
  ajoutées (cf. ci-dessus, partagées avec le module de règles du PJ).
- `data/seed/npc-creation-actor-builder.mjs` — assemble les données de
  l'Actor « npc » + ses Items Talent (pas d'Item Archétype). 8 tests.
- `foundry/npc-creation/npc-creation-wizard-view-model.mjs` — modèle de
  vue pur, calqué sur celui du PJ sans `prideShame`/`bonds`/`appearance`,
  expose `archetypeAttributeKeys`/`archetypeSkillKeys`/
  `archetypeTalentNames`/`generalTalentNames` pour les boutons Aléatoire.
  13 tests.
- `foundry/applications/npc-creation-wizard-application.mjs` — la fenêtre
  `ApplicationV2` (non testée unitairement, par convention), avec
  `templates/applications/npc-creation-wizard.hbs` et
  `styles/metro-npc-creation-wizard.css` (réutilise les classes
  `.metro-wizard-*` déjà définies pour l'assistant PJ).
- Accessible via `game.metro2033.openNpcCreationWizard()`, avec le même
  mécanisme de Macro auto-assignée que pour le PJ (réservée au MJ).

**Validation finale par l'utilisateur (28/09/2026) :** tests confirmés OK.
Chantier « Assistants de création (PJ + PNJ) » **entièrement clos**.

## Revue transverse de la charte graphique — idée notée le 28/09/2026

Remarque du porteur du projet lors du test de l'Assistant de création de
Personnage : envisager, une fois les chantiers fonctionnels en cours
stabilisés, une revue complète de toutes les fenêtres du système
(Applications, fiches Actor/Item, dialogues) pour homogénéiser la charte
graphique (espacements, composants récurrents — étoile d'archétype,
boutons, grilles — infobulles, etc.), plutôt que de laisser chaque nouvelle
fenêtre réinventer localement ses propres conventions.

Statut : **non planifié** initialement (28/09/2026), **désormais chantier
actif (03-04/10/2026)** — cf. l'amendement v0.9.7 de la Bible et la section
dédiée au rollout interface par interface plus bas dans ce document. Une
première brique commune existait déjà avant ce chantier (cf. « Macros
Foundry pour situations récurrentes » ci-dessous) : les fenêtres de
lancement des macros de jets et les cartes de Chat associées suivent
depuis le 28/09/2026 une norme graphique commune, factorisée dans
`foundry/shared/`.

## Petites retouches UI notées en passant (28/09/2026)

Sans rapport direct avec le chantier en cours, notées pour ne pas les
perdre :
- **Fiche de Personnage, onglet Biographie** : retirer le bouton « Ouvrir »
  qui permet d'ouvrir la fiche d'un Actor lié — remarque du porteur du
  projet, à traiter au moment jugé opportun (éventuellement dans le cadre
  de la revue transverse de la charte graphique ci-dessus). **LIVRÉ
  (03/10/2026)** : le bouton « Ouvrir » de la section « Liens » (jet
  `system.narrative.relationships.{index}.actor`) a été retiré de
  `templates/actors/character-sheet.hbs`. L'aperçu de l'Acteur lié (image
  + nom) reste affiché tel quel ; seul le bouton d'ouverture disparaît. Le
  gestionnaire de clic générique dans `character-sheet.mjs`
  (`.metro-character-doc-ref-open[data-uuid-field]`) est partagé avec les
  boutons « Ouvrir » de la Faction et de la Communauté d'affiliation,
  volontairement conservés (hors périmètre de cette remarque, qui ne visait
  que le lien vers un Actor). Correctif de template uniquement, non testé
  unitairement par convention (fichier `.hbs` non dépendant de logique pure) ;
  1969/1969 tests automatisés toujours verts (aucune régression).

## Macros Foundry pour situations récurrentes — CHANTIER EN COURS (rang 2)

Idée évoquée le 27/09/2026 : développer des macros dédiées pour automatiser
certaines situations de jeu récurrentes. Devient le chantier actif
maintenant que les deux Assistants de création (PJ + PNJ) sont validés.

Périmètre acté avec le porteur du projet (échange du 28/09/2026, sur la base
du chapitre 8 « Les Règles », p.205-207) : 4 macros, **une à la fois**, dans
l'ordre **Terreur → Asphyxie → Poison → Maladie**. Exigence commune aux 4 :
sélection de plusieurs Acteurs par le MJ, un message de Chat dédié par
Acteur ciblé, bouton cliquable uniquement par le propriétaire de l'Acteur
(joueur) ou le MJ.

Décisions de cadrage actées (réponses du porteur du projet, 28/09/2026) :
- **Maladie** : seul le jet d'exposition initial (Malade oui/non) sera
  automatisé — le cycle complet (jets quotidiens, contagion, soutien
  médical) reste manuel comme aujourd'hui.
- **Poison** : pas de catalogue de poisons nommés (le livre n'en fournit
  aucun) — le MJ choisit le type d'effet (Létal/Paralysant/Somnifère/
  Hallucinogène) et une valeur de Toxicité libre à chaque lancement.
- Architecture commune retenue : chaque macro suit le patron **ad hoc** du
  jet de Trépas (`domain/rules/death-roll.mjs` +
  `_postDeathRollChatMessage` dans `character-sheet.mjs`) plutôt que le
  moteur générique `YZERollChat` (trop couplé aux tests de Compétence
  standard et au Push, que le livre interdit explicitement pour l'Asphyxie
  et la Terreur).

**Norme graphique commune (actée le 28/09/2026, retour utilisateur sur le
jet de Terreur, appliquée dès l'Asphyxie) :** dans chaque fenêtre de
lancement, la liste des Acteurs à sélectionner est affichée en premier, en
grille à 3 colonnes ; la fenêtre défile (ascenseur) si son contenu dépasse
la hauteur disponible ; toute valeur de jet à choisir (ex. la Terreur) est
présentée dans un groupe séparé, avec le texte explicatif sur sa propre
ligne, sous la valeur plutôt qu'à sa suite ; le bouton « Subir le jet » des
cartes de Chat reprend le même style que le bouton « Forcer le jet »
existant (`metro-chat-button`). Cette norme est désormais **factorisée**
dans `foundry/shared/dialog-html.mjs` (fieldset de sélection d'Acteurs,
lecture de la sélection, échappement HTML) et
`foundry/shared/living-actor-options.mjs` (construction de la liste
d'Acteurs, avec pré-sélection des jetons contrôlés sur le canevas), et les
classes CSS partagées correspondantes vivent dans `styles/metro-chat.css`
(`.metro-multi-actor-roll-dialog`, `.metro-multi-actor-grid`,
`.metro-macro-value-row`...). Chaque nouvelle macro doit réutiliser ces
briques plutôt que redupliquer sa propre fenêtre.

### Jet de Terreur — STATUT : VALIDÉ (28/09/2026)

Règle (p.207) : un nombre de dés égal à la valeur de Terreur de la
source/créature, **plus les dés de Stress actuels de la cible** (propres à
chaque personnage, donc jet individuel par Acteur même si la valeur de
Terreur est partagée). Chaque réussite inflige 1 point de dégâts à
l'ESPRIT. Jet non forçable (pas de Push).

Table des 3 paliers du livre, reprise telle quelle : Effrayante (3),
Atroce (5), Abominable (8). La fenêtre de lancement propose aussi une
**valeur personnalisée** (le livre ne limite pas les sources de Terreur à
ces 3 exemples nommés).

**Non automatisé, volontairement** : la note du livre autorisant le MJ à
affecter les réussites à la jauge de Sang-froid plutôt qu'aux dégâts
d'ESPRIT (« si la source de terreur n'implique pas une créature ou un
événement surnaturel ou particulièrement effroyable ») reste un choix
manuel — la macro applique toujours les dégâts à l'ESPRIT ; au MJ d'ajuster
la fiche à la main dans ce cas particulier.

**Livré :**
- `domain/rules/terror.mjs` — règles pures : `TERROR_SOURCE_LEVELS` (3
  paliers), `computeTerrorDicePool` (valeur de Terreur en `bonus`, Stress
  de la cible en `stress`), `resolveTerrorOutcome` (réussites → dégâts).
  9 tests.
- `foundry/terror-roll/terror-roll-launcher-dialog.mjs` — fenêtre de
  lancement (MJ) : choix du palier ou d'une valeur personnalisée, sélection
  multiple d'Acteurs (Personnages/PNJ, pré-cochés si leurs jetons sont
  contrôlés sur le canevas), via les briques communes `foundry/shared/`.
  7 tests.
- `foundry/terror-roll/metro-terror-roll-hooks.mjs` — orchestration : crée
  un message de Chat par Acteur sélectionné. Accessible via
  `game.metro2033.openTerrorRollDialog()`, Macro auto-assignée à la barre
  de raccourcis (réservée au MJ, même mécanisme que les Assistants de
  création).
- `foundry/chat/terror-roll-chat.mjs` + `terror-roll-chat-hooks.mjs` — une
  carte de Chat « en attente » par Acteur ciblé, avec un bouton « Subir le
  jet » ; le jet (et l'application des dégâts à l'ESPRIT via
  `actor.takeAttributeDamage("spirit", …)`) n'a lieu qu'au clic, par le
  joueur concerné ou le MJ. Clic refusé (message d'erreur) si le compte
  n'est ni propriétaire de l'Acteur ni MJ — même convention que le Push de
  `YZERollChat` (`actor.isOwner`).

**Retouches graphiques suite au test utilisateur (28/09/2026) :** ascenseur
ajouté à la fenêtre de lancement, liste des Acteurs déplacée en tête et
passée en grille à 3 colonnes, groupe « Valeur de l'attaque » redescendu
sous les Acteurs avec le texte explicatif sur sa propre ligne, bouton
« Subir le jet » harmonisé avec le bouton « Forcer le jet » existant. C'est
à cette occasion que la norme graphique commune ci-dessus a été actée et
factorisée dans `foundry/shared/`.

**Validation finale par l'utilisateur (28/09/2026) :** tests fonctionnels
confirmés OK après ces retouches. Chantier **fonctionnellement clos**.

### Jet d'Asphyxie — STATUT : VALIDÉ (28/09/2026)

Règle (p.205) : jet d'ENDURANCE (test de Compétence standard, Attribut
VIGUEUR + Compétence Endurance), sans dé de Stress, non forçable (pas de
Push). En cas d'échec (aucune réussite), 1 point de dégâts fixe à la
VIGUEUR et à l'ESPRIT ; en cas de réussite (quel que soit le nombre de
réussites), aucun dégât.

Table SOURCE/NOCIVITÉ/FRÉQUENCE du livre reprise à titre **purement
informatif** dans la fenêtre de lancement (Légère → tous les quarts, Forte
→ tous les tours, Extrême → tous les rounds) : à la différence de la
Terreur, la Nocivité ne modifie jamais le jet lui-même, elle ne fixe que la
cadence à laquelle le MJ doit redemander le jet — cadence purement
narrative, gérée manuellement en relançant la macro au rythme voulu (comme
le cycle quotidien de la Maladie). La fenêtre ne propose donc aucune valeur
à choisir, uniquement la sélection des Acteurs exposés.

**Livré :**
- `domain/rules/asphyxiation.mjs` — règles pures :
  `ASPHYXIATION_SOURCE_LEVELS` (3 paliers, informatifs),
  `computeAsphyxiationDicePool` (VIGUEUR + Endurance),
  `resolveAsphyxiationOutcome` (échec → 1 dégât VIGUEUR + 1 dégât ESPRIT,
  réussite → aucun dégât). 8 tests.
- `foundry/asphyxiation/asphyxiation-launcher-dialog.mjs` — fenêtre de
  lancement (MJ) : sélection multiple d'Acteurs + rappel informatif de la
  table de Nocivité, via les briques communes `foundry/shared/`. 5 tests.
- `foundry/asphyxiation/metro-asphyxiation-hooks.mjs` — orchestration,
  accessible via `game.metro2033.openAsphyxiationRollDialog()`, Macro
  auto-assignée à la barre de raccourcis (réservée au MJ).
- `foundry/chat/asphyxiation-roll-chat.mjs` + `asphyxiation-roll-chat-hooks.mjs`
  — une carte de Chat « en attente » par Acteur ciblé, bouton « Subir le
  jet » (même style que la Terreur), résolution au clic par le joueur
  concerné ou le MJ uniquement (`actor.isOwner`), dégâts appliqués via
  `actor.takeAttributeDamage("vigor"/"spirit", …)`.
- Factorisation introduite à cette occasion pour les 4 macros :
  `foundry/shared/dialog-html.mjs` (fieldset de sélection d'Acteurs,
  lecture de sélection, échappement HTML — 8 tests) et
  `foundry/shared/living-actor-options.mjs` (liste d'Acteurs avec
  pré-sélection des jetons contrôlés). Le jet de Terreur a été refactorisé
  pour réutiliser ces mêmes briques (cf. ci-dessus), sans changement de
  comportement.

**Validation finale par l'utilisateur (28/09/2026) :** fonctionnel et
graphique confirmés OK. À cette occasion, remarque du porteur du projet :
« le statut Asphyxié n'est pas appliqué (état) ce qui me fait penser qu'il
faudra ajouter l'état Poison. Pour rappel, ces états en mode combat
doivent infliger des dégâts tous les rounds (cf bible). En mode hors
combat c'est le MJ qui décide quand un acteur prend des dégâts. »

#### Ajout — état « Asphyxié » et dégâts récurrents en combat (28/09/2026) — LIVRÉ, TEST EN PAUSE

Mécanique **absente du livre de règles** (vérifié : aucune mention d'un
état Asphyxié appliqué au Token ni de dégâts automatiques par round dans
le chapitre 8) et **absente des 5 amendements de la Bible** disponibles
dans cet environnement (`v0.8.8` à `v0.9.3` — recherche exhaustive de
« asphyxi », « poison », « round », « chaque round », « tous les rounds »,
« par round » : zéro occurrence). Également absente du code existant :
audit du projet confirmant qu'aucun système d'état à dégâts récurrents
n'existait avant ce jour (`StunEffectService` a bien une méthode `apply()`
mais elle n'était jamais reliée à un hook de combat).

Plutôt que d'inventer le fonctionnement, 3 questions ont été posées au
porteur du projet, dont voici les réponses actées :
- **Pose de l'état** : posé automatiquement sur échec du jet d'Asphyxie,
  retiré **manuellement par le MJ** (quand la source n'est plus présente)
  — jamais retiré automatiquement par le système.
- **Comportement round par round (en combat)** : un **nouveau jet
  d'Asphyxie est relancé automatiquement à chaque round**, tant que
  l'état reste actif sur l'Acteur.
- **Hors combat** : **aucune automatisation** — le MJ garde la main,
  soit en relançant lui-même la macro de jet, soit en demandant
  directement au joueur de retirer un point de Vigueur.

**Livré :**
- `domain/rules/asphyxiation.mjs` — ajout de la constante
  `ASPHYXIATION_STATUS_EFFECT` (`id: "asphyxiated"`, `name: "Asphyxié"`,
  icône `icons/svg/degen.svg`). 1 test supplémentaire (9 au total sur ce
  module).
- `combat/recurring-status-effect-registry.mjs` — **registre générique et
  réutilisable** (nouveau module, pur/testable) associant un identifiant
  d'état Foundry (ex. `"asphyxiated"`) à une fonction de résolution
  `async (actor, { combat }) => …`. Conçu explicitement pour que le futur
  état **Poison** (« ce qui me fait penser qu'il faudra ajouter l'état
  Poison », remarque du porteur du projet) n'ait besoin que d'un seul
  appel `recurringStatusEffectRegistry.register("poisoned", …)`, sans
  toucher au registre ni au hook de combat. 7 tests.
- `combat/resolve-recurring-status-effects.mjs` — parcourt, à chaque
  changement de round d'un Combat actif, tous les Combatants ; pour
  chaque Acteur portant un état enregistré dans le registre ci-dessus,
  déclenche sa fonction de résolution (isolée par un try/catch par
  Acteur, pour qu'un échec n'empêche pas la résolution des autres). Non
  testé unitairement (convention du projet pour le code dépendant de
  l'API Foundry, comme `StunEffectService`).
- `combat/combat-hooks.mjs` — **modifié** : le hook `updateCombat`
  existant (déjà filtré sur le changement de round, MJ uniquement)
  appelle désormais aussi `resolveRecurringStatusEffectsForRound(combat)`,
  dans son propre bloc try/catch.
- `foundry/chat/asphyxiation-roll-chat.mjs` — **modifié** :
  - `_rollForActor` pose désormais l'état « Asphyxié » sur l'Acteur en
    cas d'échec (`actor.toggleStatusEffect(...)`, best-effort — un Acteur
    sans Token sur le canevas ne peut pas porter d'état, exactement comme
    le fait déjà le jet de Trépas pour l'état « mort »).
  - Nouvelle méthode `rollAndPost({actor, sourceLabel})` : effectue un jet
    et publie directement le résultat en Chat (pas de carte « en
    attente », pas de bouton) — utilisée uniquement pour le
    déclenchement automatique par round.
- `foundry/asphyxiation/metro-asphyxiation-hooks.mjs` — **modifié** :
  enregistre le gérant d'état au démarrage
  (`recurringStatusEffectRegistry.register(ASPHYXIATION_STATUS_EFFECT.id, …)`),
  qui appelle `AsphyxiationRollChat.rollAndPost(...)` à chaque round tant
  que l'état est actif sur l'Acteur.
- `system.mjs` — **modifié** : le nouvel état est enregistré auprès de
  Foundry via `CONFIG.statusEffects.push(ASPHYXIATION_STATUS_EFFECT)`
  (sans quoi Foundry ne saurait pas afficher son icône sur le Token).

**Point de vigilance signalé à l'utilisateur :** l'icône choisie pour
l'état (`icons/svg/degen.svg`, tirée du jeu d'icônes SVG intégré au cœur
de Foundry) n'a pas pu être vérifiée sur une instance Foundry réelle —
aucun accès à un Foundry en fonctionnement depuis cet environnement de
développement. Purement cosmétique si l'icône ne convient pas ou n'existe
pas exactement sous ce chemin : à confirmer par le porteur du projet en
jeu, changement trivial sinon.

**Décision du porteur du projet (28/09/2026, soir) — test mis en pause :**
avant même le premier test en conditions Foundry réelles, le porteur du
projet a demandé de mettre cette extension en pause (« je vais tester [...]
Du coup je suggère que l'on mette en pause notre macro Asphyxie. Je
sauvegarde ton code pour un test ultérieur. ») et de disposer d'une version
consolidée de la Bible plutôt que de poursuivre sur des amendements
dispersés — cf. Bible v0.9.4 (§174), et section dédiée ci-dessus. Le jet
d'Asphyxie de base reste validé et inchangé ; seule cette extension est en
attente de test, sans échéance fixée, à la seule initiative du porteur du
projet.

Suite du chantier, une fois cette mécanique validée par l'utilisateur dans
Foundry (Token affichant bien l'état, dégâts récurrents déclenchés round
par round) : **Poison** (réutilisant directement le registre d'états
récurrents pour un état « Empoisonné »), puis **Maladie** (exposition
initiale), dans cet ordre, un jet codé et validé avant de passer au
suivant.

### Jet de Poison — STATUT : VALIDÉ (02-03/10/2026)

Règle (p.204-205, section « Les poisons »). Périmètre acté avec le porteur
du projet lors du lancement de ce chantier (02/10/2026, pendant la pause
du chantier des dés physiques) : **poison ingéré uniquement** — le poison
appliqué sur une lame (« Poisons et blessures », p.205, Toxicité plafonnée
à 6, déclenché par une attaque de mêlée réussie) est volontairement hors
périmètre, reporté à plus tard.

Jet en **opposition** d'ENDURANCE (Attribut VIGUEUR + Compétence
Endurance, sans dé de Stress) contre un nombre de dés égal à la Toxicité
du poison (lancé pour le MJ, sans Attribut/Compétence). Le livre ne
tranche pas le cas d'égalité des réussites ; convention actée avec le
porteur du projet, par cohérence avec `resolveGrappleEscape` (la saisie) :
**une égalité protège la victime** (effets réduits uniquement, jamais
effets complets). 4 types d'effet (Létal→VIGUEUR, Paralysant→AGILITÉ,
Somnifère→ESPRIT puis inconscience narrative, Hallucinogène→EMPATHIE),
chacun avec un texte d'effets complets (1 dégât par round jusqu'à être
Brisé) et un texte d'effets réduits (1 dégât immédiat, non récurrent) —
pas de poison personnalisé, seulement ces 4 types du livre. Toxicité
libre (le livre ne fournit aucun catalogue de poisons nommés, seulement 3
exemples de puissance : faible 3, puissant 6, extrêmement puissant 9+).

**Architecture délibérément différente de l'Asphyxie** (décision actée au
backlog le 02/10/2026, lors de l'audit Combat/Bible v0.9.5) : chaque
intoxication à **effets complets** est portée par un **Item embarqué**
dédié (type `poison`), et non par un simple état booléen — plusieurs
instances indépendantes peuvent ainsi coexister sur un même Actor (ex.
deux morsures différentes). Une intoxication à **effets réduits** ne crée
jamais d'Item : son unique point de dégâts est déjà entièrement résolu au
moment du jet. L'état Foundry « Empoisonné » (icône sur le Token) n'est
donc jamais posé/retiré manuellement : il est **entièrement dérivé** de la
présence d'au moins un Item Poison embarqué, synchronisé automatiquement
à chaque création/suppression d'un tel Item. Retrait **entièrement manuel
par le MJ** (même convention que l'Asphyxie) : il suffit de supprimer
l'Item Poison concerné (fin de tour narrative, antidote...) — aucune
mécanique d'antidote automatisée dans cette première version.

**Livré :**
- `domain/rules/poison.mjs` — règles pures : `POISON_EFFECT_TYPES` (4
  types, texte des effets complets/réduits repris mot pour mot du livre),
  `POISON_STATUS_EFFECT` (`id: "poisoned"`), `computePoisonOpposedPools`
  (pool victime VIGUEUR+Endurance / pool poison Toxicité),
  `resolvePoisonOpposition` (égalité → victime protégée),
  `resolvePoisonRoundDamage` (1 dégât/round, stoppé une fois l'attribut
  Brisé). 16 tests.
- `data/items/poison-model.mjs` — DataModel de l'Item `poison`
  (effectType/toxicity/sourceLabel), plus `foundry/sheets/poison-sheet.mjs`
  + `templates/items/poison-sheet.hbs` (fiche dédiée, sur le même patron
  que les Blessures critiques).
- `combat/poison-round-service.mjs` (dépendant de l'API Foundry, non
  testé par convention) : `resolvePoisonRoundForActor` applique le dégât
  de CHAQUE instance de Poison embarquée sur un Actor et publie un
  message de Chat récapitulatif.
- `foundry/poison/poison-launcher-dialog.mjs` — fenêtre de lancement (MJ) :
  choix du type d'effet, Toxicité libre, source optionnelle, sélection
  multiple d'Acteurs, via les briques communes `foundry/shared/`. 9 tests.
- `foundry/poison/metro-poison-hooks.mjs` — orchestration : enregistre le
  gérant d'état auprès de `CombatRoundCoordinator` (un Poison à effets
  complets inflige toujours ses dégâts « tous les rounds », pas de
  distinction de Nocivité comme pour l'Asphyxie — le livre n'en prévoit
  aucune pour le Poison), synchronise l'état « Empoisonné » à chaque
  création/suppression d'Item Poison, et crée la Macro MJ
  (`game.metro2033.openPoisonRollDialog()`).
- `foundry/chat/poison-roll-chat.mjs` + `poison-roll-chat-hooks.mjs` —
  une carte de Chat « en attente » par Acteur ciblé ; au clic, les DEUX
  jets (victime et poison) sont effectués et affichés ensemble, le dégât
  immédiat est appliqué dans tous les cas, et l'Item Poison n'est créé
  qu'en cas d'effets complets. **Push ajouté le 03/10/2026, cf. section
  dédiée « Push pour Poison/Maladie » ci-dessous.**

**Dégâts « atypiques » (p.203) — garantis par construction, sans code
dédié :** un Poison Létal qui Brise la VIGUEUR ne doit PAS déclencher de
jet sur la table des Blessures critiques (le livre le precise
explicitement), et un Poison Somnifère qui Brise l'ESPRIT ne doit pas
déclencher de Traumatisme psychologique (inconscience à la place). Ces
deux exemptions sont déjà vraies par construction : comme pour l'Asphyxie,
ce chantier applique les dégâts directement via `actor.takeAttributeDamage()`,
qui ne déclenche jamais aucun jet de Blessure critique/Traumatisme —
aucune règle d'exception à coder séparément.

**Points de vigilance explicitement signalés au porteur du projet :**
- **Push — RÉSOLU (03/10/2026).** À la différence de l'Asphyxie et de la
  Terreur, le livre ne précise nulle part que ce jet « ne peut pas être
  forcé » — il s'agissait donc vraisemblablement d'un jet poussable par
  défaut comme tout autre jet de Compétence. Comblé à la demande du
  porteur du projet (cf. section dédiée « Push pour Poison/Maladie »
  ci-dessous pour le détail des deux décisions de conception actées :
  seule la victime peut Push, le résultat s'affiche avant que le joueur
  choisisse de Pousser ou d'accepter).
- **Interaction avec le Repos long — RÉSOLU (03/10/2026).** Le livre
  précise que « tant que le poison fait effet, vous ne pouvez pas
  récupérer de points dans l'attribut affecté » ; `domain/rules/rest.mjs`
  restaurait jusqu'ici tous les attributs à leur maximum sans exception.
  Comblé à la demande du porteur du projet (cf. section dédiée « Repos
  long / Poison-Maladie » ci-dessous pour le détail) : un Repos long en
  cours de Poison (effets complets, Item embarqué) laisse désormais
  inchangé l'attribut de son type d'effet.
- **Jet effectué en interne via `Math.random()` (`YZERoll.roll()` sans
  `drawDie`), pas via un véritable jet Foundry.** Décision explicite du
  porteur du projet (03/10/2026, cf. section dédiée « Règle de conception
  actée » ci-dessus) : ne pas retoucher ce chantier rétroactivement
  puisqu'il vient d'être testé et validé tel quel ; la règle « tout
  nouveau jet doit utiliser un vrai jet Foundry » s'appliquera aux
  prochains chantiers, une fois le pilote des dés physiques validé. Cette
  règle s'applique aussi au Push ajouté le 03/10/2026 (cf. section dédiée
  « Push pour Poison/Maladie ») : il relance via `actor.pushRoll()`, qui
  déclenche déjà un vrai jet Foundry pour n'importe quel autre jet de
  Compétence — mais le jet initial de ce module restant sur
  `Math.random()`, c'est ce même moteur interne qui est repoussé ici.

**Validation finale par l'utilisateur (03/10/2026) :** « le test me semble
OK ». Chantier **fonctionnellement clos** (sous réserve, comme toujours,
que l'utilisateur revienne avec un retour plus poussé s'il en détecte un
plus tard — mais considéré validé en l'état à ce jour).

### Jet de Maladie — STATUT : VALIDÉ (03/10/2026)

Règle (p.204, section « Les maladies »). Périmètre acté avec le porteur du
projet dès le cadrage initial des 4 macros (28/09/2026), repris au
lancement de ce chantier (03/10/2026) : **seul le jet d'exposition initial
(Malade oui/non) est automatisé** — le cycle complet décrit par le livre
(nouveau jet de Maladie chaque jour tant que le malade n'est pas guéri,
contagion entre personnages, soutien médical via un jet en opposition de
SOINS fait par un soignant, guérison et récupération normale de VIGUEUR/
AGILITÉ) reste entièrement manuel/narratif, à la charge du MJ.

Jet en **opposition** d'ENDURANCE (Attribut VIGUEUR + Compétence
Endurance, sans dé de Stress) contre un nombre de dés égal à la Virulence
de la maladie (lancé pour le MJ, sans Attribut/Compétence) — même
structure que le Poison. Une maladie « standard » possède une Virulence de
3 (valeur préremplie dans la fenêtre de lancement) ; le livre ne fournit
aucun catalogue de maladies nommées, seulement la mention que certaines
maladies possèdent une Virulence bien plus élevée, sans autre exemple
chiffré. Le livre ne tranche pas le cas d'égalité des réussites ;
convention actée avec le porteur du projet, par cohérence avec le Poison
et l'Agrippement : **une égalité protège la victime** (elle n'est pas
rendue Malade). À la différence du Poison, ce jet ne connaît pas d'« effets
réduits » : une victoire ou une égalité de la victime n'inflige strictement
aucun effet (le livre ne décrit qu'une alternative Malade/pas Malade, pas
de palier intermédiaire). En cas d'échec, le livre inflige toujours 1 point
de dégâts fixe à la VIGUEUR et à l'AGILITÉ (« le jour suivant l'infection,
la maladie se déclare »), non convertibles en dés de Stress.

**Architecture plus légère que le Poison, plus proche de l'Asphyxie**
(décision actée avec le porteur du projet, 03/10/2026) : un échec pose
simplement l'état Foundry « Malade » (icône sur le Token), retiré
**manuellement par le MJ** — pas d'Item embarqué par instance comme pour le
Poison, puisque le livre ne décrit pas de maladies multiples et
indépendantes cumulables de la même façon que les poisons. Aucune
automatisation par round de combat n'est enregistrée pour cet état (pas
d'entrée dans `recurringStatusEffectRegistry`/`CombatRoundCoordinator`) :
le cycle de la Maladie est quotidien, pas round par round, et reste
entièrement manuel au-delà du jet d'exposition initial.

**Livré :**
- `domain/rules/illness.mjs` — règles pures : `ILLNESS_STANDARD_VIRULENCE`
  (3), `ILLNESS_STATUS_EFFECT` (`id: "sick"`, nom « Malade »),
  `computeIllnessOpposedPools` (pool victime VIGUEUR+Endurance / pool
  maladie Virulence), `resolveIllnessOpposition` (égalité → victime
  protégée, dégâts fixes VIGUEUR+AGILITÉ en cas d'échec). 10 tests.
- `foundry/illness/illness-launcher-dialog.mjs` — fenêtre de lancement
  (MJ) : Virulence libre (préremplie à 3), source optionnelle, sélection
  multiple d'Acteurs, via les briques communes `foundry/shared/`. 6 tests.
- `foundry/illness/metro-illness-hooks.mjs` — orchestration : crée un
  message de Chat par Acteur sélectionné, Macro MJ auto-assignée
  (`game.metro2033.openIllnessRollDialog()`). Pas d'enregistrement auprès
  du `CombatRoundCoordinator` (cf. ci-dessus).
- `foundry/chat/illness-roll-chat.mjs` + `illness-roll-chat-hooks.mjs` —
  une carte de Chat « en attente » par Acteur ciblé ; au clic, les DEUX
  jets (victime et maladie) sont effectués et affichés ensemble ; en cas
  d'échec, le dégât immédiat est appliqué et l'état « Malade » est posé
  (best-effort, comme l'Asphyxie) ; en cas de réussite ou d'égalité,
  aucun effet. **Push ajouté le 03/10/2026, cf. section dédiée « Push
  pour Poison/Maladie » ci-dessous.**

**Points de vigilance explicitement signalés au porteur du projet :**
- **Push — RÉSOLU (03/10/2026)**, pour les mêmes raisons et par le même
  mécanisme que pour le Poison (cf. section dédiée « Push pour
  Poison/Maladie » ci-dessous).
- **Interaction avec le Repos long — RÉSOLU (03/10/2026)**, même lacune
  que pour le Poison, comblée en même temps et par le même mécanisme (cf.
  section dédiée « Repos long / Poison-Maladie » ci-dessous) : le livre
  précise qu'on ne peut pas récupérer de VIGUEUR/AGILITÉ tant qu'on est
  Malade ; un Repos long sur un Actor affublé de l'état « Malade » laisse
  désormais ces deux attributs inchangés.
- **Jet effectué en interne via `Math.random()`**, pas via un véritable
  jet Foundry — conformément à la règle de conception actée le 03/10/2026
  (cf. section dédiée) : les prochains jets de dés attendent la validation
  du pilote des dés physiques avant de migrer vers un vrai jet Foundry, et
  la Maladie a été lancée avant cette validation. Même nuance que pour le
  Poison : le Push ajouté le 03/10/2026 relance via `actor.pushRoll()`
  (qui déclenche un vrai jet Foundry pour tout autre jet de Compétence),
  mais c'est le résultat `Math.random()` du jet initial qui est repoussé
  ici.
- **Icône de l'état « Malade »** (`icons/svg/biohazard.svg`) non vérifiée
  sur une instance Foundry réelle, exactement comme pour l'icône de
  l'Asphyxie en son temps — purement cosmétique, à confirmer par le
  porteur du projet en jeu.

**Validation finale par l'utilisateur (03/10/2026) :** « tests ok pour la
maladie ». Chantier **fonctionnellement clos**.

Avec ce chantier, **les 4 macros du périmètre initial (Terreur → Asphyxie
→ Poison → Maladie) sont toutes livrées ET validées par l'utilisateur.**
Le rang 2 de la feuille de route (« Macros Foundry pour situations
récurrentes ») n'attend donc plus que, pour l'Asphyxie, la validation de
son extension état/dégâts récurrents toujours en pause, pour être
considéré entièrement clos.

## Jet de SURVIE — déclencheur livré (03/10/2026)

Lacune signalée dans le chantier d'automatisation du système Station
ci-dessus : la réception du Jet de SURVIE (table de modificateurs, bloc
`context.stationSurvival` du gabarit générique, bouton « Appliquer à la
Station ») était câblée depuis le 03/10/2026, mais aucun code ne
construisait ce contexte — rien ne permettait à un joueur de *lancer* ce
jet en jeu normal. Deux questions de cadrage posées et tranchées avant
toute implémentation (réponses actées du porteur du projet) :
- **Déclencheur** : bouton sur la fiche de Personnage, onglet Survie
  (recommandé) — pas dans la fenêtre de préparation universelle
  directement.
- **Ciblage** : liste déroulante parmi toutes les Stations du monde
  (recommandé) — pas de pré-remplissage depuis la Communauté
  d'affiliation du Personnage (`system.affiliations.community`), ce champ
  n'étant pas garanti pointer vers une Station au sens du système
  automatisé.

Confirmation préalable tirée directement du livre (p.219) : « Le jet de
SURVIE subit un modificateur négatif » — la Compétence utilisée est bien
**SURVIE** (fixe, pas un choix libre du joueur), ce qui lève toute
ambiguïté sur ce point avant même la conception.

**Livré :**
- `foundry/station/station-survival-launcher-dialog.mjs`
  (`StationSurvivalLauncherDialog`) — fenêtre de sélection (DialogV2) :
  une Station parmi tous les Items de type `station` du monde, une
  ressource parmi les 5 (modificateur affiché à titre informatif pour
  chacune). Génération de contenu et lecture de formulaire testables
  séparément de l'ouverture Foundry, même patron que
  `IllnessLauncherDialog`/`PoisonLauncherDialog`. 6 tests.
- `foundry/station/station-survival-roll.mjs`
  (`rollStationSurvivalForActor`, non testé par convention — dépendant de
  l'API Foundry de bout en bout) — orchestration : ouvre la fenêtre de
  sélection, prépare un jet de Compétence SURVIE via
  `SkillRollPreparationService` avec le modificateur de la ressource déjà
  prérempli comme **pénalité manuelle** (le joueur peut toujours ajouter
  ses propres Talents/équipement/« Subir 1 Stress pour +3 » par-dessus
  dans la fenêtre de préparation universelle), lance le jet via
  `actor.rollSkill("survival", ...)` avec
  `context.stationSurvival = {stationUuid, stationName, resourceKey,
  resourceLabel, applied: false}`, puis publie le résultat via le
  gabarit générique `YZERollChat.createMessage()` — exactement la forme
  de contexte déjà attendue par `applyStationSurvivalRollFromMessage`
  (câblé depuis le chantier Station initial), qui n'attendait plus que ce
  déclencheur pour fonctionner de bout en bout.
- `foundry/sheets/character-sheet.mjs` + `templates/actors/
  character-sheet.hbs` — nouveau bouton « Lancer un Jet de Survie »,
  onglet Survie, dans une section dédiée distincte des Réserves
  personnelles du Personnage (Eau/Nourriture/Énergie, concept différent
  des ressources de Station) ; nouvelle méthode
  `_onStationSurvivalRoll()`, même patron défensif (try/catch,
  `ui.notifications.error`) que `_onSkillRoll()`.
- `styles/metro-character.css` — classes pour le nouveau bouton et son
  texte d'accroche, réutilisant la palette déjà en place pour le bouton
  « Repos » du même onglet.

**Bilan des tests :** 2040/2040 tests automatisés au total (+6, pour les
seules parties pures de la nouvelle fenêtre de sélection).

**Non vérifié en conditions Foundry réelles (aucun accès à une instance
Foundry depuis cet environnement de développement) :** l'ouverture du
bouton depuis la fiche de Personnage, l'affichage de la liste des
Stations du monde, le pré-remplissage correct de la pénalité manuelle
dans la fenêtre de préparation universelle, et le bon fonctionnement du
bouton « Appliquer à la Station » sur la carte de Chat qui en résulte —
à confirmer par le porteur du projet en jeu.

Avec ce déclencheur livré, le chantier d'automatisation du système
Station (règles p.218-224) est désormais **entièrement complet côté
code** — restent uniquement les réserves déjà connues de validation en
Foundry réel (listées dans la section dédiée ci-dessus), aucune
nouvellement ouvertes par ce complément.

## Point 2 (Combat) — confirmation à 100 % (03/10/2026)

Question du porteur du projet : que manque-t-il pour passer de l'estimation
≈95 % (actée au §163 de la Bible v0.9.3, 27/09/2026) à 100 % ?

Réponse, en reprenant l'audit de clôture déjà mené à ce jalon (mêlée, tir,
initiative, agrippement, étourdissement, mouvement — fichier par fichier,
aucune lacune fonctionnelle détectée sur aucun de ces six sous-systèmes) :
le seul écart documenté depuis la v0.9.1 était un choix d'harmonisation
visuelle, pas une lacune — le Tir appliquait ses conséquences
automatiquement, sans bouton de validation manuelle comme le Corps-à-corps
(décision D2 du §163, jamais engagée jusqu'ici). **Cette décision D2 a été
engagée et livrée le jour même** (cf. section « Harmonisation UX du Tir »
ci-dessus, validée par le porteur du projet).

**Conclusion : le Point 2 (Combat) de la feuille de route à 6 points est
désormais à 100 %, sans réserve ouverte.** Aucune mécanique nommée par
l'intitulé de ce point (mêlée, tir, initiative, agrippement,
étourdissement, mouvement) ne reste manquante ou non fonctionnelle. Seule
réserve générale, commune à tout le projet et non spécifique à ce point :
plusieurs éléments livrés n'ont pas encore été revalidés en conditions
Foundry réelles (cf. réserves listées section par section ci-dessus).

À noter, hors périmètre strict de ce point mais signalé pour mémoire :
l'extension « Subir 1 Stress pour +3 » (livre p.190) reste volontairement
limitée aux jets d'Attribut/Compétence ordinaires — les attaques à
distance et de mêlée ne câblent toujours aucun dé de Stress dans leur
pool (lacune préexistante, hors périmètre de l'harmonisation du Tir,
signalée dès la v0.9.5 §184). Ce n'est pas une dette du Point 2 au sens
strict (le point ne mentionne pas cette option) mais une extension
possible si le porteur du projet le souhaite.

## Audit d'automatisation des Talents — 03/10/2026 (document dédié)

Demande du porteur du projet : établir, Talent par Talent, ce qui peut
raisonnablement être automatisé mécaniquement de ce qui doit rester
narratif ou à l'appréciation du MJ, **avant** toute implémentation.

Audit mené sur l'intégralité du catalogue (`talent-archetype-catalog.mjs`,
56 Talents distincts en comptant les 6 déjà automatisés), classé en 4
catégories à partir du texte exact de l'effet de chaque Talent (aucune
extrapolation) : déjà automatisés (6), automatisable directement (39),
automatisable avec un déclencheur manuel — case à cocher/bouton, limite
d'usage par session/combat non vérifiable seule par le code (9), reste
narratif/appréciation du MJ (2).

**Document complet livré séparément** (trop volumineux pour ce backlog) :
`reference/audit-automatisation-talents.md`, dans le Project. Contient le
tableau récapitulatif, le détail Talent par Talent avec justification, et
les ambiguïtés explicitement signalées plutôt que tranchées (ex. Talents
touchant à un sous-système qui n'existe pas encore, comme l'encombrement
ou la table de blessure critique ; clauses avancées plus complexes que la
clause de base).

**Statut : audit factuel uniquement, aucun chantier d'implémentation
engagé.** La priorisation (quels Talents automatiser en premier, dans
quel ordre) reste à définir avec le porteur du projet.

## Repos long / Poison-Maladie — STATUT : VALIDÉ (03/10/2026)

Lacune signalée dans les chantiers Poison (02/10/2026) et Maladie
(03/10/2026) ci-dessus : le livre précise, pour les deux (p.204-205), que
« tant que [le poison/la maladie] fait effet, vous ne pouvez pas récupérer
de points dans l'attribut affecté », mais `domain/rules/rest.mjs` restaurait
jusqu'ici tous les attributs à leur maximum sans aucune exception. Comblé
le 03/10/2026, à la demande du porteur du projet (« Repos long /
Poison-Maladie (recommandé) »).

**Conception :** `resolveRest()` accepte désormais un paramètre optionnel
`blockedAttributeKeys` (tableau de clés d'attribut, vide par défaut —
comportement historique strictement inchangé si on l'omet). Un attribut
listé n'est pas remis à son maximum : sa valeur actuelle reste strictement
inchangée (ni restauration complète, ni récupération partielle — cette
dernière reste hors périmètre de la simplification déjà actée pour le
Repos long en général).

Côté Foundry, `character-sheet.mjs` calcule la liste des attributs bloqués
avant d'appeler `resolveRest()` (nouvelle méthode
`_computeRestBlockedAttributeKeys()`) :
- **Poison** : chaque Item embarqué de type `poison` (effets complets
  uniquement — les effets réduits ne créent jamais d'Item, cf. chantier
  Poison ci-dessus) bloque l'attribut de son propre type d'effet
  (`getPoisonEffectType(...).attribute`). Plusieurs instances
  indépendantes peuvent ainsi bloquer plusieurs attributs à la fois (ex.
  un Poison Létal ET un Poison Paralysant simultanés bloquent VIGUEUR et
  AGILITÉ).
- **Maladie** : l'état « Malade » (`ILLNESS_STATUS_EFFECT.id`, vérifié via
  `actor.statuses.has(...)`) bloque toujours VIGUEUR et AGILITÉ ensemble,
  conformément au dégât fixe à ces deux attributs que cet état représente.

Le message de confirmation du Repos (`ui.notifications.info`) mentionne
désormais, le cas échéant, les attributs non restaurés et la cause
(« hors VIGUEUR, bloqué(e) par un Poison ou la Maladie en cours »), pour
que le MJ comprenne immédiatement pourquoi un attribut n'a pas bougé.

**Livré :**
- `domain/rules/rest.mjs` — paramètre `blockedAttributeKeys` ajouté à
  `resolveRest()` ; renvoie désormais aussi `blockedAttributeKeys` (la
  liste effectivement appliquée, filtrée aux attributs réellement fournis)
  dans son résultat. 5 nouveaux tests (9 au total sur ce module).
- `foundry/sheets/character-sheet.mjs` — nouvelle méthode
  `_computeRestBlockedAttributeKeys()` (dépendante de l'API Foundry,
  `actor.items`/`actor.statuses` — non testée unitairement par convention) ;
  `_applySurvivalRest()` lui transmet le résultat et enrichit le message
  de confirmation.

**Portée volontairement inchangée par ailleurs :** cette correction ne
touche ni au Push (traité séparément, cf. section « Push pour
Poison/Maladie » ci-dessous), ni au cycle quotidien/round-par-round de
ces deux mécaniques, ni à aucune autre règle de Repos long. 1974/1974
tests automatisés au total (+5 pour ce chantier).

**Non vérifiable depuis cet environnement de développement (aucun accès à
une instance Foundry réelle) :** le calcul `_computeRestBlockedAttributeKeys()`
dépend de `actor.items`/`actor.statuses`, jamais exécutés en conditions
réelles dans ce chantier — à confirmer par le porteur du projet en jeu
(un Repos long pratiqué sur un Actor Empoisonné ou Malade doit laisser
l'attribut concerné inchangé, et le message de confirmation doit le
signaler).

## Push pour Poison/Maladie — STATUT : VALIDÉ (03/10/2026)

Lacune signalée dans les chantiers Poison (02/10/2026) et Maladie
(03/10/2026) ci-dessus : le livre ne dit nulle part que ces deux jets en
opposition « ne peuvent pas être forcés » (à la différence de l'Asphyxie
et de la Terreur, qui le précisent explicitement) — vraisemblablement des
jets de Compétence standards, poussables par défaut. Volontairement
laissé de côté lors de l'implémentation initiale des deux macros, le Push
d'un jet en opposition à **deux pools** (victime et poison/maladie)
soulevant des questions de conception que le livre ne tranche pas.
Comblé le 03/10/2026, à la demande du porteur du projet (« Push pour
Poison/Maladie (recommandé) »), après deux questions posées directement
avant toute conception :

- **Qui peut être poussé ?** → **réponse actée : seule la victime.** Son
  pool d'ENDURANCE (Attribut VIGUEUR + Compétence Endurance) peut être
  poussé normalement, exactement comme n'importe quel autre jet de
  Compétence (1er Push gratuit, 2e payé 1 point de Stress, jamais de 3e).
  Le pool du poison/de la maladie (le « jet du MJ », sans Attribut/
  Compétence, représentant la menace elle-même) n'est **jamais** relancé.
- **Intégration à la carte de Chat ?** → **réponse actée : résultat
  affiché, bouton Pousser en attente.** Cliquer sur « Subir le jet »
  effectue désormais les DEUX jets et les affiche immédiatement, mais
  n'applique plus le dégât/l'effet de statut tout de suite : le joueur
  doit ensuite cliquer sur « Pousser » (ne relance que son propre jet) ou
  « Accepter le résultat » (verrouille l'issue et l'applique) — à l'image
  du cycle Push/Accepter du gabarit générique `YZERollChat`, qui fonctionne
  déjà ainsi pour tout jet de Compétence ordinaire.

**Conception :** `PoisonRollChat`/`IllnessRollChat` passent d'une
résolution « en un clic » à un cycle en trois étapes, portées par deux
nouveaux indicateurs sur le flag du message (`rolled`/`applied`) :
1. **`resolve(message)`** (bouton « Subir le jet ») : lance les deux
   pools une seule fois, sérialise le résultat complet de la victime
   (réutilise `serializeRollResult`/`deserializeRollResult`, désormais
   toutes deux exportées de `yze-roll-chat.mjs`) et les valeurs/réussites
   fixes du poison/de la maladie, affiche la carte avec les boutons
   « Pousser »/« Accepter le résultat » — **sans** appliquer le dégât.
2. **`push(message, {useStress})`** (bouton « Pousser ») : désérialise le
   résultat de la victime et appelle `actor.pushRoll(victimResult,
   {useStress})` — exactement la même méthode générique déjà utilisée pour
   n'importe quel autre jet de Compétence (et pour le jet de la cible dans
   l'Agrippement, `pushGrappleEscape`) — qui délègue à son tour à
   `pushMetroRoll()` : 1er Push gratuit, 2e payé 1 point de Stress, jamais
   de 3e. Réaffiche la carte avec le nouveau résultat de la victime (le
   poison/la maladie reste inchangé) — toujours sans appliquer le dégât.
3. **`accept(message)`** (bouton « Accepter le résultat ») : compare les
   réussites finales (`resolvePoisonOpposition`/`resolveIllnessOpposition`,
   inchangées), applique le dégât/l'effet de statut exactement comme
   avant ce chantier, puis verrouille la carte (plus aucun bouton).

Le bouton « Pousser » n'apparaît que si `pushCount < 2`, et porte le
libellé « Pousser (coûte 1 point de Stress) » dès le second Push, pour que
le joueur sache à l'avance le coût avant de cliquer — même convention
d'affichage que le gabarit générique.

**Livré :**
- `foundry/chat/yze-roll-chat.mjs` — `serializeRollResult` passe de
  fonction privée à **exportée**, pour être réutilisée par Poison/Maladie
  sans dupliquer la logique de sérialisation (`deserializeRollResult`
  était déjà exportée). Aucun changement de comportement.
- `foundry/chat/poison-roll-chat.mjs` — `resolve()` restructuré en trois
  étapes (cf. ci-dessus) ; nouvelles méthodes `push()`/`accept()`. La
  méthode `_applyOutcome()` existante n'a pas changé, seulement le moment
  où elle est appelée (dans `accept()` plutôt qu'à la fin de `resolve()`).
  `renderContent()` gère désormais trois états de carte (en attente / jets
  affichés avec Push-Accepter en attente / appliquée-verrouillée) au lieu
  de deux.
- `foundry/chat/illness-roll-chat.mjs` — restructuration strictement
  identique, miroir exact du Poison.
- `foundry/chat/poison-roll-chat-hooks.mjs` / `illness-roll-chat-hooks.mjs`
  — nouveaux gestionnaires de clic pour `data-action="push-poison"`/
  `"accept-poison"` (et leurs équivalents Maladie), suivant exactement le
  même patron défensif (désactivation du bouton pendant l'opération,
  message d'erreur via `ui.notifications.error` et réactivation du bouton
  en cas d'échec) que le bouton « Subir le jet » déjà existant.
- Aucune modification de `domain/rules/poison.mjs`/`illness.mjs` : les
  fonctions pures de résolution (`resolvePoisonOpposition`,
  `resolveIllnessOpposition`) prennent déjà de simples compteurs de
  réussites en entrée, sans changement nécessaire.

**Portée volontairement inchangée par ailleurs :** la restriction
`actor.pushRoll()`/`_assertCharacter()` à n'autoriser le Push que sur un
Actor de type `character` est une règle système déjà en vigueur pour
**tout** jet de Compétence poussable (y compris l'Agrippement) — ni
nouvelle, ni spécifique à ce chantier : un PNJ ciblé par un Poison/une
Maladie peut toujours subir le jet initial normalement, mais pas le
pousser, de la même façon qu'il ne peut pousser aucun autre jet
aujourd'hui.

**Non testé unitairement, par convention du projet :** `poison-roll-chat.mjs`,
`illness-roll-chat.mjs` et leurs fichiers `-hooks.mjs` dépendent de l'API
Foundry (`ChatMessage`, `fromUuid`, `actor.pushRoll`) et ne sont pas
couverts par des tests unitaires, comme tous les autres fichiers de ce
dossier. Aucune nouvelle fonction de règle pure n'a été introduite par ce
chantier (seules des fonctions déjà pures et déjà testées sont
réutilisées) : 1974/1974 tests automatisés toujours verts, sans nouveau
test.

**Non vérifiable depuis cet environnement de développement (aucun accès à
une instance Foundry réelle) :** l'intégralité du cycle Pousser/Accepter
sur ces deux cartes de Chat — à confirmer par le porteur du projet en jeu
(affichage des deux boutons après « Subir le jet », décompte du Push,
coût en Stress au 2e Push, application correcte du dégât uniquement après
« Accepter le résultat »).

## Affichage/bascule des états Foundry en fiche de Personnage — STATUT : VALIDÉ (02/10/2026)

Demande du porteur du projet, en anticipation d'une liste d'états appelée à
grandir : les états Foundry (`CONFIG.statusEffects`/`actor.statuses`)
devaient devenir visibles ET bascule-ables (réservé au MJ) depuis l'onglet
Survie de la fiche de Personnage, en complément des conditions manuelles du
livre déjà présentes (`system.conditions.*`), affichés en grille à 4
colonnes plutôt qu'en ligne unique.

**Décision de conception actée :** plutôt que de lister les ~60 états par
défaut de Foundry (hors-sujet pour Métro 2033), un registre dédié
`CONFIG.Metro2033.trackedStatusEffects` a été introduit dans `system.mjs`,
peuplé uniquement des états propres au système (à ce jour : Asphyxié).
`character-sheet.mjs` construit à partir de ce registre un tableau
`statusEffects` (id/nom/icône/actif) pour le template, avec une nouvelle
méthode `_toggleStatusEffect(statusId)` (réservée au MJ, appelle
`actor.toggleStatusEffect(id, {active})`, isolée des conditions manuelles
pour ne jamais être captée par leur gestionnaire générique de formulaire).
Grille CSS dédiée (`.metro-character-survival-states-grid`) dans
`styles/metro-character.css`.

**Validation :** le porteur du projet a d'abord formulé une réserve de
principe (« tous les états de Foundry ne sont pas nécessairement visibles
dans la fiche »), puis, après test réel en Foundry, l'a explicitement
retirée et confirmé le fonctionnement (« L'état Asphyxié est bien affiché
dans la fiche d'acteur. Je reviens sur ce que j'ai dit »). **Chantier
fonctionnellement clos et validé en Foundry réel** — à la différence de
l'automatisation round-par-round de l'état (cf. section Asphyxie ci-dessus
et refonte ci-dessous), dont seul l'affichage est confirmé à ce jour.

## Audit de la gestion round-par-round du Combat et refonte de l'Asphyxie — STATUT : LIVRÉ (02/10/2026), validation Foundry réelle à confirmer

Demande explicite du porteur du projet à l'issue de la Bible v0.9.4 : un
audit dédié de la gestion tour/round du Combat (pas de l'initiative ni de
l'attaque/blocage, déjà audités — Point 2, cf. section dédiée plus bas),
avant de reprendre le chantier des macros. Déroulé complet et décisions
détaillées dans la **Bible v0.9.5 (§179-188)**, qui fait foi ; résumé
ci-dessous pour mémoire rapide.

**Origine :** en répondant à une question du porteur du projet sur la
gestion des états d'Acteur en début/fin de round, un gap de dette technique
réel a été repéré — `StunEffectService.clearExpired()` est défini mais
n'est appelé nulle part dans le code (seule `getPenalty()` est utilisée).
Signalé puis explicitement mis de côté par le porteur du projet pour être
traité séparément plus tard. **Résolu le 03/10/2026** : à la demande du
porteur du projet (« Dette technique StunEffectService (recommandé) »),
`StunEffectService.clearExpired(combat)` est désormais appelé depuis le
hook `updateCombat` de `combat/combat-hooks.mjs`, dans son propre bloc
try/catch, juste après l'appel existant à
`CombatRoundCoordinator.resolveRound(combat)`. Pour rappel, il ne
s'agissait pas d'un bug de jeu : `isActive()`/`getPenalty()` ignorent déjà
un effet expiré par eux-mêmes (comparaison de round) ; seul le flag restait
indéfiniment posé sur l'Acteur, sans jamais être retiré. Correctif
purement d'intégration Foundry, non testé unitairement par convention du
projet ; 1969/1969 tests automatisés toujours verts (aucune régression).

Le porteur du projet a ensuite transmis le **document de Bible consolidé de
base** (versions v0.3 à v0.8.7), plus ancien et plus détaillé que les 5
amendements jusque-là seuls connus dans cet environnement (v0.8.8 à
v0.9.4). Sa lecture intégrale (5030 lignes) a révélé qu'un composant
`CombatRoundCoordinator` avait été conçu en détail dès la v0.8.0 (chapitre
« Dangers et exposition », §27-37 du document de base) mais **jamais
implémenté** — confirmé par recherche dans le code (zéro occurrence) avant
toute conception, conformément à la règle de méthode actée en v0.9.4.

**Quatre décisions soumises et approuvées par le porteur du projet avant
conception :**
- Restreindre l'automatisation round-par-round de l'Asphyxie à la seule
  Nocivité **Extrême** (conforme au document de base) ; Légère et Forte
  restent manuelles/narratives même en combat.
- Ajouter l'option **« Subir 1 Stress pour +3 »** (p.190) à l'Asphyxie.
- Construire un vrai `CombatRoundCoordinator`, idempotent, à la place du
  registre d'orchestration existant.
- Traiter le futur **Poison** comme un Item intégré par instance (plusieurs
  sources cumulables indépendamment) plutôt que comme un état booléen
  simple à la façon de l'Asphyxie.

**Livré :**
- `combat/combat-round-coordinator.mjs` (remplace
  `combat/resolve-recurring-status-effects.mjs`, supprimé) : même parcours
  métier (registre d'évaluateurs par état, isolation par try/catch par
  Acteur), avec une garde d'idempotence par flag de Combat posé **avant**
  résolution (jamais de double tick, y compris en cas de rechargement en
  cours de traitement). `combat/recurring-status-effect-registry.mjs`
  conservé à l'identique.
- `foundry/asphyxiation/asphyxiation-launcher-dialog.mjs` : la Nocivité
  devient un vrai choix du MJ (boutons radio), transmise à chaque carte de
  Chat puis persistée comme flag sur l'Acteur (`asphyxiationSourceLevel`)
  au moment où l'état est posé. `metro-asphyxiation-hooks.mjs` : le gérant
  d'automatisation par round ne redéclenche le jet que si ce flag vaut
  `extreme`.
- `action-resolution/action-modifier-service.mjs` +
  `foundry/applications/action-modifier-dialog.mjs` : nouvelle option
  « Subir 1 Stress pour +3 dés » dans le bloc Ajustements de la fenêtre de
  préparation universelle (celle déjà utilisée par tout jet de Compétence,
  d'Attribut, et par le Corps-à-corps) — +3 dés au pool et +1 dé de Stress
  propre au jet, persisté sur l'Acteur (`actor.addStress`) **après**
  résolution du jet, quel qu'en soit le résultat, jamais avant (mécanique
  de Conséquences actée en v0.9.3). Volontairement limitée aux jets
  d'Attribut/Compétence ordinaires : les attaques à distance et de mêlée,
  qui passent par la même fenêtre, ne câblent aujourd'hui aucun dé de
  Stress dans leur pool (lacune préexistante, non corrigée ici, signalée
  pour un futur jalon) — la case n'apparaît donc pas pour elles.
- `foundry/chat/asphyxiation-roll-chat.mjs` : le clic « Subir le jet » sur
  la carte de Chat du joueur ouvre désormais la fenêtre de préparation
  universelle (préremplie VIGUEUR + Endurance) au lieu de lancer les dés
  instantanément, afin de bénéficier de l'option Stress+3. Le jet reste
  explicitement **non forçable** (aucun bouton Push). Effet de bord
  assumé et signalé : passer par `actor.rollSkill()` applique désormais
  la pénalité d'Étourdissement au jet manuel du joueur, comme tout jet de
  Compétence générique (ce n'était pas le cas avant). La relance
  automatique par round (`rollAndPost`) n'est pas concernée par ce
  changement : elle continue de construire son pool directement, sans
  ouvrir aucune fenêtre.
- Correctif d'affichage (même jalon, après premier retour utilisateur) :
  la case à cocher héritait d'une règle CSS prévue pour les champs
  numériques/select de la fenêtre (largeur 100 %) ; une règle dédiée lui
  rend sa taille naturelle, alignée à gauche à côté de son libellé
  (« Subir 1 Stress pour +3 dés »).

**Point de vigilance, repris de la Bible v0.9.5 (§183) :** la pause de test
de l'extension Asphyxie état/dégâts récurrents, actée à la demande du
porteur du projet en v0.9.4 (§174), **reste formellement en vigueur** —
cette refonte n'implique pas sa levée. 1915/1915 tests automatisés au
total (+8 depuis la baseline v0.9.4) ; `CombatRoundCoordinator`, la
Nocivité réelle, l'option Stress+3 et le jet d'Asphyxie via la fenêtre
universelle ne sont pas encore revalidés en conditions Foundry réelles au
moment de la rédaction de cette entrée.

## Jets de dés réellement animés dans Foundry — STATUT : VALIDÉ (04/10/2026), généralisation différée après la charte graphique

Demande explicite du porteur du projet : que chaque jet de dé déclenche un
véritable jet Foundry (comme `/r` dans le tchat), avec une vraie animation
(Dice So Nice si le module est présent), et que ce soient bien les faces
de ce jet physique qui pilotent le résultat du système (succès/échecs) —
pas un calcul interne invisible suivi d'une animation purement
décorative et déconnectée.

**Constat de départ :** le moteur YZE (`domain/rolls/yze-roll.mjs`) tirait
jusqu'ici tous ses dés en interne via `Math.random()`, sans jamais passer
par l'API `Roll` de Foundry — rien n'apparaissait dans le tchat, aucune
animation.

**Décisions de cadrage actées (porteur du projet, 02/10/2026) :**
- Migrer d'abord un **jet pilote** (Attribut/Compétence, le plus utilisé)
  afin de valider l'approche, avant de généraliser aux autres jets du
  système (Corps-à-corps, Tir, Blocage, Terreur, Asphyxie, Trépas, etc.).
- Représenter un pool YZE (dés normaux + dés de Stress) par **un seul Roll
  Foundry** (formule type `Nd6 + Md6`), donc **un seul message de Chat**
  par résolution, avec les dés de Stress en couleur distincte si Dice So
  Nice est présent.

**Conception retenue, pour préserver la testabilité du moteur pur :**
plutôt que de brancher directement l'API Foundry dans `YZERoll` (ce qui
aurait rendu ce module pur et jusqu'ici testé indirectement dépendant de
Foundry), `YZERoll.roll()`/`YZERoll.push()` acceptent désormais une
fonction `drawDie` optionnelle (`() => 1-6`), consommée à la place de
`Math.random()`. Sans cette fonction, le comportement historique est
strictement inchangé (aucune régression sur les 1915 tests existants).
Deux nouvelles méthodes pures, `YZERoll.countInitialDiceToRoll(pool)` et
`YZERoll.countPushDiceToRoll(result, {additionalStressDice})`, permettent
de connaître à l'avance le nombre exact de dés normaux et de Stress à
lancer physiquement, avant même de les lancer.

**Livré :**
- `domain/rolls/yze-roll.mjs` — `drawDie` injectable sur `roll()` et
  `push()` ; `countInitialDiceToRoll`/`countPushDiceToRoll` ajoutés.
  13 nouveaux tests (`tests/domain/rolls/yze-roll.test.mjs`, module
  jusqu'ici seulement couvert indirectement).
- `domain/rules/push.mjs` — `pushMetroRoll()` accepte un `rollerProvider`
  optionnel (callback async appelé une fois les dés à relancer décomptés),
  qui permet à l'intégration Foundry de faire précéder la résolution d'un
  vrai jet physique. Comportement historique inchangé sans ce paramètre ;
  28 tests existants toujours verts.
- `foundry/rolls/physical-dice-roller.mjs` (nouveau, dépendant de l'API
  Foundry — non testé unitairement, par convention du projet) :
  `rollPhysicalDice({normal, stress})` construit et évalue un vrai `Roll`
  Foundry (formule `Nd6 + Md6`), tente d'appliquer une teinte distincte
  aux dés de Stress via Dice So Nice si `game.dice3d` est présent, déclenche
  l'animation 3D le cas échéant, et retourne les faces obtenues dans
  l'ordre exact où le moteur YZE doit les consommer. `createDieDrawer`
  transforme ces faces en fonction `drawDie`.
- `foundry/documents/actor.mjs` — `rollAttribute()`, `rollSkill()` et
  `pushRoll()` déclenchent désormais systématiquement ce jet physique
  avant de résoudre le jet YZE, et conservent le `Roll` Foundry obtenu sur
  le résultat (`result.physicalRoll`).
- `foundry/chat/yze-roll-chat.mjs` — `createMessage()` attache ce `Roll`
  au `ChatMessage` créé (`rolls: [...]`) : la carte reste notre gabarit
  habillé habituel, mais Foundry la reconnaît désormais comme un véritable
  jet de dés (son, reconnaissance par les modules tiers). `updateMessage()`
  (utilisée après un Push) ajoute le `Roll` du Push aux `Roll` déjà portés
  par le même message, plutôt que de les remplacer — un seul message de
  Chat conserve ainsi l'historique complet d'une résolution (jet initial,
  puis chaque Push).

**Portée volontairement limitée à ce stade :** seuls les jets
d'Attribut/Compétence (initial et Push) sont concernés. Les autres jets du
système (Corps-à-corps, Tir, Blocage, Terreur, Asphyxie, Trépas, etc.)
continuent, pour l'instant, à tirer leurs dés en interne sans jet Foundry
visible — leur migration suivra une fois ce pilote validé par le porteur
du projet en conditions Foundry réelles.

**Points de vigilance explicitement signalés, non vérifiables depuis cet
environnement de développement (aucun accès à une instance Foundry
réelle) :**
- La distinction visuelle des dés de Stress (couleur rouge) repose sur un
  préréglage Dice So Nice (`colorset: "red"`) dont l'existence exacte
  n'a pas pu être vérifiée dans la version du module éventuellement
  installée par le porteur du projet. Si la couleur ne s'applique pas
  correctement en jeu, le jet reste pleinement fonctionnel — seule cette
  distinction visuelle pourrait nécessiter un ajustement une fois testée.
- Si Dice So Nice n'est pas installé, le jet Foundry a quand même lieu
  (un vrai `Roll`, un vrai message de Chat avec ses valeurs), simplement
  sans animation 3D.

#### Trois allers-retours de tests utilisateur (02/10/2026) — chantier mis en pause, non validé

Trois problèmes distincts remontés par le porteur du projet au fil de ses
tests, chacun corrigé puis redonnant lieu à un nouveau retour :

1. **Chaque jet était animé deux fois.** Cause identifiée : le code
   déclenchait lui-même l'animation Dice So Nice (`game.dice3d.showForRoll`)
   AVANT de créer le ChatMessage portant ce même `Roll` (`rolls: [...]`) —
   or Dice So Nice anime automatiquement tout `Roll` qu'il voit attaché à un
   message qui vient d'être créé. Corrigé : le jet initial ne déclenche
   plus l'animation lui-même, il laisse Dice So Nice s'en charger à la
   création du message (comme pour n'importe quel jet Foundry standard).
   Seul le Push garde un déclenchement manuel, car il ajoute son jet à un
   message déjà existant via `message.update()`, que Dice So Nice n'anime
   pas automatiquement.
2. **Les dés accordés par « Subir 1 Stress pour +3 dés » n'étaient jamais
   lancés, ni affichés dans la résolution.** Bug antérieur à ce chantier
   (datant de son introduction, v0.9.5) : la case cochée calculait bien un
   total informatif `+3` dans le résumé de la fenêtre de préparation, mais
   ce total n'était jamais réinjecté dans le bonus réellement transmis au
   jet (`actor.rollAttribute`/`rollSkill`) — la case n'a donc jamais eu
   d'effet concret avant ce chantier, qui l'a rendu visible en rendant les
   dés réellement physiques. Corrigé aux 5 endroits concernés (Attribut,
   Compétence, Tir simple/rafale, jet d'Asphyxie via la fenêtre
   universelle) : `totals.stressBonus` est désormais inclus dans
   l'ajustement signé transmis au jet.
3. **Au Push (« forcer le jet »), un nombre de dés incohérent.** Cause
   corrigée : le `Roll` Foundry de chaque Push était accumulé avec les
   précédents dans `message.rolls` au lieu de les remplacer ; une mise à
   jour de message redéclenche son rendu, et Dice So Nice pouvait
   ré-analyser l'intégralité du tableau à cette occasion. Corrigé : le
   message ne porte plus que le `Roll` physique le plus récent (notre
   propre gabarit de Chat reconstruit de toute façon l'historique complet
   à partir de `result.history`).

**Nouveau retour du porteur du projet après ces 3 correctifs (02/10/2026,
soir) :** persistance d'incohérences, cette fois plutôt dans le sens d'un
nombre de dés *diminué*. Le porteur du projet ne sait pas encore si la
cause est graphique (affichage) ou dans le calcul du nombre de dés à
lancer, et a besoin de tests plus poussés et plus longs de son côté avant
de pouvoir isoler précisément le symptôme.

**Décision actée (02/10/2026, soir) :** ce chantier est mis en pause à la
demande explicite du porteur du projet, **non validé**, le temps qu'il
prépare des tests plus approfondis. Le code des 3 correctifs ci-dessus
reste livré et conservé (1928/1928 tests automatisés toujours verts), mais
aucune partie de ce chantier — pilote initial ni ses 3 correctifs — ne
doit être considérée comme validée tant que le porteur du projet ne l'a
pas explicitement confirmé. Le projet reprend en parallèle un autre
chantier, plus simple, sans rapport avec les dés.

**Validation finale par l'utilisateur (04/10/2026) :** « je viens de
valider les jets de dés foundry. » Le pilote (jet d'Attribut/Compétence,
initial et Push) est donc désormais **validé en conditions Foundry
réelles** — les 3 correctifs ci-dessus confirmés fonctionnels. **Décision
actée le même jour : la généralisation aux autres jets du système
(Corps-à-corps, Tir, Blocage, Terreur, Asphyxie, Trépas, etc.) est
explicitement différée après la charte graphique** — le porteur du projet
a précisé que ce chantier pourra être réactivé une fois celle-ci terminée,
et non dans l'immédiat. La règle de conception actée ci-dessus (« tout
nouveau jet doit utiliser un vrai jet Foundry ») s'applique donc désormais
pleinement pour tout développement futur, mais aucun travail de migration
des jets existants n'est engagé avant la reprise explicite de ce
chantier.

## Véhicules

Cf. discussion antérieure : conception volontairement différée, le porteur
de projet et Claude s'étant jugés « pas assez mûrs » sur la réflexion
(postes à bord, conducteur/passagers/arme montée, modificateurs de tir
depuis un véhicule en mouvement). Données brutes du livre déjà connues
(tables Véhicules types et Véhicules hors d'état), mais aucun DataModel
Véhicule à ce jour.

**Confirmé le 27/09/2026 : ce chantier doit être traité en dernier**,
après les Assistants de création, les Macros et l'automatisation Station/Tir
— décision explicite du porteur du projet, indépendante de sa position dans
la feuille de route à 6 points.

## Chantier « Blessures critiques et Traumatismes psychologiques » — STATUT : TERMINÉ (28/09/2026)

Extraction des tables du chapitre 8 « Les règles » (p.202-203, livre
`Metro_2033-200-205.pdf`), déclenchée à la demande du porteur du projet.
Les DataModels `CriticalInjuryDataModel` et `PsychologicalTraumaDataModel`
existaient déjà (chantier antérieur), mais sans aucune donnée ni compendium :
- **« Métro 2033 — Blessures critiques »** (Item `criticalInjury`, 36
  entrées, D66 11 à 66 sans trou) : Fatale/modificateur de Trépas (`Oui`,
  `Oui (-1)`, `Oui (-2)`), délai entre jets de Trépas repris tel quel du
  livre (`Round`, `Quart`, `Tour`, `Journée`), mort instantanée (résultats
  63 à 66), formule de rémission (D6/2D6/3D6/6D6) ou `permanent` (Bras/Jambe
  sectionnés).
- **« Métro 2033 — Traumatismes psychologiques »** (Item `psychologicalTrauma`,
  17 entrées couvrant l'intégralité de la plage D66 11-66 par bornes
  min/max) : mort instantanée pour Infarctus (66) uniquement, `permanent`
  pour Cheveux blancs (21) et Personnalité altérée (61-62).
- **Deux RollTables Foundry natives** (« Blessures critiques (D66) » et
  « Traumatismes psychologiques (D66) »), formule `(1d6 × 10) + 1d6`
  (simule un jet de D66 à deux dés), chaque plage de résultat pointant
  directement vers l'Item correspondant dans son compendium (résultat de
  type Document, `documentUuid`). Un simple clic sur « Lancer » dans
  l'onglet Tables de jet tire donc la bonne Blessure/le bon Traumatisme.

Décisions actées :
- La logique de construction des résultats de RollTable
  (`d66-roll-table-builder.mjs`) est volontairement séparée en fonctions
  pures testables (calcul des plages, association seedKey → UUID) de la
  partie dépendante de `foundry.*` (création/mise à jour réelle du
  Document RollTable), non unit-testée par convention — à valider
  manuellement dans Foundry.
- Ordre d'exécution requis en jeu : les compendiums Item doivent être
  importés avant les RollTables (`seedCriticalInjuryCompendium()` puis
  `seedCriticalInjuryRollTable()`, et de même pour les Traumatismes), car
  la RollTable a besoin des UUID d'Item déjà créés.
- Nuance non modélisée par un champ dédié : le résultat 56 (Colonne
  vertébrale fracturée) devient permanent seulement si aucun soin n'est
  prodigué dans le délai de rémission (6D6 jours) — condition purement
  narrative, décrite dans `effect`, à charge du MJ de la gérer
  manuellement le moment venu.

## Chantier « reprise de données issues des règles » — STATUT : TERMINÉ (27/09/2026)

Cinq compendiums sont désormais importés (les quatre premiers validés par
l'utilisateur en conditions réelles Foundry, le cinquième livré ce jour) :
- **« Métro 2033 — Équipement de base »** : armes de mêlée et à distance,
  protections, munitions standard et qualité militaire, explosifs/consommables,
  objets divers, vestiges, améliorations d'armes (~111 Items).
- **« Métro 2033 — Talents et Archétypes »** : 22 Talents généraux, 33 Talents
  d'archétype (déclinés en 49 Items par archétype éligible), 8 Archétypes
  complets (~80 Items).
- **« Métro 2033 — Bestiaire »** : 15 Créatures (`creature`) extraites du
  livre « MET-06 Monstres v3 » + 3 PNJ notables croisés dans ce même chapitre
  (Le Brahmane, La Ksatriya, Kot Baïoun), cataloguées en `npc` car utilisant
  l'échelle humaine et des Talents (cf. `reference/bestiaire-extrait-monstres.md`
  pour le détail).
- **« Métro 2033 — Factions »** (Item, 16) + **« Métro 2033 — PNJ des
  Factions »** (Actor, 22) : extraits du chapitre 2 « Factions et PNJs »
  (livre `Metro_2033-14-66_Factions_et_PNJs.pdf`). Les 4 grandes factions
  (Polis, la Hanse, la Ligne Rouge, le Quatrième Reich) avec toutes leurs
  personnalités chiffrées (Archétype/Attributs/Talents/Crainte), plus 12
  factions mineures/optionnelles en description seule (pas de PNJ chiffré
  associé dans le livre, hormis les cas notés ci-dessous).
- **« Métro 2033 — Stations »** (Item, 3) + **« Métro 2033 — PNJ des
  Stations »** (Actor, 15) : extraits du chapitre 10 « Station de départ »
  (livre `Metro_2033-248-280_Stations_et_PNJs.pdf`, pages 248-280).
  Petchatniki (station de départ clé en main, terminus de la ligne
  Lyublinsko-Dmitrovskaya), Doubrovka (station commerçante alliée à la
  Hanse) et Kojoukhovskaya (station criminelle dirigée par Samuel
  Vedernikov), avec Population/Ressources/Personnel de soutien
  (`StationDataModel`, règles p.218-221, données de référence non
  automatisées) et 7+4+4 PNJ notables chiffrés (Archétype/Attributs/
  Talents/Crainte).

Décisions actées, à garder en tête pour la suite :
- **Automatisation mécanique des Talents** : seuls 6 Talents sur ~55 ont une
  implémentation mécanique réelle dans `domain/rules/talents.mjs`
  (favoriteWeapon, brute, weakPoint, weaponSpecialist, rapidFire,
  sharpshooter). Les ~49 autres sont des Items complets mais non automatisés
  (effet en texte, appliqué manuellement à la table) — **piste de chantier
  future si l'utilisateur veut aller plus loin sur l'automatisation**.
- **Améliorations d'armes** : importées via le type Item `equipment`
  (réutilisation pragmatique, bonus non automatisé). Évolution possible :
  un type d'Item dédié (`weaponMod`) avec un vrai lien mécanique à l'arme
  équipée.
- **Munitions de qualité militaire** : générées pour les catégories d'armes
  qui les autorisent, absentes pour fusil à pompe/armes lourdes (conforme
  au livre).
- **Bestiaire — mécaniques non automatisées** : Grimpeur/Vol, Toile/Saisie,
  attaques spéciales à réutilisation limitée (jet D6), Toxicité graduée —
  toutes décrites fidèlement en texte (`special`/`description`) mais non
  gérées par le moteur de combat. Détail dans
  `reference/bestiaire-extrait-monstres.md`.
- **`FactionDataModel.notableMembers`** et **`StationDataModel.notableNPCs`**
  volontairement laissés vides au seed (ces champs attendent un UUID
  d'Actor, non fiable à générer automatiquement) : la liste des
  personnalités de chaque Faction/Station est en toutes lettres dans sa
  `description`, et les Actors PNJ existent séparément dans les compendiums
  dédiés — à lier manuellement par glisser-déposer si souhaité.
- **Natasha Kniazeva** (Ligne Rouge) volontairement **absente** du
  compendium PNJ : le livre précise explicitement qu'elle n'existe pas
  (personnage de propagande fictif, sans statistiques) — cataloguer un
  Actor pour elle aurait été une fabrication contraire au texte.
- **Factions mineures sans PNJ chiffré** : Confédération de l'Arbat,
  Confédération 1905, Cité d'Émeraude, Trotskistes, Crime organisé
  (Kitaï-Gorod), Tour des Gardiens, Satanistes, Culte du Grand Ver,
  VDNKh/Alexeïevskaya/Rijskaya, Sœurs de la Charité, Chinatown,
  Vaishnavistes — décrites en Item Faction (territoire/idéologie/chef si
  connu) mais sans Actor PNJ associé (le livre n'en fournit pas).
- **Stations Doubrovka et Kojoukhovskaya — champ `line` laissé vide** : le
  livre ne précise explicitement la ligne de métro que pour Petchatniki
  (terminus de la Lyublinsko-Dmitrovskaya, vert clair). Les deux autres
  stations sont présentées comme situées au-delà de ce terminus, hors
  réseau officiel cartographié dans ce chapitre — inventer une ligne
  aurait été une fabrication ; le champ reste donc vide plutôt que
  deviné.
- **`supportPersonnel` des 3 Stations laissé à 0** : le livre ne fournit
  aucun chiffre de Personnel de soutien (Prospecteur/Cultivateur-éleveur/
  Ingénieur/Technicien/Docteur) pour ces stations — seuls Population et
  Ressources sont chiffrés dans le texte. À compléter manuellement si
  l'utilisatrice souhaite exploiter le système complet de la Station
  (p.218-221) sur ces lieux.

## Point 2 (Combat) — audit de clôture (27/09/2026)

Audité en détail (Bible v0.9.3, §163) : aucune mécanique manquante sur le
périmètre du point (mêlée, tir, initiative, agrippement, étourdissement,
mouvement). Seul écart connu, non bloquant pour tout autre chantier :
harmonisation optionnelle de l'UX du Tir sur le gabarit à états du
Corps-à-corps (bouton de validation manuelle), non engagée — cf. section
« Harmonisation UX du Tir » ci-dessous, **désormais livrée et validée**.

## Harmonisation UX du Tir — STATUT : VALIDÉ (03/10/2026)

Chantier Rang 3 (Bible v0.9.3, §163, décision D2) : aligner l'UX du Tir
(attaque à distance) sur le gabarit à états déjà en place pour le
Corps-à-corps — un bouton de validation manuelle systématique avant toute
application des conséquences, plutôt que l'application automatique dès
qu'aucun blocage (Protection/Désarmement) ne restait en attente.

**Cadrage acté avec le porteur du projet avant conception :**
- Le bouton de validation manuelle (« Résoudre les dégâts ») s'applique
  **systématiquement**, y compris à un Tir simple n'ayant jamais eu à
  bloquer sur une Protection ou un Désarmement — même convention que le
  Corps-à-corps, où le bouton « Résoudre les dommages / effets » est
  toujours requis (décision explicite : « Oui, systématique
  (recommandé) »).
- Les règles de résolution du Tir elles-mêmes (`ranged-attack-resolution.mjs`,
  `ranged-stunts.mjs`, `ranged-attack-application-plan.mjs`/`-ledger.mjs`)
  ne sont **pas retouchées** : seule l'orchestration change (quand
  l'application a lieu), jamais le calcul des dégâts/effets.

**Écart de conception assumé et documenté, par rapport au gabarit complet
du Corps-à-corps :** le Corps-à-corps repose sur une classe d'état à 11
états et un journal fixe à 9 clés (`MeleeAttackWorkflow`), persistée sur le
**Combat** (nécessite un Combat actif). Pour le Tir, le ledger
d'application existant (`createRangedAttackApplicationLedger`, un tableau
`operations` chacune `pending`/`blocked`) jouait déjà ce rôle de journal —
reproduire mécaniquement la machine à états complète du Corps-à-corps
aurait été disproportionné. Un module pur **délibérément plus léger** a
donc été créé à la place (`src/combat/ranged-attack-workflow.mjs`), avec
seulement 3 statuts (`BLOCKED`/`READY`/`APPLIED`) et des fonctions de
dérivation pures, sans journal à clés fixes. L'état du Tir continue par
ailleurs d'être persisté sur le **flag du ChatMessage** (pas sur le
Combat), pour préserver sa capacité historique à se résoudre **sans**
Combat actif — point non soumis à l'utilisateur, jugé comme une
simplification sûre et documentée plutôt qu'une divergence à trancher.

**Risque de régression révisé en cours de chantier, signalé et validé par
le porteur du projet :** l'estimation initiale de la Bible (« 40 à 60
tests nouveaux ») ne couvrait que les tests *nouveaux* ; elle ne tenait pas
compte du fait que le fichier de tests existant
(`tests/foundry/chat/yze-roll-chat-hooks.test.mjs`, plus de 10 000 lignes)
contenait une vingtaine de tests déjà écrits, étroitement couplés à
l'ancien comportement d'application automatique, qui devaient être
**réécrits** (pas seulement complétés). Signalé explicitement avant de
poursuivre ; le porteur du projet a confirmé vouloir continuer malgré ce
périmètre plus large (« On continue quand même maintenant
(recommandé) »).

**Livré :**
- `src/combat/ranged-attack-workflow.mjs` (nouveau, pur) —
  `RANGED_ATTACK_APPLICATION_STATUSES` (BLOCKED/READY/APPLIED),
  `resolveRangedAttackApplicationStatus`, `canApplyReadyRangedAttack`,
  `isRangedAttackApplicationCompleted`. 6 tests.
- `src/foundry/chat/yze-roll-chat-hooks.mjs` — l'application automatique du
  ledger dès l'absence de blocage est retirée de
  `resolveFinalizedRangedAttackMessage`,
  `resumeRangedAttackApplicationAfterProtectionChoice` et
  `resumeRangedAttackApplicationAfterDisarmChoice` : ces trois fonctions se
  contentent désormais de stocker/rerendre le checkpoint à l'état READY
  (ou BLOCKED), sans jamais appliquer. Nouvelle fonction exportée
  `applyReadyRangedAttackLedger(message, {...})` : **seul** point
  d'application restant, appelée exclusivement au clic sur le nouveau
  bouton — refuse explicitement un checkpoint déjà APPLIED ou encore
  BLOCKED. Nouveau binder `bindRangedAttackApplyChoice` (bouton
  `data-action="apply-ranged-attack"`), câblé dans
  `bindRangedAttackChatMessageInteractions` à côté des binders Protection
  et Désarmement existants.
- `src/foundry/chat/yze-roll-chat.mjs` — le ViewModel expose désormais
  `rangedAttackApplication.readyForManualApplication` (dérivé de
  `canApplyReadyRangedAttack`) et `rangedAttackApplication.applied` (dérivé
  de `isRangedAttackApplicationCompleted`).
- `templates/chat/ranged-attack.hbs` — texte « RÉSULTAT FINALISÉ — les
  conséquences s'appliquent automatiquement » corrigé en simple « RÉSULTAT
  FINALISÉ » (devenu inexact) ; nouveau bouton « Résoudre les dégâts »
  (affiché si `readyForManualApplication`) et nouveau bandeau « DÉGÂTS
  APPLIQUÉS » (affiché si `applied`), classes CSS déjà existantes
  réutilisées (`metro-chat-button`, `metro-ranged-attack-actions`,
  `metro-ranged-attack-choice-status`).
- `tests/foundry/chat/yze-roll-chat-hooks.test.mjs` — ~20 tests existants
  adaptés (ajout des mocks `storeApplicationState`/`renderStoredMessage`
  partout où l'ancien chemin « non bloqué » ne les appelait jamais ;
  réécriture des assertions qui vérifiaient un appel direct à P6
  (`applyApplicationLedger`) devenu inexistant à ce stade, remplacées par
  la vérification du nouveau statut `"ready"` stocké). Trois tests
  devenus sans objet (vérifiaient le Combat/l'attaquant/les capacités
  d'échange d'initiative transmis à P6 depuis
  `resolveFinalizedRangedAttackMessage`, câblage désormais déplacé vers
  `applyReadyRangedAttackLedger`) ont été retirés, avec une note expliquant
  pourquoi, plutôt que maintenus avec des assertions trompeuses. 11
  nouveaux tests ajoutés pour `applyReadyRangedAttackLedger` (application
  réussie, refus sur checkpoint déjà APPLIED/encore BLOCKED/absent) et
  `bindRangedAttackApplyChoice` (clic transmis, bouton désactivé pendant
  l'appel, réactivé en cas d'échec, second clic ignoré tant que désactivé).
- `tests/foundry/chat/yze-roll-chat.test.mjs` — 2 nouveaux tests pour les
  champs `readyForManualApplication`/`applied` du ViewModel (état READY,
  état APPLIED), plus 2 assertions ajoutées au test existant pour le cas
  par défaut (aucun statut encore connu → les deux valent `false`).

**Bilan des tests :** 1986/1986 tests automatisés au total, 0 échec (+26
net pour ce chantier : 6 pour le nouveau module pur, 2 pour le ViewModel,
11 pour `applyReadyRangedAttackLedger`/`bindRangedAttackApplyChoice`, le
reste résultant de la réécriture/suppression des tests pré-existants
touchés par le changement de comportement).

**Non vérifié en conditions Foundry réelles (aucun accès à une instance
Foundry depuis cet environnement de développement) :** l'affichage et le
clic effectifs du nouveau bouton « Résoudre les dégâts » sur une carte de
Tir réelle, et sa cohabitation visuelle avec les boutons Protection/
Désarmement déjà existants quand plusieurs blocages se succèdent — à
confirmer par le porteur du projet en jeu.

## Automatisation du système Station — STATUT : LIVRÉ (03/10/2026)

Chantier Rang 3 (système « La Station », règles p.218-224). Avant toute
conception, l'intégralité du texte des règles a été relue à la source
(extraction `pdftotext` du PDF `Metro_2033_Chap_Regles.zip`, pas de
paraphrase mémorisée) — cf. échange initial où l'architecture complète a
été expliquée au porteur du projet avant tout code, à sa demande explicite
(« explique moi ce que veux mettre en place »).

**Six questions de cadrage posées et tranchées avant toute conception**
(réponses actées du porteur du projet) :
1. **Déclenchement** → **bouton directement sur la fiche Item Station**
   (le porteur du projet a explicitement écarté l'option recommandée
   « Macro MJ »).
2. **Cadence** → entièrement manuel (aucune automatisation périodique/
   round-par-round, à la différence de l'Asphyxie/du Poison).
3. **Arbitrage des "6"** (choix de la ressource augmentée) → le MJ choisit
   dans la fenêtre de lancement, au moment du jet.
4. **Jet de SURVIE** (augmentation de ressource par un PJ, p.221) → oui,
   via le gabarit générique `YZERollChat`.
5. **Trace en Chat** → oui, un message récapitulatif systématique.
6. **Découpage** → tout le périmètre resserré en un seul chantier (pas de
   sous-jalons), décision explicite du porteur du projet.

**Périmètre explicitement exclu**, par choix de resserrement validé avec
le porteur du projet avant conception : fusion/échanges/conflits entre
communautés, tables de création de communauté, tables de perte de
flaveur/ambiance, jet de fabrication (Équipement contre objets) — tout
jugé optionnel/à faible fréquence d'usage pour rester dans un chantier
« resserré ».

**Règles reprises telles quelles (p.218-221), point de vigilance capturé
correctement par la lecture à la source :** le pool de base du Jet de
Population = niveau de Population (0-6, jamais forçable) ; chaque ressource
à 0 avant le jet ajoute 1 à 3 dés de Stress supplémentaires (table Eau 3/
Nourriture 2/Équipement 1/Énergie 1/Médicaments 2), dont seuls les "1"
comptent ; les "1" du jet (base + Stress confondus) baissent Eau/
Nourriture/Énergie de 1 chacune **mais jamais l'Équipement**, et les
Médicaments baissent de 1 tous les 2 "1" (division entière) ; les "6"
**du pool de base uniquement** (jamais des dés de Stress) augmentent de 1
une ressource au choix du MJ, **sauf les Médicaments** ; toute ressource
qui passerait sous 0 déclenche le contrecoup (1 dé lancé par point de
débordement, soustrait du nombre de membres de la communauté) ; des pertes
de membres par contrecoup programment 1 à 3 dés de Stress de Moral pour
le jet de la semaine **suivante** (table 1-5→1, 6-12→2, 13+→3) ; le
Personnel de soutien (3 dés par ressource pourvue d'au moins un personnel,
avant le jet de Population) donne +1 ressource par "6", mais si le jet
produit au moins deux "1" le personnel meurt et la ressource n'augmente
pas, même en cas de succès simultané ; le Jet de SURVIE (un PJ, une fois
par semaine complète de recherche) applique un modificateur négatif par
ressource visée (Eau -3/Nourriture -2/Équipement -1/Énergie -2/
Médicaments -4), chaque réussite augmentant la ressource de 1 (plafond 10).

**Livré :**
- `domain/rules/station-population.mjs` (nouveau, pur) —
  `STATION_RESOURCE_KEYS`, `STATION_ZERO_RESOURCE_STRESS_DICE`,
  `STATION_POPULATION_MEMBER_THRESHOLDS` (table p.220),
  `computeStationZeroResourceStressDiceCount`,
  `resolveStationMoralStressDiceCount`,
  `resolveStationPopulationLevelForMembers`, `resolveStationPopulationRoll`
  (pertes/gains simultanés, asymétrie Équipement/Médicaments ci-dessus),
  `resolveStationContrecoup`, `applyStationPopulationMembersLoss`.
  20 tests.
- `domain/rules/station-support-personnel.mjs` (nouveau, pur) —
  `resolveStationSupportPersonnelRoll` (3 dés, "6"→succès, ≥2 "1"→mort du
  personnel et gain annulé même avec un succès simultané). 5 tests.
- `domain/rules/station-survival-roll.mjs` (nouveau, pur) —
  `STATION_SURVIVAL_ROLL_MODIFIERS`, `getStationSurvivalRollModifier`,
  `applyStationSurvivalRollSuccesses` (plafond 10). 6 tests.
- `domain/rules/station-population-roll-workflow.mjs` (nouveau, pur) —
  couche d'orchestration testable des trois modules ci-dessus
  (`rollStationSupportPersonnel`, `rollStationPopulationDice`,
  `applyStationPopulationWeek`), avec un `rollDie` injectable
  (`Math.random()` par défaut) sur le même principe que l'injection
  `drawDie` du moteur `YZERoll` — permet de tester tout l'enchaînement
  (Personnel de soutien → pool de base/Stress → contrecoup → Moral) avec
  des dés déterministes, sans dépendre de l'API Foundry. **Volontairement
  pas un vrai jet Foundry physique** (cf. section dédiée « Règle de
  conception actée » ci-dessus : le pilote des dés physiques reste en
  pause, non validé). 7 tests. `rollStationSupportPersonnel` conserve
  désormais aussi les faces brutes de chaque résultat (`diceResults`), pas
  seulement le décompte résolu — cf. retouche d'affichage du 03/10/2026
  ci-dessous.
- `foundry/station/station-population-view-model.mjs` (nouveau, pur) —
  prépare l'affichage de la fenêtre de lancement (phase « intro » puis
  phase « choices » si au moins un "6" a été obtenu) et du message de
  Chat récapitulatif, à partir des seuls résultats déjà calculés par les
  modules ci-dessus. `STATION_RESOURCE_DEFINITIONS` (libellés français des
  5 ressources) partagé entre la fenêtre et la carte de Chat. Complété le
  03/10/2026 (`DICE_FACE_GLYPHS`/`diceFaceGlyph`/`diceFacesToGlyphs`, cf.
  ci-dessous). 9 tests.
- `data/items/station-model.mjs` — **modifié** : ajout du champ
  `population.pendingMoralStressDice` (entier ≥ 0, initial 0), seul champ
  ajouté à ce DataModel (les jauges de ressources/population/personnel de
  soutien existaient déjà depuis le chantier d'extraction des Stations).
- `foundry/applications/station-population-launcher-application.mjs`
  (nouveau, `ApplicationV2`, non testé unitairement par convention) —
  fenêtre de lancement en 2 phases : « Lancer les dés » effectue le jet du
  Personnel de soutien (ses gains sont appliqués aux ressources **avant**
  de calculer les dés de Stress dus aux ressources à 0, conformément au
  livre) puis le jet de Population ; si au moins un "6" a été obtenu, un
  menu apparaît par "6" pour choisir la ressource augmentée (Médicaments
  exclu) ; « Valider et appliquer » résout le contrecoup, met à jour
  l'Item Station (ressources, niveau/membres de Population, dés de Moral
  programmés, décompte du personnel mort), poste le récapitulatif de Chat,
  puis ferme la fenêtre. Avec `templates/applications/
  station-population-launcher.hbs`.
- `foundry/chat/station-population-chat.mjs` (nouveau, non testé par
  convention) — `postStationPopulationRecapMessage` : rend
  `templates/chat/station-population-recap.hbs` à partir du ViewModel
  ci-dessus et publie un `ChatMessage` (Personnel de soutien, dés de
  Population, ressources avant/après, détail du contrecoup le cas échéant,
  membres/niveau avant/après, dés de Moral programmés pour la semaine
  suivante, personnel perdu).
- `foundry/sheets/station-sheet.mjs` + `templates/items/station-sheet.hbs`
  — **modifiés** : nouveau bouton « Jet de Population hebdomadaire »
  (réservé au MJ, `isGM`) dans le panneau Ressources, ouvrant la fenêtre
  de lancement pour cet Item.
- `styles/metro-items.css` — classes CSS ajoutées pour la fenêtre de
  lancement et la carte de Chat (grille de ressources, ligne de choix de
  "6", encart Contrecoup) ; la carte de Chat réutilise par ailleurs les
  classes génériques déjà existantes (`.metro-chat-card`,
  `.metro-chat-section`, `.metro-chat-section-title`).

**Bilan des tests à la livraison initiale :** 2031/2031 tests automatisés
au total, 0 échec (+45 pour ce chantier : 20+5+6 pour les 3 modules de
règles pures, 7 pour la couche d'orchestration testable, 7 pour le
ViewModel de la fenêtre/Chat).

**Retouche de lisibilité du message de Chat — 03/10/2026 (retour
utilisateur) :** après un premier test, le porteur du projet a signalé
deux problèmes sur `templates/chat/station-population-recap.hbs` : (1) des
libellés trop abrégés/juxtaposés (ex. « Eau : 2 succès, 1 "1" — +2 »,
« Pool de base : 1 dé(s) — 0 "1", 0 "6" »), peu clairs sans connaître déjà
le détail des règles ; (2) un bug d'affichage où le libellé d'une
ressource et sa valeur apparaissaient collés sans espace (« Eau1 → 3(+2) »)
— cause identifiée : la ligne était composée de plusieurs éléments HTML
distincts dans une mise en page flexible (espace géré par `gap` CSS, pas
par un caractère d'espace réel), ce qui pouvait se perdre à l'affichage ou
à la copie du texte. Corrigé en reformulant chaque ligne en phrases
complètes (ex. « Eau : 2 réussite(s) ("6") et 1 "1" sur 3 dés lancés →
+2 Eau. ») et en fusionnant chaque ligne de ressource en un seul bloc de
texte (`{{label}} : {{before}} → {{after}} ({{delta}})`), ce qui élimine
la cause structurelle du bug d'espacement en même temps que le manque de
clarté.

**Représentation des dés en glyphes Unicode — 03/10/2026 (demande
utilisateur) :** à la demande du porteur du projet (« peut être utiliser
une représentation d'un dé plutôt que "1" ou "6" »), les mentions
textuelles `"1"`/`"6"` ont été remplacées par les glyphes Unicode de face
de dé (⚀ à ⚅, U+2680-U+2685), affichant les dés réellement obtenus plutôt
qu'un simple chiffre entre guillemets — à la fois dans le message de Chat
récapitulatif et dans la fenêtre de lancement elle-même (cohérence entre
les deux). Pour que cela soit possible pour le Personnel de soutien (dont
seul le résultat résolu — succès/échecs — était conservé jusqu'ici, pas
les faces brutes), `rollStationSupportPersonnel` conserve désormais aussi
`diceResults` (faces brutes) à côté du résultat résolu. Nouvelles
fonctions pures et testées dans `station-population-view-model.mjs` :
`DICE_FACE_GLYPHS` (table de correspondance face→glyphe), `diceFaceGlyph`,
`diceFacesToGlyphs` (assemble une série de dés déjà lancés, dans l'ordre
obtenu) — réutilisées pour le pool de base, les dés de Stress, le
Personnel de soutien et le contrecoup. `styles/metro-items.css` — règle
`.metro-station-population-dice` ajoutée (taille de police agrandie,
espacement des glyphes) pour que ces dés restent lisibles malgré la petite
taille par défaut de ces caractères Unicode dans la plupart des polices.

**Bilan des tests après ces deux retouches :** 2033/2033 tests automatisés
au total (+2 pour `diceFaceGlyph`/`diceFacesToGlyphs`, plus les
assertions `diceGlyphs`/`diceResults` ajoutées aux tests existants des
modules déjà cités). Aucune règle métier modifiée par ces deux retouches :
uniquement le texte et la représentation visuelle du message de Chat et de
la fenêtre de lancement.

**Remplacement des glyphes par de vrais carrés de dés — 03/10/2026
(retour utilisateur, capture d'écran à l'appui) :** les glyphes Unicode
ci-dessus, une fois testés en Foundry réel, se sont révélés trop petits
et peu lisibles. Le porteur du projet a demandé de s'aligner sur le
rendu déjà utilisé pour le jet de Compétence générique (carrés `.metro-
yze-die`, réussites en rouge/texte blanc), avec une nuance pour les "1" :
« carré à bord rouge, fond noir et texte blanc » plutôt que le style
`.metro-yze-die--one` existant (à peine distinct du dé neutre). Livré :
- `diceFaceGlyph`/`diceFacesToGlyphs` remplacés par `diceFaceSquare`/
  `diceFacesToSquares` dans `station-population-view-model.mjs` :
  renvoient désormais, par dé, `{value, success, one}` plutôt qu'un
  glyphe assemblé en chaîne de caractères — `success` (6 d'un pool de
  réussite) et `one` pilotent directement les classes CSS du carré.
  Deux options : `successOnSix` (désactivée pour les dés de Stress, dont
  les "6" n'ont mécaniquement aucun effet, règles p.218-219) et
  `markOnes` (désactivée pour les dés de contrecoup, qui ne sont pas un
  jet de réussite/échec mais un simple nombre de membres perdus par
  point de débordement — leur "1" ne signifie rien de spécial).
- Les trois champs `rollSummary`/`populationDiceSummary` concernés
  (`baseDiceGlyphs`→`baseDiceSquares`, `stressDiceGlyphs`→
  `stressDiceSquares`) et chaque ligne (`diceGlyphs`→`diceSquares`, pour
  le Personnel de soutien et le Contrecoup) renommés en conséquence.
- `templates/applications/station-population-launcher.hbs` et
  `templates/chat/station-population-recap.hbs` : les glyphes sont
  remplacés par des grilles de carrés `.metro-yze-die` (réutilisant la
  classe `.metro-yze-roll-dice-list` déjà définie pour le jet de
  Compétence générique), avec `.metro-yze-die--success` pour les "6"
  comptant comme succès et une nouvelle classe `.metro-yze-die--station-
  one` pour les "1" — appliquée uniquement dans ces deux templates, sans
  toucher au style `.metro-yze-die--one` du jet de Compétence standard
  utilisé ailleurs dans le système (pour ne pas changer son apparence
  sans demande). Les dés de contrecoup s'affichent en carrés neutres,
  sans aucune coloration (ni succès ni "1").
- `styles/metro-items.css` : règle `.metro-station-population-dice`
  (taille/espacement des glyphes, devenue inutile) retirée, remplacée
  par `.metro-yze-die.metro-yze-die--station-one` (fond noir, bordure et
  texte repris de la palette déjà utilisée pour les succès, pour rester
  cohérent visuellement).

**Bilan des tests après cette dernière retouche :** 2034/2034 tests
automatisés au total (+1, pour les deux nouvelles options de
`diceFaceSquare`). Aucune règle métier modifiée : uniquement la
représentation visuelle des dés.

**Non vérifié en conditions Foundry réelles (aucun accès à une instance
Foundry depuis cet environnement de développement) :** le rendu effectif
des carrés de dés et de la nouvelle variante "1" (fond noir/bordure
rouge/texte blanc) dans la fenêtre de lancement et le message de Chat —
à confirmer par le porteur du projet en jeu.

**Lacune signalée explicitement au porteur du projet — Jet de SURVIE sans
déclencheur dédié :** la question 4 du cadrage (« Jet de Survie → oui, via
le gabarit générique ») a été traitée pour sa partie **réception** : la
table de modificateurs (`station-survival-roll.mjs`) et la réutilisation
de `YZERollChat` (bloc `context.stationSurvival`, bouton « Appliquer à la
Station » une fois le jet finalisé, appliqué via
`applyStationSurvivalRollFromMessage`/`bindStationSurvivalApplyChoice`
dans `yze-roll-chat-hooks.mjs`) sont bien livrées et couvertes. **Mais
aucun code ne construit encore `context.stationSurvival`** : il n'existe
à ce jour **aucun bouton ni fenêtre** permettant à un joueur ou au MJ de
*lancer* un Jet de SURVIE avec la Station/ressource visée déjà attachée
au jet — ce jet reste donc, en l'état, inatteignable en jeu normal (hormis
en construisant le contexte à la main via la console). **Ce point a été
résolu depuis, cf. section « Jet de SURVIE — déclencheur livré »
ci-dessus.**

## Prochaine étape en cours (mise à jour du 04/10/2026)

Les deux Assistants de création (PJ et PNJ), l'affichage/bascule des états
Foundry, l'audit Combat/refonte Asphyxie, les 4 macros de situations
récurrentes (Terreur/Asphyxie/Poison/Maladie), le Repos long, le Push
Poison/Maladie, l'harmonisation UX du Tir, l'automatisation du système
Station (y compris son déclencheur de Jet de SURVIE), et 23 Talents sont
désormais soit validés par l'utilisateur, soit livrés en attente de
validation Foundry réelle — cf. sections dédiées ci-dessus pour le détail
complet.

Un jalon reste livré mais non revalidé en conditions Foundry réelles :
l'extension état/dégâts récurrents de l'Asphyxie (pause de test toujours
en vigueur). Le chantier des dés physiques, lui, a été validé par le
porteur du projet en conditions Foundry réelles le 04/10/2026 — sa
généralisation aux autres jets du système reste différée après la charte
graphique (cf. section dédiée ci-dessus).

**Chantier actif depuis le 03/10/2026 : revue transverse de la charte
graphique**, engagée après un audit de conformité dédié
(`reference/audit-automatisation-talents.md` pour les Talents et l'audit
de conformité charte graphique consolidé dans l'amendement de Bible
v0.9.7 — tokens de couleur, échelle typographique, composants formalisés,
règles de mise en page). Rollout interface par interface, chaque lot
revérifié par la suite de tests complète (aucune régression à ce jour,
toutes les retouches étant purement CSS) : Fiche Arme + socle commun des
fiches d'Objets, Fiche Protection, triptyque d'état rouge/ambre/vert
formalisé en 3 tokens de la charte, fenêtre de Préparation de l'initiative,
**assistants de création (PJ/PNJ)**, **`station-population-launcher`**,
**5 fenêtres sans CSS dédié** (`ranged-stunt-dialog`, `melee-stunt-dialog`,
`melee-block-stunt-dialog`, `protection-damage-allocation-dialog`,
`station-survival-launcher-dialog`), **4 fenêtres à CSS quasi inexistant**
(`terror-roll-launcher-dialog`, `asphyxiation-launcher-dialog`,
`poison-launcher-dialog`, `illness-launcher-dialog`), **les tailles de
texte hors échelle du Chat** (15px/38px, décision actée : calage sur la
grille existante), **l'onglet Survie/Biographie de la fiche Acteur**, et
**le badge d'état de la fiche Équipement** (ces cinq derniers points livrés
le 04/10/2026, cf. ci-dessous). Seul reste à traiter : les boutons natifs
Confirmer/Annuler de DialogV2 sur `action-modifier-dialog` (en attente de
validation Foundry réelle, volontairement non engagé).

**Lot « assistants de création » livré (04/10/2026) :** bandeau d'en-tête
rouge + étoile + politique de défilement désormais partagés via le
sélecteur commun de `metro-base.css` ; cadres `rgba(120,35,35,…)`/
`rgba(150,35,35,…)` remplacés par le motif panneau exact ou par les
tokens `border`/`border-subtle` selon le cas ; couleurs `#c94c4c`/
`#e08a8a`/`#a92b2b` unifiées sur `brand-hover`/`state-danger` ;
`letter-spacing` ramené sur l'échelle actée ; bouton de création finale
passé au motif Bouton (dégradé vertical). 2075/2075 tests toujours verts.

**Lot `station-population-launcher` livré (04/10/2026) :** classe de
fenêtre ajoutée au sélecteur commun de `metro-base.css` (bandeau d'en-tête
rouge + étoile + scroll désormais partagés) ; motif panneau appliqué aux 3
sections de la fenêtre de lancement (Situation actuelle, Résultat du jet,
Choix des "6") et au bloc Contrecoup de la carte de Chat (bordure
supérieure rouge + dégradé 145°, au lieu d'un cadre plat/bordure latérale) ;
titre de la Station ramené sur l'échelle (13px/700/0.09em, au lieu de
15px hors échelle) ; couleur de texte secondaire `#8a8378` unifiée sur
`ink-muted`. 2075/2075 tests toujours verts.

**Lot « 5 fenêtres sans CSS dédié » livré (04/10/2026) :** classe de
fenêtre ajoutée à `ranged-stunt-dialog`, `melee-stunt-dialog`,
`melee-block-stunt-dialog`, `protection-damage-allocation-dialog` et
`station-survival-launcher-dialog`, rattachée au sélecteur commun de
`metro-base.css` ; nouveau fichier `styles/metro-stunt-dialogs.css`
(motif panneau sur chaque ligne de liste, boutons/cases en taille
naturelle `white-space: nowrap`). 2075/2075 tests toujours verts.

**Lot « 4 fenêtres à CSS quasi inexistant » livré (04/10/2026) :** classe
de fenêtre ajoutée à `terror-roll-launcher-dialog`,
`asphyxiation-launcher-dialog`, `poison-launcher-dialog` et
`illness-launcher-dialog`, rattachée au sélecteur commun de
`metro-base.css` ; motif panneau appliqué aux `fieldset` partagés
(`metro-chat.css`), légendes ramenées sur l'échelle `titre-section`,
texte unifié sur `ink-soft`/`ink` exacts. 2075/2075 tests toujours verts.

**Tailles de texte hors échelle du Chat — corrigé (04/10/2026) :**
décision actée du porteur du projet (« Caler sur la grille existante
(recommandé) »). `metro-yze-chat.css`/`metro-chat.css` : titre et
libellé de résultat ramenés à 13px (`titre-section`), valeur du résultat
à 28px (palier le plus haut), étoile `.melee-completed-star` à 12px
(alignée sur les autres étoiles). 2075/2075 tests toujours verts.

**Badge d'état de la fiche Équipement — corrigé (04/10/2026) :** triptyque
d'état (`state-danger`/`state-warning`/`state-success`) appliqué à
`.metro-equipment-condition-value`, mappé sur les drapeaux
`broken`/`damaged` de `_getEquipmentState()`. 2075/2075 tests toujours
verts.

**Onglet Survie/Biographie de la fiche Acteur — audité et corrigé
(04/10/2026) :** motif panneau appliqué aux sections des deux onglets
(`metro-character.css`), par sélecteurs CSS génériques plutôt que par
modification du template (corps de section trop variés pour un wrapper
commun) ; le bloc Notes MJ garde son traitement dédié, réaligné sur les
tokens exacts. 2075/2075 tests toujours verts.

Avec ces cinq lots, **la revue transverse de la charte graphique est
désormais entièrement terminée**, à la seule exception des boutons
natifs Confirmer/Annuler de DialogV2 sur `action-modifier-dialog`,
volontairement laissés en l'état en attendant une validation Foundry
réelle.

Le porteur du projet n'a pas de lien direct vers les fichiers modifiés
dans cet environnement de développement (environnement cloud sans accès
à son poste) : convention actée le 04/10/2026, un zip complet du projet
est désormais livré après chaque lot de la charte graphique terminé, pour
qu'il puisse l'extraire sur sa copie locale et vérifier les changements.

## Bug signalé — pas de bouton « Équiper » après glisser/déposer d'une Arme sur un Personnage sans arme (04/10/2026) — STATUT : LIVRÉ (04/10/2026, cf. section « Chantier « case à cocher Équipée » » plus bas dans ce document)

Remarque du porteur du projet (04/10/2026, en plein chantier de la charte
graphique) : « je viens de m'apercevoir que j'avais un personnage acteur
qui n'avait pas d'arme. je lui en ai glisser/déposer une mais je n'ai pas
le bouton "Equiper". On peut finir la charte graphique mais gardons cela
en tête. »

**Symptôme rapporté** : un Actor de type Personnage qui ne possédait
initialement aucune Arme, après qu'une Arme lui a été glissée-déposée
depuis le répertoire/un compendium, ne montre pas de bouton « Équiper »
sur la fiche — alors que ce bouton est attendu pour pouvoir équiper
l'Arme nouvellement reçue.

**Précision apportée par le porteur du projet (04/10/2026, en aparté,
toujours pendant le chantier de la charte graphique) :** « pour les armes
et protections glissé/déposé sur une fiche d'actor il doit y avoir une
case à cocher "Equipé" oui/non et qui du coup permet des avoir pour le
combat les armes et les protections équipées. C'est un chantier à garder
en tête. » Cette précision élargit et clarifie le symptôme initial : il
ne s'agit pas seulement d'un bouton « Équiper » manquant pour l'Arme,
mais d'une **mécanique d'équipement à concevoir pour les deux types
d'Objets concernés (Arme ET Protection)** — une case à cocher « Équipé »
(oui/non) sur chaque Item, qui déterminerait lesquels de ces Objets
comptent comme équipés pour la résolution du Combat (dégâts/protection
appliqués uniquement pour les Items cochés « Équipé »).

**Décision explicite du porteur du projet : ne pas investiguer ni corriger
ce point maintenant.** La priorité reste de terminer le chantier en cours
(rollout de la charte graphique interface par interface). Ce point est
consigné ici uniquement pour ne pas le perdre d'une session à l'autre,
conformément à la méthode de travail du projet.

**Aucune investigation n'a encore été menée** (pas de lecture du code de
`character-sheet.mjs`, des fiches Arme/Protection, ni des éventuels champs
`system.equipped` déjà présents ou absents sur leurs DataModels respectifs ;
pas d'hypothèse actée sur l'articulation avec le Combat — où et comment un
Item « Équipé » est lu au moment de résoudre une attaque/un blocage) : à
reprendre en détail au moment où le porteur du projet demandera
explicitement de traiter ce point. Ce chantier touchera vraisemblablement
au moins : `data/items/weapon-model.mjs`, `data/items/armor-model.mjs` (ou
équivalents), leurs fiches (`.hbs`)/feuilles (`.mjs`), et les points du
moteur de Combat qui lisent aujourd'hui les Items Arme/Protection d'un
Actor (mêlée, tir, blocage) pour ne retenir que ceux marqués « Équipé ».

## Chantier Talents — lot 1 « chercheurs de ressource » livré (03/10/2026)

À la demande du porteur du projet (« très bien attaquons le chantier des
talents »), démarrage de l'automatisation des Talents sur la base de
l'audit dédié (`reference/audit-automatisation-talents.md`) et des deux
réponses de cadrage retenues : lot de départ = les « 17 Talents généraux
automatisables directement », et exclusion du lot les Talents hors du
mécanisme de pool de dés déjà en place (reportés à un lot séparé).

**Point de transparence important, vérifié directement sur le texte
source avant tout code** : sur les 17 Talents du lot approuvé, seuls **5**
satisfont réellement le critère retenu (« pool de dés d'un jet via le
mécanisme déjà en place, sans nouveau type d'effet, sans nouveau
sous-système »). Il s'agit de la famille des Talents « chercheurs de
ressource » du Jet de SURVIE (Station, p.219) : **Sourcier** (Eau),
**Chasseur-cueilleur** (Nourriture), **Carbochimiste** (Énergie),
**Pharmacologiste** (Médicaments), **Dénicheur** (Équipement). Les 12
autres Talents du lot des 17 ne sont en réalité pas automatisables sans
extension d'architecture :
- 3 nécessitent un nouveau type d'effet (remplacement d'Attribut sous
  une Compétence) : Esquive, Sens du danger, Menaçant ;
- 7 relèvent en fait du lot déjà mis de côté par la deuxième réponse de
  cadrage (hors mécanisme de pool de dés) : Bête de somme, Chanceux,
  Guérison accélérée, Maîtrise de soi, Réflexes éclair, Impitoyable,
  Dégainé rapide ;
- 1 est bloqué par une information de contexte absente du code
  (couvert/véhicule en mouvement) : Tireur instinctif ;
- 1 passe par un sous-système de jet totalement différent, non relié au
  moteur générique de Talents (Terreur) : Courage ;
- 1 est en réalité un nouveau déclencheur de jet à part entière,
  comparable en ampleur au chantier Jet de Survie : Second souffle.

**Décision prise** : plutôt que de bloquer sur ce constat, implémentation
immédiate du sous-ensemble réellement scopé et cohérent (les 5 Talents
« chercheurs de ressource »), les 12 autres restant au backlog pour un
arbitrage ultérieur du porteur du projet (lots séparés par nature de
blocage, listés ci-dessus).

**Réalisé :**
- Ajout de `mechanicalKey` aux 5 entrées correspondantes du catalogue
  (`src/data/seed/talent-archetype-catalog.mjs`) : `waterForager`,
  `foodForager`, `energyForager`, `medicineForager`, `equipmentForager`.
- 5 nouvelles clés `TALENT_KEYS` et définitions `TALENT_DEFINITIONS`
  dans `src/domain/rules/talents.mjs`, via une fabrique commune
  (`createResourceForagerTalentDefinition`) : pertinent uniquement pour
  un Jet de SURVIE (`SKILL_ROLL`, compétence `survival`) dont la
  ressource ciblée (`context.metadata.resourceKey`) correspond au
  Talent ; condition toujours `NONE` (pas de circonstance à arbitrer) ;
  effet toujours +1 au niveau normal, +2 au niveau supérieur (y compris
  pour Dénicheur, de niveau max 1, qui ne propose donc que +1).
- `src/foundry/station/station-survival-roll.mjs` : transmission de
  `metadata: { resourceKey }` à `SkillRollPreparationService.create`,
  condition nécessaire pour que ces nouveaux Talents soient détectés par
  le moteur de préparation d'action.
- Tests unitaires (`tests/domain/rules/talents.test.mjs`) : nouveau
  helper `skillContext`, un bloc de tests par Talent (pertinence stricte
  à la ressource visée et au type de jet, effet +1/+2), mise à jour des
  deux assertions exhaustives sur `TALENT_KEYS`/`TALENT_DEFINITIONS`
  (onze talents automatisés au total désormais). **2055/2055 tests
  automatisés au total.**

**Réserve à signaler au porteur du projet (déploiement)** : le
réensemencement du compendium (`seedTalentArchetypeCompendium`) met à
jour la clé mécanique des Items du compendium, mais les Items de Talent
déjà incarnés sur des Personnages existants dans le monde sont des
instantanés Foundry indépendants — ils ne se mettront pas à jour tout
seuls. Pour que ces 5 nouveaux automatismes s'appliquent à un Personnage
qui possède déjà l'un de ces Talents, il faudra retirer puis
réattribuer l'Item de Talent concerné (ou le remplacer manuellement)
après le déploiement de cette mise à jour.

**Non traité, laissé en l'état au backlog** : les 12 Talents généraux
listés ci-dessus, les 22 Talents d'archétype, et les 9 Talents à
déclencheur manuel de l'audit — aucun arbitrage du porteur du projet n'a
encore été demandé sur leur ordre de reprise.

## Chantier Talents — lot 2 « échange d'Attribut » livré (03/10/2026)

Suite au lot 1 (chercheurs de ressource), le porteur du projet a demandé
de continuer sur les Talents (« Continuons sur les talents »). Choix fait
(parmi 4 options proposées) : attaquer les **3 Talents généraux restants
qui touchent le mécanisme générique sans sous-système séparé** — Esquive,
Sens du danger, Menaçant — tous trois de la même famille mécanique :
« vous pouvez (au choix) faire CE jet sous tel Attribut plutôt que tel
autre ».

**Nouveauté d'architecture nécessaire, confirmée par investigation avant
codage** : aucun des 4 types d'effet de Talent existants (`ACTION_MODIFIER`,
`DAMAGE_MODIFIER`, `ACTION_COST`, `FORBID_AIM`) ne permet de représenter
un remplacement d'Attribut. Ajout d'un 5e type, `ATTRIBUTE_SWAP`,
strictement limité à porter l'identifiant de l'Attribut alternatif — le
score correspondant est résolu par la couche Foundry (qui a accès à
l'Actor), jamais par le Talent lui-même (toujours pur/sans dépendance).

**Décision de conception** : contrairement aux bonus numériques de
Talent (pré-cochés dès que la condition est remplie ou absente), un
échange d'Attribut n'est **jamais appliqué automatiquement** — ces 3
Talents sont tous formulés « au choix »/« si vous le souhaitez » dans le
livre. La case à cocher dédiée dans la fenêtre de préparation est donc
toujours décochée par défaut, quel que soit l'état de la condition.

**Réalisé :**
- `domain/rules/talents.mjs` : nouveau type d'effet `ATTRIBUTE_SWAP` ;
  3 nouvelles définitions — **Esquive** (Blocage en mêlée → Agilité au
  lieu de Vigueur, toujours disponible), **Sens du danger** (Jet
  d'Observation → Empathie au lieu d'Esprit, toujours disponible),
  **Menaçant** (Jet de Manipulation → Vigueur au lieu d'Empathie ;
  niveau normal conditionné à la circonstance narrative « vous menacez
  quelqu'un », non détectable automatiquement — même politique que
  Tireur d'élite : proposé décoché, arbitrage au MJ ; niveau supérieur
  toujours disponible).
- Catalogue (`talent-archetype-catalog.mjs`) : ajout des `mechanicalKey`
  correspondants (`dodge`, `dangerSense`, `intimidating`).
- `action-resolution/action-preparation-service.mjs` : nouvelle
  résolution de l'option d'échange d'Attribut (au plus une par contexte,
  ces 3 Talents ciblant chacun une action/Compétence distincte), avec
  le score de l'Attribut alternatif calculé sur l'Actor.
- `action-resolution/action-modifier-service.mjs` : `createPreparation`
  transmet cette option telle quelle dans la préparation
  (`preparation.attributeSwap`), sans toucher au calcul des totaux.
- `foundry/applications/action-modifier-dialog.mjs` : nouvelle case à
  cocher dédiée dans la section « Valeurs du test », qui bascule en
  direct (sans ouvrir de nouvelle fenêtre) la valeur numérique et le
  libellé de l'Attribut utilisé pour le jet — réutilise entièrement le
  champ numérique d'Attribut déjà éditable, donc aucun changement requis
  côté calcul des totaux ni des points d'appel d'`actor.rollSkill`/
  `rollAttribute` (déjà alimentés par ce même champ). Non testée
  unitairement (dépendance Foundry), conformément à la convention du
  projet.
- Tests unitaires : 3 nouveaux blocs de Talents dans
  `tests/domain/rules/talents.test.mjs` (pertinence stricte, condition
  narrative de Menaçant), 5 nouveaux tests dans
  `tests/action-resolution/action-preparation-service.test.mjs`
  (résolution de l'option, cas sans Talent pertinent). Mise à jour des
  assertions exhaustives sur `TALENT_KEYS`/`TALENT_DEFINITIONS`/
  `TALENT_EFFECT_TYPES` (quatorze Talents automatisés au total
  désormais). **2067/2067 tests automatisés au total.**

**Réserve de déploiement identique au lot 1** : les Talents déjà
possédés par des Personnages existants devront être retirés/réattribués
pour profiter de l'automatisation (clé mécanique ajoutée après coup au
catalogue).

**Non traité, laissé en l'état au backlog** : les 9 Talents restants du
lot des 17 initial (7 « hors pool de dés », Tireur instinctif bloqué sur
une infrastructure de faits absente, Courage sur un sous-système
séparé), ainsi que Second souffle (nouveau déclencheur de jet), les 22
Talents d'archétype et les 9 Talents à déclencheur manuel de l'audit.

## Chantier Talents — lot 3 « Tireur instinctif » livré (03/10/2026)

Suite au lot 2, nouvelle demande de poursuite (« continuons sur les
talents »). Parmi les options proposées, le porteur du projet a apporté
une clarification importante plutôt que de choisir tel quel : **la
notion de couverture (et de véhicule en mouvement) est purement
narrative et à l'appréciation du MJ** — donc PAS un blocage
d'infrastructure comme initialement supposé dans l'audit, mais un simple
fait de contexte optionnel, exactement comme « overwatch »/« aiming »
pour Tireur d'élite (déjà automatisé).

Cette clarification invalide le constat initial de l'audit sur ce
Talent : **Tireur instinctif** rejoint donc lui aussi les Talents
automatisables directement, sans aucune nouvelle infrastructure.

**Réalisé :**
- `domain/rules/talents.mjs` : nouvelle définition **Tireur instinctif**,
  structurée en miroir exact de Tireur d'élite — deux faits de contexte
  optionnels `cover` et `movingVehicle` (absents par défaut -> `UNKNOWN`,
  proposé décoché, arbitrage au MJ). Niveau normal : +1 si à couvert
  (réduit le –2 habituel à –1). Niveau supérieur : +2 si à couvert
  (annule le –2) et +1 supplémentaire si véhicule en mouvement (annule
  le –1 habituel), cumulables.
- Catalogue (`talent-archetype-catalog.mjs`) : ajout de la
  `mechanicalKey` `instinctiveShooter`.
- Tests unitaires dédiés (mêmes cas que Tireur d'élite : connu/inconnu/
  cumul). Mise à jour des assertions exhaustives
  (`TALENT_KEYS`/`TALENT_DEFINITIONS`, quinze Talents automatisés au
  total). **2070/2070 tests automatisés au total.**

**Réserve de déploiement identique aux lots précédents** (réensemencement
du compendium nécessaire + retrait/réattribution pour les Personnages
existants).

**Non traité, laissé en l'état au backlog** : les 7 Talents « hors pool
de dés » (encombrement, blessure critique, sang-froid, initiative, coup
de grâce, dégainer/recharger), Courage (sous-système Terreur séparé),
Second souffle (nouveau déclencheur), les 22 Talents d'archétype et les 9
Talents à déclencheur manuel.

## Chantier Talents — lot 4 « hors pool de dés » : 3 livrés, 4 reportés (03/10/2026)

Suite au lot 3, poursuite demandée sur les Talents, cette fois sur le
lot des 7 Talents touchant chacun une mécanique différente, hors du
moteur générique de préparation d'action. Investigation menée mécanique
par mécanique avant tout codage, conformément à la convention du projet
(ne jamais fabriquer un mécanisme qui n'existe pas).

**Constat, par Talent :**

| Talent | Mécanisme sous-jacent | Décision |
|---|---|---|
| **Bête de somme** | Encombrement (`domain/rules/encumbrance.mjs`, déjà complet) | **Automatisé** |
| **Maîtrise de soi** | Maximum de Sang-froid (`character-model.mjs`, codé en dur à 5) | **Automatisé** |
| **Réflexes éclair** | Tirage d'initiative multiple (`metro-initiative-draw.mjs`, déjà conçu pour ce cas) | **Automatisé** |
| Chanceux | Tirage de Blessure critique (RollTable Foundry native, 100% manuelle, aucun service applicatif) | Reporté — sous-système à construire (hook + dialogue de choix) |
| Guérison accélérée | Rémission des Blessures critiques (champs de données prêts, mais AUCUN calcul/décompte n'existe, Talent ou pas) | Reporté — sous-système à construire |
| Impitoyable | Coup de grâce (aucune trace dans le code : pas d'action dédiée, pas de jet d'EMPATHIE associé, pas de case de Sang-froid liée) | Reporté — sous-système entièrement absent |
| Dégainé rapide | Dégainer une arme (action inexistante) / Recharger (action existante mais à coût figé, non paramétrable par Talent) | Reporté — sous-système d'actions à étendre |

Ces 3 Talents automatisés **ne passent PAS par le moteur générique**
`domain/rules/talents.mjs`/`evaluateTalentsForAction` (réservé aux
Talents qui modifient une résolution d'action — jet de Compétence,
attaque, blocage) : ce sont des valeurs dérivées de personnage
(encombrement, maximum de Sang-froid) ou une suggestion d'interface
(tirage d'initiative), donc chacun lit directement `actor.items` à
l'endroit concerné, suivant le même principe (`item.type === "talent"`
+ `item.system.key`) mais sans passer par `TALENT_KEYS`/
`TALENT_DEFINITIONS`.

**Réalisé :**
- **Bête de somme** (`beastOfBurden`) : `Actor.getEncumbrance()`
  (`foundry/documents/actor.mjs`) double la Vigueur transmise à
  `resolveEncumbrance()` si le Talent est présent — double ainsi la
  capacité normale ET la capacité critique dans la même proportion
  (ratio conservé, le livre ne précisant que le seuil normal).
- **Maîtrise de soi** (`selfControl`) : nouvelle méthode
  `_applyComposureMaxFromTalents()`, appelée depuis
  `prepareDerivedData()` — porte le maximum de Sang-froid à 6 (niveau
  normal) ou 7 (niveau supérieur) en donnée dérivée (jamais persistée),
  sans toucher au plafond de schema (qui ne décrit que la valeur de
  base sans Talent).
- **Réflexes éclair** (`quickReflexes`) : la fenêtre de Préparation de
  l'initiative (`initiative-preparation-application.mjs`) suggère un
  drawCount de 2 (ou 3 au niveau supérieur) à la création d'un groupe
  d'un seul Combattant possédant ce Talent — reste entièrement
  modifiable par le MJ, et n'affecte pas les groupes de plusieurs
  Combattants (pas d'interprétation évidente du livre pour un Talent
  individuel appliqué à un groupe).
- Catalogue (`talent-archetype-catalog.mjs`) : ajout des 3
  `mechanicalKey` correspondantes.
- Aucun de ces 3 changements n'est testé unitairement : tous les trois
  touchent exclusivement des fichiers dépendants de Foundry
  (`foundry/documents/actor.mjs`, `foundry/applications/
  initiative-preparation-application.mjs`), conformément à la
  convention du projet. **2070/2070 tests automatisés inchangés**
  (aucune mécanique pure nouvelle à verrouiller).

**Réserve de déploiement identique aux lots précédents** (réensemencement
du compendium nécessaire + retrait/réattribution pour les Personnages
existants).

**Réserve de validation Foundry réelle, nouvelle et spécifique à ce
lot** : ces 3 automatisations n'ont, par construction, jamais pu être
exercées dans un vrai Foundry (pas d'accès à une instance en cours) :
- Bête de somme : à vérifier que l'affichage de la jauge d'encombrement
  en fiche de Personnage reflète bien la capacité doublée.
- Maîtrise de soi : **premier usage dans ce projet d'une mutation de
  donnée dérivée en `prepareDerivedData()`** (aucun précédent dans le
  code) — à vérifier que la valeur 6/7 est bien prise en compte partout
  où le maximum de Sang-froid est lu (fiche, `addComposure()`), sans
  effet de bord.
- Réflexes éclair : à vérifier que le champ drawCount pré-rempli
  s'affiche et reste éditable comme attendu dans la fenêtre de
  Préparation de l'initiative.

**Non traité, laissé en l'état au backlog** : Chanceux, Guérison
accélérée, Impitoyable et Dégainé rapide (les 4 nécessitant chacun de
construire un sous-système absent), Courage (sous-système Terreur
séparé), Second souffle (nouveau déclencheur), les 22 Talents
d'archétype et les 9 Talents à déclencheur manuel.

## Talents — ré-audit complet « automatisable vs appréciation narrative du MJ » (03/10/2026)

Demande du porteur du projet : reprendre TOUS les Talents restants en
distinguant explicitement ce qui est automatisable (y compris via un
fait narratif arbitré par le MJ, comme pour Tireur instinctif) de ce qui
relève véritablement d'une appréciation/décision narrative non
réductible à un chiffre ou un fait booléen.

**Un Talent a été automatisé immédiatement à l'issue de ce ré-audit :**

- **Courage** (général) : `foundry/chat/terror-roll-chat.mjs` lit
  directement le Talent sur l'Actor ciblé par une attaque de Terreur
  (sous-système `terror.mjs`, totalement isolé du moteur générique de
  Talents — il ne construit aucun `ActionResolutionContext`). Niveau
  normal : réduit de 1 les réussites de l'attaque pour cette cible.
  Niveau supérieur : en plus, seule la moitié (arrondie à l'inférieur)
  des dés de Stress de la cible s'ajoute au jet. **Décision
  d'interprétation actée** (le livre ne tranche pas explicitement) : le
  niveau supérieur AJOUTE son effet à celui du niveau normal, suivant la
  convention déjà appliquée ailleurs dans ce projet pour les clauses
  « Supérieur » (ex. Point faible, qui conserve son +2 et ajoute un
  second effet). Catalogue : ajout de la `mechanicalKey` `courage`. Non
  testé unitairement (fichier Foundry-dépendant). **2070/2070 tests
  automatisés inchangés.**

**Reclassement complet des Talents restants, issu de ce ré-audit :**

| Talent | Statut | Remarque |
|---|---|---|
| Second souffle | Sous-système à construire (moyenne) | Aucun état « Brisé » détectable dans le code ; comparable en ampleur au chantier Jet de Survie. |
| Chanceux, Assassin | Sous-système à construire (moyenne/grande) | Dépendent tous deux du même tirage D66 programmatique de Blessure critique, qui n'existe pas du tout (RollTable 100 % manuelle). |
| Guérison accélérée | Sous-système à construire (moyenne) | Champs de données prêts, mais aucun calcul de rémission n'existe. |
| Impitoyable | Sous-système à construire (grande) | Coup de grâce absent du code (aucune action, aucun jet associé). |
| Dégainé rapide | Sous-système à construire (moyenne) | Dégainer inexistant comme action ; recharge à coût figé non paramétrable par Talent. |
| Dur à cuire, Temporisation, Hésitation, Présence rassurante, Toxicologiste (palier session) | Sous-système à construire (petite, mutualisable) | Aucun compteur d'usage « 1×/session » dans le code — un seul mécanisme générique de compteur couvrirait ces 5. |
| Discipline de groupe, Garde du corps | Sous-système à construire (moyenne) | Aucun mécanisme de substitution de jet/cible. |
| Exaltation | Sous-système à construire (moyenne/grande) | En plus du compteur « 1×/combat », nécessite un statut de groupe persistant (rien d'équivalent n'existe). |
| Ravitaillement (palier 1) | Sous-système à construire (petite) | Même famille « ignorer un 1 sur un jet forcé » que Imperturbable et consorts — pas un ajout direct contrairement à ce que l'audit initial indiquait. |
| Compassion, Inquisiteur, Téméraire, Tenace | Sous-système à construire (moyenne) | Exigent un 3ᵉ Push conditionnel avec règle de relance différente ; `push.mjs` plafonne `METRO_MAX_PUSHES = 2` en dur — **reclassés depuis « automatisable directement »**. |
| Imperturbable, Mental d'acier, Nerfs d'acier, Résistance | Sous-système à construire (petite) | « Ignorer un 1 » agit APRÈS le jet physique, hors du périmètre des 5 `TALENT_EFFECT_TYPES` actuels (tous pré-jet) — **reclassés depuis « automatisable directement »**. |
| Pilote | Mixte | Volet modificateur (+1/+2 RÉACTION) automatisable directement ; volet « ignore une affliction » dans le même sous-système que ci-dessus. |
| Maître du terrain | Mixte | Clause « à couvert » automatisable directement ; clause « 1×/combat, pas de coût d'action » dans le sous-système de compteur. |
| Amélioration, Artificier, As de la bricole, Fantôme, Forte tête (clause de base), Neutralisation, Psychologie, Urgentiste, Vigilant, Yeux de la nuit, Toxicologiste (volet modificateur) | Automatisable directement | Confirmés : modificateur/choix chiffré sur contexte objectivement détectable, même pattern que les 15 Talents déjà câblés. |
| Ravitaillement (palier 2), Forte tête (clause avancée) | Appréciation narrative du MJ | Respectivement « objet plausible » et « facteurs de négociation de groupe » non chiffrés précisément. |
| Investigateur, Tuyau | Appréciation narrative du MJ (confirmé) | Livrent une information de scénario, aucun chiffre ni fait booléen — hors de portée par nature, pas un problème d'infrastructure. |

**Conséquence importante à signaler** : ce ré-audit corrige l'audit
initial sur un point précis — 8 Talents (Compassion, Inquisiteur,
Téméraire, Tenace, Imperturbable, Mental d'acier, Nerfs d'acier,
Résistance) classés à tort « automatisable directement » touchent en
réalité le COMPORTEMENT APRÈS le jet physique (forçage, afflictions),
un périmètre que le moteur générique de Talents ne couvre pas du tout
aujourd'hui (il ne modifie que le pool de dés avant le jet). Leur
automatisation suppose soit de modifier `push.mjs` (plafond de Push
actuellement codé en dur à 2), soit d'ajouter un nouveau point
d'accroche dans le flux de résolution d'un jet forcé.

**Non traité, laissé en l'état au backlog** : tous les sous-systèmes
listés ci-dessus restent à construire — aucun arbitrage sur l'ordre de
reprise n'a encore été demandé au porteur du projet.

## Talents — famille « ignorer une affliction » livrée, 3e Push reporté à part (03/10/2026)

Du lot « forçage après-coup » identifié au ré-audit précédent (8
Talents), seule la sous-famille à risque faible a été livrée
maintenant, après un point de cadrage explicite sur le risque : le 3e
Push (Compassion, Inquisiteur, Téméraire, Tenace) oblige à toucher le
cœur du moteur de jet utilisé par TOUS les jets du jeu (`push.mjs`,
`yze-roll.mjs`, le fichier de tchat gérant les boutons Forcer avec sa
limite de 2 actuellement dupliquée à plusieurs endroits), sans
possibilité de validation en Foundry réel — reporté à un chantier à part
entière, à cadrer séparément avant d'y toucher.

**Livré : Imperturbable, Mental d'acier, Nerfs d'acier, Résistance**
(chacun : "Vous pouvez ignorer une affliction (« 1 ») sur tous vos jets
forcés dépendant de l'attribut [EMPATHIE / ESPRIT / AGILITÉ / VIGUEUR]").

- `domain/rules/afflictions.mjs` : nouveau paramètre optionnel
  `ignoredAfflictions` sur `resolveAfflictions(actor, result, {...})` —
  réduit le total d'afflictions disponibles avant répartition (plancher
  à 0). Fonction restée pure : elle ne connaît aucun Talent, seulement
  un nombre déjà déterminé par l'appelant. Changement rétrocompatible
  (valeur par défaut 0, comportement existant inchangé).
- `foundry/documents/actor.mjs` : `resolveRollAfflictions()` calcule ce
  nombre via une nouvelle méthode `_getIgnoredAfflictionsCount(result)` —
  lit l'Attribut du jet (`result.context.attribute`), cherche le Talent
  correspondant sur l'Actor (table `IGNORE_AFFLICTION_TALENT_KEYS_BY_ATTRIBUTE`),
  et ne l'applique QUE si le jet a réellement été forcé
  (`result.pushCount > 0`, conforme au texte "sur tous vos jets
  **forcés**"). Non testé unitairement (fichier Foundry-dépendant).
- Catalogue : ajout des 4 `mechanicalKey` (`unflappable`, `steelMind`,
  `steelNerves`, `resilience`).
- Tests unitaires dédiés dans `tests/domain/rules/afflictions.test.mjs`
  (réduction du total, rejet d'une répartition incohérente, plancher à
  0, validation du type, non-régression par défaut). **2075/2075 tests
  automatisés au total.**

**Reporté à un chantier séparé, à cadrer avant d'y toucher** : le 3e
Push conditionnel (Compassion, Inquisiteur, Téméraire, Tenace), niveau
normal uniquement (la clause avancée — relance rétroactive des « 1 » du
premier jet forcé — reste elle-même hors scope, risque de réécriture
d'un jet déjà résolu jugé trop délicat pour l'instant). Également
toujours en attente : Second souffle, Chanceux/Assassin (tirage D66),
Guérison accélérée, Impitoyable, Dégainé rapide, Discipline de
groupe/Garde du corps (substitution), Exaltation (statut de groupe), le
volet pilotage de Pilote (infrastructure liée au chantier Véhicules, pas
encore cadré).

## Correction de classement — 3e Push : appréciation du MJ, pas d'automatisation (03/10/2026)

Précision apportée par le porteur du projet immédiatement après la
livraison ci-dessus : la limite de 2 Push (`METRO_MAX_PUSHES`,
`push.mjs`) est une règle de table délibérée de ce système, pas un
oubli technique. Autoriser un 3e Push pour 4 Talents (Compassion,
Inquisiteur, Téméraire, Tenace) reviendrait donc à percer une limite
posée intentionnellement — ce n'est pas un sous-système « à construire »
comme classé précédemment, c'est une décision qui relève du MJ (comme la
notion de session, déjà écartée de l'automatisation pour le même type de
raison).

**Reclassement définitif** : Compassion, Inquisiteur, Téméraire, Tenace
rejoignent la catégorie « appréciation narrative/décision du MJ, pas
d'automatisation pertinente », au même titre qu'Investigateur, Tuyau,
Ravitaillement (palier 2) et Forte tête (clause avancée). Aucun
développement ne sera engagé sur ces 4 Talents.

**Bilan à jour du chantier Talents** : automatisés — 15 Talents
généraux + Courage + 3 Talents d'encombrement/sang-froid/initiative +
4 Talents « ignorer une affliction » = **23 Talents automatisés** au
total. Relèvent du MJ/narratif, non automatisables par nature :
Investigateur, Tuyau, Ravitaillement (palier 2), Forte tête (clause
avancée), Compassion, Inquisiteur, Téméraire, Tenace. Restent en
sous-systèmes à construire (ampleur variable, non cadrés) : Second
souffle, Chanceux/Assassin (tirage D66), Guérison accélérée, Impitoyable,
Dégainé rapide, Discipline de groupe/Garde du corps, Exaltation, le
volet pilotage de Pilote.

## Charte graphique — revue transverse interface par interface — STATUT : TERMINÉE (démarrée 03/10/2026, achevée 04/10/2026)

Cf. amendement de Bible v0.9.7 pour le détail complet (tokens de couleur,
échelle typographique, 7 composants formalisés, règles de mise en page) —
résumé de suivi ci-dessous pour mémoire rapide, mis à jour à chaque lot.

**Livré (lots correctifs, chacun revérifié par la suite de tests
complète, aucune régression — toutes les retouches étant purement
CSS) :**
- Fiche Arme + socle commun des fiches d'Objets (`metro-items.css`) —
  04/10/2026.
- Fiche Protection — 04/10/2026.
- Triptyque d'état rouge/ambre/vert formalisé en 3 tokens de la charte
  (`state-danger`/`state-warning`/`state-success`) — 04/10/2026.
- Fenêtre de Préparation de l'initiative (`metro-initiative-preparation.css`)
  — 04/10/2026.
- Assistants de création PJ/PNJ (`metro-character-creation-wizard.css`,
  `metro-npc-creation-wizard.css`) — 04/10/2026.
- Fenêtre de lancement du Jet de Population (`station-population-launcher`)
  — 04/10/2026.
- 5 fenêtres sans CSS dédié (`ranged-stunt-dialog`, `melee-stunt-dialog`,
  `melee-block-stunt-dialog`, `protection-damage-allocation-dialog`,
  `station-survival-launcher-dialog`, nouveau fichier
  `metro-stunt-dialogs.css`) — 04/10/2026.
- 4 fenêtres à CSS quasi inexistant (`terror-roll-launcher-dialog`,
  `asphyxiation-launcher-dialog`, `poison-launcher-dialog`,
  `illness-launcher-dialog`) — 04/10/2026.
- Tailles de texte hors échelle du Chat (15px/38px, calées sur la grille
  existante — `metro-yze-chat.css`/`metro-chat.css`) — 04/10/2026.
- Badge d'état de la fiche Équipement, colorié selon le triptyque
  (`metro-items.css`) — 04/10/2026.
- Onglet Survie/Biographie de la fiche Acteur, motif panneau appliqué aux
  sections des deux onglets (`metro-character.css`) — 04/10/2026.

**Convention de livraison actée le 04/10/2026** : le porteur du projet
n'ayant pas de lien direct vers les fichiers modifiés depuis cet
environnement de développement (environnement cloud, sans accès à son
poste), un zip complet du projet est désormais livré après chaque lot
terminé, pour extraction sur sa copie locale.

**Reste à traiter** — un seul point, volontairement laissé en l'état :
- Boutons natifs Confirmer/Annuler de DialogV2 sur `action-modifier-dialog`
  — en attente de validation Foundry réelle avant d'y toucher (le porteur
  du projet a indiqué réserver ses tests globaux pour plus tard).

## Harmonisation de largeur des boutons d'action alternatifs — STATUT : VALIDÉ (04/10/2026)

Remarque du porteur du projet, juste après la clôture de la revue
transverse de la charte graphique : sur la carte de Chat d'un jet de
Compétence, le bouton « FORCER LE JET » était plus large que le bouton
« ACCEPTER LE RÉSULTAT ».

**Cause identifiée** : `.metro-yze-roll-push` (`metro-yze-chat.css`)
portait `width: 100%`, mais `.metro-yze-roll-finalize` n'avait aucune
règle dédiée et restait à sa largeur naturelle (dictée par son texte,
plus court). **Corrigé** : `.metro-yze-roll-finalize { width: 100%; }`
ajouté, les deux boutons (chacun seul sur sa propre ligne) occupent
désormais la même largeur.

**Cas apparenté trouvé en vérifiant et corrigé à la même occasion,
après confirmation du porteur du projet** : sur les cartes de Poison et
de Maladie, les boutons « Pousser »/« Accepter le résultat » sont côte
à côte sur la même ligne, chacun en largeur naturelle — même écart,
horizontal cette fois. Corrigé via
`.metro-chat-survival-card .metro-chat-actions .metro-chat-button { flex: 1 1 0; }`
(répartition égale de la ligne, quel que soit le nombre de boutons
affichés).

**Règle actée et documentée dans le Design System (`conformite.md`,
v15)** : deux boutons représentant les options d'une même action
alternative (Forcer/Accepter, Pousser/Accepter...) doivent toujours
être de largeur identique — `width: 100%` chacun si empilés sur leur
propre ligne, `flex: 1 1 0` chacun si côte à côte sur une même ligne.
2075/2075 tests automatisés toujours verts (changements purement CSS).

## Chantier « case à cocher Équipée » (Armes et Protections) — STATUT : LIVRÉ (04/10/2026)

Suite donnée au bug signalé le 04/10/2026 (cf. section « Bug signalé —
pas de bouton « Équiper »... » plus haut dans ce document) : demande
explicite du porteur du projet, une fois la charte graphique terminée,
de construire la mécanique d'équipement pour les Armes et les
Protections.

**Investigation préalable (avant tout code), comme toujours sur un point
homebrew** : le champ `system.equipped` (BooleanField, `initial: false`)
existait déjà dans `weapon-model.mjs` ET `armor-model.mjs`, et le moteur
de Combat le lisait **déjà** intégralement :
- `_prepareCombat()` (`character-sheet.mjs`) ne liste, pour l'onglet
  Combat, que les Armes/Protections dont `system.equipped === true`
  (fallback « Aucune arme équipée. »/« Aucune protection équipée. »
  déjà présent dans `character-sheet.hbs` si la liste est vide).
- `WeaponDataModel.canAttack`/`canFire`/`usableEquipmentBonus` et
  `ArmorDataModel.usableProtection`/sa capacité de résilience
  retournent tous `false`/`0` si `!this.equipped`.

**Constat du bug réel** : ce champ n'avait donc **aucune interface** nulle
part pour le faire basculer — ni sur la fiche de l'Item (Arme/Protection)
lui-même, ni sur la fiche de Personnage. Un objet glissé-déposé restait
ainsi irrémédiablement à `equipped: false` (la valeur initiale du
DataModel), sans jamais apparaître en Combat, sans aucun moyen de le
corriger en jeu. Il ne s'agissait donc pas de concevoir une nouvelle
mécanique de règle, mais uniquement de câbler un champ déjà actif.

**Livré :**
- `src/foundry/sheets/character-sheet.mjs` — `_prepareEquipmentItem()` :
  ajout de `canToggleEquipped` (Armes et Protections uniquement) et
  `equipped` (lu depuis `system.equipped`) sur la vue de chaque ligne de
  l'onglet Équipement. Nouvelle méthode `_toggleEquippedItem(itemId)`
  (bascule `system.equipped` via `item.update()`, avec garde-fou sur le
  type d'Item et gestion d'erreur). Câblage de la case dans
  `_bindEquipmentTab`-équivalent (écouteur `click` sur
  `.metro-character-equipment-equipped-checkbox[data-item-id]`, même
  patron défensif que les autres contrôles de cet onglet).
- `templates/actors/character-sheet.hbs` — nouvelle colonne « Équipée »
  dans le tableau de l'onglet Équipement (en-tête + cellule), case à
  cocher affichée uniquement sur les lignes Arme/Protection
  (`{{#if canToggleEquipped}}`), désactivée en lecture seule
  (`@root.editable`). Volontairement **sans** attribut `name` : il
  s'agit du champ d'un Item embarqué, pas un champ de l'Actor — même
  convention que les cases d'état Foundry de l'onglet Survie (aucun
  risque de doublon de `name` sur le document).
- `styles/metro-character.css` — colonne/cellule `-column-equipped`/
  `-cell-equipped` (largeur 64px, centrée), case à cocher
  `.metro-character-equipment-equipped-checkbox` (`accent-color`
  reprenant `brand`).

**Non testé unitairement, par convention du projet** : toutes ces
modifications touchent exclusivement `character-sheet.mjs`/`.hbs`
(code dépendant de l'API Foundry). Aucune règle pure nouvelle n'a été
introduite — le champ et son exploitation en Combat existaient déjà et
sont déjà couverts par les tests existants des DataModels Arme/
Protection. 2075/2075 tests automatisés toujours verts (inchangé).

**Non vérifié en conditions Foundry réelles (aucun accès à une instance
Foundry depuis cet environnement de développement) :** l'affichage de
la case, sa bascule au clic, et la réapparition effective de l'Arme/
Protection dans l'onglet Combat une fois cochée — à confirmer par le
porteur du projet en jeu.

Avec ce chantier, la remarque initiale du porteur du projet (04/10/2026)
est entièrement traitée pour les deux types d'Objets concernés (Arme ET
Protection), conformément à la précision qu'il avait apportée.

## Bible v0.9.8 — amendement livré (04/10/2026)

À la demande du porteur du projet (« Faisons le prochain amendement de
notre bible et surtout listons les points d'avancement (en %), le reste à
faire et les futurs chantiers »), la Bible a été amendée en v0.9.8.
Contenu : clôture complète de la revue transverse de la charte graphique
(7 derniers lots : assistants de création, fenêtre Population de Station,
5 fenêtres sans CSS dédié, 4 fenêtres à CSS quasi inexistant, tailles de
texte hors échelle, badge d'état Équipement, onglets Survie/Biographie —
seule réserve restante : boutons natifs Confirmer/Annuler de DialogV2),
harmonisation de largeur des boutons d'action alternatifs (nouvelle règle
de charte), chantier « case à cocher Équipée » (livré, non validé en
Foundry réel), confirmation formelle du Point 2 (Combat) à 100 % sans
réserve, et surtout un **recalcul complet de la feuille de route à 6
points avec avancement en pourcentage** (premier recalcul détaillé depuis
la v0.9.4) : Point 1 ≈100 %, Point 2 100 % sans réserve, Point 3 ≈94-97 %,
Point 4 100 %, Point 5 ≈45-50 %, Point 6 100 % — moyenne de l'ordre de
90-92 %. Fichiers : `bible/Metro_2033_Bible_v0.9.8_Amendement.docx` et
`.pdf`, générés par `bible/build-amendment-v0.9.8.js` (conversion pdf via
`soffice --headless --convert-to pdf`, disponible dans cet environnement).
Point de reprise (ordre de priorité révisé) : Rang 1 retours Foundry réels
sur les chantiers livrés non validés, Rang 2 balisage DialogV2, Rang 3
réactivation possible de la généralisation des dés physiques animés
(condition — fin de la charte graphique — désormais remplie), Rang 4
priorisation des 9 Talents à sous-système non cadré, Rang 5 (dernier,
inchangé) système Véhicules.

## Bug signalé — blocage automatique de l'économie d'actions de combat — STATUT : CORRIGÉ (04/10/2026)

Signalé par le porteur du projet : lors d'une Attaque de mêlée répétée, le
système bloquait l'action avec le message « Artyom ne dispose plus de
l'action nécessaire pour effectuer : melee-attack. ». Demande explicite :
la gestion du nombre d'actions restantes ou pouvant être réalisées par un
Actor en combat **ne doit pas être automatisée** — elle doit rester
entièrement à la main du MJ. Un même Actor doit pouvoir frapper (ou tirer)
autant de fois qu'il le souhaite si le MJ l'autorise, sans blocage système.
Même demande pour le Tir (« Idem pour le tir »).

**Cadrage posé avant correction** (AskUserQuestion) : le blocage reposait
en réalité sur un seul mécanisme générique, l'« économie d'actions de
combat » (1 action lente + 1 rapide, OU 2 actions rapides, par round),
partagé par Attaque de mêlée, Tir, Agrippement (attaque et tentative de
libération) et Blocage — ainsi que par un service de Déplacement/Reptation
jamais réellement câblé en pratique. Réponses actées par le porteur du
projet : (1) retirer le blocage pour **toutes** les actions de combat
concernées, pas seulement mêlée/tir ; (2) ne conserver **aucun** suivi
informatif du nombre d'actions restantes — le système ne doit plus ni
bloquer ni compter, entièrement manuel.

Ce mécanisme n'avait jamais été consigné dans la Bible comme une décision
de conception délibérée (recherche exhaustive dans les 8 amendements
disponibles : aucune occurrence d'« économie d'action », « action lente »
ou « actions rapides » en tant que règle actée) — il s'agissait d'une
automatisation du Point 2 (Combat) mise en place avant que le principe
« une limite de règle délibérée n'est jamais un sous-système à construire,
c'est une décision du MJ » ne soit formalisé (Bible v0.9.7, §202, à propos
du nombre de Push). La demande du porteur du projet applique ce même
principe à l'économie d'actions.

**Retiré :**
- `src/foundry/documents/actor.mjs` : les deux méthodes `_assertCombatActionAvailable`
  et `_spendCombatAction`, ainsi que leurs 4 appels de vérification
  (`rollRangedAttack`, `rollMeleeAttack`, `rollGrappleAttack`,
  `rollGrappleEscape`) et 5 appels de consommation (ces 4 méthodes +
  `rollMeleeBlock`). Le calcul `hasFastAction` (basé sur
  `CombatActionService`) dans `rollMeleeBlock` est également retiré ; le
  blocage ne dépend plus que du type d'attaque et de la présence d'un
  objet de blocage adapté.
- `src/combat/melee-attack-chat-hooks.mjs` (`resolveBlockPreparation`) :
  le second point de blocage (« ne dispose plus d'action rapide pour
  bloquer »), redondant avec celui d'`actor.mjs`.
- `src/combat/combat-hooks.mjs` : l'appel `CombatActionService.resetAll(combat)`
  au changement de round (le flag `combatActions` du Combatant n'étant
  plus utilisé par rien, sa réinitialisation n'avait plus d'objet).
- `src/domain/rules/melee-block-eligibility.mjs` : la branche
  `"no-fast-action"` de `resolveMeleeBlockEligibility`.
- Fichiers supprimés intégralement, plus aucun appelant après le
  nettoyage ci-dessus : `src/combat/combat-action-service.mjs`,
  `src/combat/combat-movement-service.mjs` (service de Déplacement/
  Reptation lié au même mécanisme, qui n'était en pratique jamais invoqué
  nulle part dans le code — aucun changement de comportement observable),
  `src/domain/rules/combat-actions.mjs` (règles pures de l'économie
  d'actions).

**Important — ce qui N'A PAS changé :** aucune règle de dégâts, de pool de
dés, d'éligibilité de blocage (type d'attaque, objet de blocage requis) ou
de saisie n'a été modifiée. Seule la couche de comptage/blocage du nombre
d'actions par round disparaît ; la résolution de chaque action individuelle
reste strictement identique.

**Tests :** suite passée de 2075/2075 à **1988/1988**, soit **-87 tests**,
tous supprimés délibérément (plus aucun code à tester) : les 51 tests de
`combat-actions.test.mjs`, les 32 tests de `combat-action-service.test.mjs`
(fichiers supprimés), et 4 tests de `melee-block-eligibility.test.mjs`
portant sur la branche `"no-fast-action"` retirée. `combat-hooks.test.mjs`
a été réécrit (4 tests conservés, recentrés sur la seule préservation de
l'initiative Métro au changement de round — son véritable objet restant
après le retrait de l'économie d'actions) plutôt que supprimé, car le hook
`updateCombat` reste par ailleurs nécessaire (échanges d'initiative,
`CombatRoundCoordinator`, purge des effets d'Étourdissement expirés).
Aucune régression : 0 échec.

**Incidence sur le Point 2 (Combat), confirmé à 100 % sans réserve dans
l'amendement de Bible v0.9.8 livré quelques minutes avant ce correctif :**
cette suppression ne rouvre aucune lacune fonctionnelle du Point 2 — elle
retire une automatisation qui allait au-delà de ce que le livre impose
(le livre décrit l'économie d'actions comme une règle de table, pas comme
un verrou logiciel) et ramène son application à la discrétion du MJ,
conformément au principe déjà acté pour le nombre de Push. À consigner au
prochain amendement de la Bible comme clarification du Point 2, pas comme
régression.

## Correction de précision — composition réelle du Point 3 (Items, catalogue de référence) (04/10/2026)

Suite à la question du porteur du projet (« Que manque-t-il pour finir et
atteindre 100 % ? » sur le Point 3, ≈94-97 % dans l'amendement v0.9.8),
vérification détaillée de ce que recouvre réellement ce point — l'amendement
v0.9.8 avait reconduit sans la corriger une formulation déjà présente dans
la v0.9.4 (« reste hors périmètre : automatisation mécanique des Talents et
modélisation Véhicule (Point 5) »), qui mélange en réalité trois choses
distinctes.

**Clarification actée :**
- L'**automatisation mécanique des Talents** (23/56 Talents automatisés à
  ce jour) est une question de **moteur de résolution d'action**, pas de
  complétude du **catalogue** : les 56 Talents existent déjà intégralement
  comme Items catalogués (texte d'effet complet), seul leur comportement
  mécanique est partiel. Ne devrait donc pas peser sur le pourcentage du
  Point 3.
- La **modélisation Véhicule** appartient explicitement au **Point 5**
  (PNJ/Créature/Véhicule), pas au Point 3 — aucune ambiguïté sur ce point
  dans la définition d'origine de la feuille de route (v0.9.0, §138).

**Écarts réels, propres au Point 3 (catalogue d'Items), identifiés par
cette vérification :**
1. **Poison appliqué sur une lame** (livre p.205, « Poisons et blessures » —
   Toxicité plafonnée à 6, déclenché par une attaque de mêlée réussie) :
   volontairement exclu du périmètre du chantier Poison (cadrage du
   02/10/2026, « poison ingéré uniquement »), reporté à plus tard. Catalogue
   incomplet sur ce point précis.
2. **Améliorations d'armes modélisées en type `equipment` générique**
   plutôt qu'un type d'Item dédié (`weaponMod`) avec un vrai lien mécanique
   à l'arme équipée — simplification pragmatique actée lors de l'extraction
   initiale (27/09/2026), jamais revue depuis.
3. **Liens UUID manquants** : `FactionDataModel.notableMembers` et
   `StationDataModel.notableNPCs` restent vides (les PNJ existent comme
   Actors séparés dans leurs propres compendiums, mais ne sont pas liés
   par UUID aux Items Faction/Station correspondants).
4. **`supportPersonnel` à 0 pour les 3 Stations extraites** — à la
   différence des 3 écarts ci-dessus, celui-ci est **bloqué de façon
   permanente, pas un simple report** : le livre ne fournit aucun chiffre
   de Personnel de soutien pour ces stations précises. Ne peut être
   complété sans fabriquer une donnée absente du livre (interdit par la
   méthode de travail du projet).

**Conséquence sur l'estimation** : en excluant Talents/Véhicule du calcul
du Point 3 et en ne retenant que les 3 écarts réellement corrigibles
ci-dessus (le 4e étant une limite de source), une estimation plus précise
se situerait plutôt autour de **96-98 %** pour ce point, et non 94-97 %.
À reprendre explicitement dans le tableau de la feuille de route au
prochain amendement de la Bible, avec cette même distinction entre écarts
corrigibles et limite de source permanente.

**Aucun code modifié par cette entrée** : correction de précision
documentaire uniquement, aucune implication sur les tests (2075/2075
avant le correctif de l'économie d'actions de combat, 1988/1988 depuis,
cf. section dédiée ci-dessus).

## Chantier Véhicule — jalon 1 livré (04/10/2026)

Premier jalon du **Point 5 de la feuille de route** (PNJ/Créature/
Véhicule) : le volet Véhicule, jusqu'ici manquant (le type Actor
`vehicle` existait déclaré vide dans `system.json` depuis l'extraction
initiale, sans DataModel ni Sheet). Périmètre resserré, validé par le
porteur du projet via 4 décisions de cadrage actées en amont (non
redemandées) :
1. Véhicules terrestres uniquement — les véhicules aériens sont
   explicitement hors scope, reportés à un chantier ultérieur.
2. Suivi structuré des occupants (conducteur + passagers) par UUID
   d'Actor, et non purement narratif, pour ouvrir la voie à une
   automatisation future (« occupant touché → Intégrité -1 »).
3. Les modificateurs de combat liés aux véhicules (câblage en faits de
   contexte dans la fenêtre de préparation de jet) sont explicitement
   hors scope de ce jalon.
4. Ce jalon vise uniquement DataModel + Sheet + RollTable « Véhicules
   hors d'état » — les actions dédiées (Démarrer le moteur, Conduire/
   piloter, Entrer/sortir d'un véhicule) restent purement narrées, sans
   bouton dédié ni accroche à l'économie d'actions (supprimée du projet).

**Livré :**
- `domain/rules/vehicle.mjs` — règles pures (p.211) :
  `resolveVehicleDisplacement` (Déplacement réduit à 1 en zone encombrée
  pour les véhicules marqués `*` de la table du livre — Moto tout-terrain,
  Jeep, 4x4 ; lève une `Error` explicite si un véhicule non marqué `*`
  comme le Camion ou le Véhicule blindé se voit demander d'entrer en zone
  encombrée), `vehicleArmorAsProtectionValue` (le Blindage sert
  directement de valeur de Protection pour les occupants, comme un abri),
  `resolveOccupantHitIntegrityLoss` (toujours 1 point d'Intégrité perdu
  par occupant touché, quel que soit le dégât réel — **fonction
  disponible pour un futur incrément d'automatisation, non câblée dans ce
  jalon**), `isVehicleOutOfOrder` (Intégrité ≤ 0). 15 tests.
- `data/actors/vehicle-model.mjs` — `VehicleDataModel` : identité
  (type de véhicule, description), caractéristiques (Déplacement fixe,
  `reducedInEncumberedZone`, Intégrité current/max, Fiabilité fixe,
  Blindage fixe), occupants (`driver` UUID unique, `passengers` tableau
  d'UUID), notes MJ. Getters dérivés `isOutOfOrder`/`protectionValue`
  délégués au module de règles ci-dessus.
- `data/seed/vehicle-catalog.mjs` — catalogue pur des 5 véhicules
  terrestres de la table « VÉHICULES TYPES » (p.211) : Moto tout-terrain,
  Jeep, 4x4, Camion, Véhicule blindé, avec leurs valeurs exactes du livre.
- `data/seed/vehicle-actor-builder.mjs` — `buildVehicleActorData`/
  `buildAllVehicleActorsData`, pures, sur le même patron que
  `bestiary-actor-builder.mjs` (occupants vides par défaut).
- `data/seed/vehicle-breakdown-catalog.mjs` — catalogue pur des 6
  résultats de la table « VÉHICULES HORS D'ÉTAT » (p.211), texte verbatim
  du livre (Conducteur touché, Passager touché, Tonneau, Roue ou arme
  montée arrachée, Moteur H.S., Explosion du réservoir).
- `data/seed/vehicle-breakdown-roll-table-builder.mjs` — nouvelle
  fonction générique `buildTextRollTableResultData` (résultat de
  RollTable de type texte pur, sans Document associé — contrairement au
  patron D66 existant) + `buildVehicleBreakdownRollTableResultsData`,
  `D6_FORMULA = "1d6"`. 6 tests.
- `foundry/setup/seed-vehicle-compendium.mjs` /
  `seed-vehicle-breakdown-roll-table.mjs` — scripts de seed idempotents
  (compendium Actor « vehicules », RollTable « Métro 2033 — Véhicules
  hors d'état (D6) »), non testés unitairement par convention (dépendants
  de l'API Foundry). Accessibles via
  `game.metro2033.seedVehicleCompendium()` /
  `game.metro2033.seedVehicleBreakdownRollTable()`.
- `foundry/sheets/vehicle-sheet.mjs` + `templates/actors/vehicle-sheet.hbs`
  + `styles/metro-vehicle.css` — fiche Actor Véhicule (portrait/identité,
  caractéristiques avec rappel du `*`, Intégrité current/max, occupants
  avec dropzone conducteur + liste de passagers, description, notes MJ).
  Décision de conception documentée : comme il n'existait pas encore de
  patron de drag&drop d'Actor vers un champ UUID dans ce projet (gap
  connu — `notableNPCs` de Station reste non lié), une dropzone autonome
  et propre au Véhicule a été implémentée (`dragover`/`drop` sur
  `.metro-vehicle-occupant-dropzone`, `TextEditor.implementation.getDragEventData`,
  mise à jour de `system.occupants.driver`/`passengers` via
  `actor.update()`), avec résolution asynchrone des noms d'occupants
  dans `_prepareContext()` (`fromUuid`).
- `system.mjs` — `VehicleDataModel` ajouté à `CONFIG.Actor.dataModels`,
  `VehicleSheet` enregistrée via `DocumentSheetConfig.registerSheet`
  (`types: ["vehicle"]`, libellé « Métro 2033 — Véhicule »),
  `seedVehicleCompendium`/`seedVehicleBreakdownRollTable` exposées sur
  `CONFIG.Metro2033`, exactement sur le même patron que Créature.
- `system.json` — ajout de `styles/metro-vehicle.css` à la liste des
  styles. Le type Actor `vehicle` et les libellés de `lang/fr.json`
  (`TYPES.Actor.vehicle`, `METRO2033.ActorTypes.vehicle` = « Véhicule »)
  existaient déjà avant ce jalon et n'ont pas été modifiés.

**Explicitement HORS de ce jalon (reporté à des incréments ultérieurs du
même chantier) :**
- Véhicules aériens (Ptérodactyle-like, hors table « VÉHICULES TYPES »
  terrestre).
- Modificateurs de combat liés aux véhicules câblés en faits de contexte
  dans la fenêtre de préparation de jet.
- Actions dédiées dotées d'un bouton (Démarrer le moteur, Conduire/
  piloter, Entrer/sortir d'un véhicule) — restent purement narrées.
- Automatisation effective de la perte d'Intégrité d'un occupant touché
  (la fonction pure `resolveOccupantHitIntegrityLoss` existe mais n'est
  câblée à aucun Hook/Sheet).
- Tirage automatisé en Chat de la table « Véhicules hors d'état » au
  passage à 0 d'Intégrité (la RollTable existe et peut être lancée
  manuellement par le MJ depuis l'onglet Tables de jet, mais aucun
  déclenchement automatique n'est câblé).

**Tests** : 21 tests ajoutés (15 pour `domain/rules/vehicle.mjs`, 6 pour
`data/seed/vehicle-breakdown-roll-table-builder.mjs`). Suite complète :
**2009/2009, 0 échec, aucune régression** (baseline 1988/1988 + ces 21
nouveaux tests).

## Chantier jets de dés Foundry — généralisation complète (04/10/2026)

Suite du chantier « Jets de dés réellement animés dans Foundry » (pilote
Attribut/Compétence validé le même jour, cf. section dédiée ci-dessus) :
généralisation du même patron (jet physique Foundry réel via
`rollPhysicalDice`/`createDieDrawer`, puis résolution YZE sur les faces
réellement obtenues via `YZERoll.roll(pool, context, {drawDie})`) à tous
les sites restants du moteur YZE (`DicePool` + `YZERoll.roll`) qui
tiraient encore leurs dés en interne via le `Math.random` par défaut.

**10 sites migrés, exhaustifs (confirmés par grep avant et après ce
chantier — aucun autre site `DicePool`+`YZERoll.roll` ne subsiste hors de
ce chantier et du pilote) :**

1. `foundry/documents/actor.mjs#rollMeleeAttack` — jet d'attaque de
   mêlée. `physicalRoll` câblé jusqu'au `ChatMessage` via une extension de
   `combat/melee-attack-chat.mjs#updateMessage` (nouveau 3ᵉ paramètre
   optionnel `{physicalRoll}`, absent jusqu'ici car cette carte n'avait
   jamais porté de `Roll` Foundry) et du site appelant dans
   `combat/melee-attack-chat-hooks.mjs` (capture de
   `result.attackRoll.physicalRoll` avant que
   `MeleeAttackWorkflowService.resolveAttack` ne sérialise le résultat et
   perde la référence au `Roll` Foundry vivant).
2. `foundry/documents/actor.mjs#rollGrappleAttack` — jet d'attaque de
   saisie. `physicalRoll` attaché au résultat exactement comme le pilote.
   **Aucun câblage de ChatMessage effectué** : cette méthode n'a, à ce
   jour, aucun appelant nulle part dans `src/` (confirmé par grep) — pas
   de fenêtre, pas de Hook, pas de Sheet ne l'invoque encore. Elle reste
   du code en attente d'une future intégration UI ; le jour où un
   appelant sera câblé, `physicalRoll` sera déjà disponible sur le
   résultat, prêt à être transmis à un `ChatMessage.create`.
3. et 4. `foundry/documents/actor.mjs#rollGrappleEscape` — les DEUX jets
   de l'opposition (jet de la cible et jet du saisisseur), chacun avec
   son propre `rollPhysicalDice`/`drawDie` indépendant. Même remarque que
   pour `rollGrappleAttack` : **aucun appelant actuel** (confirmé par
   grep), donc aucun câblage de ChatMessage possible à ce stade — les deux
   `physicalRoll` sont néanmoins déjà attachés aux résultats `targetRoll`
   et `attackerRoll` retournés dans `opposition.rolls`.
5. `foundry/chat/terror-roll-chat.mjs#resolve` — jet de Terreur. `rolls`
   et `sound: CONFIG.sounds.dice` ajoutés au `message.update()` existant.
6. `foundry/chat/asphyxiation-roll-chat.mjs#_rollForActor` — seul le jet
   construit pour la **relance automatique par round de combat**
   (`rollAndPost`) était concerné : le clic manuel du joueur
   (`_rollForActorViaDialog`/`resolve`) passe déjà par `actor.rollSkill()`,
   migré dans le pilote. `physicalRoll` câblé jusqu'au `ChatMessage.create`
   de `rollAndPost`.
7. et 8. `foundry/chat/illness-roll-chat.mjs#resolve` — les DEUX jets de
   l'opposition (victime et maladie), chacun avec son propre
   `rollPhysicalDice`/`drawDie`. Les deux `Roll` Foundry sont combinés dans
   un seul tableau `rolls` (`[victimRoll.physicalRoll,
   illnessRoll.physicalRoll].filter(Boolean)`) sur l'unique
   `message.update()` qui suit, cohérent avec le principe « un seul
   message porte l'intégralité du jet » déjà en vigueur ailleurs. Le Push
   ultérieur du jet de la victime (`push()`, via `actor.pushRoll()`) n'a
   volontairement pas été retouché : il délègue déjà au mécanisme
   générique de Push (hors périmètre de ce chantier, cf. `domain/rules/
   push.mjs`), mais sa carte de Chat ne portait et ne porte toujours pas
   de `Roll` Foundry sur son propre `message.update()` — identique à son
   état avant ce chantier, car hors des 10 sites `YZERoll.roll` listés.
9. et 10. `foundry/chat/poison-roll-chat.mjs#resolve` — même patron
   exact que pour la Maladie (DEUX jets d'opposition, victime et poison,
   combinés dans un seul tableau `rolls`), même remarque pour le Push non
   retouché.
11. `foundry/sheets/character-sheet.mjs` (méthode du jet de Trépas,
   anciennement sans nom dédié dans l'énoncé — c'est en réalité la
   méthode de clic sur le bouton de jet de Trépas, qui appelle ensuite
   `_postDeathRollChatMessage`). `physicalRoll` transmis en paramètre
   jusqu'à `_postDeathRollChatMessage`, qui l'attache au
   `ChatMessage.create`.

**Mécanique de non-régression respectée partout** : le traitement des dés
de Stress éliminés sur un 6 (qui suit chaque `YZERoll.roll` concerné) n'a
été touché nulle part — il continue de consommer le résultat retourné par
`YZERoll.roll`, quelle que soit la façon dont les dés ont été tirés.

**6 mécanismes D6-hors-YZE volontairement NON migrés (confirmés
hors-périmètre par grep, mécanique différente — tirage D6 simple
indépendant du moteur YZE, jamais un `DicePool`) :**
- `domain/rules/equipment-damage.mjs`, `domain/rolls/protection-roll.mjs`,
  `domain/rolls/stun-protection-roll.mjs`,
  `domain/rolls/stun-grenade-roll.mjs`, `domain/rolls/explosion-roll.mjs`,
  `domain/rules/station-population-roll-workflow.mjs` : dégâts
  d'équipement, jets de Protection, population de Station, etc.
- `foundry/sheets/character-sheet.mjs#_rollD6` (jets de Réserve / Effets
  des radiations) : explicitement documentée dans le code comme la seule
  méthode de hasard de la fiche pour CES jets-là. **Piste notée pour un
  futur incrément** (non demandée explicitement, non traitée) : étendre
  un jour le même patron de jet physique Foundry à `_rollD6`, par
  cohérence avec le reste du système — mais cette méthode n'a
  volontairement pas été touchée dans ce chantier.
- Tirage de cartes d'initiative (`foundry/initiative/*.mjs`,
  `random = Math.random` injectable) : mécanisme sans rapport avec les
  jets YZE.
- `domain/rules/character-creation.mjs` (`DEFAULT_RNG`) : création de
  personnage.

**Tests** : suite complète **2009/2009, 0 échec** — identique au
baseline d'avant ce chantier (code exclusivement Foundry-dépendant, non
testable unitairement par convention du projet ; aucun test mockait
l'ancien comportement `Math.random` par défaut sans `drawDie`, donc aucun
ajustement de test n'a été nécessaire).

## Suppression de l'automatisation orpheline Agrippement — tentative de libération et d'attaque dédiée (04/10/2026)

En investiguant pourquoi `rollGrappleAttack`/`rollGrappleEscape`
n'avaient aucun appelant nulle part dans le code (constat déjà posé dans
la section « Chantier jets de dés Foundry — généralisation complète »
ci-dessus, au moment de leur migration vers les jets physiques Foundry),
l'audit a confirmé que :
- la tentative de libération d'une Saisie (p.193-195 du livre) possédait
  un moteur complet et testé (`GrappleEscapeService`, `pushGrappleEscape`,
  `rollGrappleEscape`), mais **aucun bouton, hook ou fenêtre ne l'appelait
  nulle part** dans le projet ;
- `rollGrappleAttack` (tenter d'agripper comme action dédiée, distincte de
  la Saisie appliquée comme prouesse de mêlée) ainsi que sa méthode de
  résolution associée `resolveGrappleAttackAgainst` étaient également
  orphelines (ce second constat n'avait pas été relevé explicitement
  auparavant — confirmé ici par grep sur l'ensemble du dépôt, zéro
  appelant) ;
- `GrappleService.release()` (qui met fin à une Saisie) n'est lui-même
  appelé par rien d'autre dans `src/`, seulement par ses propres tests.

Réponse du porteur du projet, verbatim : **« La libération était un jet
d'attribut ou de compétence initié à la demande du MJ. Il n'y a donc pas
d'automatisation à prévoir sur cette fonction. Je pense qu'elle peut être
supprimée. »** En pratique, le MJ se contente de demander un jet
d'Attribut ou de Compétence ordinaire (déjà couvert par
`rollAttribute`/`rollSkill`, eux bien câblés et migrés vers les jets
physiques Foundry) quand il juge qu'une tentative de libération a lieu —
aucun moteur dédié n'est nécessaire. Même raisonnement pour la tentative
d'agrippement comme action dédiée : un jet ordinaire arbitré par le MJ
suffit.

**Supprimé :**
- `src/foundry/documents/actor.mjs` : les méthodes `rollGrappleAttack`,
  `resolveGrappleAttackAgainst`, `rollGrappleEscape`, `pushGrappleEscape`
  en entier, ainsi que leurs imports devenus inutiles (`GrappleEscapeService`,
  `createGrappleAttackContext` depuis `grapple-attack.mjs`). Les autres
  imports utilisés par ces méthodes (`DicePool`, `YZERoll`,
  `rollPhysicalDice`/`createDieDrawer`, `StunEffectService`,
  `MeleeStuntService`, `resolveMeleeAttack`, `resolveMeleeStunts`,
  `resolveMeleeAttackDamage`, `GrappleService`) restent nécessaires à
  d'autres méthodes de la classe et n'ont pas été touchés.
- `src/combat/grapple-escape-service.mjs` — fichier entier (plus aucun
  appelant après le point précédent).
- `src/domain/rules/grapple-attack.mjs` — fichier entier
  (`resolveGrappleAttackEligibility`, `createGrappleAttackContext`),
  exclusivement dédié à l'attaque de saisie comme action autonome.
- `src/domain/rules/grapple-state.mjs` : les fonctions `isGrappleAttacker`,
  `isGrappleTarget`, `canPerformGrappleAttack`, `canAttemptGrappleEscape`
  et `releaseGrappleState` — vérifiées une par une par grep sur
  l'ensemble de `src/` : aucune n'était appelée par
  `grapple-service.mjs` ni par aucun autre fichier (seulement par leurs
  propres tests, ou par d'autres fonctions du même groupe entre elles).
  Leur usage prévu (éligibilité de l'attaque/libération dédiées, retrait
  manuel de la saisie côté domaine) ne correspondait qu'à l'automatisation
  retirée ci-dessus — elle n'avait d'ailleurs jamais été câblée, même par
  `grapple-escape-service.mjs` ou `grapple-attack.mjs` eux-mêmes, qui
  passaient par d'autres chemins (`GrappleService`, logique dupliquée
  localement).
- Tests : `tests/domain/rules/grapple-attack.test.mjs` (fichier entier,
  plus aucun code à tester) ; dans `tests/domain/rules/grapple-state.test.mjs`,
  les 4 tests portant exclusivement sur `isGrappleAttacker`/`isGrappleTarget`
  (import mis à jour en conséquence). Aucun test direct de
  `rollGrappleAttack`/`resolveGrappleAttackAgainst`/`rollGrappleEscape`/
  `pushGrappleEscape`/`GrappleEscapeService` n'existait dans
  `tests/foundry/` ni `tests/combat/` (confirmé par grep avant
  suppression).

**Conservé intégralement, vérifié fonction par fonction (la Saisie EN
TANT QUE PROUESSE DE MÊLÉE reste pleinement fonctionnelle) :**
- `src/domain/rules/grapple.mjs` (`resolveGrapple`), utilisé par
  `src/combat/melee-stunt-service.mjs` — résolution de la prouesse
  « Saisir » appliquée sur une Attaque de mêlée réussie. Non touché.
- `src/combat/grapple-service.mjs` dans son intégralité, y compris
  `GrappleService.release()` et `GrappleService.resolveEscape()` (qui
  continue d'appeler `resolveGrappleEscape` de `grapple-state.mjs`,
  conservée pour cette raison) : ce fichier gère l'état de Saisie actif
  (`establish`, `canActorMove`, `canActorPerformAction`, etc.), nécessaire
  tant que la Saisie existe comme état de combat, indépendamment de toute
  automatisation de libération/attaque dédiée.
- `src/domain/rules/grapple-state.mjs` : `createGrappleState` (utilisé par
  `GrappleService.establish`), `isActiveGrappleState` (utilisé en interne
  par `resolveGrappleEscape`) et `resolveGrappleEscape` (utilisé par
  `GrappleService.resolveEscape`) — conservées intactes.
- `src/domain/rules/grapple-actions.mjs` (`GRAPPLE_ACTIONS`,
  `getGrappleRole`, `canMoveDuringGrapple`, `canPerformActionDuringGrapple`,
  `getGrappleActionState`), utilisé par `grapple-service.mjs` pour
  déterminer ce qu'un Actor saisi/saisisseur peut faire. Non touché — la
  constante `GRAPPLE_ACTIONS.ATTACK = "grapple-attack"` qui y figure est un
  simple identifiant de chaîne pour la logique de restriction d'action
  pendant une Saisie active, indépendant du fichier `grapple-attack.mjs`
  supprimé.
- Le hook `preUpdateToken` de `src/combat/combat-hooks.mjs`
  (`GrappleService.canActorMove`) et le label « Saisi » de
  `character-sheet.mjs` — non touchés.

**Observation signalée, sans suppression (hors périmètre explicitement
demandé)** : après ce nettoyage, `GrappleService.release()` n'a plus
aucun appelant dans `src/` — seulement dans ses propres tests
(`tests/combat/grapple-service.test.mjs`). Il n'est pas certain qu'un
appelant structurel soit un jour nécessaire, puisque le relâchement
volontaire de la Saisie par l'attaquant relève lui aussi d'une décision
de table que le MJ peut tout à fait faire constater sans bouton dédié.
Conservé tel quel à ce stade, cette méthode n'étant pas dans le périmètre
explicitement demandé par le porteur du projet.

**Tests** : suite passée de **2009/2009** à **1990/1990**, soit **-19
tests**, tous supprimés délibérément (plus aucun code à tester) : 15
tests de `grapple-attack.test.mjs` (fichier supprimé) et 4 tests de
`grapple-state.test.mjs` (`isGrappleAttacker`/`isGrappleTarget`).
Aucune régression : 0 échec.

**Incidence sur le Point 2 (Combat) — cette suppression ne rouvre PAS la
confirmation à 100 % sans réserve de la Bible v0.9.8 :** il ne s'agit pas
d'une régression. La Saisie comme prouesse de mêlée (établissement,
conséquences immédiates, contraintes de déplacement et d'action,
relâchement volontaire, résolution d'une tentative de libération via
`GrappleService.resolveEscape`) reste pleinement fonctionnelle et
strictement inchangée. On retire uniquement un moteur d'automatisation
dédié (tentative de libération en opposition entièrement outillée, et
attaque de saisie comme action autonome) qui n'avait jamais été câblé à
la moindre interface et qui, sur décision du porteur du projet, est jugé
inutile : le MJ préfère demander un jet d'Attribut/Compétence ordinaire
quand il estime qu'une telle tentative a lieu. Même principe que celui
déjà appliqué à l'économie d'actions de combat (cf. section « Bug
signalé — blocage automatique de l'économie d'actions de combat »
ci-dessus) : une automatisation jamais actée dans la Bible comme règle
délibérée, et qui va au-delà de ce que le livre impose, est retirée sans
que cela rouvre la lacune fonctionnelle qu'elle prétendait couvrir. À
consigner, le cas échéant, au prochain amendement de la Bible comme
clarification, pas comme régression.

## Adoption d'une nouvelle base de travail + correctif CSS — en-têtes de section Faction/Station (04/10/2026)

Le porteur du projet a réimporté le projet après y avoir apporté lui-même
des modifications dans une feuille de style ; cette version devient la
base de travail de référence à partir de maintenant (remplace l'archive
livrée à l'issue du nettoyage de l'automatisation orpheline de
l'Agrippement, cf. section précédente).

**Bug signalé** : sur les fiches Item Faction et Station, les en-têtes de
section affichaient l'étoile rouge à gauche et l'intitulé plaqué à droite
au lieu d'être groupés à gauche (constaté sur Identité, Description,
Ressources, Notes du MJ pour Faction ; Identité, Ressources de la
Station, Description, Marché, Défenses/Dangers, Notes du MJ pour
Station).

**Cause** : la règle `.metro-faction-sheet .metro-item-section-header` /
`.metro-station-sheet .metro-item-section-header` (`justify-content:
space-between`) s'appliquait à TOUS les en-têtes de section de ces deux
fiches, alors qu'elle n'était nécessaire que pour les deux en-têtes de
chaque fiche portant un bouton « + Ajouter » (Faction : Relations avec
les autres Factions, Membres notables ; Station : Connexions vers
d'autres Stations, PNJ notables) — pour écarter l'intitulé et le bouton
aux deux extrémités. Les en-têtes sans bouton héritaient à tort du même
écartement, entre seulement deux éléments (étoile, intitulé), d'où le
plaquage à droite.

**Correctif** : ajout d'une classe modificatrice
`metro-item-section-header--with-action` sur les 4 en-têtes concernés
(2 dans `templates/items/faction-sheet.hbs`, 2 dans
`templates/items/station-sheet.hbs`) ; les règles CSS
`.metro-faction-sheet .metro-item-section-header` /
`.metro-station-sheet .metro-item-section-header` dans
`styles/metro-items.css` reciblées sur ce seul modificateur. Les boutons
« + Ajouter » restent correctement poussés à droite indépendamment
(`margin-left: auto` déjà présent sur `.metro-faction-list-add` /
`.metro-station-list-add`). Aucun autre en-tête de section du système
n'était concerné (le problème ne touchait que ces deux fiches, seules à
redéfinir `justify-content` sur `.metro-item-section-header`).

**Tests** : suite complète inchangée après ce correctif purement visuel —
**2088/2088, 0 échec** (nouveau total de référence sur cette base de
travail réimportée, différent du dernier total connu avant réimport :
l'archive remise par le porteur du projet contient des éléments
additionnels — dossiers `docs/`, `ui/`, `packs/` notamment — non présents
dans les livraisons précédentes de ce chantier).

## Bible v0.9.9 — amendement livré (04/10/2026)

Bilan complet du jalon du jour, à la demande du porteur du projet
(« Je veux faire un bilan du reste à faire ») : décisions et choix actés,
développements accomplis, avancement en pourcentage recalculé pour les
6 points de la feuille de route, reste à faire déjà identifié.

**Contenu** : §221 résumé exécutif ; §222 retrait de l'économie d'actions
de combat ; §223 correction de précision du Point 3 ; §224 chantier
Véhicule jalon 1 ; §225 généralisation complète des jets de dés Foundry ;
§226 retrait de l'automatisation orpheline Agrippement ; §227 adoption de
la base de travail réimportée + correctif CSS Faction/Station ; §228
feuille de route à 6 points recalculée (Pt1 ≈100 %, Pt2 100 % sans
réserve, Pt3 ≈96-98 %, Pt4 100 %, Pt5 ≈53-58 %, Pt6 100 %, moyenne ~92 %)
; §229 baseline de tests (cheminement complet 2075 → 1988 → 2009 → 1990 →
2088) ; §230 point de reprise (5 rangs de priorité + chantiers à cadrer)
; §231 méthode de travail maintenue (2 nouvelles règles : vérifier
fonction par fonction avant de supprimer du code orphelin ; vérifier
formellement par comparaison de fichiers une nouvelle base de travail
avant d'y appliquer un correctif).

Fichiers `Metro_2033_Bible_v0.9.9_Amendement.docx`/`.pdf` générés
(`build-amendment-v0.9.9.js`, patron identique aux amendements
précédents) et livrés.

## Rang 1 validé en Foundry réel + recadrage du chantier Véhicule (04/10/2026)

**Rang 1 validé par le porteur du projet, verbatim : « Sur le Rang 1, je
valide : le jalon 1 du chantier Véhicule, les jets de dés Foundry, le
retrait de l'économie des actions, les corrections d'affichage sur les
factions/stations. »** Les quatre chantiers suivants passent donc de
« livré, non validé en Foundry réel » à **validé en conditions Foundry
réelles**, sans réserve :
- Chantier Véhicule — jalon 1 (DataModel, catalogue, fiche, table
  « Véhicules hors d'état »).
- Généralisation complète des jets de dés réellement animés dans
  Foundry (10 sites migrés).
- Retrait de l'économie d'actions de combat.
- Correctif d'alignement des en-têtes de section Faction/Station.

**Recadrage du chantier Véhicule (2e incrément), décisions actées,
verbatim :**
- « Sur les jalons véhicules, je ne souhaite pas que l'on développe des
  véhicules aériens. Nous pouvons l'enlever de notre bible et y on y
  reviendra si besoin dans une version très ultérieure. » → les véhicules
  aériens ne sont plus un simple report technique : ils sont **retirés du
  périmètre du chantier Véhicule**, à reconsidérer uniquement dans une
  version très ultérieure du projet si le besoin se présente. À retirer
  de la liste des reports du chantier Véhicule au prochain amendement de
  la Bible.
- « Les actions des véhicules seront des actions narratives et donc pas
  automatisées. » → Démarrer le moteur, Conduire/piloter, Entrer/sortir
  d'un véhicule rejoignent la catégorie « appréciation narrative/décision
  du MJ, pas d'automatisation pertinente », au même titre que les Talents
  déjà classés ainsi (Investigateur, Tuyau, etc., cf. Bible v0.9.7,
  §203-204). Ce n'est plus un sous-système à cadrer plus tard : aucun
  développement n'est prévu sur ce point.
- « Pour la perte d'intégrité d'un occupant touché je penche également
  pour une gestion narrative à la charge du MJ. » → `resolveOccupantHitIntegrityLoss`
  (fonction pure déjà écrite, cf. Bible v0.9.9 §224) reste disponible
  dans le code mais ne sera **pas câblée** à une automatisation Hook/Sheet,
  par cohérence avec la même logique que les deux points ci-dessus. Le
  porteur du projet reste sur un « je penche » plutôt qu'un refus
  catégorique : à confirmer explicitement avant de retirer définitivement
  cette piste du backlog (à la différence des véhicules aériens et des
  actions dédiées, tranchés sans réserve).

**Scope restant du chantier Véhicule, 2e incrément, après ce recadrage** :
uniquement les modificateurs de combat liés aux véhicules (câblage en
faits de contexte dans la fenêtre de préparation de jet, décision de
principe déjà actée au 1er jalon — cf. Bible v0.9.9, §224, point 3 du
cadrage initial) et la question, non tranchée, d'un éventuel déclenchement
automatique de la table « Véhicules hors d'état » en chat au passage à 0
d'Intégrité. Les deux restent à cadrer avec le porteur du projet, sans
échéance fixée — le chantier Véhicule n'est plus la priorité immédiate
(le porteur du projet indique passer au Rang 2 ensuite).

**Prochain chantier engagé, sur indication du porteur du projet : Rang 2**
— déterminer le balisage réel des boutons Confirmer/Annuler de DialogV2
en conditions Foundry réelles (réserve ouverte depuis la v0.9.7, §210).
Aucun code modifié par cette entrée : clarifications et décisions de
cadrage uniquement.

## Précision — perte d'Intégrité d'un occupant de véhicule : décision ferme (04/10/2026)

Le porteur du projet a confirmé, verbatim : « Quand je dis "je penche"
c'est effectivement équivalent à "je souhaite". » La gestion de la perte
d'Intégrité d'un occupant de véhicule touché rejoint donc, sans réserve,
les deux autres points du recadrage du chantier Véhicule (véhicules
aériens retirés, actions dédiées narratives) : **appréciation narrative
du MJ, pas d'automatisation prévue**. `resolveOccupantHitIntegrityLoss`
reste dans le code (fonction pure déjà testée) mais ne sera pas câblée à
un Hook ou une Sheet. Plus aucun point en suspens sur le recadrage du
chantier Véhicule.

## Pause de test de l'extension Asphyxie — levée, test confié au porteur du projet (04/10/2026)

Le porteur du projet lève la pause de test actée le 28/09/2026 (Bible
v0.9.4, §174). Vérification technique effectuée avant la levée : tout le
code de l'extension (état « Asphyxié », relance automatique par round via
`CombatRoundCoordinator` limitée à la Nocivité Extrême, option « Subir 1
Stress pour +3 dés », jet via la fenêtre de préparation universelle) reste
intact et cohérent après les chantiers du jour (retrait de l'économie
d'actions, retrait de l'automatisation Agrippement, généralisation des
jets de dés Foundry) — tests ciblés verts (16/16,
`asphyxiation.test.mjs` + `combat-round-coordinator.test.mjs` +
`recurring-status-effect-registry.test.mjs`), `node --check` propre sur
les 4 fichiers concernés.

Aucun développement engagé : la levée de la pause ne nécessitait aucun
code, seulement la confirmation ci-dessus. **Le test en conditions
Foundry réelles (état Asphyxié posé en combat à Nocivité Extrême, relance
round par round, icône du Token, option Stress+3) est explicitement pris
en charge par le porteur du projet**, pas par ce chantier.

## Extension de « Subir 1 Stress pour +3 dés » à l'Attaque de mêlée et à l'Attaque à distance (04/10/2026)

Chantier engagé à la demande du porteur du projet après le point d'étape
du jour, pour traiter un gap documenté depuis la v0.9.5 et jamais repris
depuis : l'option « Subir 1 Stress pour +3 » (livre, p.190, « un jet
d'attribut ou de compétence, quel qu'il soit ») était volontairement
exclue de l'Attaque de mêlée (`rollMeleeAttack`) et de l'Attaque à
distance (`rollRangedAttack`) — `supportsStressForBonus()`
(`action-modifier-dialog.mjs`) ne l'activait que pour `skill-roll` et
`attribute-roll`, avec un commentaire actant explicitement ce gap comme
hors périmètre à l'époque.

**Ce qui était déjà en place côté UI, mais mort faute de case
visible** : dans `character-sheet.mjs`, le bonus de +3 dés
(`totals.stressBonus`) était déjà additionné dans l'ajustement signé
juste avant les deux appels à `rollRangedAttack` (tir normal et tir en
rafale). Comme la case à cocher n'apparaissait jamais pour ces actions
(`supportsStressForBonus()` renvoyait `false`), `totals.stressBonus`
valait toujours 0 — ce code ne changeait donc jamais réellement le jet.

**Ce qui a été ajouté :**
- `supportsStressForBonus()` : ajout de `"melee-attack"` et
  `"ranged-attack"` aux types d'action supportés ; commentaire au-dessus
  de la fonction réécrit (il expliquait pourquoi ces deux actions étaient
  exclues, cette justification n'existe plus).
- `actor.mjs#rollMeleeAttack` : ajout du paramètre `extraStressDie = 0`
  (défaut rétrocompatible), intégré au total de dés de Stress du pool, et
  persisté sur l'Actor via `await this.addStress(normalizedExtraStressDie)`
  après résolution du jet, quel qu'en soit le résultat — même patron
  exact que `rollAttribute`/`rollSkill`.
- `actor.mjs#rollRangedAttack` : ajout du même paramètre `extraStressDie
  = 0`, simplement propagé jusqu'à l'appel interne à `rollSkill("shooting",
  …)` que `rollRangedAttack` délègue déjà — `rollSkill` gère seul la
  construction du pool et la persistance post-résolution, sans
  duplication de logique.
- `character-sheet.mjs` : les deux appels à `rollRangedAttack` (tir
  normal et tir en rafale) reçoivent désormais `extraStressDie:
  Number(totals.extraStressDie ?? 0)`, au même emplacement que pour
  `rollAttribute`/`rollSkill`.
- `combat/melee-attack-chat-hooks.mjs` : point non anticipé par le
  cadrage initial du chantier — `rollMeleeAttack` n'est en réalité jamais
  appelé depuis `character-sheet.mjs` (aucune Attaque de mêlée directe
  depuis la fiche), mais uniquement depuis le workflow de combat
  `resolveAttackPreparation`, qui utilise un contrat différent
  (`resolvedPreparation.bonus`/`.penalty`, contrat historique des
  ActionModifier) n'incluant pas non plus `stressBonus`. Par cohérence
  avec le correctif de `character-sheet.mjs` et pour que la case cochée
  ait réellement un effet sur ce seul chemin d'appel réel de
  `rollMeleeAttack`, le même correctif a été appliqué ici : `totals.stressBonus`
  ajouté au `bonus` transmis, et `extraStressDie: Number(totals.extraStressDie
  ?? 0)` ajouté à l'appel à `rollMeleeAttack`. Le Blocage (`melee-block`,
  workflow voisin dans le même fichier) n'a pas été touché : il reste hors
  périmètre, `supportsStressForBonus()` ne l'inclut pas.

**Câblage bout en bout confirmé** : case visible (actionType
`melee-attack`/`ranged-attack` désormais supporté) → `totals.extraStressDie`
calculé par `ActionModifierService.resolvePreparationTotals` → transmis en
paramètre `extraStressDie` à `rollMeleeAttack`/`rollRangedAttack` →
intégré au pool de dés de Stress du jet → persisté sur l'Actor via
`addStress()` après résolution, indépendamment du résultat.

**Résultat des tests** : suite complète verte, **2088/2088, 0 échec**
(`node --test --test-reporter=spec "tests/**/*.test.mjs"`), identique à
la baseline d'avant chantier — ce chantier ne touche que du code
Foundry-dépendant (dialogue, fiche, méthodes Actor, hooks de combat), non
couvert par des tests unitaires par convention constante du projet.
`node --check` propre sur les 4 fichiers modifiés
(`action-modifier-dialog.mjs`, `actor.mjs`, `character-sheet.mjs`,
`melee-attack-chat-hooks.mjs`).

## Point 3 (1/3) — Nouveau type d'Item « weaponMod » (Améliorations d'arme) livré (04/10/2026)

**Décision de l'utilisateur, verbatim (spécification unifiée et définitive)** :

> « Ces weaponMod doivent être considérés comme des talents ou outils
> utilisables dans un jet. Quand la fenêtre de préparation apparaît, si
> l'arme est impliquée dans le jet alors le système propose le weaponMod
> et surtout présente en info bulle une description de son effet et de
> son bonus. Si le joueur sélectionne le weaponMod, le MJ autorise
> narrativement le joueur à modifier les bonus, le tir à une portée plus
> longue, etc ... par contre si le weaponMod nécessite la consommation
> d'une énergie ou d'une ressource elle est décomptée sur la fiche
> d'acteur du joueur. [...] dès qu'une arme est impliquée dans un jet, si
> cette arme dispose d'un weaponMod nécessitant une ressource disponible
> ou ne nécessitant pas de ressource, on propose le weaponMod dans la
> fenêtre de préparation (en mode sélectionnable) mais les effets ne sont
> pas automatisés mais gérés par le MJ. Par contre s'il y a consommation
> de ressource si utilisé, alors on décompte une ressource. »

Cette spécification remplace la proposition initiale (découpage Jalon
1/Jalon 2) que j'avais soumise et que l'utilisateur a explicitement
écartée au profit de ce design unifié, plus simple : **aucun des 11
weaponMods ne contribue jamais de bonus chiffré au jet** — ils sont tous
traités de façon identique (sélectionnables, jamais automatisés dans
leurs effets), seule la consommation de ressource (quand applicable) est
automatisée.

### Livré

- Nouveau type d'Item Foundry `weaponMod` (« Amélioration d'arme ») :
  `WeaponModDataModel` (`attachedWeaponUuid`, `resource.{id,amount}`,
  `weight`, `description`, `gmNotes`), fiche dédiée avec résolution de
  l'arme attachée et bouton de détachement, glisser-déposer d'un
  weaponMod directement sur la fiche d'une Arme (étend
  `_onDropDocument` de `weapon-sheet.mjs`, même pattern que l'attachement
  de Munition déjà existant).
- Catalogue des 11 Améliorations d'arme du livre (p.213-214), texte
  verbatim : Bipied, Crosse pliable, Frein de bouche, Lunette de visée
  x4, Lunette de visée x8 (Vestige), Mire améliorée, Poignée verticale,
  Pointeur laser (Vestige), Silencieux, Système de vision nocturne
  (Vestige), Viseur point rouge (Vestige). Ressource « Énergie »
  requise (`system.survival.energy`, champ et méthodes
  `hasResource`/`consumeResource` déjà existants, aucune nouvelle
  infrastructure) uniquement pour Pointeur laser, Système de vision
  nocturne et Viseur point rouge — conformément à l'encart du livre
  « RÉSERVE D'ÉNERGIE ET AMÉLIORATIONS D'ARME ».
- Compendium de seed dédié `seedWeaponModCompendium()` (pack
  `ameliorations-armes`), même pattern idempotent (seedKey) que les
  autres compendiums du système.
- Câblage dans la fenêtre de préparation de l'Attaque à distance
  (seul flux où `context.weapon.uuid` est actuellement disponible) :
  nouvelle section dédiée (distincte de la section « Sources », qui
  contribue toujours un bonus chiffré — ce n'est jamais le cas ici),
  case à cocher décochée par défaut, info-bulle (`data-tooltip` natif
  Foundry + repli `title`) avec le texte d'effet verbatim du livre. Un
  weaponMod n'est proposé que s'il ne nécessite aucune ressource, ou si
  la ressource nécessaire est disponible sur l'Actor — jamais affiché
  sinon (pas de case désactivée). Consommation de la ressource (si
  applicable) décomptée après résolution du jet — même timing que la
  persistance du dé de Stress « Subir 1 Stress pour +3 » — jamais avant,
  jamais si le dialogue est annulé.
- Règle de domaine pure et testée : `src/domain/rules/weapon-mod.mjs`
  (`isWeaponModUsable`, `getUsableWeaponModsForWeapon`).

### Migration des 11 anciennes entrées génériques « Outil »

Les 11 entrées `WEAPON_IMPROVEMENTS` (jusqu'ici modélisées comme de
simples Items `equipment` inertes, sans aucune mécanique) ont été
retirées du catalogue Équipement et remplacées par le nouveau catalogue
`weaponMod` dédié, qui porte la vraie mécanique. La fonction
`buildEquipmentItemData`, devenue sans appelant, a été retirée après
vérification (grep complet du projet, aucune autre utilisation).

**Point d'attention pour l'utilisateur** : si le compendium
« Équipement de base » a déjà été importé dans un monde Foundry réel
avant ce chantier, les 11 anciens Items « Outil » (Bipied, Crosse
pliable, etc.) y resteront tels quels (le script de seed ne supprime
jamais d'Items) — il faudra les retirer manuellement de ce monde, puis
lancer le nouveau `seedWeaponModCompendium()` pour obtenir les Items
`weaponMod` dédiés à leur place.

### Écart constaté et assumé

Le livre ne décrit des effets d'Amélioration d'arme que pour les armes
à distance (aucune des 11 ne s'applique à une arme de mêlée). Le flux
de préparation de l'Attaque de mêlée (`melee-attack-preparation-service.mjs`)
construit son `context.weapon` via une fonction distincte qui n'expose
pas `uuid` — câblage non nécessaire et non fait, hors périmètre de la
demande qui porte sur les Améliorations d'arme (toutes pour armes à
distance dans le livre).

### Tests

2088 → **2105/2105**, 0 échec, 0 régression. `node --check` propre sur
tous les fichiers Foundry-dépendants créés/modifiés (DataModel, fiche,
script de seed, dialogue de préparation, fiche Arme, fiche Personnage,
`system.mjs`).

### Reste à faire — Point 3 (2/3 et 3/3)

- Poison de lame (déclenchement automatique, confirmé par l'utilisateur).
- Liens UUID `notableMembers`/`notableNPCs` (Faction/Station).

Point d'étape prévu par l'utilisateur une fois ces 2 chantiers livrés.

## Point 3 (2/3) — Poison de lame, déclenchement automatique livré (04/10/2026)

**Décision utilisateur** : « Déclenchement automatique (recommandé) » (réponse à la question de cadrage posée en amont du chantier weaponMod).

### Texte verbatim du livre (p.204, « POISONS ET BLESSURES »)

> « Il est possible d'appliquer des poisons sur une lame, par exemple. Le
> poison reste actif 1 tour avant de perdre ses propriétés. La Toxicité
> d'un tel poison ne peut excéder 6. Si une attaque est portée avec
> succès et inflige au moins 1 point de dégâts à la VIGUEUR de la
> cible, celle-ci subit également les effets du poison et doit faire un
> jet en opposition d'ENDURANCE contre la Toxicité du poison qui ne
> compte pas comme une action. Une fois le poison inoculé à la victime,
> la lame n'est plus empoisonnée [...]. Les effets de ces poisons sont
> réduits. Ainsi, si la cible empoisonnée réussit son jet d'ENDURANCE,
> elle ne subit aucun effet du poison. Si elle le rate, elle ne subit
> que les effets réduits du poison. »

### Mécanique, distincte du Poison ingéré déjà implémenté

Contrairement au poison ingéré (toujours 1 point de dégâts immédiat,
complets si le poison l'emporte strictement), le poison de lame est un
choix binaire tout-ou-rien, plafonné aux effets réduits, jamais d'Item
`poison` récurrent créé :
- victime gagnante **ou égalité** (convention du projet : l'égalité
  protège toujours la victime, étendue ici logiquement à ce choix
  binaire) → aucun effet, aucun dégât ;
- poison gagnant → effets réduits uniquement (1 point de dégâts à
  l'attribut concerné du type de poison choisi).

### Livré

- Fiche Arme (uniquement pour une arme de mêlée) : section « Poison de
  lame » — choix du type d'effet (4 types du livre), Toxicité (1-6,
  plafond livre), libellé de source optionnel, bouton « Appliquer » ;
  une fois actif, affichage de l'état + bouton « Retirer » manuel (la
  durée narrative « 1 tour » reste à la charge du MJ, non automatisée,
  cohérent avec toutes les autres notions de durée narrative du
  projet).
- Déclenchement 100% automatique : dès qu'une attaque de mêlée inflige
  réellement ≥1 point de dégâts de VIGUEUR (dégât appliqué après
  plafond/overflow, pas la quantité demandée) avec une arme dont la
  lame est actuellement empoisonnée, le jet en opposition ENDURANCE vs
  Toxicité se déclenche automatiquement sur la cible (réutilise
  entièrement l'infrastructure de Chat du Poison ingéré — push/accepter
  — sans dupliquer le moteur de dés). La lame redevient aussitôt non
  empoisonnée, indépendamment de l'issue du jet qui suit.
- Nouvelle fonction pure testée `resolveBladePoisonOpposition` dans
  `domain/rules/poison.mjs`.

### Tests

2105 → **2109/2109**, 0 échec, 0 régression (4 tests ajoutés). Chemin
du Poison ingéré existant relu intégralement et confirmé inchangé.
`node --check` propre sur les fichiers Foundry-dépendants.

### Reste à faire — Point 3 (3/3)

- Liens UUID `notableMembers`/`notableNPCs` (Faction/Station).

Point d'étape prévu par l'utilisateur une fois ce dernier chantier livré.

## Point 3 (3/3) — Liens UUID notableMembers/notableNPCs livré (04/10/2026)

Le champ `actor` de chaque ligne « Membre notable » (Faction) / « PNJ
notable » (Station) était jusqu'ici une simple saisie manuelle d'UUID en
texte libre, sans résolution ni affichage du nom. Remplacé par un
glisser-déposer d'Acteur (sidebar/Token) directement sur chaque ligne,
avec résolution et affichage du nom (repli « (Acteur introuvable) » si
l'Acteur référencé a été supprimé), et un bouton « Changer » pour délier
sans supprimer la ligne (le `role` saisi est conservé). Le bouton
« ✕ Retirer » existant (suppression de la ligne entière) est inchangé.

Duplication assumée entre `FactionSheet`/`StationSheet` (pas de classe
de base commune pour cette logique, cohérent avec le reste du fichier
qui duplique déjà `_addListRow`/`_removeListRow` à l'identique entre les
deux fiches).

Tests : 2109/2109 inchangé (chantier 100% Foundry-dépendant, aucun test
unitaire possible).

**Point 3 entièrement clos (weaponMod + poison de lame + liens UUID).**
Point d'étape avec l'utilisateur à prévoir — actuellement repoussé par
une demande complémentaire sur le weaponMod (cf. section suivante).

## Généralisation du weaponMod — emplacements, Protection, rattachement Acteur (04/10/2026)

**Demande complémentaire de l'utilisateur, verbatim, arrivée après la livraison du chantier weaponMod** :

> « Il y a un chantier que l'on n'a pas évoqué (ma faute) avant ce
> développement c'est l'attribution sur une arme ou une protection
> (pourquoi pas) d'un weaponMod. Et combien peut-on attribuer de weapon
> mod ? Je pense qu'il faut créer l'item WeaponMod avec un libellé
> 'Amélioration d'équipement'. Ce weaponMod doit savoir sur quel type
> d'équipement il peut être affecté (Arme, Protection, etc...) Et pour
> chaque arme et protection il faut définir ensemble combien
> d'amélioration ils peuvent bénéficier. Ensuite il faudra prévoir pour
> chaque arme/protection [...] une possibilité d'ajouter un UID d'un
> weaponMod au niveau de l'acteur et pas au niveau général. [...] je
> paramètre un fusil avec une possibilité de 2 améliorations possibles
> (weaponMod). Ensuite je l'affecte à un acteur et j'ajoute à l'arme de
> cet acteur une modification. »

### Livré

- Libellé d'affichage renommé : « Amélioration d'arme » → **« Amélioration
  d'équipement »** (clé technique `weaponMod` inchangée, aucune migration
  de données nécessaire).
- Nouveau champ `applicableTypes` sur l'Amélioration d'équipement :
  déclare sur quel(s) type(s) d'Item (`weapon` et/ou `armor`) elle peut
  être attachée. Les 11 entrées du livre (p.213-214) restent toutes
  `applicableTypes: ["weapon"]` — **aucune Amélioration de Protection
  n'a été inventée**, le livre n'en définit aucune ; seule
  l'infrastructure générique est en place, prête à accueillir du
  contenu de Protection si le livre (ou une extension maison validée)
  en fournit un jour.
- Nouveau champ `weaponModSlots` (nombre d'emplacements) sur l'Arme ET
  la Protection, éditable sur chaque fiche, valeur par défaut 0 pour
  tout le catalogue existant (le livre ne chiffre aucun nombre
  d'emplacements par arme — c'est un paramétrage MJ, table par table,
  exactement comme dans l'exemple de l'utilisateur).
- Rattachement d'une Amélioration désormais strictement réservé au
  niveau Acteur : refusé si l'arme/protection n'est pas assignée à un
  Acteur, refusé si l'Amélioration déposée n'appartient pas au même
  Acteur, refusé si son `applicableTypes` ne couvre pas le type
  d'objet ciblé, refusé si le quota `weaponModSlots` est déjà atteint
  — chaque cas avec un message dédié. Réattachement de la même
  Amélioration au même objet resté idempotent (ne consomme pas un
  second emplacement).
- Mécanique étendue à la fiche Protection (glisser-déposer, affichage
  des Améliorations attachées, bouton Détacher), symétrique à ce qui
  existait déjà pour l'Arme.

### Hors périmètre, assumé

Aucun câblage d'Amélioration de Protection dans une fenêtre de
préparation de jet : il n'existe aujourd'hui aucun `context.armor`
équivalent à `context.weapon` dans le dialogue de préparation, et le
livre ne fournit de toute façon aucun contenu de Protection à y
afficher. Ce point reste un chantier futur distinct si des
Améliorations de Protection sont un jour définies.

### Tests

2109 → **2116/2116**, 0 échec, 0 régression. Renommage de champ
(`attachedWeaponUuid` → `attachedItemUuid`) vérifié complet par grep
exhaustif (0 occurrence restante).

## Bible v0.9.10 — point d'étape livré (09/10/2026)

Amendement `Metro_2033_Bible_v0.9.10_Amendement` (.docx + .pdf, §232-§243).
Vérification en Foundry réel par le porteur du projet (09/10/2026) :
import des compendiums « Équipement de base » (Armes, Armures, Munitions,
Objets) et « Améliorations de base » OK. Feuille de route recalculée :
Pt1 ≈100 %, Pt2 100 %, Pt3 ≈99-100 %, Pt4 100 %, Pt5 ≈60-65 % (ré-étalonné
après retrait des véhicules aériens et décisions narratives), Pt6 100 %,
moyenne ≈94 %. Baseline de tests : 2116/2116. Priorités : Rang 1 retour
d'usage Foundry réel (Stress+3, weaponMod, poison de lame, liens UUID,
Asphyxie) ; Rang 2 les 9 Talents ; Rang 3 Véhicule incrément 2 réduit ;
DialogV2 reporté à la fin du projet.

## Cadrage des 9 Talents non automatisés — décisions (09/10/2026)

**Décision verbatim : les 7 Talents suivants sont classés définitivement
narratifs (gérés par le MJ, aucune automatisation)** : Dégainé rapide,
Garde du corps, Discipline de groupe, Chanceux, Assassin, Guérison accélérée,
Exaltation. Ils rejoignent Investigateur, Tuyau, etc.

Constats de l'audit de cadrage : (1) le livre donne bien le coût de base de
« Dégainer » (action rapide, p.196/p.2160 du texte extrait), ce qui corrige
l'audit du 03/10 qui le disait introuvable ; l'économie d'actions étant
retirée du système, Dégainé rapide n'a de toute façon rien à automatiser.
(2) La table des Blessures critiques (D66) est tirée à la main par le MJ
(RollTable) : Chanceux et Assassin se jouent donc à la table sans code.
(3) Le moteur ne calcule aucune rémission (Guérison accélérée).

Restent à trancher : Impitoyable (réponse libre du porteur du projet à
clarifier : case à cocher « souhaite exécuter sa cible » + bouton « Coup de
grâce »), Second souffle et Pilote (« pas de préférence » : recommandation
retenue par défaut, bouton fiche pour Second souffle, fait de contexte
« je pilote un véhicule » décoché pour Pilote).

## Talents : Second souffle, Pilote, Coup de grâce (Impitoyable) livrés (09/10/2026)

Décisions du porteur du projet (verbatim résumé) : Second souffle = bouton
« Second souffle » sous « Repos », visible si Talent + personnage Brisé
(VIGUEUR 0) ; Pilote = Talent proposé (décoché) dans la préparation d'un jet
de RÉACTION, le joueur le coche selon l'avis du MJ, « pas d'autre
automatisation » ; Coup de grâce = macro MJ (PJ en deux colonnes, ★ rouge après
le nom des Impitoyables, texte modifiable « Tu veux exécuter ta cible de
sang-froid »), une carte de Chat par PJ avec bouton à icône de mort
« Coup de grâce », cliquable seulement par le propriétaire de l'Acteur.

Livré : `recoverAttribute` (soin d'attribut, plafonné au max) sur l'Actor ;
règles pures `second-wind.mjs`, `coup-de-grace.mjs`, `talent-identity.mjs` ;
Pilote (`pilot`, fait de contexte `piloting`, +1/+2) ; clés `secondWind`,
`ruthless`, `pilot` au catalogue (repli par nom pour les Items déjà importés,
aucune migration) ; macro « Métro 2033 — Coup de grâce » créée pour le MJ
(`CONFIG.Metro2033.openCoupDeGraceDialog`). Tests 2116 → 2148/2148.

Interprétations à connaître : usage unique de Second souffle non suivi (le
bouton reste tant que VIGUEUR = 0) ; affliction ignorée de Pilote, zone
encombrée et Déplacement non automatisés ; jet d'EMPATHIE réussi = pas de
coût (le livre n'en prévoit pas) ; sans Impitoyable, 0 réussite = coup porté
(1 dégât EMPATHIE + 1 case de Sang-froid), avec Impitoyable aucun jet et pas
de case ; MJ compté comme propriétaire.

**Point de vigilance à tester en jeu** : la résolution d'une carte de Chat
(Coup de grâce, comme Terreur/Poison) fait un `message.update` sur un message
créé par le MJ ; Foundry peut le refuser à un joueur non-auteur. À tester
avec un compte joueur ; si bloqué, cela touche aussi Terreur et Poison
(chantier d'infrastructure à cadrer).

Talents restant à cadrer : aucun des 9 initiaux (7 narratifs, 2 livrés
Second souffle/Impitoyable ; Pilote livré).

## Retours de test Foundry réel — Second souffle, Pilote, Coup de grâce : 3 correctifs (09/10/2026)

Retours du porteur du projet : Second souffle OK mais bouton non réactif
(VIGUEUR passée à 0 sur la fiche ouverte : il faut fermer/rouvrir) ; Pilote
absent de la fenêtre de préparation d'un jet de Réaction ; Coup de grâce OK
côté MJ, bloqué côté joueur.

- **Pilote** — cause établie dans le code : les 5 services de préparation
  (compétence, attribut, tir, mêlée, blocage) cherchaient la définition par
  `system.key` exact ; les Talents importés avant le chantier portent l'ancienne
  clé générée `pilote`, jamais reconnue. Correctif à la source :
  `resolveTalentKey(item)` (clé canonique, anciennes clés, repli par nom) dans
  les 5 collecteurs ; aucune migration ni réimport. Reste non vérifié en Foundry
  la valeur réelle de `system.key` sur l'Actor de test.
- **Second souffle** — la VIGUEUR de l'en-tête n'est enregistrée qu'à la
  fermeture de la fiche : le bouton est désormais toujours présent dans le DOM
  pour un porteur du Talent et se montre/se cache en direct sur la saisie ;
  le clic force `submit()` puis revérifie.
- **Coup de grâce** — un joueur ne peut pas modifier un ChatMessage créé par le
  MJ. Relais via le socket du système (`"socket": true` ajouté à
  `system.json`) : le MJ actif applique la mise à jour (charge strictement
  validée : flag, clés autorisées, demandeur propriétaire de l'Actor) ; erreurs
  lisibles si aucun MJ actif / pas de réponse sous 10 s. Les dés restent lancés
  chez le joueur. L'ordre de résolution a été inversé (carte mise à jour AVANT
  les dégâts d'EMPATHIE et la case de Sang-froid) : si le relais échoue, aucun
  coût n'est appliqué. À vérifier en jeu : acceptation des rolls par la mise à
  jour côté MJ, et affichage Dice So Nice.

**Défaut potentiel identique, NON corrigé (hors périmètre) : cartes en attente
de Terreur (`terror-roll-chat.mjs` l.500), Poison (l.734/868/1014), Maladie
(l.621/755/865), Asphyxie (l.798)** — chacune fait `message.update` après un
contrôle `isOwner` ; un joueur propriétaire non auteur devrait y échouer. À
confirmer par un test avec un compte joueur ; correction possible avec
`updateChatMessageAsGM` + ajout du nom de flag à `GM_RELAY_ALLOWED_FLAGS`.
`terror-roll-chat.mjs` l.316 lit encore `item.system?.key` directement.

Tests : 2148 → **2174/2174**.

## Relais MJ étendu à Terreur, Poison, Maladie, Asphyxie (09/10/2026)
- Cause : un joueur ne peut pas `message.update` une carte créée par le MJ. Relais socket généralisé (`GM_RELAY_FLAG_RULES` par flag : champs immuables, transitions, nb de rolls max ; issue recalculée côté MJ, contenu HTML recalculé).
- Flux couverts : `terrorRoll`, `poisonRoll` (résolution/Push/acceptation, bladePoison), `illnessRoll`, `asphyxiationRoll` ; `coupDeGrace` inchangé. Terreur : Courage via `resolveTalentKey`.
- Ordre : carte mise à jour avant effets irréversibles (Terreur, acceptation Poison/Maladie). Push et Asphyxie : ordre inchangé ; contrôle « MJ actif » en amont.
- Tests : 2174 → 2190. Livré, non validé en Foundry réel (à confirmer : 2 rolls sérialisés pour Poison/Maladie, Dice So Nice).
- Chantier à cadrer : mêlée (PNJ attaquant un PJ) — l'écriture dans les flags du Combat échoue pour un joueur ; identité talent `courage` absente de `TALENT_IDENTITIES`.

## État « Brisé » lié au Sang-froid (09/10/2026)
- Règle : Sang-froid actuel >= maximum (5 par défaut ; 6/7 avec Maîtrise de soi) → état `composureBroken` « Brisé » (icône `icons/svg/daze.svg`) + message Chat « [Nom] est brisé. Limite de sang-froid atteinte » (uniquement au passage effectif). État retiré dès que le Sang-froid repasse sous la limite.
- Hooks `updateActor` / `createActiveEffect` / `deleteActiveEffect` (client auteur seulement) : toute pose/retrait manuel est corrigé sans nouveau message. Non listé dans l'onglet Survie (non manuel).
- Tests 2190 → 2198. Livré, non validé en Foundry réel (à vérifier : le seuil « 5 » = maximum, icône).

## Cadrage de la version 1 / version 2 — décisions du porteur du projet (09/10/2026)

**Décisions (verbatim résumé) :**
- `GrappleService.release()` : « on supprime après vérification » → FAIT (09/10/2026). Aucun appelant en production ; sortie de prise couverte par `resolveEscape`. 4 tests `release` retirés, 1 test (« ignore une saisie terminée ») réécrit via `resolveEscape`. Tests 2198 → 2194. La constante de domaine `GRAPPLE_ACTIONS.RELEASE` (grapple-actions.mjs) est conservée (action de combat, hors service).
- Améliorations de Protection : V2, besoin à re-questionner.
- Véhicule incrément 2 : V2.
- Harmonisation graphique de l'ensemble du système sur la charte graphique : en fin de chantier V1.
- Reste du plan d'étape (analyse du 09/10/2026) validé.

**Périmètre V1 retenu :** écart de baseline 1990→2088 (investigation) ; commentaires « Amélioration d'arme » ; CSS weaponMod ; balisage DialogV2 ; relais joueur pour la mêlée PNJ→PJ (écriture flags Combat) ; audit des droits joueur ; plan de recette Foundry ; installation/packaging ; migration des mondes ; matrice règles du livre → système ; documentation courte ; canal de retours ; amendement Bible v0.9.11 ; classement des capacités du bestiaire (automatisé vs narratif) pour le Point 5 ; harmonisation graphique en dernier.
**Périmètre V2 :** Véhicule incrément 2 ; améliorations de Protection ; autres selon retours.
Règle de « 100 % » proposée : chaque règle est implémentée OU classée narrative par décision, ET validée en Foundry y compris côté joueur.

## Chantier de livraison : système et module de contenu séparés (09/10/2026)

**Décision du porteur du projet :** le système est développé sans accord de l'éditeur ; proposer un système est moins sensible que proposer des données issues du livre. → Deux releases : (1) le SYSTÈME (mécanique, fiches, sans données du livre) ; (2) un MODULE séparé contenant les compendiums.

**Empreinte constatée (audit du 09/10/2026) :**
- 14 catalogues dans `src/data/seed/` (~2 785 lignes) + 15 fonctions `seed-*` dans `src/foundry/setup/` ; `system.json` ne déclare aucun pack (import au runtime par commande console).
- Les assistants de création (Point 6) consomment des catalogues (`character-creation-catalog`, `talent-archetype-catalog`) et `domain/rules/archetypes.mjs` : à rendre tolérants à l'absence du module, ou à clarifier ce qui relève de la mécanique.
- Des textes issus du livre peuvent aussi résider dans le système lui-même (textes d'effet, libellés, tables) : audit à mener.
- Ce découpage n'est pas un avis juridique : à qualifier par le porteur du projet (mécanique vs texte/statistiques verbatim).

**À cadrer :** frontière exacte système/module ; mode de distribution du module ; comportement du système sans module (assistants, macros) ; format (packs préconstruits vs import).

## Audit des textes du livre présents dans le système, hors catalogues (09/10/2026)

Méthode : recoupement automatique (séquences de 8 mots consécutifs identiques, accents/casse ignorés) entre `regles/regles-layout.txt` et tous les `.mjs`/`.hbs`/`.json`/`.css` du système, `src/data/seed` et `tests` exclus. Limites : ne détecte que la reprise quasi littérale (pas la paraphrase) et ne mesure pas les données structurées des catalogues (noms, valeurs chiffrées).
- Résultat : ~1 300 mots de prose du livre hors catalogues, dont **~1 100 en commentaires** (JSDoc citant les règles : poison ≈ 416, maladie ≈ 185, coup de grâce ≈ 107, talents ≈ 103, terreur ≈ 102, asphyxie ≈ 65…) et **~194 mots dans du code exécuté ou affiché** : `poison.mjs` (≈150), `asphyxiation-roll-chat.mjs` (18), `illness-roll-chat.mjs` (10), `illness-launcher-dialog.mjs` (8), `character-creation-wizard.hbs` (8). Aucune occurrence dans `lang/fr.json`.
- Conséquence : le système peut être purgé du texte du livre à faible coût (reformulation des commentaires et de ~5 chaînes), indépendamment du découpage en module. Le gros du volume à déplacer reste les 14 catalogues `src/data/seed/`.
- Reste à trancher par le porteur du projet : frontière système/module, mode de distribution du module.

## Annulation du découpage système / module de contenu (09/10/2026)
Le porteur du projet retire sa demande : le système peut être distribué publiquement, la restriction de l'éditeur ne porte que sur les **illustrations**, actuellement non incluses. Les compendiums restent donc dans le système tels quels. → Le chantier « module séparé » est annulé ; l'audit des textes du livre (section précédente) reste consigné à titre d'information, la purge des commentaires/chaînes devient facultative. Contrainte à retenir : **ne jamais inclure d'illustrations du livre** (images, couvertures, icônes extraites) dans le système.

## Matrice de couverture règles du livre → système (09/10/2026)
Six audits lecture seule (livre p.159-225, PDF 1-68), 853 règles, détail dans `work/matrice/01..06-*.md`, synthèse `00-synthese.md`. Traité (AUTO+DONNEES+NARRATIF+HORS) = 379 (44 %) ; 547 (64 %) si les 168 « à valider » sont tous narratifs ; 143 PARTIEL, 159 ABSENT. Ce n'est pas comparable au ≈94 % de la feuille de route (chantiers livrés).
Correctif livré : plafond `composure.current` 5 → 7 (état Brisé + Maîtrise de soi). Constats vérifiés à corriger : Point faible (`knife` vs `bladedWeapon`), afflictions non câblées (4 Talents inertes), évasion de saisie inatteignable, code mort de l'économie d'actions, jet de SURVIE de station (`vigor` vs `spirit`, à confirmer). Suite : arbitrage des 168 « à valider », puis classement V1/V2/narratif des ABSENT et PARTIEL.

## Retours du porteur du projet sur la matrice + correctifs (09/10/2026)
**Décisions (verbatim résumé) :** Point faible → uniquement `bladedWeapon` (pas `knife`) et vérifier les autres incohérences de catégories ; Afflictions → nouvelle fenêtre de désignation des afflictions proposée aux joueurs après des dégâts subis à l'issue d'un combat, À DÉVELOPPER (chantier V1) ; évasion de saisie → narrative ou test demandé par le MJ, plus aucun chantier ; économie d'actions → suppression OK ; SURVIE → Esprit confirmé ; modificateurs de tir (portée, visée, taille…) et abris → NARRATIF (MJ indique bonus/malus) ; 12 Talents sans implémentation → déjà jugés narratifs, sans chantier ; Feu → statut posé par le MJ, dégâts automatiques en mode combat uniquement, pas d'autre gestion (à vérifier). Le « bug de dégâts de mêlée non appliqués au PNJ » signalé puis RETIRÉ par le porteur du projet (tout est OK).
**Livré :** (1) Point faible : `category === "bladedWeapon"` (`talents.mjs`) ; contexte de mêlée aligné sur le tir (`category` = catégorie MÉTIER `weaponCategory`, la classification mécanique reste dans `isMeleeWeapon`) — corrige aussi Arme de prédilection en mêlée ; tests `talents.test.mjs` : `knife` → `bladedWeapon`. Audit des catégories : catalogue, fiche d'arme et fiche de Talent portent les mêmes 15 valeurs (cohérent) ; seule incohérence restante : Spécialiste en armement (voir ci-dessous). (2) Jet de SURVIE de station : attribut `spirit` (`station-survival-roll.mjs`). (3) Code mort de l'économie d'actions supprimé après vérification fonction par fonction (aucun consommateur hors du trio) : `combat-actions.mjs`, `combat-action-service.mjs`, `combat-movement-service.mjs` + leurs 2 fichiers de tests (-83 tests). Conservé : `grapple-actions.mjs` (état d'action de saisie). Tests 2194 → 2111, 0 échec.
**Constats restants :** Spécialiste en armement compare `weapon.type` (= `system.weaponType`, champ INEXISTANT sur l'arme) à `configuration.weaponType` (aucune interface pour le renseigner sur la fiche de Talent) → ne peut jamais se déclencher. Le livre parle d'un « type d'armes (de mêlée, à distance ou lourdes) » → proposition : `type` dérivé (melee / ranged / heavy) + liste de choix sur la fiche de Talent ; à valider. Feu : AUCUNE implémentation (ni statut ni gérant) ; l'infrastructure `recurringStatusEffectRegistry` est prête ; le statut natif Foundry `burning` existe. Règle du livre (p.203) : Intensité 8 standard, 1 réussite = 1 dégât de VIGUEUR (non forçable, Protection sans Résilience), Intensité +1 par round, s'éteint quand une attaque n'inflige plus de dégâts, extinction par RÉACTION, Trépas si Brisé. À cadrer (intensité de départ, extinction automatique, Protection).
**Fichier :** `work/matrice/arbitrage-168-regles.md` (168 règles à classer N / A / V2).

## Spécialiste en armement : type d'arme sélectionnable + Feu / fenêtre des afflictions en V1 (09/10/2026)
**Décisions du porteur du projet :** Spécialiste en armement dépend du type d'arme, se prend plusieurs fois (une fois par type ; un second exemplaire du même type = Supérieur), la fiche de Talent doit proposer la sélection du type et l'afficher dans le libellé (ex. « Spécialiste en armement (Arme lourde) »). Feu : chantier à étudier, À GARDER EN MÉMOIRE pour finaliser la V1 (éléments manquants : intensité de départ, extinction, Protection — cf. section précédente). Fenêtre de désignation des afflictions (joueurs, après dégâts de combat) : chantier V1 à prévoir.
**Livré (non validé en Foundry) :** `domain/rules/weapon-talent-type.mjs` (types melee / ranged / heavy, `resolveWeaponTalentType` : lourde prioritaire sinon catégorie mécanique ; `composeSpecialistName`) ; contextes de tir et de mêlée : `weapon.type` déduit de l'arme (plus de `system.weaponType` inexistant) ; fiche de Talent : liste « Type d'arme (Spécialiste en armement) » (`system.configuration.weaponType`) ; hook `preUpdateItem` (`foundry/talents/metro-talent-name-hooks.mjs`) qui suffixe le nom du Talent ; `evaluateTalentsForAction` fusionne les exemplaires de même type (niveau = max(niveau, nombre d'exemplaires) → +2) et laisse les types différents indépendants. Interprétation retenue, à confirmer : une arme lourde relève UNIQUEMENT du type « Arme lourde » (pas aussi de « à distance »). Tests 2111 → 2116.
**À faire par le porteur :** sur chaque Item « Spécialiste en armement » existant, choisir le type sur sa fiche (les exemplaires déjà créés n'ont pas de type et restent inactifs).

## Arbitrage des 168 règles « à valider » — validé (10/10/2026)
Verbatim : « Je valide tel quel toutes ces règles ». Interprétation retenue (à corriger si faux) : les 168 règles sont classées **NARRATIF** (gérées par le MJ, aucun développement), conformément à l'audit. Y compris les candidats à garde-fou signalés par les audits (jets « une seule chance », jets de groupe, aide aux autres, XP de fin de session, jets de réserve) → aucun développement.
Couverture recalculée : traité (AUTO + DONNEES + NARRATIF + HORS) = 379 + 168 = **547 / 853 (64 %)** ; reste **302** règles ouvertes (159 ABSENT + 143 PARTIEL) + 4 INCERTAIN. Liste à classer N / V1 / V2 : `work/matrice/completer-regles-absentes-partielles.md` (76 lignes rapprochées de décisions récentes par mots-clés, suggestion non décisionnelle). Décisions déjà prises qui en retirent une partie : modificateurs de tir et abris narratifs, 12 Talents narratifs, évasion de saisie narrative.
Chantiers V1 identifiés à ce jour : fenêtre de désignation des afflictions, Feu (à cadrer), Spécialiste en armement (livré), harmonisation graphique, DialogV2, baseline 1990→2088, commentaires « Amélioration d'arme », CSS weaponMod, relais joueur mêlée PNJ→PJ, audit des droits joueur, recette Foundry, installation/packaging, migration, documentation, retours de bugs, Bible v0.9.11.

## Arbitrage des 302 règles PARTIEL / ABSENT — décision (10/10/2026)
Verbatim : « Je valide toutes ces règles » ; précision demandée et choisie : **tout narratif, sauf les chantiers V1 déjà décidés**. → 280 règles classées NARRATIF (aucun développement) ; restent ouvertes 22 règles rattachées à deux chantiers V1 : **fenêtre de désignation des afflictions** (11 lignes) et **Feu** (11 lignes, à cadrer) — rattachement par mots-clés, à revérifier au cadrage — plus 4 INCERTAIN.
Couverture par classement : 547 + 280 = **827 / 853 (97 %)** ; reste 26 (22 V1 + 4 incertains). ATTENTION : ce pourcentage mesure le classement, pas l'automatisation (règles AUTO = 260 + 38 Spécialiste/Point faible/etc. corrigés depuis) ; classer PARTIEL en narratif n'en corrige pas les défauts. Défauts constatés par les audits qui ne relèvent pas de l'arbitrage MJ (à reprendre en correctifs si le porteur le souhaite) : bonus +5 du lance-roquette/mortier plafonné à 3 par le schéma ; jet de SURVIE de station forçable alors que le livre l'interdit ; malus de tenue antiémeute / casque intégral stockés mais jamais lus par les jets ; Niveau Supérieur des Talents non détecté hors voie Tir ; Brute précoché sans contrepartie.
Prochaine étape : cadrage de la fenêtre des afflictions et du Feu ; relais joueur mêlée PNJ→PJ ; recette Foundry ; installation ; migration ; documentation ; harmonisation graphique ; Bible v0.9.11.

## Cadrage — Fenêtre de répartition des afflictions (chantier V1) (10/10/2026)
**Règle du livre (p.177, p.190, p.199, p.205, p.210) :** les afflictions (« 1 ») ne s'activent que sur un jet FORCÉ ; les « 1 » des dés de Stress produisent une affliction même sur un jet non forcé. Chaque affliction doit être attribuée à : (a) 1 point de dégâts à l'attribut du jet ; (b) la jauge de sang-froid ; (c) l'équipement utilisé (réduit son bonus de 1 ; UNE seule affliction ; seulement si l'équipement a donné des dés ; la Fiabilité peut l'annuler) ; (d) un dé de Stress. L'aide d'autres PJ (conversion en Stress de l'aidant) est classée narrative. Talents Imperturbable / Mental d'acier / Nerfs d'acier / Résistance : ignorent 1 affliction. TIR forcé avec affliction : chargeur vide (règle p.205, à cadrer à part).
**Existant :** `resolveAfflictions` (`domain/rules/afflictions.mjs`) et `Actor.resolveRollAfflictions` complets et testés (répartition obligatoire = total disponible, équipement ≤ 1, validations) mais appelés par AUCUNE interface ; la carte de jet affiche seulement les compteurs (`yze-roll-chat.mjs`) ; le bouton « Finaliser » existe (`finalizeMessage`). Le chantier = fenêtre + câblage + résumé dans le chat.
**Écart à clarifier :** le porteur du projet décrit la fenêtre comme apparaissant « lorsque les joueurs subissent des dégâts à l'issue d'un combat » ; le livre déclenche la répartition à la finalisation d'un jet forcé (ou dé de Stress). Proposition : ouvrir la fenêtre à la finalisation du jet.

## Fenêtre de répartition des afflictions — livrée, non validée en Foundry (10/10/2026)
**Décisions du porteur du projet :** ouverture « après résoudre les dommages ou résoudre les éclats » ; fermeture sans répartir → tout en dégâts d'attribut ; résumé dans un message de chat séparé.
**Livré (2116 → 2173 tests, 0 échec, `node --check` OK) :** logique pure `domain/rules/affliction-allocation.mjs` ; fenêtre `foundry/afflictions/affliction-allocation-dialog.mjs` (DialogV2, compteur en direct, Confirmer actif si somme exacte, ligne Équipement absente si non autorisée, max 1) ; service `foundry/afflictions/afflictions-service.mjs` (`resolveAfflictionsForRoll`) ; `Actor.getAvailableAfflictions(result)` ; CSS fenêtre + carte de résumé. Câblage : jets génériques à la finalisation (`yze-roll-chat-hooks.mjs`), tir après « Résoudre les dégâts », mêlée après « Résoudre les dommages / effets » (`melee-attack-chat-hooks.mjs`, `resolveMeleeAttackAfflictions`). Idempotence par flag d'Actor `afflictionsResolved` (jamais d'écriture dans un ChatMessage ni dans le Combat). `adaptMeleeAttackContext` : le jet de mêlée stocke `context.attributeId` et l'arme dans `context.weapon` (pas `attribute`/`equipment`) — adapté sans toucher à `rollMeleeAttack`.
**Non câblé / à décider :** jet de blocage du défenseur (même particularité `attributeId`) ; chargeur vide sur TIR forcé avec affliction (p.205) ; aide d'autres PJ (narratif).
**À vérifier en Foundry :** DialogV2 (désactivation dynamique de Confirmer, compteur), rendu CSS (classes `protection-damage-allocation-*` réutilisées), timing mêlée après `refreshMessage`, speaker d'un Actor de jeton non lié, un jet forcé de chaque type (compétence, tir, mêlée) avec joueur puis MJ.

## Boutons d'attaque PNJ / Créature — livré, non validé en Foundry (10/10/2026)
**Constat du porteur du projet :** les fiches PNJ et Créature n'avaient aucun bouton d'attaque.
**Livré (2173 → 2179 tests, 0 échec ; `node --check` OK) :** règle pure `domain/rules/embedded-weapon-attack.mjs` (arme équipée mêlée → « Frapper », distance → « Tirer », désactivé si hors d'usage / sans munition compatible) ; `foundry/sheets/embedded-weapon-attack.mjs` (ViewModel, boutons, commutateur « équipée », mêmes services que la fiche Personnage : préparation + fenêtre de modificateurs + `rollRangedAttack`, workflow de mêlée + message) ; boutons sur `npc-sheet.hbs` et `creature-sheet.hbs`. `Actor.rollSkill` ouvert aux PNJ/Créatures (`_assertLivingActor`) ; Stress persisté seulement pour les Personnages (rollSkill et rollMeleeAttack).
**Limites assumées / à cadrer :** pas de Rafale ni d'Améliorations d'arme sur ces fiches ; l'option « Subir 1 Stress pour +3 » reste proposée dans la fenêtre mais est sans coût pour un PNJ (le Stress est réservé aux PJ) ; une arme doit être équipée (bouton main sur la fiche, ou case sur l'Item) ; les PNJ n'ont pas de fenêtre d'afflictions (réservée aux Personnages).
**À vérifier en Foundry :** tir et mêlée d'un PNJ puis d'une Créature (cible ciblée, Combat actif pour la mêlée), arme sans munition (bouton grisé), commutateur équipée.
**Correctif (10/10/2026, retour de test) :** mêlée d'une Créature → « L'arme du workflow est introuvable » : le Token étant non lié, l'Actor est synthétique et l'arme n'est pas retrouvée via game.actors. Le Token attaquant est maintenant transmis au workflow (`attackerToken`). À retester.
**Correctif 2 (10/10/2026, retour de test) :** mêlée d'une Créature, jet d'attaque → « nécessite un Actor de type character » (`getSkill`). Ouverts aux PNJ/Créatures (lecture seule) : `getSkill`, `getSkillAttribute`, `getSkillPool` ; `rollMeleeBlock` ouvert aux acteurs vivants (Stress éliminé persisté pour les Personnages seulement). Restent réservés aux Personnages : Push, Stress, Sang-froid, progression, ressources. À retester : attaque de mêlée Créature/PNJ jusqu'aux dégâts, blocage par un PNJ.

## Validations et afflictions du blocage (10/10/2026)
**Validé en Foundry par le porteur du projet :** fenêtre de répartition des afflictions (jets génériques, tir, mêlée) ; attaque de mêlée PNJ → PJ ; boutons d'attaque PNJ/Créature en mêlée (tests plus poussés en bêta-test).
**Livré, non validé :** jet de blocage du défenseur branché sur la fenêtre des afflictions (`resolveMeleeBlockAfflictions` dans `melee-attack-chat-hooks.mjs`, clé `melee-block:<combat>:<workflow>`, même instant que l'attaquant). Le blocage n'étant jamais forçable, seules les « 1 » des dés de Stress produisent des afflictions ; pas de ligne Équipement. Un PNJ défenseur n'ouvre aucune fenêtre (réservée aux Personnages). À vérifier : PJ avec Stress qui bloque, obtenir un « 1 » sur un dé de Stress.

## Relais joueur — mêlée PNJ→PJ (étapes du défenseur) — livré, non validé en Foundry (10/10/2026)
**Décision du porteur du projet :** périmètre « Décision + blocage ». Le joueur propriétaire du PJ défenseur choisit Bloquer / Encaisser, prépare et lance son blocage, répartit ses éclats de blocage. Le MJ continue de cliquer « Résoudre les dommages » (Protection, répartition d'armure, application).
**Livré (2179 → 2196 tests, 0 échec ; `node --check` OK) :** règle pure `domain/rules/melee-workflow-relay.mjs` (17 tests : propriétaire du défenseur obligatoire, pas de création par un joueur, identité/attaque/éclats/conséquences/Protection/application/métadonnées immuables, transitions d'état autorisées uniquement, cohérence réussites ↔ état, taille bornée) ; couche Foundry `combat/melee-workflow-relay.mjs` (demande « save » : le MJ actif écrit le flag du Combat après validation ; demande « refresh » : le MJ recalcule la carte depuis le workflow stocké, rien n'est repris du joueur) ; `MeleeAttackWorkflowService.save` relaie pour tout non-MJ ; `MeleeAttackChat.updateMessage` relaie pour un non-MJ non auteur ; enregistrement dans `system.mjs`.
**Limites assumées :** valeurs de dés non vérifiables par le MJ (comme les autres relais) ; sans MJ actif connecté, message clair « Aucun MJ actif » ; le jet physique (dés 3D) d'un joueur n'est pas rejoué sur la carte rafraîchie par le MJ. **Hors périmètre / à cadrer :** un joueur ATTAQUANT en mêlée (création du workflow, jet d'attaque, éclats, application des dommages sur l'acteur du PNJ) ; un joueur qui résout lui-même sa Protection / application finale (écritures sur l'acteur du PNJ : contre-attaque, désarmement, étourdissement).
**À vérifier en Foundry avec un compte JOUEUR (MJ connecté) :** PNJ attaque le PJ → le joueur voit les boutons Bloquer / Encaisser, clique, la carte se met à jour ; blocage : préparation, jet, éclats de blocage ; annulation de la préparation ; ordre des mises à jour (la carte reflète bien l'étape suivante) ; MJ déconnecté → message d'erreur lisible.

## Feu (p.203) — livré, non validé en Foundry (10/10/2026)
**Décisions du porteur du projet :** départ par une macro MJ (cibles + Intensité) ; une carte « en attente » par cible, lancée par le joueur (relais MJ) ; en combat, « attaque » du feu AUTOMATIQUE au début de chaque round (Intensité +1) ; extinction par bouton sur la carte (jet de RÉACTION) ; Brisé par le feu → simple avertissement « jet de Trépas requis » (jet lancé à la main).
**Livré (2196 → 2213 tests, 0 échec ; `node --check` OK) :** `domain/rules/fire.mjs` (statut `burning` « En feu », Intensité standard 8, normalisation 1-30, issue 1 dégât/réussite moins Protection, +1/round, extinction d'office sans dégât, Trépas si dégâts à VIGUEUR 0, extinction = ≥ 1 réussite) ; règle de relais `fireRoll` (dés = Intensité, réussites = nombre de 6, dégâts restants ≤ réussites, cohérence « brûle ») ; `foundry/fire/` (fenêtre de lancement, macro « Métro 2033 — Feu » accrochée à la barre du MJ, gérant du registre des effets récurrents pour `burning`) ; `foundry/chat/fire-roll-chat.mjs` + hooks (jet de N dés non forçable, `actor.rollProtection(…, {ignoreWornResilience:true})`, dégâts de VIGUEUR, statut + Intensité mémorisée en flag d'Actor, carte de round, extinction) ; l'état natif « burning » est renommé « En feu » (pas de doublon).
**Règles du livre non automatisées / limites :** dégradation de la Protection par le feu non appliquée (livre muet) ; hors combat le MJ rejoue la macro ou retire le statut ; un camarade au contact éteint le feu seulement si le MJ lance le jet en sélectionnant son Token (un joueur ne peut pas retirer un statut d'un autre personnage) ; un statut « En feu » posé à la main est traité comme Intensité 8 (première attaque automatique à 9) ; la progression d'un jet de RÉACTION d'extinction poussé n'est pas liée à l'extinction. **Hors périmètre / à cadrer :** lien avec les armes (lance-flammes, Intensité 10, explosion du réservoir, véhicules Intensité 9) ; le statut n'est pas listé dans l'onglet Survie de la fiche.
**À vérifier en Foundry :** macro MJ, carte joueur « Subir le feu » (relais), dégâts et Protection, icône du statut sur le Token, changement de round en combat (carte automatique, Intensité +1, extinction d'office), bouton d'extinction (joueur, puis MJ avec un camarade sélectionné), Brisé par le feu (avertissement).

## Installation / initialisation / mise à jour (10/10/2026)
**Constat :** les compendiums sont créés dans le monde par 14 commandes de console (`CONFIG.Metro2033.seed…`), idempotentes (clé `seedKey`) ; `packs/` est vide et `system.json` ne déclare aucun pack, ni URL de manifeste / téléchargement.
**Livré (2213 → 2219 tests ; `node --check` OK) :** `domain/rules/seed-sequence.mjs` (enchaînement ordonné, étape en échec n'arrête pas les autres, dépendances, rapport, besoin d'initialisation selon la version) ; `foundry/setup/initialize-system.mjs` (macro MJ « Métro 2033 — Initialiser le système », rapport en message privé, réglage monde `initializedVersion`, rappel permanent à la première installation et après toute mise à jour) ; `docs/guide-installation-utilisation.md` (installation manuelle, première ouverture, mise à jour, macros, combat, arbitrage MJ, signalement d'un problème, limites) ; `docs/recette-foundry.md`.
**Politique de migration retenue :** aucune migration de données tant que les modèles ne font qu'ajouter des champs avec valeur initiale (Foundry les applique) ; après mise à jour, relancer l'initialisation met les compendiums à jour sans toucher aux acteurs / items du monde. Un changement de structure non rétrocompatible exigera un script de migration dédié et une entrée de version.
**Décisions restantes pour le porteur du projet :** hébergement (URL du manifeste et de l'archive, ex. dépôt GitHub public) pour l'installation en un clic ; numéro de version à publier (`system.json` indique encore 0.1.0) ; licence / mention de non-affiliation à inscrire dans `system.json` ; compendiums livrés pré-construits dans l'archive (nécessite d'exporter les packs depuis Foundry) ou générés par la macro (état actuel).


## Chantier graphique — clôture (10/10/2026)
**Livré (CSS seul, 2219 tests inchangés) :** fiche Amélioration d'équipement (règles complètes, `metro-item-specialized.css`) ; fenêtre Feu ajoutée au cadre commun des fenêtres (`metro-base.css`) ; pied de fenêtre DialogV2 (`.form-footer`, boutons `data-action="cancel|confirm"`, balisage confirmé par inspection F12 du porteur) pour les 12 fenêtres lanceur/dialogue ; boutons Frapper/Tirer/équiper des fiches PNJ/Créature (état désactivé, bouton d'attaque distinct) ; liseré de la carte Feu ; harmonisation finale (`metro-items.css`) : étiquettes de champs Équipement/Armure, case « Réparable », listes d'améliorations attachées (Arme/Armure), lame empoisonnée, texte d'aide du Poison. **Retours visuels du porteur : OK** (lot précédent) ; le dernier lot d'harmonisation reste « livré, non validé ».
**Constaté sans action :** classes de fiches PNJ/Créature (`-attributes`, `-skill-list`, `-notes`…) et ~100 autres classes `metro-*` des gabarits sont de simples repères portés par des éléments déjà stylés ; fenêtre des afflictions déjà stylée via `protection-damage-allocation-*`.
