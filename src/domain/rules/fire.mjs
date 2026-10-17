/**
 * Le Feu (livre de règles, p.203).
 *
 * « La puissance d'un feu se mesure par son Intensité. Un feu
 * standard a une Intensité de 8. Lorsque vous êtes exposé au feu,
 * jetez un nombre de dés égal à son Intensité. Pour chaque
 * réussite, vous subissez 1 point de dégâts à la VIGUEUR (ce jet
 * ne peut pas être forcé). Les protections peuvent réduire ces
 * dégâts, mais l'éventuelle résilience des protections ne
 * compte pas.
 *
 * Si vous subissez des dégâts, vous prenez feu, continuez à
 * brûler et subissez une nouvelle « attaque » du feu au début de
 * chaque nouveau round. L'Intensité augmente de 1 par round. Dès
 * qu'une attaque de feu n'inflige plus de dégâts, le feu
 * s'éteint de lui-même. Vous (ou un camarade situé au contact)
 * pouvez éteindre le feu avec un jet réussi de RÉACTION (action
 * lente).
 *
 * Si vous êtes Brisé par des dégâts de feu, ou que vous souffrez
 * de dégâts de feu alors que vous êtes déjà Brisé, vous devez
 * faire un jet de Trépas chaque round [...] »
 *
 * Module PUR (aucune dépendance à Foundry). Les jets de dés, la
 * Protection et l'application des dégâts sont dans la couche
 * Foundry (foundry/chat/fire-roll-chat.mjs).
 */

/**
 * État Foundry posé sur un Actor qui brûle. L'identifiant est
 * celui de l'état natif de Foundry (« burning ») : le système ne
 * fait que le renommer en français.
 */
export const FIRE_STATUS_EFFECT = Object.freeze({
    id: "burning",
    name: "En feu",
    img: "icons/svg/fire.svg"
});

export const FIRE_STANDARD_INTENSITY = 8;

/**
 * Garde-fou de saisie (nombre de dés lancés), pas une règle du
 * livre.
 */
export const FIRE_MAX_INTENSITY = 30;


/**
 * Intensité saisie -> entier de 1 au maximum de saisie.
 *
 * @throws {TypeError} si ce n'est pas un entier >= 1.
 */
export function normalizeFireIntensity(value) {

    const number =
        typeof value === "string" && value.trim() !== ""
            ? Number(value)
            : value;

    if (
        typeof number !== "number"
        || !Number.isInteger(number)
        || number < 1
    ) {

        throw new TypeError(
            "L'Intensité du feu doit être un entier supérieur ou égal à 1."
        );

    }

    return Math.min(number, FIRE_MAX_INTENSITY);

}


/**
 * Issue d'une « attaque » du feu : 1 point de dégâts à la
 * VIGUEUR par réussite (`successes`), réduits par la Protection
 * (`remainingDamage` est le dégât restant après le jet de
 * Protection, calculé sans résilience par la couche Foundry).
 * On prend feu (ou on continue à brûler) seulement s'il reste des
 * dégâts.
 */
export function resolveFireOutcome({
    successes,
    remainingDamage
} = {}) {

    if (
        !Number.isInteger(successes)
        || successes < 0
    ) {

        throw new TypeError(
            "Le nombre de réussites doit être un entier positif ou nul."
        );

    }

    if (
        !Number.isInteger(remainingDamage)
        || remainingDamage < 0
        || remainingDamage > successes
    ) {

        throw new TypeError(
            "Les dégâts restants doivent être un entier entre 0 et le nombre de réussites."
        );

    }

    return {
        successes,
        rawDamage: successes,
        remainingDamage,
        prevented: successes - remainingDamage,
        ignites: remainingDamage > 0
    };

}


/**
 * Passage au round suivant d'un feu qui continue : l'Intensité
 * augmente de 1 (dans la limite du garde-fou de saisie).
 */
export function resolveFireRound({
    currentIntensity
} = {}) {

    return {
        intensity:
            Math.min(
                normalizeFireIntensity(currentIntensity) + 1,
                FIRE_MAX_INTENSITY
            )
    };

}


/**
 * Un jet de Trépas est requis chaque round si le feu inflige des
 * dégâts alors que la VIGUEUR est (ou tombe) à 0 (Brisé).
 */
export function isFireDeathRollRequired({
    remainingDamage,
    vigorAfter
} = {}) {

    return (
        Number(remainingDamage) > 0
        && Number(vigorAfter) === 0
    );

}


/**
 * Extinction : un jet de RÉACTION réussi (au moins une réussite).
 */
export function isFireExtinguishSuccess(successes) {

    if (
        !Number.isInteger(successes)
        || successes < 0
    ) {

        throw new TypeError(
            "Le nombre de réussites doit être un entier positif ou nul."
        );

    }

    return successes > 0;

}
