/**
 * Résolution de la Fiabilité d'un équipement.
 *
 * Ce jet :
 * - utilise uniquement la Fiabilité ;
 * - réussit sur au moins un 6 ;
 * - ne peut pas être forcé ;
 * - ne produit pas lui-même d'affliction.
 */
export function rollReliability(reliability = 0) {

    if (
        !Number.isInteger(reliability)
        || reliability < 0
    ) {
        throw new TypeError(
            "La Fiabilité doit être un entier positif ou nul."
        );
    }


    const dice = [];


    for (
        let index = 0;
        index < reliability;
        index++
    ) {

        dice.push(
            Math.floor(
                Math.random() * 6
            ) + 1
        );

    }


    const successes =
        dice.filter(
            value => value === 6
        ).length;


    return {

        reliability,

        dice,

        successes,

        success:
            successes > 0

    };

}