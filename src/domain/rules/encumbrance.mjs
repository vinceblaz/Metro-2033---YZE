/**
 * Résout l'état d'encombrement d'un personnage.
 *
 * Règles Métro 2033 :
 *
 * - la capacité normale de transport vaut le double
 *   de la Vigueur (valeur de base, pas réduite par
 *   des dégâts) ;
 * - au-delà, le personnage est "trop encombré" ;
 * - la capacité absolue ne peut jamais dépasser
 *   quatre fois la Vigueur.
 *
 * Le poids de chaque objet (system.weight) représente déjà
 * le poids total de la pile qu'il incarne (par exemple, un
 * lot de munitions ou un consommable à plusieurs doses) :
 * cette règle se contente donc d'additionner ces poids,
 * sans tenir compte d'une quantité séparée.
 */
export function resolveEncumbrance({
    vigor,
    items = []
} = {}) {

    if (
        !Number.isInteger(vigor)
        || vigor < 1
    ) {
        throw new TypeError(
            "La Vigueur doit être un entier strictement positif."
        );
    }


    if (!Array.isArray(items)) {

        throw new TypeError(
            "La liste d'objets doit être un tableau."
        );

    }


    const totalWeight =
        items.reduce(
            (sum, item) => {

                const weight =
                    item?.weight
                    ?? 0;


                if (
                    typeof weight !== "number"
                    || !Number.isFinite(weight)
                    || weight < 0
                ) {

                    throw new TypeError(
                        "Le poids d'un objet doit être un nombre positif ou nul."
                    );

                }


                return sum + weight;

            },
            0
        );


    const capacity =
        vigor * 2;

    const criticalCapacity =
        vigor * 4;


    const overloaded =
        totalWeight > capacity;

    const criticallyOverloaded =
        totalWeight > criticalCapacity;


    return {

        vigor,

        totalWeight,

        capacity,

        criticalCapacity,

        remaining:
            Math.max(
                0,
                capacity - totalWeight
            ),

        excess:
            Math.max(
                0,
                totalWeight - capacity
            ),

        overloaded,

        criticallyOverloaded

    };

}
