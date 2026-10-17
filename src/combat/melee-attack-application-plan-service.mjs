/**
 * Construit le plan final d'application
 * d'une attaque de mêlée.
 *
 * Ce service ne modifie aucun Document Foundry.
 *
 * Il transforme :
 *
 * - les conséquences calculées de l'attaque ;
 * - le résultat éventuel de Protection ;
 *
 * en un plan explicite indiquant :
 *
 * - les dégâts finaux de Vigueur ;
 * - les dégâts d'Agilité ;
 * - la dégradation éventuelle de Protection ;
 * - les effets d'éclat restant à appliquer.
 */
export class MeleeAttackApplicationPlanService {


    static resolve({
        consequences,
        protection = null
    } = {}) {

        // ============================================================
        // 1. VALIDATION DES CONSÉQUENCES
        // ============================================================

        if (!consequences) {

            throw new TypeError(
                "Les conséquences de l'attaque sont requises."
            );

        }


        if (
            typeof consequences.hit
            !== "boolean"
        ) {

            throw new TypeError(
                "Le résultat des conséquences doit préciser si l'attaque touche."
            );

        }


        // ============================================================
        // 2. ÉCHEC DE L'ATTAQUE
        // ============================================================

        if (!consequences.hit) {

            return {

                hit:
                    false,

                damage: {

                    vigor:
                        0,

                    agility:
                        0

                },

                protection: {

                    required:
                        false,

                    resolved:
                        false,

                    incomingDamage:
                        0,

                    preventedDamage:
                        0,

                    remainingDamage:
                        0,

                    degradation: {

                        required:
                            false,

                        amount:
                            0,

                        requiresTargetChoice:
                            false,

                        availableTargets:
                            []

                    }

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


        // ============================================================
        // 3. DÉGÂTS AVANT PROTECTION
        // ============================================================

        const incomingVigorDamage =
            Number(
                consequences.damage
                    ?.vigor
                    ?.beforeProtection
                ?? 0
            );


        const agilityDamage =
            Number(
                consequences.damage
                    ?.agility
                    ?.total
                ?? 0
            );


        if (
            !Number.isInteger(
                incomingVigorDamage
            )
            || incomingVigorDamage < 0
        ) {

            throw new TypeError(
                "Les dégâts de Vigueur avant Protection sont invalides."
            );

        }


        if (
            !Number.isInteger(
                agilityDamage
            )
            || agilityDamage < 0
        ) {

            throw new TypeError(
                "Les dégâts d'Agilité sont invalides."
            );

        }


        // ============================================================
        // 4. PROTECTION NÉCESSAIRE ?
        // ============================================================

        const protectionRequired =
            consequences.protection
                ?.required
            === true;


        let finalVigorDamage =
            incomingVigorDamage;


        let preventedDamage =
            0;


        let protectionResolved =
            false;


        // ============================================================
        // 5. RÉSULTAT DE PROTECTION
        // ============================================================

        if (protectionRequired) {

            if (!protection) {

                throw new Error(
                    "Le résultat de Protection est requis avant de construire le plan d'application."
                );

            }


            if (
                !Number.isInteger(
                    protection.remainingDamage
                )
                || protection.remainingDamage < 0
            ) {

                throw new TypeError(
                    "Les dégâts restants après Protection sont invalides."
                );

            }


            if (
                !Number.isInteger(
                    protection.totalPrevented
                )
                || protection.totalPrevented < 0
            ) {

                throw new TypeError(
                    "Le nombre de dégâts empêchés par la Protection est invalide."
                );

            }


            if (
                protection.incomingDamage
                !== incomingVigorDamage
            ) {

                throw new Error(
                    "Le résultat de Protection ne correspond pas aux dégâts de Vigueur de cette attaque."
                );

            }


            finalVigorDamage =
                protection.remainingDamage;


            preventedDamage =
                protection.totalPrevented;


            protectionResolved =
                true;

        }


        // ============================================================
        // 6. DÉGRADATION DE LA PROTECTION
        // ============================================================

        const protectionDamage =
            Number(
                protection
                    ?.protectionDamage
                ?? 0
            );


        if (
            !Number.isInteger(
                protectionDamage
            )
            || protectionDamage < 0
        ) {

            throw new TypeError(
                "La dégradation de Protection est invalide."
            );

        }


        const source =
            protection?.source
            ?? null;


        const bodyArmorAvailable =
            source?.type === "worn"
            && source?.bodyArmor !== null
            && source?.bodyArmor !== undefined;


        const helmetAvailable =
            source?.type === "worn"
            && source?.helmet !== null
            && source?.helmet !== undefined;


        const availableTargets =
            [];


        if (bodyArmorAvailable) {

            availableTargets.push(
                "body"
            );

        }


        if (helmetAvailable) {

            availableTargets.push(
                "helmet"
            );

        }


        const degradationRequired =
            protectionDamage > 0
            && source?.type === "worn";


        const requiresTargetChoice =
            degradationRequired
            && availableTargets.length > 1;


        // ============================================================
        // 7. EFFETS D'ÉCLAT
        // ============================================================

        const effects = {

            swapInitiative:
                consequences.effects
                    ?.swapInitiative
                === true,

            disarm:
                consequences.effects
                    ?.disarm
                === true,

            knockdown:
                consequences.effects
                    ?.knockdown
                === true,

            grapple:
                consequences.effects
                    ?.grapple
                === true

        };


        // ============================================================
        // 8. PLAN FINAL
        // ============================================================

        return {

            hit:
                true,

            damage: {

                vigor:
                    finalVigorDamage,

                agility:
                    agilityDamage

            },

            protection: {

                required:
                    protectionRequired,

                resolved:
                    protectionResolved,

                incomingDamage:
                    incomingVigorDamage,

                preventedDamage,

                remainingDamage:
                    finalVigorDamage,

                degradation: {

                    required:
                        degradationRequired,

                    amount:
                        degradationRequired
                            ? protectionDamage
                            : 0,

                    requiresTargetChoice,

                    availableTargets

                }

            },

            effects

        };

    }

}