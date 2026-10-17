export function resolveDisarm({
    target,
    item = null
} = {}) {

    if (!target) {
        throw new TypeError(
            "Une cible est nécessaire pour résoudre un désarmement."
        );
    }


    /*
     * Sans objet explicitement choisi, le resolver
     * indique simplement qu'une décision est requise.
     *
     * Le domaine ne choisit jamais silencieusement
     * une arme à la place du joueur/MJ.
     */
    if (!item) {

        return {
            applied: false,
            requiresChoice: true,
            reason: "item-required",
            targetId: target.id,
            itemId: null,
            itemName: null
        };

    }


    if (
        item.actor?.id !== target.id
    ) {

        throw new Error(
            "L'objet à désarmer n'appartient pas à la cible."
        );

    }


    /*
     * Pour l'instant, seuls les objets possédant réellement
     * un état equipped peuvent être désarmés.
     */
    if (
        typeof item.system?.equipped
        !== "boolean"
    ) {

        throw new Error(
            "Cet objet ne possède pas d'état équipé."
        );

    }


    if (!item.system.equipped) {

        return {
            applied: false,
            requiresChoice: false,
            reason: "not-equipped",
            targetId: target.id,
            itemId: item.id,
            itemName: item.name
        };

    }


    return {
        applied: true,
        requiresChoice: false,
        reason: "disarmed",
        targetId: target.id,
        itemId: item.id,
        itemName: item.name
    };

}
