/**
 * Définitions métier des archétypes
 * de Métro 2033.
 *
 * Ce module ne dépend pas de Foundry.
 *
 * Les identifiants de compétences correspondent
 * aux identifiants métier utilisés par skills.mjs.
 */

export const ARCHETYPE_DEFINITIONS =
    Object.freeze({

        diplomat: Object.freeze({
            id: "diplomat",
            label: "Diplomate",

            attribute:
                "empathy",

            skills: Object.freeze([
                "analysis",
                "comprehension",
                "manipulation"
            ])
        }),


        scout: Object.freeze({
            id: "scout",
            label: "Éclaireur",

            attribute:
                "agility",

            skills: Object.freeze([
                "stealth",
                "observation",
                "survival"
            ])
        }),


        infiltrator: Object.freeze({
            id: "infiltrator",
            label: "Infiltrateur",

            attribute:
                "agility",

            skills: Object.freeze([
                "closeCombat",
                "stealth",
                "shooting"
            ])
        }),


        mechanic: Object.freeze({
            id: "mechanic",
            label: "Mécanicien",

            attribute:
                "vigor",

            skills: Object.freeze([
                "repair",
                "comprehension",
                "reaction"
            ])
        }),


        medic: Object.freeze({
            id: "medic",
            label: "Médecin",

            attribute:
                "empathy",

            skills: Object.freeze([
                "analysis",
                "comprehension",
                "medicine"
            ])
        }),


        soldier: Object.freeze({
            id: "soldier",
            label: "Soldat",

            /*
             * Le Soldat constitue un cas particulier :
             *
             * - Agilité OU Vigueur ;
             * - Corps à corps OU Endurance ;
             * - Réaction ;
             * - Tir.
             *
             * Les choix réels du personnage devront
             * donc être conservés dans ses données.
             */
            attribute:
                null,

            attributeChoices:
                Object.freeze([
                    "agility",
                    "vigor"
                ]),

            skills:
                Object.freeze([
                    "reaction",
                    "shooting"
                ]),

            skillChoices:
                Object.freeze([
                    Object.freeze([
                        "closeCombat",
                        "endurance"
                    ])
                ])
        }),


        strategist: Object.freeze({
            id: "strategist",
            label: "Stratège",

            attribute:
                "spirit",

            skills: Object.freeze([
                "comprehension",
                "manipulation",
                "observation"
            ])
        }),


        trader: Object.freeze({
            id: "trader",
            label: "Trafiquant",

            attribute:
                "spirit",

            skills: Object.freeze([
                "closeCombat",
                "manipulation",
                "observation"
            ])
        })

    });


/**
 * Retourne la définition d'un archétype.
 */
export function getArchetypeDefinition(
    archetypeId
) {

    return (
        ARCHETYPE_DEFINITIONS[
            archetypeId
        ]
        ?? null
    );

}


/**
 * Retourne tous les archétypes.
 */
export function getArchetypeDefinitions() {

    return Object.values(
        ARCHETYPE_DEFINITIONS
    );

}


/**
 * Vérifie si un identifiant correspond
 * à un archétype connu.
 */
export function isKnownArchetype(
    archetypeId
) {

    return Boolean(
        getArchetypeDefinition(
            archetypeId
        )
    );

}