/**
 * Rappels informatifs affichés en bas des onglets de la fiche
 * Personnage : choix possibles pour les afflictions, les éclats
 * de réussite (mêlée / distance) et les réussites de blocage.
 *
 * Fonction pure : les listes d'éclats proviennent des définitions
 * déjà utilisées par les fenêtres de jeu, pour qu'il n'existe
 * aucun second texte à maintenir.
 */

/**
 * Choix d'attribution d'une affliction (livre p.177, p.190 ; cf.
 * fenêtre de répartition des afflictions).
 */
export const AFFLICTION_CHOICES = Object.freeze([

    Object.freeze({
        label: "Dégâts à l'attribut du jet",
        detail: "1 point de dégâts par affliction."
    }),

    Object.freeze({
        label: "Sang-froid",
        detail: "1 case de Sang-froid par affliction."
    }),

    Object.freeze({
        label: "Équipement utilisé",
        detail: "réduit son bonus de 1 ; une seule affliction, et seulement s'il a fourni des dés (la Fiabilité peut l'annuler)."
    }),

    Object.freeze({
        label: "Dé de Stress",
        detail: "1 dé de Stress par affliction."
    })

]);


function toChoices(definitions) {

    return Array.from(definitions ?? [])
        .map(definition => ({
            label: String(definition.label ?? ""),
            repeatable: definition.repeatable === true
        }))
        .filter(choice => choice.label.length > 0);

}


export function buildChoicesReminder({
    meleeStunts = [],
    rangedStunts = [],
    blockStunts = []
} = {}) {

    return {

        afflictions:
            AFFLICTION_CHOICES.map(choice => ({ ...choice })),

        meleeStunts:
            toChoices(meleeStunts),

        rangedStunts:
            toChoices(rangedStunts),

        blockStunts:
            toChoices(blockStunts)

    };

}
