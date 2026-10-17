export class ProtectionRoll {

    static roll(
        source,
        {
            incomingDamage = 0,
            protectionReduction = 0,
            ignoreWornResilience = false
        } = {}
    ) {

        if (!source) {
            throw new TypeError(
                "ProtectionRoll nécessite une source de Protection."
            );
        }


        if (
            !Number.isInteger(source.value)
            || source.value < 0
        ) {
            throw new TypeError(
                "La valeur de Protection doit être un entier positif ou nul."
            );
        }


        if (
            !Number.isInteger(incomingDamage)
            || incomingDamage < 0
        ) {
            throw new TypeError(
                "Les dégâts entrants doivent être un entier positif ou nul."
            );
        }


        if (
            !Number.isInteger(protectionReduction)
            || protectionReduction < 0
        ) {
            throw new TypeError(
                "La réduction de Protection doit être un entier positif ou nul."
            );
        }


        // ========================================================
        // PROTECTION EFFECTIVE
        // ========================================================

        /*
         * Les réductions de Protection provenant notamment
         * des munitions militaires ne s'appliquent actuellement
         * qu'aux protections portées.
         *
         * La Protection naturelle des créatures n'est pas affectée.
         * ou si cible derrière un abri
         */
        const reductionApplies =
            source.type === "worn"
            || source.type === "cover";


        const effectiveReduction =
            reductionApplies
                ? protectionReduction
                : 0;


        const effectiveProtection =
            Math.max(
                0,
                source.value - effectiveReduction
            );


        // ========================================================
        // JET DE PROTECTION
        // ========================================================

        const dice =
            this.#rollDice(
                effectiveProtection
            );


        const successes =
            dice.filter(
                value => value === 6
            ).length;


        const ones =
            dice.filter(
                value => value === 1
            ).length;


        // ========================================================
        // DÉGRADATION
        // ========================================================

        /*
         * Les protections portées sont dégradables.
         * La Protection naturelle ne l'est pas.
         */
        const protectionDamage =
            source.degradable
                ? ones
                : 0;


        // ========================================================
        // RÉSILIENCE
        // ========================================================

        /*
         * L'annulation de Résilience fournie par les munitions
         * militaires ne concerne pas la Résilience naturelle.
         */
        const resilienceIgnored =
            (
                source.type === "worn"
                && ignoreWornResilience
            );


        const resiliencePrevented =
            (
                source.resilience
                && effectiveProtection > 0
                && !resilienceIgnored
            )
                ? 1
                : 0;


        // ========================================================
        // DÉGÂTS ARRÊTÉS
        // ========================================================

        const rawPrevented =
            successes
            + resiliencePrevented;


        const totalPrevented =
            Math.min(
                incomingDamage,
                rawPrevented
            );


        const remainingDamage =
            Math.max(
                0,
                incomingDamage - totalPrevented
            );


        // ========================================================
        // RÉSULTAT
        // ========================================================

        return {

            source: {
                ...source
            },

            dice,

            successes,

            ones,

            incomingDamage,

            baseProtection:
                source.value,

            protectionReduction:
                effectiveReduction,

            effectiveProtection,

            protectionDamage,

            resilienceIgnored,

            resiliencePrevented,

            rawPrevented,

            totalPrevented,

            remainingDamage,

            canPush:
                false

        };

    }


    // ============================================================
    // DÉS
    // ============================================================

    static #rollDice(count) {

        const dice = [];


        for (
            let index = 0;
            index < count;
            index += 1
        ) {

            dice.push(
                Math.floor(
                    Math.random() * 6
                ) + 1
            );

        }


        return dice;

    }

}