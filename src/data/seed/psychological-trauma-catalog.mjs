/**
 * Table des Traumatismes psychologiques (livre de règles,
 * p.203, chapitre 8 « Les règles »).
 *
 * Jet de D66 (deux D6, dizaines puis unités) effectué lorsque
 * l'ESPRIT d'un personnage tombe à 0 (état Brisé).
 *
 * Colonnes du livre → champs de `PsychologicalTraumaDataModel` :
 * - D66          → d66.min / d66.max (plusieurs résultats
 *                  couvrent souvent un même traumatisme, ex.
 *                  11-16 Tremblements)
 * - TRAUMATISME  → name (porté par Item.name)
 * - EFFET        → effect
 * - PÉRIODE      → recoveryFormula (formule de D6 à lancer pour
 *                  déterminer la durée de rémission), ou
 *                  permanent = true pour les traumatismes
 *                  marqués "Permanent."
 *
 * Seul le résultat 66 (Infarctus) tue instantanément
 * (instantDeath = true) : contrairement aux Blessures
 * critiques fatales, il n'existe ici aucun jet de Trépas.
 */

export const PSYCHOLOGICAL_TRAUMAS = [

    { min: 11, max: 16, name: "Tremblements", effect: "Modificateur de –1 à tous les jets d'Agilité.", recoveryFormula: "1d6", permanent: false, instantDeath: false },
    { min: 21, max: 21, name: "Cheveux blancs", effect: "Aucun.", recoveryFormula: "", permanent: true, instantDeath: false },
    { min: 22, max: 24, name: "Anxiété", effect: "Modificateur de –1 à tous les jets d'Esprit.", recoveryFormula: "1d6", permanent: false, instantDeath: false },
    { min: 25, max: 31, name: "Dépression", effect: "Modificateur de –1 à tous les jets d'Empathie.", recoveryFormula: "1d6", permanent: false, instantDeath: false },
    { min: 32, max: 35, name: "Cauchemars", effect: "Faites un jet d'Analyse lors de chaque quart passé à dormir. En cas d'échec, cette phase de repos n'a aucun effet.", recoveryFormula: "1d6", permanent: false, instantDeath: false },
    { min: 36, max: 41, name: "Nocturne", effect: "Vous ne pouvez dormir que lorsqu'il fait jour.", recoveryFormula: "2d6", permanent: false, instantDeath: false },
    { min: 42, max: 43, name: "Phobie", effect: "Vous êtes terrifié par la chose qui vous a Brisé. Le MJ décide de ce dont il s'agit. Vous subissez 1 point de dégâts à l'Esprit chaque round passé à courte portée de l'objet de votre phobie.", recoveryFormula: "2d6", permanent: false, instantDeath: false },
    { min: 44, max: 45, name: "Alcoolisme", effect: "Vous devez consommer de l'alcool quotidiennement ou subir 1 point de dégâts à l'Agilité.", recoveryFormula: "3d6", permanent: false, instantDeath: false },
    { min: 46, max: 51, name: "Claustrophobie", effect: "À chaque tour passé dans un environnement confiné, vous subissez 1 point de dégâts à l'Esprit.", recoveryFormula: "2d6", permanent: false, instantDeath: false },
    { min: 52, max: 52, name: "Mythomanie", effect: "Vous ne pouvez pas vous empêcher de mentir. Sur tout. Cet effet doit être interprété.", recoveryFormula: "2d6", permanent: false, instantDeath: false },
    { min: 53, max: 54, name: "Paranoïa", effect: "Vous êtes persuadé que quelqu'un vous en veut. Cet effet doit être interprété.", recoveryFormula: "2d6", permanent: false, instantDeath: false },
    { min: 55, max: 55, name: "Délire", effect: "Vous êtes tout à fait convaincu de quelque chose qui est totalement faux, comme le fait qu'un objet ou une couleur n'existe pas.", recoveryFormula: "3d6", permanent: false, instantDeath: false },
    { min: 56, max: 56, name: "Hallucinations", effect: "Faites un jet d'Analyse à chaque quart. Si vous échouez, vous souffrez d'une violente hallucination. Le MJ en détermine la nature.", recoveryFormula: "3d6", permanent: false, instantDeath: false },
    { min: 61, max: 62, name: "Personnalité altérée", effect: "Votre personnalité est profondément modifiée. Déterminez de quelle façon avec le MJ. Cet effet doit être interprété.", recoveryFormula: "", permanent: true, instantDeath: false },
    { min: 63, max: 63, name: "Amnésie", effect: "Vous perdez totalement la mémoire et ne savez plus qui vous êtes (ni qui sont les autres). Cet effet doit être interprété.", recoveryFormula: "1d6", permanent: false, instantDeath: false },
    { min: 64, max: 65, name: "Catatonie", effect: "Les yeux hagards, vous fixez le vide et ne réagissez à aucun stimulus.", recoveryFormula: "1d6", permanent: false, instantDeath: false },
    { min: 66, max: 66, name: "Infarctus", effect: "Votre cœur s'arrête. Vous mourrez de pure terreur.", recoveryFormula: "", permanent: false, instantDeath: true }

];
