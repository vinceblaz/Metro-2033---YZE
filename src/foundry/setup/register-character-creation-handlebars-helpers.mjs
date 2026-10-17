/**
 * Aides Handlebars utilisées par le template de l'Assistant de
 * création de Personnage
 * (templates/applications/character-creation-wizard.hbs).
 *
 * Enregistrées explicitement plutôt que supposées fournies par
 * le cœur de Foundry, pour ne jamais dépendre d'un helper dont
 * la disponibilité n'est pas garantie d'une version à l'autre.
 *
 * `lookup` n'a pas besoin d'être enregistré : c'est un helper
 * natif de Handlebars.js lui-même.
 */
export function registerCharacterCreationHandlebarsHelpers() {

    Handlebars.registerHelper("eq", (a, b) => a === b);

    Handlebars.registerHelper("add", (a, b) => Number(a) + Number(b));

    Handlebars.registerHelper(
        "includes",
        (array, value) => Array.isArray(array) && array.includes(value)
    );

}
