/**
 * Pont vers l'API Roll native de Foundry.
 *
 * Objectif : qu'un jet YZE ne soit plus un calcul interne
 * invisible (Math.random), mais déclenche un véritable jet
 * Foundry — visible dans le tchat, animé par Dice So Nice si
 * ce module est présent — dont les faces réellement obtenues
 * pilotent le résultat métier (succès/échecs), et non l'inverse.
 *
 * Ce module dépend intégralement de l'API Foundry (Roll,
 * game.dice3d, foundry.dice.terms.Die) : non testé
 * unitairement, par convention du projet.
 *
 * Un seul Roll Foundry est produit par appel, combinant dés
 * normaux et dés de Stress dans une même formule
 * ("Nd6 + Md6"), afin qu'un seul message de Chat porte
 * l'intégralité du jet.
 */


/*
 * Tentative de distinction visuelle des dés de Stress (rouge)
 * via Dice So Nice, si le module est présent.
 *
 * Non vérifiable depuis cet environnement de développement
 * (aucun accès à une instance Foundry réelle) : à confirmer
 * et au besoin ajuster une fois testé en jeu. Si l'appel
 * échoue ou si le préréglage "red" n'existe pas dans la
 * version de Dice So Nice installée, le jet reste pleinement
 * fonctionnel — seule la couleur distincte des dés de Stress
 * peut alors ne pas s'appliquer.
 */
const STRESS_DICE_SO_NICE_COLORSET =
    "red";


/**
 * Isole les termes Die d'un Roll déjà évalué,
 * dans leur ordre d'apparition dans la formule.
 */
function getDieTerms(
    roll
) {

    if (
        !roll
        || !Array.isArray(roll.terms)
    ) {

        return [];

    }


    return roll.terms.filter(
        term =>
            term
            instanceof foundry.dice.terms.Die
    );

}


/**
 * Applique, best-effort, un jeu de couleurs distinct
 * au dernier terme Die d'un Roll (par construction,
 * celui des dés de Stress — cf. buildFormula ci-dessous).
 */
function applyStressColorset(
    roll
) {

    const dieTerms =
        getDieTerms(
            roll
        );


    const stressTerm =
        dieTerms[
            dieTerms.length - 1
        ]
        ?? null;


    if (!stressTerm) {

        return;

    }


    try {

        stressTerm.options = {

            ...stressTerm.options,

            colorset:
                STRESS_DICE_SO_NICE_COLORSET,

            flavor:
                "Stress"

        };

    }
    catch (error) {

        console.warn(
            "Metro 2033 | Impossible de distinguer visuellement les dés de Stress (Dice So Nice).",
            error
        );

    }

}


/**
 * Construit la formule d'un Roll combinant dés normaux
 * et dés de Stress ("Nd6 + Md6"), en omettant les groupes
 * vides.
 */
function buildFormula(
    normalCount,
    stressCount
) {

    const parts = [];


    if (normalCount > 0) {

        parts.push(
            `${normalCount}d6`
        );

    }


    if (stressCount > 0) {

        parts.push(
            `${stressCount}d6`
        );

    }


    return parts.join(
        " + "
    );

}


/**
 * Lance un jet Foundry réel pour normalCount dés normaux
 * et stressCount dés de Stress, puis retourne :
 *
 * - roll : le Roll Foundry évalué (ou null si aucun dé
 *   n'était à lancer) ;
 * - values : les faces obtenues, dans l'ordre exact où
 *   elles devront être consommées par le moteur YZE
 *   (dés normaux d'abord, dés de Stress ensuite).
 *
 * Ne décide d'aucune règle métier : se contente de
 * produire les faces, à charge de l'appelant de les
 * transmettre à YZERoll via drawDie.
 *
 * ANIMATION — forceAnimation :
 *
 * Par défaut (forceAnimation = false), cette fonction
 * NE déclenche PAS elle-même l'animation Dice So Nice.
 * En effet, dès que le Roll retourné est attaché à un
 * ChatMessage via `rolls: [roll]` lors de sa CRÉATION
 * (cf. YZERollChat.createMessage), Dice So Nice anime
 * automatiquement ce message via son propre hook
 * createChatMessage — déclencher nous-mêmes l'animation
 * ici en plus produirait un double lancer visible (bug
 * constaté : les dés apparaissent lancés deux fois de
 * suite).
 *
 * forceAnimation = true est réservé aux cas où le Roll
 * ne sera PAS porté par un nouveau ChatMessage créé juste
 * après (ex. un Push, qui ajoute son Roll à un message
 * déjà existant via message.update() — une mise à jour
 * que Dice So Nice n'anime pas automatiquement) : il faut
 * alors déclencher l'animation nous-mêmes, une seule fois.
 */
export async function rollPhysicalDice({
    normal = 0,
    stress = 0,
    forceAnimation = false
} = {}) {

    const normalCount =
        Math.max(
            0,
            Number(normal) || 0
        );


    const stressCount =
        Math.max(
            0,
            Number(stress) || 0
        );


    const total =
        normalCount
        + stressCount;


    if (total <= 0) {

        return {

            roll:
                null,

            values:
                []

        };

    }


    const formula =
        buildFormula(
            normalCount,
            stressCount
        );


    const roll =
        new Roll(
            formula
        );


    await roll.evaluate();


    if (stressCount > 0) {

        applyStressColorset(
            roll
        );

    }


    if (forceAnimation && game.dice3d) {

        try {

            await game.dice3d.showForRoll(
                roll,
                game.user,
                true
            );

        }
        catch (error) {

            console.warn(
                "Metro 2033 | Échec de l'animation Dice So Nice, le jet reste valide.",
                error
            );

        }

    }


    const values =
        getDieTerms(roll)
            .flatMap(
                term =>
                    (term.results ?? [])
                        .map(
                            dieResult =>
                                dieResult.result
                        )
            );


    return {

        roll,

        values

    };

}


/**
 * Transforme un tableau de faces déjà tirées
 * en une fonction drawDie() consommée dans l'ordre,
 * telle qu'attendue par YZERoll.roll()/push().
 *
 * Lève une erreur explicite si le moteur YZE tente
 * de tirer plus de dés que le jet physique n'en a
 * réellement produit : signe d'une incohérence entre
 * le décompte préalable (countInitialDiceToRoll /
 * countPushDiceToRoll) et la résolution elle-même,
 * jamais une situation normale.
 */
export function createDieDrawer(
    values
) {

    const queue =
        [...values];


    return () => {

        if (queue.length === 0) {

            throw new Error(
                "Metro 2033 | Le jet Foundry n'a pas produit assez de dés pour la résolution demandée."
            );

        }


        return queue.shift();

    };

}
