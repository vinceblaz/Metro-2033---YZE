/**
 * Règles pures relatives aux Véhicules (règles p.211).
 *
 * Périmètre de ce premier jalon (chantier Véhicule) :
 * véhicules terrestres uniquement. Les modificateurs de
 * combat liés aux véhicules (câblage en faits de contexte
 * dans la fenêtre de préparation de jet) sont explicitement
 * hors scope et seront traités dans un incrément ultérieur.
 *
 * Fonctions pures : aucune dépendance à `foundry.*`.
 */


/**
 * Résout le Déplacement effectif d'un véhicule.
 *
 * Certains véhicules (marqués `*` dans la table « VÉHICULES
 * TYPES », p.211 : Moto tout-terrain, Jeep, 4x4) peuvent
 * entrer en zone encombrée, mais leur Déplacement tombe alors
 * à 1. Les autres véhicules (Camion, Véhicule blindé) ne
 * peuvent pas du tout entrer en zone encombrée.
 *
 * @param {object} params
 * @param {number} params.baseDisplacement Déplacement de base
 *   du véhicule (table « VÉHICULES TYPES »).
 * @param {boolean} params.reducedInEncumberedZone Le véhicule
 *   peut-il entrer en zone encombrée (avec Déplacement réduit
 *   à 1) ? Correspond au `*` de la table du livre.
 * @param {boolean} params.inEncumberedZone Le véhicule se
 *   trouve-t-il (ou cherche-t-il à entrer) en zone encombrée ?
 *
 * @returns {number} Le Déplacement effectif.
 *
 * @throws {Error} Si le véhicule ne peut pas entrer en zone
 *   encombrée (`reducedInEncumberedZone` false) alors qu'on
 *   lui demande de s'y trouver (`inEncumberedZone` true). Ce
 *   cas ne doit normalement jamais être soumis à cette
 *   fonction : il revient à l'appelant (narration/MJ) de ne
 *   pas autoriser un tel véhicule à entrer dans la zone.
 */
export function resolveVehicleDisplacement({
    baseDisplacement,
    reducedInEncumberedZone,
    inEncumberedZone
} = {}) {

    if (
        !Number.isInteger(baseDisplacement)
        || baseDisplacement < 0
    ) {
        throw new TypeError(
            "baseDisplacement doit être un entier positif ou nul."
        );
    }

    if (typeof reducedInEncumberedZone !== "boolean") {
        throw new TypeError(
            "reducedInEncumberedZone doit être un booléen."
        );
    }

    if (typeof inEncumberedZone !== "boolean") {
        throw new TypeError(
            "inEncumberedZone doit être un booléen."
        );
    }


    if (!inEncumberedZone) {
        return baseDisplacement;
    }


    if (!reducedInEncumberedZone) {
        throw new Error(
            "Ce véhicule ne peut pas entrer en zone encombrée."
        );
    }


    return 1;

}


/**
 * Le Blindage d'un véhicule sert directement de valeur de
 * Protection pour ses occupants (comme un abri, règles p.211).
 *
 * @param {object} params
 * @param {number} params.armor Blindage du véhicule.
 *
 * @returns {number} La valeur de Protection équivalente.
 */
export function vehicleArmorAsProtectionValue({
    armor
} = {}) {

    if (
        !Number.isInteger(armor)
        || armor < 0
    ) {
        throw new TypeError(
            "armor doit être un entier positif ou nul."
        );
    }

    return armor;

}


/**
 * Perte d'Intégrité subie par le véhicule lorsqu'un de ses
 * occupants est touché (résultats 1 à 3 de la table
 * « VÉHICULES HORS D'ÉTAT », p.211) : toujours exactement 1
 * point, quel que soit le dégât réel subi par l'occupant.
 *
 * Fonction disponible pour un futur incrément d'automatisation
 * du chantier Véhicule (ex : « occupant touché → Intégrité
 * -1 »). Elle n'est volontairement câblée à aucun Hook ni
 * aucune Sheet dans ce jalon.
 *
 * @returns {number} Toujours 1.
 */
export function resolveOccupantHitIntegrityLoss() {

    return 1;

}


/**
 * Un véhicule est hors d'état lorsque son Intégrité atteint 0
 * (règles p.211, déclenche la table « VÉHICULES HORS D'ÉTAT »).
 *
 * @param {object} params
 * @param {number} params.integrity Intégrité actuelle du
 *   véhicule.
 *
 * @returns {boolean}
 */
export function isVehicleOutOfOrder({
    integrity
} = {}) {

    if (!Number.isInteger(integrity)) {
        throw new TypeError(
            "integrity doit être un entier."
        );
    }

    return integrity <= 0;

}
