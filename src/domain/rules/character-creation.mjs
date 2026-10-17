/**
 * Règles de création de Personnage joueur (livre de règles,
 * p.163-175 : « Les 10 étapes de la création de personnages »).
 *
 * Ce module ne dépend pas de Foundry. Il calcule uniquement :
 *
 * - la catégorie d'âge et les points qui en découlent
 *   (Attributs, Compétences) ;
 * - la validité d'une répartition d'Attributs ;
 * - la validité d'une répartition de Compétences ;
 * - la validité du choix des deux Talents de départ.
 *
 * Il ne modifie aucun Actor et ne prend aucune décision
 * narrative (Fierté/Honte/Liens/Nom/Apparence restent des
 * choix libres du joueur, non validés ici).
 */

export const AGE_CATEGORY =
    Object.freeze({
        YOUNG: "young",
        ADULT: "adult",
        ELDER: "elder"
    });


const AGE_THRESHOLDS =
    Object.freeze({
        youngMax: 25,
        adultMax: 50
    });


/**
 * Points d'Attributs / de Compétences disponibles à la
 * création, selon la catégorie d'âge (règles p.172).
 */
export const AGE_CREATION_BUDGETS =
    Object.freeze({
        [AGE_CATEGORY.YOUNG]: Object.freeze({ attributePoints: 15, skillPoints: 8 }),
        [AGE_CATEGORY.ADULT]: Object.freeze({ attributePoints: 14, skillPoints: 10 }),
        [AGE_CATEGORY.ELDER]: Object.freeze({ attributePoints: 13, skillPoints: 12 })
    });


export const ATTRIBUTE_KEYS =
    Object.freeze(["vigor", "agility", "spirit", "empathy"]);

export const SKILL_KEYS =
    Object.freeze([
        "repair", "closeCombat", "endurance",
        "stealth", "reaction", "shooting",
        "comprehension", "observation", "survival",
        "analysis", "manipulation", "medicine"
    ]);


/*
 * Bornes de répartition à la création (règles p.172-173).
 *
 * Un Attribut/une Compétence d'archétype peut dépasser le
 * plafond général (Attribut : 5 au lieu de 4 ; Compétence :
 * 3 au lieu de 2).
 */
const ATTRIBUTE_MIN = 2;
const ATTRIBUTE_MAX = 4;
const ATTRIBUTE_ARCHETYPE_MAX = 5;

const SKILL_MIN = 0;
const SKILL_MAX = 2;
const SKILL_ARCHETYPE_MAX = 3;

export const STARTING_TALENT_COUNT = 2;


/**
 * Résout le ou les Attributs d'archétype réels d'un
 * personnage, à partir de la définition canonique de son
 * archétype (domain/rules/archetypes.mjs) et, pour le Soldat
 * (seul cas à choix, règles p.169), de l'Attribut choisi par
 * le joueur.
 *
 * @param {object} archetypeDefinition Une entrée de
 *   ARCHETYPE_DEFINITIONS.
 * @param {string} [chosenAttribute] Requis uniquement lorsque
 *   `archetypeDefinition.attribute` est `null` (Soldat).
 *
 * @returns {string[]} Toujours un tableau (vide si le choix
 *   requis n'a pas encore été fait).
 */
export function resolveArchetypeAttributeKeys(archetypeDefinition, chosenAttribute = null) {

    if (!archetypeDefinition) {
        return [];
    }

    if (archetypeDefinition.attribute) {
        return [archetypeDefinition.attribute];
    }

    if (
        Array.isArray(archetypeDefinition.attributeChoices)
        && archetypeDefinition.attributeChoices.includes(chosenAttribute)
    ) {
        return [chosenAttribute];
    }

    return [];
}


/**
 * Résout les Compétences d'archétype réelles d'un personnage,
 * à partir de la définition canonique de son archétype et,
 * pour le Soldat (seul cas à choix, règles p.169), de la
 * Compétence choisie par le joueur au sein de chaque groupe de
 * choix (`skillChoices`).
 *
 * @param {object} archetypeDefinition Une entrée de
 *   ARCHETYPE_DEFINITIONS.
 * @param {string[]} [chosenSkills] Une compétence choisie par
 *   groupe de `archetypeDefinition.skillChoices`, dans l'ordre.
 *
 * @returns {string[]} Les compétences d'archétype fixes, plus
 *   celles issues d'un choix valide (omises si le choix requis
 *   n'a pas encore été fait).
 */
export function resolveArchetypeSkillKeys(archetypeDefinition, chosenSkills = []) {

    if (!archetypeDefinition) {
        return [];
    }

    const fixed = [...(archetypeDefinition.skills ?? [])];

    const choiceGroups = archetypeDefinition.skillChoices ?? [];

    const resolvedChoices = choiceGroups
        .map((group, index) => {
            const chosen = chosenSkills[index];
            return group.includes(chosen) ? chosen : null;
        })
        .filter((skill) => skill !== null);

    return [...fixed, ...resolvedChoices];
}


function assertAge(age) {

    if (!Number.isInteger(age) || age < 0) {
        throw new TypeError("L'âge doit être un entier positif ou nul.");
    }
}


/**
 * Détermine la catégorie d'âge d'un personnage
 * (Jeune ≤ 25, Adulte 26-50, Aîné > 50).
 */
export function getAgeCategory(age) {

    assertAge(age);

    if (age <= AGE_THRESHOLDS.youngMax) {
        return AGE_CATEGORY.YOUNG;
    }

    if (age <= AGE_THRESHOLDS.adultMax) {
        return AGE_CATEGORY.ADULT;
    }

    return AGE_CATEGORY.ELDER;
}


/**
 * Points d'Attributs disponibles à la création pour cet âge.
 */
export function getAttributePointsBudget(age) {
    return AGE_CREATION_BUDGETS[getAgeCategory(age)].attributePoints;
}


/**
 * Points de Compétences disponibles à la création pour cet
 * âge.
 */
export function getSkillPointsBudget(age) {
    return AGE_CREATION_BUDGETS[getAgeCategory(age)].skillPoints;
}


/**
 * Valide une répartition des 4 Attributs à la création.
 *
 * @param {object} params
 * @param {Record<string,number>} params.allocation Les 4 clés
 *   de ATTRIBUTE_KEYS, chacune associée à sa valeur choisie.
 * @param {number} params.age Âge du personnage.
 * @param {string|string[]} params.archetypeAttributes Le(s)
 *   attribut(s) d'archétype (un seul pour la plupart des
 *   archétypes ; le Soldat choisit Agilité OU Vigueur, mais un
 *   seul est réellement son attribut d'archétype une fois le
 *   choix fait).
 *
 * @returns {{valid:boolean, errors:string[], budget:number, total:number}}
 */
export function validateAttributeAllocation({
    allocation,
    age,
    archetypeAttributes = []
} = {}) {

    const errors = [];

    const archetypeSet = new Set(
        Array.isArray(archetypeAttributes)
            ? archetypeAttributes
            : [archetypeAttributes]
    );

    const budget = getAttributePointsBudget(age);

    let total = 0;

    for (const key of ATTRIBUTE_KEYS) {

        const value = allocation?.[key];

        if (!Number.isInteger(value)) {
            errors.push(`L'attribut « ${key} » doit être un entier.`);
            continue;
        }

        total += value;

        const isArchetypeAttribute = archetypeSet.has(key);
        const max = isArchetypeAttribute ? ATTRIBUTE_ARCHETYPE_MAX : ATTRIBUTE_MAX;

        if (value < ATTRIBUTE_MIN || value > max) {
            errors.push(
                `L'attribut « ${key} » doit être compris entre ${ATTRIBUTE_MIN} et ${max}` +
                (isArchetypeAttribute ? " (attribut d'archétype)." : ".")
            );
        }
    }

    if (total !== budget) {
        errors.push(
            `Le total des attributs doit être exactement ${budget} (actuellement ${total}).`
        );
    }

    return {
        valid: errors.length === 0,
        errors,
        budget,
        total
    };
}


/**
 * Valide une répartition des 12 Compétences à la création.
 *
 * @param {object} params
 * @param {Record<string,number>} params.allocation Les clés de
 *   SKILL_KEYS, chacune associée à sa valeur choisie (0 si
 *   omise).
 * @param {number} params.age Âge du personnage.
 * @param {string[]} params.archetypeSkills Les compétences
 *   d'archétype (jusqu'à 3, cf. p.172 encadré).
 *
 * @returns {{valid:boolean, errors:string[], budget:number, total:number}}
 */
export function validateSkillAllocation({
    allocation,
    age,
    archetypeSkills = []
} = {}) {

    const errors = [];
    const archetypeSet = new Set(archetypeSkills);
    const budget = getSkillPointsBudget(age);

    let total = 0;

    for (const key of SKILL_KEYS) {

        const value = allocation?.[key] ?? 0;

        if (!Number.isInteger(value)) {
            errors.push(`La compétence « ${key} » doit être un entier.`);
            continue;
        }

        total += value;

        const isArchetypeSkill = archetypeSet.has(key);
        const max = isArchetypeSkill ? SKILL_ARCHETYPE_MAX : SKILL_MAX;

        if (value < SKILL_MIN || value > max) {
            errors.push(
                `La compétence « ${key} » doit être comprise entre ${SKILL_MIN} et ${max}` +
                (isArchetypeSkill ? " (compétence d'archétype)." : ".")
            );
        }
    }

    if (total !== budget) {
        errors.push(
            `Le total des compétences doit être exactement ${budget} (actuellement ${total}).`
        );
    }

    return {
        valid: errors.length === 0,
        errors,
        budget,
        total
    };
}


const DEFAULT_RNG = Math.random;


/**
 * Mélange (Fisher-Yates) une copie du tableau donné. `rng` est
 * injectable pour permettre des tests déterministes (sinon
 * `Math.random`).
 */
function shuffle(array, rng = DEFAULT_RNG) {

    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}


/**
 * Génère une répartition aléatoire — mais toujours valide — des
 * 4 Attributs, pour le bouton « Aléatoire » de l'Assistant de
 * création de PNJ (règle actée avec le porteur du projet le
 * 28/09/2026 : l'Attribut d'archétype ne descend jamais sous 4).
 *
 * Le total produit est toujours exactement égal au budget de la
 * catégorie d'âge, et chaque valeur reste dans ses bornes
 * (2-4, ou 2-5 pour l'Attribut d'archétype) : le résultat est
 * donc systématiquement accepté par `validateAttributeAllocation`.
 *
 * @param {object} params
 * @param {number} params.age
 * @param {string|string[]} [params.archetypeAttributes]
 * @param {() => number} [params.rng] Injectable pour les tests.
 *
 * @returns {Record<string,number>}
 */
export function randomizeAttributeAllocation({
    age,
    archetypeAttributes = [],
    rng = DEFAULT_RNG
} = {}) {

    const budget = getAttributePointsBudget(age);

    const archetypeSet = new Set(
        Array.isArray(archetypeAttributes) ? archetypeAttributes : [archetypeAttributes]
    );

    const ARCHETYPE_FLOOR = 4;

    const allocation = Object.fromEntries(ATTRIBUTE_KEYS.map((key) => [key, ATTRIBUTE_MIN]));

    for (const key of archetypeSet) {
        if (key in allocation) {
            allocation[key] = Math.max(allocation[key], ARCHETYPE_FLOOR);
        }
    }

    let remaining = budget - Object.values(allocation).reduce((sum, value) => sum + value, 0);

    // Garde-fou (ne devrait jamais se produire avec les budgets
    // du livre) : si le plancher d'archétype dépasse le budget,
    // on le redescend plutôt que de produire une répartition
    // invalide.
    while (remaining < 0) {
        const key = [...archetypeSet].find((candidate) => allocation[candidate] > ATTRIBUTE_MIN);
        if (!key) break;
        allocation[key] -= 1;
        remaining += 1;
    }

    const caps = Object.fromEntries(
        ATTRIBUTE_KEYS.map((key) => [key, archetypeSet.has(key) ? ATTRIBUTE_ARCHETYPE_MAX : ATTRIBUTE_MAX])
    );

    while (remaining > 0) {
        const available = ATTRIBUTE_KEYS.filter((key) => allocation[key] < caps[key]);
        if (available.length === 0) break;
        const [pick] = shuffle(available, rng);
        allocation[pick] += 1;
        remaining -= 1;
    }

    return allocation;
}


/**
 * Génère une répartition aléatoire — mais toujours valide — des
 * 12 Compétences, pour le bouton « Aléatoire » de l'Assistant de
 * création de PNJ (règle actée le 28/09/2026 : une Compétence
 * d'archétype ne descend jamais sous 2).
 *
 * @param {object} params
 * @param {number} params.age
 * @param {string[]} [params.archetypeSkills]
 * @param {() => number} [params.rng] Injectable pour les tests.
 *
 * @returns {Record<string,number>}
 */
export function randomizeSkillAllocation({
    age,
    archetypeSkills = [],
    rng = DEFAULT_RNG
} = {}) {

    const budget = getSkillPointsBudget(age);
    const archetypeSet = new Set(archetypeSkills);

    const ARCHETYPE_FLOOR = 2;

    const allocation = Object.fromEntries(SKILL_KEYS.map((key) => [key, SKILL_MIN]));

    for (const key of archetypeSet) {
        if (key in allocation) {
            allocation[key] = Math.max(allocation[key], ARCHETYPE_FLOOR);
        }
    }

    let remaining = budget - Object.values(allocation).reduce((sum, value) => sum + value, 0);

    while (remaining < 0) {
        const key = [...archetypeSet].find((candidate) => allocation[candidate] > SKILL_MIN);
        if (!key) break;
        allocation[key] -= 1;
        remaining += 1;
    }

    const caps = Object.fromEntries(
        SKILL_KEYS.map((key) => [key, archetypeSet.has(key) ? SKILL_ARCHETYPE_MAX : SKILL_MAX])
    );

    while (remaining > 0) {
        const available = SKILL_KEYS.filter((key) => allocation[key] < caps[key]);
        if (available.length === 0) break;
        const [pick] = shuffle(available, rng);
        allocation[pick] += 1;
        remaining -= 1;
    }

    return allocation;
}


/**
 * Pioche `count` Talents distincts au hasard parmi `names`,
 * pour les boutons « Choix aléatoire » de l'étape Talents de
 * l'Assistant de création de PNJ.
 *
 * @param {string[]} names
 * @param {number} count
 * @param {() => number} [rng] Injectable pour les tests.
 *
 * @returns {string[]}
 */
export function pickRandomTalents(names, count, rng = DEFAULT_RNG) {
    return shuffle(names, rng).slice(0, Math.min(count, names.length));
}


/**
 * Valide le choix des deux Talents de départ (règles p.173) :
 * exactement deux Talents distincts, chacun pioché parmi les
 * Talents d'archétype ou les Talents généraux.
 *
 * @param {object} params
 * @param {string[]} params.selected Noms des Talents choisis.
 * @param {string[]} params.archetypeTalentNames
 * @param {string[]} params.generalTalentNames
 */
export function validateStartingTalentSelection({
    selected = [],
    archetypeTalentNames = [],
    generalTalentNames = []
} = {}) {

    const errors = [];

    if (selected.length !== STARTING_TALENT_COUNT) {
        errors.push(
            `Vous devez choisir exactement ${STARTING_TALENT_COUNT} Talents (actuellement ${selected.length}).`
        );
    }

    if (new Set(selected).size !== selected.length) {
        errors.push("Les deux Talents choisis doivent être différents.");
    }

    const allowed = new Set([...archetypeTalentNames, ...generalTalentNames]);

    for (const name of selected) {
        if (!allowed.has(name)) {
            errors.push(`« ${name} » n'est pas un Talent disponible pour cet archétype.`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
