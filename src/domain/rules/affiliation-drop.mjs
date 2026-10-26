/**
 * Dépôt d'un Item Faction ou Station sur une fiche de Personnage :
 * un Personnage n'a qu'une Faction et qu'une Station, enregistrées comme
 * références (system.affiliations). Un Item identique est ignoré ; un Item
 * différent remplace le précédent. Fonction pure.
 */

const AFFILIATION_PATHS = Object.freeze({
    faction: "system.affiliations.faction",
    station: "system.affiliations.community"
});

export function decideAffiliationDrop({ itemType, itemUuid, currentUuid }) {

    const path = AFFILIATION_PATHS[itemType];

    if (!path) {
        return { action: "not-affiliation" };
    }

    const current = String(currentUuid ?? "").trim();

    if (!itemUuid) {
        return { action: "ignore", path };
    }

    if (current === itemUuid) {
        return { action: "same", path };
    }

    return {
        action: current ? "replace" : "set",
        path
    };
}
