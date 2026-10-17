import test from "node:test";
import assert from "node:assert/strict";

import {
    createMetroInitiativeAssignment
} from "../../../src/domain/rules/metro-initiative-assignment.mjs";


test(
    "createMetroInitiativeAssignment crée une attribution individuelle",
    () => {

        const assignment =
            createMetroInitiativeAssignment({
                initiative: 3,
                combatantIds: [
                    "combatant-vladimir"
                ]
            });


        assert.deepEqual(
            assignment,
            {
                initiative: 3,

                combatantIds: [
                    "combatant-vladimir"
                ]
            }
        );

    }
);


test(
    "createMetroInitiativeAssignment accepte plusieurs Combatants partageant une initiative",
    () => {

        const assignment =
            createMetroInitiativeAssignment({
                initiative: 6,
                combatantIds: [
                    "brigand-1",
                    "brigand-2",
                    "brigand-3"
                ]
            });


        assert.deepEqual(
            assignment,
            {
                initiative: 6,

                combatantIds: [
                    "brigand-1",
                    "brigand-2",
                    "brigand-3"
                ]
            }
        );

    }
);


test(
    "createMetroInitiativeAssignment rejette une initiative Métro invalide",
    () => {

        assert.throws(
            () =>
                createMetroInitiativeAssignment({
                    initiative: 11,
                    combatantIds: [
                        "combatant-vladimir"
                    ]
                }),
            {
                name: "RangeError"
            }
        );

    }
);


test(
    "createMetroInitiativeAssignment exige au moins un Combatant",
    () => {

        assert.throws(
            () =>
                createMetroInitiativeAssignment({
                    initiative: 3,
                    combatantIds: []
                }),
            {
                name: "TypeError"
            }
        );

    }
);


test(
    "createMetroInitiativeAssignment exige des identifiants de Combatant non vides",
    () => {

        const invalidCombatantIds = [
            [""],
            ["combatant-1", ""],
            [null],
            [undefined],
            [42]
        ];


        for (
            const combatantIds
            of invalidCombatantIds
        ) {

            assert.throws(
                () =>
                    createMetroInitiativeAssignment({
                        initiative: 3,
                        combatantIds
                    }),
                {
                    name: "TypeError"
                }
            );

        }

    }
);


test(
    "createMetroInitiativeAssignment refuse qu'un Combatant apparaisse deux fois",
    () => {

        assert.throws(
            () =>
                createMetroInitiativeAssignment({
                    initiative: 6,
                    combatantIds: [
                        "brigand-1",
                        "brigand-1"
                    ]
                }),
            {
                name: "Error"
            }
        );

    }
);


test(
    "createMetroInitiativeAssignment produit une copie indépendante de la liste des Combatants",
    () => {

        const combatantIds = [
            "brigand-1",
            "brigand-2"
        ];


        const assignment =
            createMetroInitiativeAssignment({
                initiative: 6,
                combatantIds
            });


        combatantIds.push(
            "brigand-3"
        );


        assert.deepEqual(
            assignment.combatantIds,
            [
                "brigand-1",
                "brigand-2"
            ]
        );

    }
);