import { ProtectionRoll }
    from "./protection-roll.mjs";

import { resolveCover }
    from "../rules/cover.mjs";


export class CoverRoll {

    static roll({
        value,
        incomingDamage,
        range = "short",
        totalCover = false,
        contactAllowed = true,
        protectionReduction = 0
    } = {}) {

        const cover =
            resolveCover({
                value,
                range,
                totalCover,
                contactAllowed,
                protectionReduction
            });


        /*
         * Aucun abri applicable.
         */
        if (!cover.applies) {

            return {
                source: {
                    type: "cover",
                    value: 0,
                    resilience: false,
                    degradable: false
                },

                cover,

                dice: [],

                successes: 0,
                ones: 0,

                incomingDamage,

                baseProtection:
                    cover.baseProtection,

                protectionReduction:
                    cover.protectionReduction,

                effectiveProtection: 0,

                protectionDamage: 0,

                resilienceIgnored: false,
                resiliencePrevented: 0,

                rawPrevented: 0,
                totalPrevented: 0,

                remainingDamage:
                    incomingDamage,

                canPush: false
            };

        }


        /*
         * resolveCover() a déjà déterminé
         * la Protection effectivement disponible.
         *
         * On transmet donc cette valeur comme
         * source au moteur générique.
         */
        const result =
            ProtectionRoll.roll(
                {
                    type: "cover",

                    value:
                        cover.effectiveProtection,

                    resilience:
                        false,

                    degradable:
                        false
                },
                {
                    incomingDamage
                }
            );


        return {
            ...result,

            cover,

            /*
             * On conserve les valeurs originales
             * de l'abri dans le résultat public.
             */
            baseProtection:
                cover.baseProtection,

            protectionReduction:
                cover.protectionReduction,

            effectiveProtection:
                cover.effectiveProtection
        };
    }

}