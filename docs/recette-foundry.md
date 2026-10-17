# Recette Foundry — Système Métro 2033 (V1)

Plan de test à dérouler dans un vrai monde Foundry v14. Chaque ligne est à cocher ; noter l'écart constaté (message d'erreur de la console F12 inclus) à côté de toute case non cochée.

## 0. Préparation

- [ ] Un monde de test dédié (ne pas tester dans la campagne).
- [ ] **Deux navigateurs** (ou un profil privé) : un connecté en **MJ**, un connecté en **joueur** propriétaire d'un Personnage. Le joueur ne doit PAS être MJ ni assistant MJ.
- [ ] Au moins : 1 Personnage joueur (avec armure équipée et dés de Stress), 1 PNJ armé (arme de mêlée équipée), 1 Créature (« Mains nues » équipée), 1 PNJ avec arme à distance chargée.
- [ ] Un Combat actif contenant tous ces acteurs, avec jetons sur la scène.
- [ ] Console F12 ouverte sur les deux navigateurs.

> Règle : tout ce qui est marqué **[JOUEUR]** se fait depuis le navigateur du joueur, avec le MJ connecté dans l'autre. Refaire les étapes marquées **[SANS MJ]** avec le MJ déconnecté : le message attendu est « Aucun MJ actif… ».

## 1. Boutons d'attaque PNJ / Créature (MJ)

- [ ] Fiche PNJ : l'icône main équipe / déséquipe l'arme ; sans équipement, aucun bouton Frapper/Tirer.
- [ ] Arme de mêlée équipée : « Frapper » visible ; cibler un jeton → l'attaque démarre (carte de mêlée).
- [ ] Même test avec la Créature (« Mains nues ») — jeton NON lié à l'acteur du monde.
- [ ] Arme à distance chargée : « Tirer » ouvre la fenêtre de modificateurs, le jet est publié. Sans munition compatible : bouton grisé.
- [ ] Aucune cible, ou deux cibles : message clair, rien ne se passe.

## 2. Mêlée PNJ → PJ avec un vrai joueur (relais) **[JOUEUR]**

- [ ] Le MJ lance l'attaque du PNJ sur le jeton du joueur. Le joueur voit « Bloquer » / « Encaisser » actifs ; le MJ aussi.
- [ ] **Encaisser** : la carte passe à l'étape suivante pour les deux navigateurs.
- [ ] **Bloquer** : préparation, jet de blocage, éclats de blocage proposés si réussite ; la carte se met à jour à chaque étape.
- [ ] Annuler la préparation du blocage : retour à Bloquer / Encaisser.
- [ ] Le MJ clique « Résoudre l'attaque » puis « Résoudre les dommages / effets » : dégâts appliqués au PJ.
- [ ] **[SANS MJ]** Le joueur clique Bloquer : message « Aucun MJ actif », rien d'enregistré.
- [ ] Console : aucune erreur de permission (« User lacks permission »).

## 3. Fenêtre des afflictions

- [ ] Jet de compétence **forcé** du joueur avec des « 1 » : la fenêtre de répartition s'ouvre à la finalisation ; la somme doit être exacte pour confirmer.
- [ ] Fermer sans répartir : tout part en dégâts d'attribut ; un message de résumé séparé est posté.
- [ ] Tir forcé, puis attaque de mêlée forcée : la fenêtre s'ouvre après « Résoudre les dégâts / dommages ».
- [ ] Jet de blocage avec dés de Stress contenant un « 1 » : fenêtre « Blocage » à la résolution des dommages.
- [ ] Une même résolution ne rouvre jamais la fenêtre (idempotence), même après rechargement de la page.
- [ ] Un PNJ qui attaque ou bloque n'ouvre jamais de fenêtre.

## 4. Feu

- [ ] La macro « Métro 2033 — Feu » est sur la barre du MJ ; la fenêtre propose les acteurs et l'Intensité (8).
- [ ] **[JOUEUR]** La carte « Feu » arrive ; « Subir le feu » lance les dés, applique Protection (sans résilience) et dégâts de Vigueur ; la carte se met à jour.
- [ ] Dégât restant > 0 : jeton avec le statut « En feu » ; sinon aucun statut.
- [ ] Combat : passer au round suivant → carte automatique d'Intensité +1 ; sans dégât, le feu s'éteint et le statut disparaît.
- [ ] Bouton « Tenter d'éteindre » : joueur sur lui-même ; MJ avec un camarade sélectionné ; une réussite retire le statut.
- [ ] Vigueur à 0 sous le feu : avertissement « jet de Trépas requis » sur la carte.
- [ ] **[SANS MJ]** « Subir le feu » refusé avant tout jet.

## 5. Brisé (sang-froid)

- [ ] Sang-froid du PJ = maximum → statut « Brisé » + message de chat ; en dessous du maximum → statut retiré.
- [ ] Maîtrise de soi : maximum 6 / 7 selon le niveau du talent.

## 6. Talents et armes

- [ ] « Spécialiste en armement » : choisir le type d'arme sur la fiche du talent ; le nom affiche le type ; bonus visible dans la préparation d'un tir avec une arme de ce type ; deux exemplaires pour le même type cumulent.
- [ ] « Point faible » : bonus avec une arme blanche (catégorie arme blanche).
- [ ] Station : jet de SURVIE → Esprit.

## 7. Cartes de survie existantes **[JOUEUR]**

- [ ] Terreur, Poison, Maladie, Asphyxie, Coup de grâce : la carte arrive, le joueur la résout, la carte se met à jour (relais).

## 8. Permissions joueur (balayage)

- [ ] Le joueur peut ouvrir et modifier sa propre fiche, mais pas celle d'un PNJ ni d'un autre PJ.
- [ ] Le joueur ne voit pas les notes MJ des PNJ / Créatures.
- [ ] Aucune erreur rouge en console pendant les sections 2 à 7.

## Résultats

Écarts à reporter : section, étape, message exact, capture de la console.
