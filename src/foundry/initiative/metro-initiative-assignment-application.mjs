import {
    createMetroInitiativeAssignment
} from "../../domain/rules/metro-initiative-assignment.mjs";


export const METRO_INITIATIVE_FLAG_SCOPE =
    "metro-2033-yze";

export const METRO_INITIATIVE_ASSIGNMENTS_FLAG_KEY =
    "initiativeAssignments";


/**
 * Retourne les attributions d'initiative
 * actuellement persistées dans le Combat.
 */
export function getCombatInitiativeAssignments(
    combat
) {

    if (
        !combat
        || typeof combat.getFlag !== "function"
    ) {

        throw new TypeError(
            "Un Combat Foundry est nécessaire."
        );

    }


    const assignments =
        combat.getFlag(
            METRO_INITIATIVE_FLAG_SCOPE,
            METRO_INITIATIVE_ASSIGNMENTS_FLAG_KEY
        );


    if (!Array.isArray(assignments)) {
        return [];
    }


    return assignments.map(
        assignment => ({
            ...assignment,

            combatantIds:
                Array.isArray(
                    assignment.combatantIds
                )
                    ? [...assignment.combatantIds]
                    : []
        })
    );
}


/**
 * Applique une carte d'initiative à un ou
 * plusieurs Combatants.
 *
 * La carte constitue la source de l'initiative.
 * Combatant.initiative n'est que sa projection
 * numérique pour le Combat Tracker.
 */
export async function applyMetroInitiativeAssignment({
    combat,
    cardId,
    initiative,
    combatantIds
} = {}) {

    if (
        !combat
        || !combat.combatants
        || typeof combat.setFlag !== "function"
        || typeof combat.updateEmbeddedDocuments
            !== "function"
    ) {

        throw new TypeError(
            "Un Combat Foundry exploitable est nécessaire."
        );

    }


    if (
        typeof cardId !== "string"
        || cardId.length === 0
    ) {

        throw new TypeError(
            "Un identifiant de carte est nécessaire."
        );

    }


    const assignment =
        createMetroInitiativeAssignment({
            initiative,
            combatantIds
        });


    for (
        const combatantId
        of assignment.combatantIds
    ) {

        const combatant =
            combat.combatants.get(
                combatantId
            );


        if (!combatant) {

            throw new Error(
                `Le Combatant « ${combatantId} » ne participe pas au combat.`
            );

        }

    }


    const existingAssignments =
        getCombatInitiativeAssignments(
            combat
        );


    if (
        existingAssignments.some(
            existing =>
                existing.cardId === cardId
        )
    ) {

        throw new Error(
            `La carte « ${cardId} » est déjà attribuée.`
        );

    }


    const alreadyAssignedCombatantIds =
        new Set(
            existingAssignments.flatMap(
                existing =>
                    existing.combatantIds
            )
        );


    for (
        const combatantId
        of assignment.combatantIds
    ) {

        if (
            alreadyAssignedCombatantIds.has(
                combatantId
            )
        ) {

            throw new Error(
                `Le Combatant « ${combatantId} » possède déjà une initiative.`
            );

        }

    }


    const persistedAssignment = {
        cardId,

        initiative:
            assignment.initiative,

        combatantIds:
            [...assignment.combatantIds]
    };


    const nextAssignments = [
        ...existingAssignments,
        persistedAssignment
    ];


    await combat.setFlag(
        METRO_INITIATIVE_FLAG_SCOPE,
        METRO_INITIATIVE_ASSIGNMENTS_FLAG_KEY,
        nextAssignments
    );


    try {

        await combat.updateEmbeddedDocuments(
            "Combatant",
            assignment.combatantIds.map(
                combatantId => ({
                    _id:
                        combatantId,

                    initiative:
                        assignment.initiative
                })
            )
        );

    }
    catch (projectionError) {

        /*
         * Le flag a déjà été persisté.
         *
         * Si la projection vers les Combatants
         * échoue, on restaure donc exactement
         * l'état antérieur des attributions.
         */
        try {

            await combat.setFlag(
                METRO_INITIATIVE_FLAG_SCOPE,
                METRO_INITIATIVE_ASSIGNMENTS_FLAG_KEY,
                existingAssignments
            );

        }
        catch (rollbackError) {

            throw new AggregateError(
                [
                    projectionError,
                    rollbackError
                ],
                "La projection de l'initiative a échoué et le flag du Combat n'a pas pu être restauré."
            );

        }


        throw projectionError;

    }


    return {
        assignment: {
            ...persistedAssignment,

            combatantIds:
                [...persistedAssignment.combatantIds]
        },

        assignments:
            nextAssignments.map(
                existing => ({
                    ...existing,

                    combatantIds:
                        [...existing.combatantIds]
                })
            )
    };
}


/**
 * Libère les attributions d'initiative
 * appartenant à un Combat précis.
 *
 * Seules les cartes référencées par les
 * initiativeAssignments de ce Combat sont
 * remises à disposition.
 *
 * Aucune opération globale sur le paquet
 * n'est effectuée : une carte utilisée par
 * un autre Combat ne doit jamais être
 * libérée par celui-ci.
 *
 * Les projections Combatant.initiative sont
 * également remises à null pour les
 * Combatants encore présents dans le Combat,
 * puis les attributions persistées sont
 * vidées.
 *
 * Un Combatant peut avoir été retiré du
 * Combat avant la fin du conflit. Son
 * absence ne remet pas en cause
 * l'attribution persistée de sa carte :
 * cette carte appartient toujours à ce
 * Combat et doit donc être libérée.
 *
 * En revanche, aucun update Foundry ne doit
 * être demandé pour un Combatant qui
 * n'existe plus dans l'EmbeddedCollection.
 *
 * Toutes les cartes nécessaires sont
 * validées avant la première mutation afin
 * d'éviter une libération partielle lorsqu'une
 * attribution référence une carte absente ou
 * inexploitable.
 *
 * Les différentes phases sont compensées
 * lorsqu'une opération ultérieure échoue :
 *
 * - échec de libération d'une carte :
 *   restauration des cartes déjà libérées ;
 *
 * - échec de remise à zéro des projections :
 *   restauration des cartes ;
 *
 * - échec de suppression des assignments :
 *   restauration des projections encore
 *   existantes puis des cartes.
 */
export async function releaseCombatInitiativeAssignments({
    combat,
    deck
} = {}) {

    if (
        !combat
        || !combat.combatants
        || typeof combat.combatants.get !== "function"
        || typeof combat.getFlag !== "function"
        || typeof combat.setFlag !== "function"
        || typeof combat.updateEmbeddedDocuments
            !== "function"
    ) {

        throw new TypeError(
            "Un Combat Foundry exploitable est nécessaire."
        );

    }


    /*
     * `deck` est volontairement conservé dans
     * la signature pour compatibilité avec les
     * appelants actuels.
     *
     * Il n'intervient plus dans le cycle de vie
     * métier d'un Combat.
     *
     * Les Cards Foundry constituent le catalogue
     * global des identités et valeurs
     * d'initiative ; leur état physique ne doit
     * jamais être modifié lors de la restitution
     * d'un Combat particulier.
     */
    void deck;


    const assignments =
        getCombatInitiativeAssignments(
            combat
        );


    if (
        assignments.length === 0
    ) {

        return {
            releasedCardIds: []
        };

    }


    /*
     * Les identifiants de Card restent utiles
     * comme résultat logique de la restitution.
     *
     * "releasedCardIds" signifie désormais :
     * cartes qui ne sont plus attribuées dans
     * CE Combat.
     *
     * Cela n'implique aucune mutation de
     * Card.drawn.
     */
    const releasedCardIds =
        assignments.map(
            assignment =>
                assignment.cardId
        );


    /*
     * Les projections numériques ne peuvent
     * être modifiées que pour les Combatants
     * encore réellement présents dans
     * l'EmbeddedCollection du Combat.
     *
     * Un assignment peut continuer à référencer
     * un Combatant supprimé. Son absence ne doit
     * pas empêcher le nettoyage du flag
     * initiativeAssignments.
     */
    const initiativeByCombatantId =
        new Map();


    for (
        const assignment
        of assignments
    ) {

        for (
            const combatantId
            of assignment.combatantIds
        ) {

            const combatant =
                combat.combatants.get(
                    combatantId
                );


            if (!combatant) {

                continue;

            }


            initiativeByCombatantId.set(
                combatantId,
                assignment.initiative
            );

        }

    }


    const assignedCombatantIds =
        [
            ...initiativeByCombatantId.keys()
        ];


    const initiativeResetUpdates =
        assignedCombatantIds.map(
            combatantId => ({
                _id:
                    combatantId,

                initiative:
                    null
            })
        );


    const initiativeRestoreUpdates =
        assignedCombatantIds.map(
            combatantId => ({
                _id:
                    combatantId,

                initiative:
                    initiativeByCombatantId.get(
                        combatantId
                    )
            })
        );


    /*
     * Phase 1 :
     * supprimer les projections numériques
     * des Combatants encore présents.
     *
     * Aucun état de Card n'est impliqué.
     *
     * Si cette opération échoue, les
     * initiativeAssignments n'ont encore subi
     * aucune modification et constituent donc
     * toujours l'autorité persistante.
     */
    if (
        initiativeResetUpdates.length > 0
    ) {

        await combat.updateEmbeddedDocuments(
            "Combatant",
            initiativeResetUpdates
        );

    }


    /*
     * Phase 2 :
     * supprimer l'autorité persistante du
     * Combat.
     *
     * Si cette écriture échoue, les assignments
     * sont toujours présents. Nous devons donc
     * restaurer les projections numériques des
     * Combatants encore présents afin de revenir
     * à l'état cohérent correspondant à ces
     * assignments.
     *
     * Aucun rollback de Card n'existe plus.
     */
    try {

        await combat.setFlag(
            METRO_INITIATIVE_FLAG_SCOPE,
            METRO_INITIATIVE_ASSIGNMENTS_FLAG_KEY,
            []
        );

    }
    catch (assignmentClearError) {

        if (
            initiativeRestoreUpdates.length === 0
        ) {

            throw assignmentClearError;

        }


        try {

            await combat.updateEmbeddedDocuments(
                "Combatant",
                initiativeRestoreUpdates
            );

        }
        catch (projectionRollbackError) {

            throw new AggregateError(
                [
                    assignmentClearError,
                    projectionRollbackError
                ],
                "La suppression des attributions d'initiative a échoué et les projections précédentes n'ont pas pu être restaurées."
            );

        }


        throw assignmentClearError;

    }


    return {
        releasedCardIds
    };
}