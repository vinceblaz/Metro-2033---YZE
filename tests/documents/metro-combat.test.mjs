import test from "node:test";
import assert from "node:assert/strict";


/*
 * MetroCombat étend directement la classe
 * globale Foundry Combat.
 *
 * Les tests Node ne disposent pas du runtime
 * Foundry : on fournit donc uniquement le
 * contrat minimal nécessaire à ces tests.
 */
globalThis.Combat = class Combat {

    constructor({
        combatants = [],
        round = 0
    } = {}) {

        this.combatants =
            new Map(
                combatants.map(
                    combatant => [
                        combatant.id,
                        combatant
                    ]
                )
            );

        this.round =
            round;

        this.preDeleteCalls =
            [];
    }


    /**
     * Reproduit le signal métier Foundry
     * dont MetroCombat a besoin :
     *
     * round 0   -> Combat non commencé
     * round > 0 -> Combat commencé
     */
    get started() {

        return this.round > 0;
    }


    /**
     * Contrat minimal du cycle de suppression
     * Foundry utilisé par MetroCombat.
     *
     * Le stub permet de vérifier que
     * MetroCombat poursuit bien le workflow
     * parent après son traitement propre.
     */
    async _preDelete(
        options,
        user
    ) {

        this.preDeleteCalls.push({
            options,
            user
        });

        return true;
    }
};


const {
    MetroCombat
} = await import(
    "../../src/documents/metro-combat.mjs"
);


function createCombatantStub({
    id,
    initiative = null,
    isOwner = true
}) {

    return {
        id,
        initiative,
        isOwner
    };
}


test(
    "MetroCombat.rollInitiative ne redistribue pas l'initiative lorsque le Combat a commencé",
    async () => {

        const combatant =
            createCombatantStub({
                id:
                    "combatant-1",

                initiative:
                    null,

                isOwner:
                    true
            });


        const combat =
            new MetroCombat({
                combatants: [
                    combatant
                ],

                round:
                    1
            });


        const result =
            await combat.rollInitiative(
                combatant.id
            );


        assert.equal(
            result,
            combat
        );


        assert.equal(
            combatant.initiative,
            null
        );

    }
);


test(
    "MetroCombat._preDelete poursuit le cycle de suppression Foundry",
    async () => {

        const combat =
            new MetroCombat({
                combatants: [],
                round:
                    1
            });


        /*
         * Ce test vérifie uniquement le
         * contrat avec le workflow parent.
         *
         * La libération Métro possède ses
         * propres tests dédiés : on neutralise
         * donc ici cette frontière afin de ne
         * pas dépendre du runtime Foundry
         * global `game`.
         */
        combat._releaseMetroInitiativeAssignments =
            async () => ({
                releasedCardIds: []
            });


        const options = {
            deleteAll:
                false
        };

        const user = {
            id:
                "user-1"
        };


        const result =
            await combat._preDelete(
                options,
                user
            );


        assert.equal(
            result,
            true
        );


        assert.deepEqual(
            combat.preDeleteCalls,
            [
                {
                    options,
                    user
                }
            ]
        );

    }
);

test(
    "MetroCombat._preDelete libère l'initiative Métro avant de poursuivre la suppression Foundry",
    async () => {

        const combat =
            new MetroCombat({
                combatants: [],
                round:
                    1
            });


        const lifecycleCalls = [];


        /*
         * Ce remplacement local représente
         * uniquement la frontière métier que
         * MetroCombat._preDelete devra appeler.
         *
         * Il évite de mocker les imports ESM
         * du deck et du service de libération.
         */
        combat._releaseMetroInitiativeAssignments =
            async () => {

                lifecycleCalls.push(
                    "release"
                );

            };


        /*
         * Le stub parent enregistre déjà son
         * appel. On l'étend ici uniquement
         * pour rendre l'ordre observable.
         */
        combat.preDeleteCalls =
            [];


        const parentPreDelete =
            Combat.prototype._preDelete;


        Combat.prototype._preDelete =
            async function (
                options,
                user
            ) {

                lifecycleCalls.push(
                    "super"
                );


                return parentPreDelete.call(
                    this,
                    options,
                    user
                );

            };


        const options = {
            deleteAll:
                false
        };

        const user = {
            id:
                "user-1"
        };


        try {

            const result =
                await combat._preDelete(
                    options,
                    user
                );


            assert.equal(
                result,
                true
            );


            assert.deepEqual(
                lifecycleCalls,
                [
                    "release",
                    "super"
                ]
            );


            assert.deepEqual(
                combat.preDeleteCalls,
                [
                    {
                        options,
                        user
                    }
                ]
            );

        }
        finally {

            /*
             * Ne jamais laisser la modification
             * du prototype contaminer les tests
             * suivants.
             */
            Combat.prototype._preDelete =
                parentPreDelete;

        }

    }
);

test(
    "MetroCombat._preDelete ne poursuit pas la suppression Foundry si la libération de l'initiative échoue",
    async () => {

        const combat =
            new MetroCombat({
                combatants: [],
                round:
                    1
            });


        combat._releaseMetroInitiativeAssignments =
            async () => {

                throw new Error(
                    "initiative-release-failed"
                );

            };


        const options = {
            deleteAll:
                false
        };

        const user = {
            id:
                "user-1"
        };


        await assert.rejects(
            () =>
                combat._preDelete(
                    options,
                    user
                ),
            /initiative-release-failed/
        );


        /*
         * La libération Métro précède le
         * workflow parent.
         *
         * Si elle échoue, super._preDelete()
         * ne doit jamais être atteint.
         */
        assert.deepEqual(
            combat.preDeleteCalls,
            []
        );

    }
);

test(
    "MetroCombat._releaseMetroInitiativeAssignments ne demande pas de deck lorsqu'aucune attribution n'existe",
    async () => {

        const combat =
            new MetroCombat({
                combatants: [],
                round:
                    0
            });


        /*
         * Contrat minimal nécessaire à la
         * lecture des initiativeAssignments.
         *
         * Ce Combat ne possède aucune
         * attribution persistée.
         */
        combat.getFlag =
            () => undefined;


        const result =
            await combat._releaseMetroInitiativeAssignments();


        assert.deepEqual(
            result,
            {
                releasedCardIds: []
            }
        );

    }
);

test(
    "MetroCombat._releaseMetroInitiativeAssignments nettoie les attributions sans dépendre du deck Foundry",
    async () => {

        const combatant =
            createCombatantStub({
                id:
                    "combatant-1",

                initiative:
                    4,

                isOwner:
                    true
            });


        const combat =
            new MetroCombat({
                combatants: [
                    combatant
                ],

                round:
                    1
            });


        /*
         * Une attribution existe réellement.
         *
         * Nous voulons donc traverser la
         * branche qui, historiquement,
         * cherchait ou créait le deck Foundry.
         */
        let assignments = [
            {
                cardId:
                    "card-4",

                initiative:
                    4,

                combatantIds: [
                    "combatant-1"
                ]
            }
        ];


        combat.getFlag =
            (
                scope,
                key
            ) => {

                if (
                    scope === "metro-2033-yze"
                    && key === "initiativeAssignments"
                ) {

                    return structuredClone(
                        assignments
                    );

                }


                return undefined;
            };


        combat.setFlag =
            async (
                scope,
                key,
                value
            ) => {

                if (
                    scope === "metro-2033-yze"
                    && key === "initiativeAssignments"
                ) {

                    assignments =
                        structuredClone(
                            value
                        );

                }


                return combat;
            };


        combat.updateEmbeddedDocuments =
            async (
                embeddedName,
                updates
            ) => {

                assert.equal(
                    embeddedName,
                    "Combatant"
                );


                for (
                    const update
                    of updates
                ) {

                    const currentCombatant =
                        combat.combatants.get(
                            update._id
                        );


                    if (
                        !currentCombatant
                    ) {

                        throw new Error(
                            `Combatant introuvable : ${update._id}`
                        );

                    }


                    currentCombatant.initiative =
                        update.initiative;

                }


                return updates;
            };


        /*
         * Aucun stub de globalThis.game n'est
         * fourni volontairement.
         *
         * La restitution locale d'un Combat
         * ne doit plus avoir besoin du runtime
         * Cards de Foundry.
         */
        const result =
            await combat
                ._releaseMetroInitiativeAssignments();


        assert.deepEqual(
            result,
            {
                releasedCardIds: [
                    "card-4"
                ]
            }
        );


        assert.equal(
            combatant.initiative,
            null
        );


        assert.deepEqual(
            assignments,
            []
        );

    }
);

