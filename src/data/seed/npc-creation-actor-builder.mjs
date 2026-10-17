/**
 * Assemble les données d'un Actor « npc » (et de ses Items
 * embarqués : Talents de départ) à partir d'un brouillon
 * complété de l'Assistant de création de PNJ.
 *
 * Fonctions pures : aucune dépendance à `foundry.*`. Le
 * DataModel réellement persisté est `NpcDataModel`
 * (data/actors/npc-model.mjs) ; ce module ne fait que produire
 * un objet conforme à son schéma, prêt pour
 * `Actor.create(actorData)` puis
 * `actor.createEmbeddedDocuments("Item", itemsData)`.
 *
 * Contrairement au Personnage, `NpcDataModel` ne prévoit
 * volontairement aucun champ Archétype (cf. commentaire du
 * DataModel : « Volontairement absents de ce DataModel, à la
 * différence du Personnage : progression par XP, Archétype... »).
 * L'Archétype choisi dans l'assistant sert donc uniquement,
 * pendant la création, à calculer les budgets de points,
 * l'Attribut/les Compétences marqués « d'archétype », les
 * Talents proposés et le texte d'équipement de départ — puis il
 * est simplement noté en texte dans `system.identity.role`, à
 * l'identique de la convention déjà utilisée pour les PNJ de
 * Factions/Stations (« Chef du triumvirat de Petchatniki —
 * Archétype Diplomate », etc.). Aucun Item Archétype n'est créé.
 *
 * Aucune donnée n'est inventée : les Talents sont repris tels
 * quels du catalogue déjà transcrit du livre
 * (talent-archetype-catalog.mjs). Si un Talent choisi ne s'y
 * trouve pas (anomalie de brouillon), il est signalé dans
 * `warnings` plutôt que fabriqué.
 */

import { buildTalentItemData }
    from "./talent-archetype-item-builder.mjs";

import { ARCHETYPES }
    from "./talent-archetype-catalog.mjs";

import { resolveStartingTalentCatalogEntry }
    from "./character-creation-actor-builder.mjs";

export { resolveStartingTalentCatalogEntry };


/**
 * Construit les données d'un Actor « npc » et de ses Items
 * embarqués (Talents de départ) à partir d'un brouillon de
 * création complet.
 *
 * @param {object} draft Voir
 *   `npc-creation-wizard-view-model.mjs#createInitialNpcDraft`.
 *
 * @returns {{
 *   actorData: object,
 *   itemsData: object[],
 *   warnings: string[]
 * }}
 */
export function buildNpcCreationActorData(draft) {

    const warnings = [];

    const archetypeText = ARCHETYPES.find((entry) => entry.key === draft.archetypeKey) ?? null;

    const itemsData = [];

    for (const talentName of draft.talents ?? []) {

        const entry = resolveStartingTalentCatalogEntry(talentName, draft.archetypeKey);

        if (!entry) {
            warnings.push(`Talent « ${talentName} » introuvable dans le catalogue : non ajouté.`);
            continue;
        }

        itemsData.push(buildTalentItemData(entry));
    }

    if (!archetypeText) {
        warnings.push(`Archétype « ${draft.archetypeKey} » introuvable dans le catalogue.`);
    }

    const role = archetypeText ? `Archétype : ${archetypeText.name}` : "";

    const actorData = {

        name: draft.name?.trim() || "PNJ sans nom",
        type: "npc",

        system: {

            identity: {
                role,
                /*
                 * Pas de Genre/Apparence collectés par l'assistant
                 * (décision actée le 28/09/2026 : ces informations
                 * ne sont pas restituées sur la fiche PNJ) — le MJ
                 * peut toujours remplir ce champ à la main ensuite.
                 */
                description: ""
            },

            /*
             * `system.attributes.<clé>` est un objet
             * `{value, max}`, comme sur la fiche de Personnage.
             */
            attributes: Object.fromEntries(
                Object.entries(draft.attributes ?? {}).map(([key, value]) => [
                    key,
                    { value, max: value }
                ])
            ),
            skills: { ...draft.skills },

            special: "",
            gmNotes: ""
        }
    };

    return { actorData, itemsData, warnings };
}
