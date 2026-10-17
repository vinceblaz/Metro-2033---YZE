/**
 * Table des Blessures critiques (livre de règles, p.202,
 * chapitre 8 « Les règles »).
 *
 * Jet de D66 (deux D6, dizaines puis unités) effectué lorsque
 * la VIGUEUR d'un personnage tombe à 0 (état Brisé).
 *
 * Colonnes du livre → champs de `CriticalInjuryDataModel` :
 * - D66      → d66
 * - BLESSURE → name (porté par Item.name)
 * - FATALE   → fatal (+ deathRollModifier pour les « Oui (-1) »,
 *              « Oui (-2) »)
 * - TEMPS    → deathRollInterval (délai entre deux jets de
 *              Trépas ; chaîne libre reprenant le terme exact
 *              du livre : "Round", "Quart", "Tour", "Journée")
 * - EFFET    → effect
 * - PÉRIODE  → recoveryFormula (formule de D6 à lancer pour
 *              déterminer la durée de rémission), ou
 *              permanent = true pour les blessures marquées
 *              "Permanent."
 *
 * Les résultats 63, 64, 65 et 66 tuent instantanément
 * (instantDeath = true) : aucun jet de Trépas n'est nécessaire.
 *
 * Cas particulier du résultat 56 (Colonne vertébrale
 * fracturée) : le livre indique que l'effet (paralysie sous le
 * cou) devient permanent si aucun soin n'est prodigué dans le
 * délai de rémission (6D6 jours). Cette nuance conditionnelle
 * n'est pas modélisée par un champ dédié ; elle reste donc
 * uniquement décrite dans `effect`, à charge du MJ de la gérer
 * manuellement le moment venu.
 */

export const CRITICAL_INJURIES = [

    { d66: 11, name: "Essoufflé", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Aucun.", recoveryFormula: "", permanent: false, instantDeath: false },
    { d66: 12, name: "Étourdi", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Aucun.", recoveryFormula: "", permanent: false, instantDeath: false },
    { d66: 13, name: "Douleur fulgurante", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Aucun.", recoveryFormula: "", permanent: false, instantDeath: false },
    { d66: 14, name: "Cheville foulée", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Réaction –2 et ne peut pas courir avant qu'un jet de Soins n'ait été réussi.", recoveryFormula: "", permanent: false, instantDeath: false },
    { d66: 15, name: "Sang dans les yeux", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Observation et Tir –2 jusqu'à ce qu'un jet de Soins n'ait été réussi.", recoveryFormula: "", permanent: false, instantDeath: false },
    { d66: 16, name: "Commotion cérébrale", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Réaction –2. Si la cible porte un casque, le résultat peut devenir #12.", recoveryFormula: "1d6", permanent: false, instantDeath: false },

    { d66: 21, name: "Oreille coupée", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Observation –2.", recoveryFormula: "1d6", permanent: false, instantDeath: false },
    { d66: 22, name: "Orteil cassé", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Courir devient une action lente.", recoveryFormula: "1d6", permanent: false, instantDeath: false },
    { d66: 23, name: "Main cassée", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Ne peut pas utiliser cette main.", recoveryFormula: "1d6", permanent: false, instantDeath: false },
    { d66: 24, name: "Dents cassées", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Manipulation –2.", recoveryFormula: "1d6", permanent: false, instantDeath: false },
    { d66: 25, name: "Cuisse transpercée", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Courir devient une action lente.", recoveryFormula: "2d6", permanent: false, instantDeath: false },
    { d66: 26, name: "Épaule entaillée", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Ce bras est inutilisable.", recoveryFormula: "1d6", permanent: false, instantDeath: false },

    { d66: 31, name: "Nez cassé", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Manipulation et Observation –1.", recoveryFormula: "1d6", permanent: false, instantDeath: false },
    { d66: 32, name: "Coup dans l'entrejambe", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "1 point de dégât à chaque jet de Réaction ou de Corps à corps effectué.", recoveryFormula: "1d6", permanent: false, instantDeath: false },
    { d66: 33, name: "Côtes cassées", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Réaction et Observation –1.", recoveryFormula: "2d6", permanent: false, instantDeath: false },
    { d66: 34, name: "Œil crevé", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Tir et Réaction –2.", recoveryFormula: "2d6", permanent: false, instantDeath: false },
    { d66: 35, name: "Genou cassé", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Ne peut plus courir, peut juste ramper.", recoveryFormula: "2d6", permanent: false, instantDeath: false },
    { d66: 36, name: "Bras cassé", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Ce bras est inutilisable.", recoveryFormula: "2d6", permanent: false, instantDeath: false },

    { d66: 41, name: "Jambe cassée", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Ne peut plus courir, peut juste ramper.", recoveryFormula: "2d6", permanent: false, instantDeath: false },
    { d66: 42, name: "Pied écrasé", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Ne peut plus courir, peut juste ramper.", recoveryFormula: "3d6", permanent: false, instantDeath: false },
    { d66: 43, name: "Coude broyé", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Ce bras est inutilisable.", recoveryFormula: "3d6", permanent: false, instantDeath: false },
    { d66: 44, name: "Poumon perforé", fatal: true, deathRollModifier: 0, deathRollInterval: "Journée", effect: "Endurance et Réaction –2.", recoveryFormula: "1d6", permanent: false, instantDeath: false },
    { d66: 45, name: "Hémorragie abdominale", fatal: true, deathRollModifier: 0, deathRollInterval: "Quart", effect: "1 point de dégât à chaque jet de Réaction ou de Corps à corps effectué.", recoveryFormula: "1d6", permanent: false, instantDeath: false },
    { d66: 46, name: "Intestins perforés", fatal: true, deathRollModifier: 0, deathRollInterval: "Quart", effect: "Maladie de Virulence 6.", recoveryFormula: "2d6", permanent: false, instantDeath: false },

    { d66: 51, name: "Rein écrasé", fatal: true, deathRollModifier: 0, deathRollInterval: "Journée", effect: "Ne peut plus courir, peut juste ramper ; Réaction –2.", recoveryFormula: "2d6", permanent: false, instantDeath: false },
    { d66: 52, name: "Artère brachiale ouverte", fatal: true, deathRollModifier: -1, deathRollInterval: "Tour", effect: "Ce bras est inutilisable.", recoveryFormula: "1d6", permanent: false, instantDeath: false },
    { d66: 53, name: "Artère fémorale ouverte", fatal: true, deathRollModifier: -1, deathRollInterval: "Tour", effect: "Courir devient une action lente.", recoveryFormula: "1d6", permanent: false, instantDeath: false },
    { d66: 54, name: "Bras sectionné", fatal: true, deathRollModifier: -1, deathRollInterval: "Quart", effect: "Ce bras est inutilisable.", recoveryFormula: "", permanent: true, instantDeath: false },
    { d66: 55, name: "Jambe sectionnée", fatal: true, deathRollModifier: -1, deathRollInterval: "Quart", effect: "Ne peut plus courir, peut juste ramper.", recoveryFormula: "", permanent: true, instantDeath: false },
    { d66: 56, name: "Colonne vertébrale fracturée", fatal: false, deathRollModifier: 0, deathRollInterval: "", effect: "Paralysé sous le cou. Sans soins effectués dans les temps, l'effet devient permanent.", recoveryFormula: "6d6", permanent: false, instantDeath: false },

    { d66: 61, name: "Jugulaire ouverte", fatal: true, deathRollModifier: -1, deathRollInterval: "Round", effect: "Endurance –1.", recoveryFormula: "2d6", permanent: false, instantDeath: false },
    { d66: 62, name: "Aorte ouverte", fatal: true, deathRollModifier: -2, deathRollInterval: "Round", effect: "Endurance –2.", recoveryFormula: "3d6", permanent: false, instantDeath: false },
    { d66: 63, name: "Éventré", fatal: true, deathRollModifier: 0, deathRollInterval: "", effect: "Mort instantanée.", recoveryFormula: "", permanent: false, instantDeath: true },
    { d66: 64, name: "Crâne broyé", fatal: true, deathRollModifier: 0, deathRollInterval: "", effect: "Vos aventures s'arrêtent là. Si la cible porte un casque, le résultat peut devenir #12.", recoveryFormula: "", permanent: false, instantDeath: true },
    { d66: 65, name: "Cœur perforé", fatal: true, deathRollModifier: 0, deathRollInterval: "", effect: "Vous périssez sur le coup.", recoveryFormula: "", permanent: false, instantDeath: true },
    { d66: 66, name: "Cœur empalé", fatal: true, deathRollModifier: 0, deathRollInterval: "", effect: "Votre cœur a battu pour la dernière fois.", recoveryFormula: "", permanent: false, instantDeath: true }

];
