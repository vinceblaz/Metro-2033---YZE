import {
    resolveMeleeAttackDamage
} from "../domain/rules/melee-attack-damage.mjs";


/* ============================================================
 * UTILITAIRES
 * ============================================================ */


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


function normalizeBoolean(
    value
) {

    return value === true;

}


/* ============================================================
 * SERVICE
 * ============================================================ */


/**
 * Construit le plan complet de conséquences
 * d'une attaque de mêlée.
 *
 * Ce service reste volontairement pur :
 *
 * - aucune modification d'Actor ;
 * - aucun jet de Protection ;
 * - aucune modification d'initiative ;
 * - aucun désarmement réel ;
 * - aucun état appliqué ;
 * - aucun agrippement créé.
 *
 * Il décrit uniquement ce qui devra être résolu.
 */
export class MeleeAttackConsequenceService {


    static resolve({

        outcome,

        weaponDamage = 0,

        stuntConsequences = null

    } = {}) {

        if (
            !outcome
            || typeof outcome !== "object"
        ) {

            throw new TypeError(
                "Un résultat d'opposition de mêlée est requis."
            );

        }


        if (
            typeof outcome.hit !== "boolean"
        ) {

            throw new TypeError(
                "outcome.hit doit être un booléen."
            );

        }


        const normalizedWeaponDamage =
            normalizeNonNegativeInteger(
                weaponDamage,
                "Les dégâts de l'arme"
            );


        const vigorBonus =
            normalizeNonNegativeInteger(
                stuntConsequences
                    ?.damage
                    ?.vigorBonus
                ?? 0,
                "Le bonus de dégâts de Vigueur"
            );


        const agilityBonus =
            normalizeNonNegativeInteger(
                stuntConsequences
                    ?.damage
                    ?.agilityBonus
                ?? 0,
                "Le bonus de dégâts d'Agilité"
            );


        /*
         * On délègue la formule des dégâts
         * à la règle métier existante.
         */
        const damage =
            resolveMeleeAttackDamage({

                hit:
                    outcome.hit,

                weaponDamage:
                    normalizedWeaponDamage,

                bonusVigorDamage:
                    vigorBonus,

                bonusAgilityDamage:
                    agilityBonus

            });


        /*
         * Les effets d'éclat restent séparés
         * des dégâts.
         *
         * Ils devront pouvoir être appliqués
         * même si la Protection absorbe
         * tous les dégâts de Vigueur.
         */
        const effects = {

            swapInitiative:
                normalizeBoolean(
                    stuntConsequences
                        ?.effects
                        ?.swapInitiative
                ),

            disarm:
                normalizeBoolean(
                    stuntConsequences
                        ?.effects
                        ?.disarm
                ),

            knockdown:
                normalizeBoolean(
                    stuntConsequences
                        ?.effects
                        ?.knockdown
                ),

            grapple:
                normalizeBoolean(
                    stuntConsequences
                        ?.effects
                        ?.grapple
                )

        };


        /*
         * Une attaque ratée ne doit produire
         * aucun effet d'éclat.
         *
         * Normalement aucun éclat ne devrait
         * pouvoir exister sur une attaque ratée,
         * mais cette sécurité évite de propager
         * un état incohérent.
         */
        if (!outcome.hit) {

            return {

                hit:
                    false,

                outcome: {

                    attackSuccesses:
                        normalizeNonNegativeInteger(
                            outcome.attackSuccesses,
                            "Les réussites d'attaque"
                        ),

                    blockSuccesses:
                        normalizeNonNegativeInteger(
                            outcome.blockSuccesses,
                            "Les réussites de blocage"
                        ),

                    cancelledSuccesses:
                        normalizeNonNegativeInteger(
                            outcome.cancelledSuccesses,
                            "Les réussites annulées"
                        ),

                    netSuccesses:
                        normalizeNonNegativeInteger(
                            outcome.netSuccesses
                            ?? outcome.effectiveSuccesses,
                            "Les réussites nettes"
                        ),

                    extraSuccesses:
                        0

                },

                damage: {

                    weapon:
                        0,

                    vigor: {

                        base:
                            0,

                        stuntBonus:
                            0,

                        beforeProtection:
                            0

                    },

                    agility: {

                        stuntBonus:
                            0,

                        total:
                            0

                    }

                },

                protection: {

                    required:
                        false,

                    incomingVigorDamage:
                        0

                },

                effects: {

                    swapInitiative:
                        false,

                    disarm:
                        false,

                    knockdown:
                        false,

                    grapple:
                        false

                }

            };

        }


        const vigorDamage =
            normalizeNonNegativeInteger(
                damage.vigorDamage,
                "Les dégâts de Vigueur"
            );


        const agilityDamage =
            normalizeNonNegativeInteger(
                damage.agilityDamage,
                "Les dégâts d'Agilité"
            );


        return {

            hit:
                true,


            /*
             * Conservation du résultat
             * de l'opposition pour traçabilité.
             */
            outcome: {

                attackSuccesses:
                    normalizeNonNegativeInteger(
                        outcome.attackSuccesses,
                        "Les réussites d'attaque"
                    ),

                blockSuccesses:
                    normalizeNonNegativeInteger(
                        outcome.blockSuccesses,
                        "Les réussites de blocage"
                    ),

                cancelledSuccesses:
                    normalizeNonNegativeInteger(
                        outcome.cancelledSuccesses,
                        "Les réussites annulées"
                    ),

                netSuccesses:
                    normalizeNonNegativeInteger(
                        outcome.netSuccesses
                        ?? outcome.effectiveSuccesses,
                        "Les réussites nettes"
                    ),

                extraSuccesses:
                    normalizeNonNegativeInteger(
                        outcome.extraSuccesses,
                        "Les réussites supplémentaires"
                    )

            },


            /*
             * Dégâts AVANT Protection.
             */
            damage: {

                weapon:
                    damage.weaponDamage,

                vigor: {

                    base:
                        damage.weaponDamage,

                    stuntBonus:
                        damage.bonusVigorDamage,

                    beforeProtection:
                        vigorDamage

                },

                agility: {

                    stuntBonus:
                        damage.bonusAgilityDamage,

                    total:
                        agilityDamage

                }

            },


            /*
             * La Protection ne sera pas lancée ici.
             *
             * Cette partie indique seulement
             * ce qu'il faudra lui soumettre.
             */
            protection: {

                required:
                    vigorDamage > 0,

                incomingVigorDamage:
                    vigorDamage

            },


            /*
             * Effets non numériques.
             *
             * Ils ne sont pas encore appliqués.
             */
            effects

        };

    }

}