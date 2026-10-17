export function resolveKnockdown({
    target
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


    const alreadyProne =
        target.system?.conditions?.prone
        === true;


    return {

        applied:
            !alreadyProne,

        targetId:
            target.id,

        targetName:
            target.name,

        previous:
            alreadyProne,

        current:
            true,

        alreadyProne,

        reason:
            alreadyProne
                ? "already-prone"
                : "knocked-down",

        /*
         * Le déplacement éventuel de la cible
         * sera traité séparément par la couche
         * Combat/Scene.
         */
        requiresPositionResolution:
            true

    };

}