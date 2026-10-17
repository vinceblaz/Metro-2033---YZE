import { test } from "node:test";
import assert from "node:assert/strict";

import {
    getActorStressDice,
    getActorAttributeValue,
    getActorSkillValue,
    resolveActionBase
} from "../../src/action-resolution/action-base-resolver.mjs";


/**
 * Ce fichier verrouille le comportement actuel de
 * action-base-resolver.mjs (aucun test n'existait
 * avant ce chantier).
 */


/* ============================================================
 * getActorStressDice
 * ============================================================ */


test(
    "getActorStressDice : retourne le stress d'un PJ",
    () => {

        const actor = {
            type: "character",
            system: {
                stress: {
                    dice: 2
                }
            }
        };


        assert.equal(
            getActorStressDice(actor),
            2
        );

    }
);


test(
    "getActorStressDice : retourne 0 pour un PNJ même s'il possède un stress",
    () => {

        const actor = {
            type: "npc",
            system: {
                stress: {
                    dice: 3
                }
            }
        };


        assert.equal(
            getActorStressDice(actor),
            0
        );

    }
);


test(
    "getActorStressDice : retourne 0 pour une Créature",
    () => {

        const actor = {
            type: "creature",
            system: {
                stress: {
                    dice: 5
                }
            }
        };


        assert.equal(
            getActorStressDice(actor),
            0
        );

    }
);


test(
    "getActorStressDice : retourne 0 si actor est null",
    () => {

        assert.equal(
            getActorStressDice(null),
            0
        );

    }
);


test(
    "getActorStressDice : retourne 0 si le stress est absent du système",
    () => {

        const actor = {
            type: "character",
            system: {}
        };


        assert.equal(
            getActorStressDice(actor),
            0
        );

    }
);


test(
    "getActorStressDice : retourne 0 si la valeur de stress n'est pas numérique",
    () => {

        const actor = {
            type: "character",
            system: {
                stress: {
                    dice: "beaucoup"
                }
            }
        };


        assert.equal(
            getActorStressDice(actor),
            0
        );

    }
);


/* ============================================================
 * getActorAttributeValue
 * ============================================================ */


test(
    "getActorAttributeValue : retourne la valeur de l'attribut demandé",
    () => {

        const actor = {
            system: {
                attributes: {
                    vigor: {
                        value: 4
                    }
                }
            }
        };


        assert.equal(
            getActorAttributeValue(
                actor,
                "vigor"
            ),
            4
        );

    }
);


test(
    "getActorAttributeValue : retourne 0 si actor est null",
    () => {

        assert.equal(
            getActorAttributeValue(
                null,
                "vigor"
            ),
            0
        );

    }
);


test(
    "getActorAttributeValue : retourne 0 si attributeId n'est pas une chaîne",
    () => {

        const actor = {
            system: {
                attributes: {
                    vigor: {
                        value: 4
                    }
                }
            }
        };


        assert.equal(
            getActorAttributeValue(
                actor,
                undefined
            ),
            0
        );

    }
);


test(
    "getActorAttributeValue : retourne 0 si attributeId est une chaîne vide",
    () => {

        const actor = {
            system: {
                attributes: {
                    vigor: {
                        value: 4
                    }
                }
            }
        };


        assert.equal(
            getActorAttributeValue(
                actor,
                ""
            ),
            0
        );

    }
);


test(
    "getActorAttributeValue : retourne 0 si l'attribut demandé n'existe pas sur l'Actor",
    () => {

        const actor = {
            system: {
                attributes: {
                    vigor: {
                        value: 4
                    }
                }
            }
        };


        assert.equal(
            getActorAttributeValue(
                actor,
                "reflexes"
            ),
            0
        );

    }
);


/* ============================================================
 * getActorSkillValue
 * ============================================================ */


test(
    "getActorSkillValue : retourne la valeur de la compétence demandée",
    () => {

        const actor = {
            system: {
                skills: {
                    closeCombat: 3
                }
            }
        };


        assert.equal(
            getActorSkillValue(
                actor,
                "closeCombat"
            ),
            3
        );

    }
);


test(
    "getActorSkillValue : retourne 0 si actor est null",
    () => {

        assert.equal(
            getActorSkillValue(
                null,
                "closeCombat"
            ),
            0
        );

    }
);


test(
    "getActorSkillValue : retourne 0 si skillId n'est pas une chaîne",
    () => {

        const actor = {
            system: {
                skills: {
                    closeCombat: 3
                }
            }
        };


        assert.equal(
            getActorSkillValue(
                actor,
                42
            ),
            0
        );

    }
);


test(
    "getActorSkillValue : retourne 0 si skillId est une chaîne vide",
    () => {

        const actor = {
            system: {
                skills: {
                    closeCombat: 3
                }
            }
        };


        assert.equal(
            getActorSkillValue(
                actor,
                ""
            ),
            0
        );

    }
);


test(
    "getActorSkillValue : retourne 0 si la compétence demandée n'existe pas sur l'Actor",
    () => {

        const actor = {
            system: {
                skills: {
                    closeCombat: 3
                }
            }
        };


        assert.equal(
            getActorSkillValue(
                actor,
                "stealth"
            ),
            0
        );

    }
);


/* ============================================================
 * resolveActionBase
 * ============================================================ */


test(
    "resolveActionBase : lève une erreur si actor est absent",
    () => {

        assert.throws(
            () =>
                resolveActionBase(
                    null,
                    {
                        attribute: "vigor",
                        skill: "closeCombat"
                    }
                ),
            TypeError
        );

    }
);


test(
    "resolveActionBase : lève une erreur si context est absent",
    () => {

        const actor = {
            type: "character",
            system: {}
        };


        assert.throws(
            () =>
                resolveActionBase(
                    actor,
                    null
                ),
            TypeError
        );

    }
);


test(
    "resolveActionBase : agrège attribut, compétence et stress d'un PJ",
    () => {

        const actor = {
            type: "character",
            system: {
                attributes: {
                    vigor: {
                        value: 4
                    }
                },
                skills: {
                    closeCombat: 2
                },
                stress: {
                    dice: 1
                }
            }
        };

        const context = {
            attribute: "vigor",
            skill: "closeCombat"
        };


        assert.deepEqual(
            resolveActionBase(
                actor,
                context
            ),
            {
                attribute: 4,
                skill: 2,
                stress: 1
            }
        );

    }
);


test(
    "resolveActionBase : le stress d'un PNJ reste toujours nul",
    () => {

        const actor = {
            type: "npc",
            system: {
                attributes: {
                    vigor: {
                        value: 3
                    }
                },
                skills: {
                    closeCombat: 1
                },
                stress: {
                    dice: 9
                }
            }
        };

        const context = {
            attribute: "vigor",
            skill: "closeCombat"
        };


        assert.deepEqual(
            resolveActionBase(
                actor,
                context
            ),
            {
                attribute: 3,
                skill: 1,
                stress: 0
            }
        );

    }
);


test(
    "resolveActionBase : retourne des valeurs à 0 si le contexte ne référence ni attribut ni compétence",
    () => {

        const actor = {
            type: "character",
            system: {
                attributes: {
                    vigor: {
                        value: 4
                    }
                },
                skills: {
                    closeCombat: 2
                },
                stress: {
                    dice: 1
                }
            }
        };

        const context = {};


        assert.deepEqual(
            resolveActionBase(
                actor,
                context
            ),
            {
                attribute: 0,
                skill: 0,
                stress: 1
            }
        );

    }
);
