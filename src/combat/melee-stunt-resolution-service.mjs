/**
 * Résolution des conséquences produites
 * par les éclats d'une attaque de mêlée.
 *
 * Ce service est volontairement pur :
 *
 * - aucune modification d'Actor ;
 * - aucune modification de Combat ;
 * - aucun Active Effect ;
 * - aucun ChatMessage ;
 * - aucune persistance.
 *
 * Il transforme simplement un résultat
 * d'éclats déjà validé en un plan
 * de conséquences normalisé.
 */


/* ============================================================
 * UTILITAIRES
 * ============================================================ */


/**
 * Normalise une valeur numérique positive ou nulle.
 */
function normalizeNonNegativeInteger(
    value,
    label
) {

    const number =
        Number(
            value
            ?? 0
        );


    if (
        !Number.isInteger(number)
        || number < 0
    ) {

        throw new TypeError(
            `${label} doit être un entier positif ou nul.`
        );

    }


    return number;

}


/**
 * Normalise strictement un booléen métier.
 */
function normalizeBoolean(
    value
) {

    return value === true;

}


/* ============================================================
 * VALIDATION
 * ============================================================ */


/**
 * Vérifie qu'un résultat d'éclats
 * possède la structure minimale attendue.
 */
function assertStuntResult(
    stuntResult
) {

    if (
        !stuntResult
        || typeof stuntResult !== "object"
    ) {

        throw new TypeError(
            "Un résultat d'éclats valide est requis."
        );

    }


    if (
        !stuntResult.effects
        || typeof stuntResult.effects !== "object"
    ) {

        throw new TypeError(
            "Le résultat d'éclats ne contient aucun effet."
        );

    }


    return stuntResult;

}


/* ============================================================
 * SERVICE
 * ============================================================ */


export class MeleeStuntResolutionService {

    /**
     * Transforme un résultat d'éclats
     * en plan de conséquences.
     *
     * Le résultat retourné est volontairement
     * indépendant de Foundry et des Actors.
     */
    static resolve(
        stuntResult
    ) {

        assertStuntResult(
            stuntResult
        );


        const available =
            normalizeNonNegativeInteger(
                stuntResult.available,
                "Le nombre de réussites disponibles"
            );


        const spent =
            normalizeNonNegativeInteger(
                stuntResult.spent,
                "Le nombre de réussites dépensées"
            );


        const remaining =
            normalizeNonNegativeInteger(
                stuntResult.remaining,
                "Le nombre de réussites restantes"
            );


        if (
            spent > available
        ) {

            throw new Error(
                "Le nombre de réussites dépensées dépasse le nombre disponible."
            );

        }


        if (
            remaining
            !== available - spent
        ) {

            throw new Error(
                "Le nombre de réussites restantes est incohérent."
            );

        }


        const effects =
            stuntResult.effects;


        const vigorDamageBonus =
            normalizeNonNegativeInteger(
                effects.vigorDamage,
                "Le bonus de dégâts de Vigueur"
            );


        const agilityDamageBonus =
            normalizeNonNegativeInteger(
                effects.agilityDamage,
                "Le bonus de dégâts d'Agilité"
            );


        const consequencePlan = {

            /**
             * Traçabilité de la dépense.
             */
            successes: {

                available,

                spent,

                remaining

            },


            /**
             * Modificateurs de dégâts provenant
             * uniquement des éclats.
             *
             * IMPORTANT :
             *
             * ce ne sont PAS encore les dégâts finaux
             * de l'attaque.
             *
             * Les dégâts de base de l'arme,
             * la Protection et les autres règles
             * seront traités dans la couche suivante.
             */
            damage: {

                vigorBonus:
                    vigorDamageBonus,

                agilityBonus:
                    agilityDamageBonus

            },


            /**
             * Effets non directement numériques.
             *
             * Ils sont seulement déclarés ici.
             * Rien n'est encore appliqué.
             */
            effects: {

                swapInitiative:
                    normalizeBoolean(
                        effects.swapInitiative
                    ),

                disarm:
                    normalizeBoolean(
                        effects.disarm
                    ),

                knockdown:
                    normalizeBoolean(
                        effects.knockdown
                    ),

                grapple:
                    normalizeBoolean(
                        effects.grapple
                    )

            },


            /**
             * Copie normalisée des choix.
             *
             * Utile plus tard pour :
             *
             * - le résumé Chat ;
             * - l'audit du workflow ;
             * - l'explication détaillée
             *   des conséquences.
             */
            selections:
                Array.isArray(
                    stuntResult.selections
                )
                    ? stuntResult.selections.map(
                        selection => ({

                            key:
                                String(
                                    selection.key
                                    ?? ""
                                ),

                            quantity:
                                normalizeNonNegativeInteger(
                                    selection.quantity,
                                    "La quantité d'un éclat"
                                ),

                            cost:
                                normalizeNonNegativeInteger(
                                    selection.cost,
                                    "Le coût d'un éclat"
                                ),

                            spent:
                                normalizeNonNegativeInteger(
                                    selection.spent,
                                    "La dépense d'un éclat"
                                ),

                            parameters:
                                foundry.utils.deepClone(
                                    selection.parameters
                                    ?? {}
                                )

                        })
                    )
                    : []

        };


        return consequencePlan;

    }

}