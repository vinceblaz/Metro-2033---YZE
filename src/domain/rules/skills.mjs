/**
 * Définition des compétences et de leur attribut associé.
 *
 * Ces données représentent les règles du jeu.
 * Elles ne font donc pas partie du DataModel du personnage.
 */

export const SKILL_DEFINITIONS = Object.freeze({

    repair: {
        attribute: "vigor"
    },

    closeCombat: {
        attribute: "vigor"
    },

    endurance: {
        attribute: "vigor"
    },


    stealth: {
        attribute: "agility"
    },

    reaction: {
        attribute: "agility"
    },

    shooting: {
        attribute: "agility"
    },


    comprehension: {
        attribute: "spirit"
    },

    observation: {
        attribute: "spirit"
    },

    survival: {
        attribute: "spirit"
    },


    analysis: {
        attribute: "empathy"
    },

    manipulation: {
        attribute: "empathy"
    },

    medicine: {
        attribute: "empathy"
    }
});


export function getSkillDefinition(skillId) {

    return SKILL_DEFINITIONS[skillId] ?? null;

}


export function getSkillAttribute(skillId) {

    return getSkillDefinition(skillId)?.attribute ?? null;

}