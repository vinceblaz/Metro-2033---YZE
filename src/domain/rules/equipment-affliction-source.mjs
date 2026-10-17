/**
 * Équipement « utilisé » par un jet préparé, pour les afflictions.
 *
 * Avec la fenêtre de préparation, l'arme ou l'équipement n'est plus
 * transmis au jet comme un Item (seul le total de dés l'est) : le
 * contexte du jet ne l'identifiait donc plus, et la fenêtre de
 * répartition des afflictions ne proposait jamais « Équipement ».
 *
 * Cette fonction retrouve l'Item à partir des sources cochées dans
 * la préparation (livre p.177 : l'équipement qui a fourni des dés).
 * Elle reste pure : la recherche de l'Item est injectée.
 *
 * Règles :
 * - seules les sources sélectionnées, de type arme ou équipement,
 *   avec un bonus de dés > 0 et un identifiant d'Item, comptent ;
 * - la première source retenue est celle de l'affliction (une seule
 *   affliction possible sur l'équipement, cf. afflictions.mjs) ;
 * - Item introuvable : source ignorée.
 */

const EQUIPMENT_SOURCE_TYPES = Object.freeze([
    "weapon",
    "equipment"
]);


export function resolveEquipmentContextFromSources(
    selectedSources,
    findItem
) {

    if (
        !Array.isArray(selectedSources)
        || typeof findItem !== "function"
    ) {
        return null;
    }

    for (const source of selectedSources) {

        if (
            source?.selected !== true
            || !EQUIPMENT_SOURCE_TYPES.includes(source?.type)
            || !(Number(source?.bonus) > 0)
        ) {
            continue;
        }

        const itemId = source.metadata?.itemId;

        if (!itemId) {
            continue;
        }

        const item = findItem(itemId);

        if (!item) {
            continue;
        }

        return {
            itemId: item.id,
            itemUuid: item.uuid,
            itemName: item.name,
            itemType: item.type
        };

    }

    return null;

}
