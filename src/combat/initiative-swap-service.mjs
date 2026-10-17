import {
    getCombatInitiativeAssignments,
    METRO_INITIATIVE_FLAG_SCOPE,
    METRO_INITIATIVE_ASSIGNMENTS_FLAG_KEY
} from "../foundry/initiative/metro-initiative-assignment-application.mjs";


export class InitiativeSwapService {

    /**
     * Retrouve le Combatant correspondant à un Actor.
     */
    static getCombatantForActor(
        combat,
        actor
    ) {

        if (!combat) {
            throw new TypeError(
                "Un Combat Foundry est nécessaire."
            );
        }

        if (!actor) {
            throw new TypeError(
                "Un Actor est nécessaire."
            );
        }


        const combatant =
            combat.combatants.find(
                entry =>
                    entry.actor?.id === actor.id
            );


        if (!combatant) {
            throw new Error(
                `L'Actor « ${actor.name} » ne participe pas au combat.`
            );
        }


        return combatant;
    }


    /**
     * Résout les deux participants d'un échange.
     *
     * Cette méthode ne modifie encore aucune initiative.
     */
    static getParticipants(
        combat,
        attacker,
        target
    ) {

        if (attacker?.id === target?.id) {
            throw new Error(
                "Un Actor ne peut pas échanger son initiative avec lui-même."
            );
        }


        const attackerCombatant =
            this.getCombatantForActor(
                combat,
                attacker
            );

        const targetCombatant =
            this.getCombatantForActor(
                combat,
                target
            );


        return {
            combatId:
                combat.id,

            round:
                combat.round,

            attacker: {
                actorId:
                    attacker.id,

                combatantId:
                    attackerCombatant.id,

                initiative:
                    attackerCombatant.initiative
            },

            target: {
                actorId:
                    target.id,

                combatantId:
                    targetCombatant.id,

                initiative:
                    targetCombatant.initiative
            }
        };
    }

    /**
     * Enregistre un échange d'initiative pour le round suivant.
     *
     * L'initiative n'est PAS modifiée immédiatement.
     */
    static async scheduleSwap(
        combat,
        attacker,
        target
    ) {

        const participants =
            this.getParticipants(
                combat,
                attacker,
                target
            );


        const currentRound =
            combat.round ?? 0;

        const applyRound =
            currentRound + 1;


        const pendingSwaps =
            foundry.utils.deepClone(
                combat.getFlag(
                    "metro-2033-yze",
                    "pendingInitiativeSwaps"
                ) ?? []
            );


        pendingSwaps.push({
            id:
                foundry.utils.randomID(),

            createdRound:
                currentRound,

            applyRound,

            attacker: {
                actorId:
                    participants.attacker.actorId,

                combatantId:
                    participants.attacker.combatantId,

                initiative:
                    participants.attacker.initiative
            },

            target: {
                actorId:
                    participants.target.actorId,

                combatantId:
                    participants.target.combatantId,

                initiative:
                    participants.target.initiative
            }
        });


        await combat.setFlag(
            "metro-2033-yze",
            "pendingInitiativeSwaps",
            pendingSwaps
        );


        return {
            scheduled: true,
            applied: false,

            combatId:
                combat.id,

            createdRound:
                currentRound,

            applyRound,

            attacker:
                participants.attacker,

            target:
                participants.target
        };
    }


    /**
     * Retourne les échanges d'initiative encore en attente.
     */
    static getPendingSwaps(
        combat
    ) {

        if (!combat) {
            throw new TypeError(
                "Un Combat Foundry est nécessaire."
            );
        }


        return foundry.utils.deepClone(
            combat.getFlag(
                "metro-2033-yze",
                "pendingInitiativeSwaps"
            ) ?? []
        );
    }


    /**
     * Applique les échanges arrivés à échéance.
     *
     * Un échange programmé au round N est appliqué
     * lorsque le Combat atteint son applyRound.
     */
    static async applyPendingSwaps(
        combat
    ) {

        if (!combat) {
            throw new TypeError(
                "Un Combat Foundry est nécessaire."
            );
        }


        const currentRound =
            combat.round ?? 0;

        const pendingSwaps =
            this.getPendingSwaps(
                combat
            );


        const due = [];
        const remaining = [];


        for (const swap of pendingSwaps) {

            if (swap.applyRound <= currentRound) {
                due.push(swap);
            }
            else {
                remaining.push(swap);
            }

        }


        const applied = [];
        const skipped = [];


        /*
        * La carte d'initiative (initiativeAssignments) constitue
        * la source d'autorité de l'initiative lorsqu'elle existe :
        * Combatant.initiative n'en est qu'une projection numérique
        * (cf. metro-initiative-assignment-application.mjs).
        *
        * Un échange doit donc déplacer l'APPARTENANCE des
        * Combatants entre les cartes, et non se limiter à permuter
        * les valeurs numériques déjà projetées. Sans cela, toute
        * opération ultérieure qui re-projette l'initiative depuis
        * les cartes (par exemple la restitution du Combat) annule
        * silencieusement l'échange déjà appliqué.
        */
        const assignments =
            getCombatInitiativeAssignments(
                combat
            );

        let assignmentsChanged =
            false;


        for (const swap of due) {

            const attackerCombatant =
                combat.combatants.get(
                    swap.attacker.combatantId
                );

            const targetCombatant =
                combat.combatants.get(
                    swap.target.combatantId
                );


            /*
            * Un participant a pu quitter le combat
            * entre la programmation et l'application.
            */
            if (
                !attackerCombatant
                || !targetCombatant
            ) {

                skipped.push({
                    id:
                        swap.id,

                    reason:
                        "combatant-missing"
                });

                continue;
            }


            /*
            * On échange les initiatives ACTUELLES.
            *
            * C'est volontaire : entre la programmation
            * et le round suivant, une autre règle pourrait
            * avoir modifié l'initiative.
            */
            const attackerPreviousInitiative =
                attackerCombatant.initiative;

            const targetPreviousInitiative =
                targetCombatant.initiative;


            const attackerAssignmentIndex =
                assignments.findIndex(
                    assignment =>
                        assignment.combatantIds.includes(
                            attackerCombatant.id
                        )
                );

            const targetAssignmentIndex =
                assignments.findIndex(
                    assignment =>
                        assignment.combatantIds.includes(
                            targetCombatant.id
                        )
                );


            let attackerNewInitiative;
            let targetNewInitiative;


            if (
                attackerAssignmentIndex !== -1
                && targetAssignmentIndex !== -1
                && attackerAssignmentIndex
                    !== targetAssignmentIndex
            ) {

                /*
                * Les deux Combatants sont suivis par des
                * cartes distinctes : on déplace chacun vers
                * la carte de l'autre, ce qui déplace
                * réellement l'autorité de l'initiative.
                */
                const attackerAssignment =
                    assignments[attackerAssignmentIndex];

                const targetAssignment =
                    assignments[targetAssignmentIndex];


                attackerAssignment.combatantIds =
                    attackerAssignment.combatantIds
                        .filter(
                            id =>
                                id !== attackerCombatant.id
                        )
                        .concat(
                            targetCombatant.id
                        );

                targetAssignment.combatantIds =
                    targetAssignment.combatantIds
                        .filter(
                            id =>
                                id !== targetCombatant.id
                        )
                        .concat(
                            attackerCombatant.id
                        );


                attackerNewInitiative =
                    targetAssignment.initiative;

                targetNewInitiative =
                    attackerAssignment.initiative;

                assignmentsChanged =
                    true;

            }
            else {

                /*
                * Au moins un des deux Combatants n'est suivi
                * par aucune carte (aucun système de cartes en
                * usage, ou initiative fixée manuellement) :
                * on retombe sur le simple échange des valeurs
                * numériques actuelles.
                */
                attackerNewInitiative =
                    targetPreviousInitiative;

                targetNewInitiative =
                    attackerPreviousInitiative;

            }


            await combat.updateEmbeddedDocuments(
                "Combatant",
                [
                    {
                        _id:
                            attackerCombatant.id,

                        initiative:
                            attackerNewInitiative
                    },
                    {
                        _id:
                            targetCombatant.id,

                        initiative:
                            targetNewInitiative
                    }
                ]
            );


            applied.push({
                id:
                    swap.id,

                attackerCombatantId:
                    attackerCombatant.id,

                targetCombatantId:
                    targetCombatant.id,

                attackerPreviousInitiative,

                attackerCurrentInitiative:
                    attackerNewInitiative,

                targetPreviousInitiative,

                targetCurrentInitiative:
                    targetNewInitiative
            });

        }


        /*
        * L'autorité persistante n'est réécrite que si au
        * moins un échange a réellement déplacé une
        * appartenance de carte.
        */
        if (assignmentsChanged) {

            await combat.setFlag(
                METRO_INITIATIVE_FLAG_SCOPE,
                METRO_INITIATIVE_ASSIGNMENTS_FLAG_KEY,
                assignments
            );

        }


        /*
        * Les échanges arrivés à échéance sont retirés,
        * qu'ils aient été appliqués ou abandonnés.
        *
        * Cela empêche une seconde application accidentelle.
        */
        await combat.setFlag(
            "metro-2033-yze",
            "pendingInitiativeSwaps",
            remaining
        );


        return {
            round:
                currentRound,

            due:
                due.length,

            applied,

            skipped,

            remaining:
                remaining.length
        };
    }


}