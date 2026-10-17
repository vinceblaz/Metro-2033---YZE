import test from "node:test";
import assert from "node:assert/strict";

import {
    METRO_INITIATIVE_VALUES,
    isValidMetroInitiativeValue,
    validateMetroInitiativeValue
} from "../../../src/domain/rules/metro-initiative.mjs";


test(
    "METRO_INITIATIVE_VALUES contient exactement les initiatives 1 à 10",
    () => {

        assert.deepEqual(
            METRO_INITIATIVE_VALUES,
            [
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10
            ]
        );

    }
);


test(
    "isValidMetroInitiativeValue accepte chaque initiative entière de 1 à 10",
    () => {

        for (
            const initiative
            of METRO_INITIATIVE_VALUES
        ) {

            assert.equal(
                isValidMetroInitiativeValue(
                    initiative
                ),
                true
            );

        }

    }
);


test(
    "isValidMetroInitiativeValue refuse les valeurs hors de 1 à 10",
    () => {

        const invalidValues = [
            0,
            -1,
            11,
            100
        ];


        for (
            const initiative
            of invalidValues
        ) {

            assert.equal(
                isValidMetroInitiativeValue(
                    initiative
                ),
                false
            );

        }

    }
);


test(
    "isValidMetroInitiativeValue refuse les valeurs non entières ou non numériques",
    () => {

        const invalidValues = [
            1.5,
            "1",
            "10",
            null,
            undefined,
            NaN,
            Infinity,
            {},
            []
        ];


        for (
            const initiative
            of invalidValues
        ) {

            assert.equal(
                isValidMetroInitiativeValue(
                    initiative
                ),
                false
            );

        }

    }
);


test(
    "validateMetroInitiativeValue retourne une initiative valide",
    () => {

        assert.equal(
            validateMetroInitiativeValue(1),
            1
        );

        assert.equal(
            validateMetroInitiativeValue(10),
            10
        );

    }
);


test(
    "validateMetroInitiativeValue rejette une initiative invalide",
    () => {

        assert.throws(
            () =>
                validateMetroInitiativeValue(0),
            {
                name: "RangeError"
            }
        );

        assert.throws(
            () =>
                validateMetroInitiativeValue(11),
            {
                name: "RangeError"
            }
        );

        assert.throws(
            () =>
                validateMetroInitiativeValue("5"),
            {
                name: "RangeError"
            }
        );

    }
);