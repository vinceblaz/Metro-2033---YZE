export const KNOCKDOWN_MODES =
    Object.freeze({
        PRONE: "prone",
        PUSH: "push"
    });


export function resolveKnockdownChoice({
    target,
    mode = null
} = {}) {

    if (!target) {

        throw new TypeError(
            "Une cible est nécessaire."
        );

    }


    if (!target.isLivingActor) {

        throw new Error(
            "La cible doit être un Actor vivant."
        );

    }


    if (!mode) {

        return {

            resolved: false,

            requiresChoice: true,

            targetId:
                target.id,

            targetName:
                target.name,

            availableModes: [
                KNOCKDOWN_MODES.PRONE,
                KNOCKDOWN_MODES.PUSH
            ],

            mode:
                null
        };

    }


    if (
        !Object.values(
            KNOCKDOWN_MODES
        ).includes(mode)
    ) {

        throw new Error(
            `Mode de résolution de knockdown inconnu : ${mode}.`
        );

    }


    if (
        mode ===
        KNOCKDOWN_MODES.PRONE
    ) {

        return {

            resolved: true,

            requiresChoice: false,

            mode:
                KNOCKDOWN_MODES.PRONE,

            targetId:
                target.id,

            targetName:
                target.name,

            applyProne:
                true,

            requiresTokenMovement:
                false
        };

    }


    return {

        resolved: true,

        requiresChoice: false,

        mode:
            KNOCKDOWN_MODES.PUSH,

        targetId:
            target.id,

        targetName:
            target.name,

        applyProne:
            false,

        /*
         * Le livre permet le repoussement,
         * mais nous ne fixons pas ici une
         * distance non explicitement déterminée.
         */
        requiresTokenMovement:
            true
    };

}