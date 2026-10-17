/**
 * Assemble les données d'un Actor « character » (et de ses
 * Items embarqués : Archétype + 2 Talents de départ) à partir
 * d'un brouillon complété de l'Assistant de création de
 * Personnage.
 *
 * Fonctions pures : aucune dépendance à `foundry.*`. Le
 * DataModel réellement persisté est `CharacterDataModel`
 * (data/actors/character-model.mjs) ; ce module ne fait que
 * produire un objet conforme à son schéma, prêt pour
 * `Actor.create(actorData)` puis
 * `actor.createEmbeddedDocuments("Item", itemsData)`.
 *
 * Aucune donnée n'est inventée : l'Archétype et les Talents
 * sont repris tels quels du catalogue déjà transcrit du livre
 * (talent-archetype-catalog.mjs). Si un Talent choisi ne s'y
 * trouve pas (anomalie de brouillon), il est signalé dans
 * `warnings` plutôt que fabriqué.
 */

import { buildTalentItemData, buildArchetypeItemData }
    from "./talent-archetype-item-builder.mjs";

import { GENERAL_TALENTS, ARCHETYPE_TALENTS, ARCHETYPES }
    from "./talent-archetype-catalog.mjs";


/**
 * Recherche un Talent (par nom) éligible pour un archétype
 * donné : en priorité parmi ses Talents d'archétype, sinon
 * parmi les Talents généraux.
 *
 * @returns Une entrée de GENERAL_TALENTS / ARCHETYPE_TALENTS,
 *   ou `null` si le nom ne correspond à aucun Talent
 *   disponible pour cet archétype.
 */
export function resolveStartingTalentCatalogEntry(name, archetypeKey) {

    const archetypeMatch = ARCHETYPE_TALENTS.find(
        (talent) => talent.name === name && talent.archetypeId === archetypeKey
    );

    if (archetypeMatch) {
        return archetypeMatch;
    }

    return GENERAL_TALENTS.find((talent) => talent.name === name) ?? null;
}


/**
 * Construit les données d'un Actor « character » et de ses
 * Items embarqués (Archétype + Talents de départ) à partir
 * d'un brouillon de création complet.
 *
 * @param {object} draft Voir
 *   `character-creation-wizard-view-model.mjs#createInitialDraft`.
 * @param {{actorId:string, text:string}[]} [draft.bonds]
 *   `actorId` est l'UUID Foundry de l'autre PJ.
 *
 * @returns {{
 *   actorData: object,
 *   itemsData: object[],
 *   warnings: string[]
 * }}
 */
export function buildCharacterCreationActorData(draft) {

    const warnings = [];

    const archetypeText = ARCHETYPES.find((entry) => entry.key === draft.archetypeKey) ?? null;

    const itemsData = [];

    if (archetypeText) {

        const archetypeItemData = buildArchetypeItemData(archetypeText);

        archetypeItemData.system.configuration = {
            attribute: draft.soldierAttributeChoice ?? "",
            skill: draft.soldierSkillChoice ?? ""
        };

        itemsData.push(archetypeItemData);

    } else {
        warnings.push(`Archétype « ${draft.archetypeKey} » introuvable dans le catalogue.`);
    }

    for (const talentName of draft.talents ?? []) {

        const entry = resolveStartingTalentCatalogEntry(talentName, draft.archetypeKey);

        if (!entry) {
            warnings.push(`Talent « ${talentName} » introuvable dans le catalogue : non ajouté.`);
            continue;
        }

        itemsData.push(buildTalentItemData(entry));
    }

    const actorData = {

        name: draft.name?.trim() || "Personnage sans nom",
        type: "character",

        system: {

            identity: {
                age: draft.age,
                gender: draft.gender ?? "",
                appearance: draft.appearance ?? "",
                biography: ""
            },

            /*
             * `system.attributes.<clé>` est un objet
             * `{value, max}` (comme sur la fiche de Personnage),
             * contrairement aux Compétences qui sont de simples
             * nombres. À la création, `max` est fixé à la même
             * valeur que `value` : rien n'a encore réduit le
             * plafond de l'Attribut.
             */
            attributes: Object.fromEntries(
                Object.entries(draft.attributes ?? {}).map(([key, value]) => [
                    key,
                    { value, max: value }
                ])
            ),
            skills: { ...draft.skills },

            narrative: {
                pride: {
                    description: draft.pride ?? "",
                    used: 0
                },
                shame: draft.shame ?? "",
                relationships: (draft.bonds ?? []).map((bond) => ({
                    actor: bond.actorId ?? "",
                    type: "pj",
                    description: bond.text ?? ""
                }))
            }
        }
    };

    return { actorData, itemsData, warnings };
}
