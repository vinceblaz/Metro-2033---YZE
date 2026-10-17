/**
 * Résolution pure de la consommation de munitions.
 *
 * Ce service ne modifie aucun Document Foundry.
 */

export const AMMUNITION_CONSUMPTION_MODES =
    Object.freeze({
        UNIT: "unit",
        CONTAINER: "container"
    });


export const AMMUNITION_CONSUMPTION_EVENTS =
    Object.freeze({
        SHOT: "shot",
        PUSH: "push"
    });


export function resolveAmmunitionConsumption({
    ammo,
    rollResult,
    event = "shot",
    burstFire = false,
    causedByPoorAmmunition = false
} = {}) {

    if (!ammo) {
        throw new TypeError(
            "resolveAmmunitionConsumption nécessite une munition."
        );
    }


    const consumptionMode =
        ammo.consumptionMode;


    if (
        consumptionMode !== "unit"
        && consumptionMode !== "container"
    ) {
        throw new Error(
            `Mode de consommation inconnu : ${consumptionMode}`
        );
    }


    if (
        event !== "shot"
        && event !== "push"
    ) {
        throw new Error(
            `Événement de consommation inconnu : ${event}`
        );
    }


    // ============================================================
    // CONSOMMATION UNITAIRE
    // ============================================================

    /*
     * Flèche, carreau, balle individuelle...
     *
     * Une unité est consommée UNE SEULE FOIS
     * lorsque le tir est effectué.
     *
     * Le Push ne consomme jamais une seconde unité.
     */
    if (
        consumptionMode === "unit"
    ) {

        if (
            event === "shot"
        ) {

            return {
                consume: true,
                amount: 1,
                reason: "shot"
            };

        }


        return {
            consume: false,
            amount: 0,
            reason: "unit-already-consumed"
        };

    }


    // ============================================================
    // CONTENEUR — TIR INITIAL
    // ============================================================

    /*
     * Un tir normal ne consomme pas de chargeur.
     *
     * Une rafale consomme un conteneur selon
     * la règle déjà utilisée dans le système.
     */
    if (
        event === "shot"
    ) {

        if (burstFire) {

            return {
                consume: true,
                amount: 1,
                reason: "burst-fire"
            };

        }


        return {
            consume: false,
            amount: 0,
            reason: "normal-shot"
        };

    }


    // ============================================================
    // CONTENEUR — PUSH
    // ============================================================

    /*
    * Une rafale a déjà consommé son conteneur
    * lors du tir initial.
    *
    * Le Push du même jet ne doit donc pas
    * en consommer un second.
    */
    if (
        rollResult?.context
            ?.attack
            ?.burstFire
        === true
    ) {

        return {
            consume: false,
            amount: 0,
            reason: "burst-already-consumed"
        };

    }


    if (!rollResult?.pushed) {

        return {
            consume: false,
            amount: 0,
            reason: "not-pushed"
        };

    }


    const normalAfflictions =
        rollResult.normalAfflictions
        ?? 0;


    if (
        normalAfflictions <= 0
    ) {

        return {
            consume: false,
            amount: 0,
            reason: "no-affliction"
        };

    }


    /*
     * Une affliction causée spécifiquement
     * par des munitions de mauvaise qualité
     * ne provoque pas ce rechargement.
     */
    if (causedByPoorAmmunition) {

        return {
            consume: false,
            amount: 0,
            reason: "poor-ammunition-affliction"
        };

    }


    return {
        consume: true,
        amount: 1,
        reason: "reload-affliction"
    };

}