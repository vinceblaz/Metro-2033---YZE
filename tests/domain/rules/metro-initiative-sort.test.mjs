import test from "node:test";
import assert from "node:assert/strict";

import {
    compareMetroInitiative
} from "../../../src/domain/rules/metro-initiative-sort.mjs";


test(
    "compareMetroInitiative place une initiative faible avant une initiative élevée",
    () => {

        const combatants = [
            {
                id:
                    "combatant-8",

                initiative:
                    8
            },
            {
                id:
                    "combatant-2",

                initiative:
                    2
            }
        ];


        combatants.sort(
            compareMetroInitiative
        );


        assert.deepEqual(
            combatants.map(
                combatant =>
                    combatant.initiative
            ),
            [
                2,
                8
            ]
        );

    }
);


test(
    "compareMetroInitiative respecte l'ordre complet 1 à 10",
    () => {

        const combatants = [
            {
                id:
                    "combatant-10",

                initiative:
                    10
            },
            {
                id:
                    "combatant-1",

                initiative:
                    1
            },
            {
                id:
                    "combatant-7",

                initiative:
                    7
            },
            {
                id:
                    "combatant-3",

                initiative:
                    3
            },
            {
                id:
                    "combatant-5",

                initiative:
                    5
            }
        ];


        combatants.sort(
            compareMetroInitiative
        );


        assert.deepEqual(
            combatants.map(
                combatant =>
                    combatant.initiative
            ),
            [
                1,
                3,
                5,
                7,
                10
            ]
        );

    }
);


test(
    "compareMetroInitiative place un Combatant sans initiative après les initiatives attribuées",
    () => {

        const combatants = [
            {
                id:
                    "sans-initiative",

                initiative:
                    null
            },
            {
                id:
                    "initiative-6",

                initiative:
                    6
            }
        ];


        combatants.sort(
            compareMetroInitiative
        );


        assert.deepEqual(
            combatants.map(
                combatant =>
                    combatant.id
            ),
            [
                "initiative-6",
                "sans-initiative"
            ]
        );

    }
);


test(
    "compareMetroInitiative place plusieurs Combatants sans initiative dans un ordre déterministe",
    () => {

        const combatants = [
            {
                id:
                    "combatant-b",

                initiative:
                    null
            },
            {
                id:
                    "combatant-a",

                initiative:
                    null
            }
        ];


        combatants.sort(
            compareMetroInitiative
        );


        assert.deepEqual(
            combatants.map(
                combatant =>
                    combatant.id
            ),
            [
                "combatant-a",
                "combatant-b"
            ]
        );

    }
);


test(
    "compareMetroInitiative départage les initiatives identiques par identifiant",
    () => {

        const combatants = [
            {
                id:
                    "brigand-b",

                initiative:
                    4
            },
            {
                id:
                    "brigand-a",

                initiative:
                    4
            }
        ];


        combatants.sort(
            compareMetroInitiative
        );


        assert.deepEqual(
            combatants.map(
                combatant =>
                    combatant.id
            ),
            [
                "brigand-a",
                "brigand-b"
            ]
        );

    }
);


test(
    "compareMetroInitiative ne transforme pas les valeurs d'initiative",
    () => {

        const first = {
            id:
                "combatant-2",

            initiative:
                2
        };

        const second = {
            id:
                "combatant-8",

            initiative:
                8
        };


        compareMetroInitiative(
            first,
            second
        );


        assert.equal(
            first.initiative,
            2
        );

        assert.equal(
            second.initiative,
            8
        );

    }
);