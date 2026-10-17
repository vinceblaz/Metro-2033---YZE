/**
 * Identification d'un Talent possédé par un Actor.
 *
 * Aucune dépendance à Foundry.
 *
 * Convention du projet : un Item Talent porte une clé métier
 * stable dans `system.key` (cf. TalentDataModel). Pour les Items
 * déjà importés AVANT l'ajout de cette clé dans le catalogue
 * (Second souffle, Impitoyable, Pilote), la clé stockée est une
 * clé générée à partir du nom ("secondSouffle", "impitoyable",
 * "pilote") ou vide : on prévoit donc un repli par NOM de Talent
 * (insensible à la casse, aux accents et aux espaces
 * superflus).
 */


export const TALENT_IDENTITIES =
    Object.freeze({

        SECOND_WIND: Object.freeze({
            key: "secondWind",
            name: "Second souffle",
            legacyKeys: Object.freeze(["secondSouffle"])
        }),

        RUTHLESS: Object.freeze({
            key: "ruthless",
            name: "Impitoyable",
            legacyKeys: Object.freeze(["impitoyable"])
        }),

        PILOT: Object.freeze({
            key: "pilot",
            name: "Pilote",
            legacyKeys: Object.freeze(["pilote"])
        })

    });


/**
 * Normalise un nom pour comparaison : minuscules, sans accents,
 * espaces compactés.
 */
export function normalizeTalentName(
    name
) {

    return String(name ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

}


/**
 * Un Item (ou objet simple) est-il le Talent recherché ?
 *
 * 1. type "talent" obligatoire ;
 * 2. clé métier identique (`system.key`) ;
 * 3. sinon, repli : nom identique après normalisation.
 */
export function isTalentItem(
    item,
    {
        key,
        name
    } = {}
) {

    if (item?.type !== "talent") {

        return false;

    }


    if (
        typeof key === "string"
        && key.length > 0
        && item.system?.key === key
    ) {

        return true;

    }


    /*
     * Ancienne clé générée par le catalogue (ex. "pilote").
     */
    if (
        typeof key === "string"
        && key.length > 0
        && resolveTalentKey(item) === key
    ) {

        return true;

    }


    return (
        typeof name === "string"
        && name.length > 0
        && normalizeTalentName(item.name)
            === normalizeTalentName(name)
    );

}


/**
 * La collection d'Items contient-elle ce Talent ?
 */
export function hasTalent(
    items,
    identity
) {

    return Array.from(
        items ?? []
    ).some(
        item =>
            isTalentItem(
                item,
                identity
            )
    );

}


/**
 * Clé métier CANONIQUE d'un Item Talent.
 *
 * Ordre de résolution :
 *
 * 1. `system.key` égale à une clé canonique connue ;
 * 2. `system.key` égale à une ancienne clé générée par le
 *    catalogue (ex. "pilote" -> "pilot") ;
 * 3. nom du Talent (normalisé) égal à un nom canonique connu ;
 * 4. sinon `system.key` telle que stockée (rognée, "" si absente).
 *
 * Permet de reconnaître sans migration ni réimport les Items
 * importés avant l'introduction des clés canoniques.
 */
export function resolveTalentKey(
    item
) {

    const stored =
        String(
            item?.system?.key
            ?? ""
        ).trim();

    const identities =
        Object.values(
            TALENT_IDENTITIES
        );


    for (const identity of identities) {

        if (stored === identity.key) {

            return identity.key;

        }

    }


    for (const identity of identities) {

        if (
            stored.length > 0
            && identity.legacyKeys?.includes(stored)
        ) {

            return identity.key;

        }

    }


    const normalizedName =
        normalizeTalentName(
            item?.name
        );


    if (normalizedName.length > 0) {

        for (const identity of identities) {

            if (
                normalizeTalentName(identity.name)
                === normalizedName
            ) {

                return identity.key;

            }

        }

    }


    return stored;

}
