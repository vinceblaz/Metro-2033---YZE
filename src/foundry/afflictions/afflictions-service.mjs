/**
 * Orchestration de la RÉPARTITION DES AFFLICTIONS d'un jet
 * (livre p.177, 190, 199).
 *
 * Appelée par les trois points de câblage, côté client qui a
 * cliqué (propriétaire ou MJ) :
 *
 * - jet générique : à la finalisation du jet ;
 * - tir          : après « Résoudre les dégâts » ;
 * - mêlée        : après « Résoudre les dommages / effets ».
 *
 * Déroulement :
 *
 * 1. calcul du nombre d'afflictions disponibles (Talents
 *    Imperturbable & co. déjà retranchés) ; 0 -> rien ;
 * 2. garde d'idempotence (une répartition par jet) ;
 * 3. fenêtre de répartition ; fermeture sans confirmer ->
 *    TOUT en dégâts d'attribut (décision du porteur) ;
 * 4. application via actor.resolveRollAfflictions ;
 * 5. résumé dans un message de chat séparé.
 *
 * IDEMPOTENCE — choix et raison :
 *
 * Le jet (clé = id du ChatMessage, ou « melee:<workflowId> »)
 * est enregistré dans un flag de l'ACTOR
 * (metro-2033-yze.afflictionsResolved, tableau borné de clés).
 * L'Actor est celui dont on applique de toute façon les
 * afflictions (on lui retire de l'attribut, on lui ajoute du
 * Stress) : le client qui clique en est propriétaire ou MJ, donc
 * l'écriture est toujours permise. On N'ÉCRIT JAMAIS dans le
 * ChatMessage (un joueur ne peut pas modifier un message dont il
 * n'est pas l'auteur) ni dans le Combat.
 *
 * La clé est enregistrée AVANT d'ouvrir la fenêtre : si la
 * fenêtre ou l'application échoue ensuite, rien n'est jamais
 * appliqué deux fois (au pire, des afflictions non appliquées,
 * signalées par une erreur). Un Set mémoire protège en plus
 * contre deux appels simultanés dans le même client (le flag
 * est asynchrone). Si l'enregistrement du flag échoue, on
 * n'applique rien.
 *
 * Aucune erreur n'est propagée : la résolution des dégâts qui
 * précède ne doit jamais être empêchée.
 */

import {
    computeAvailableAfflictions,
    getAttributeLabel,
    getDefaultAllocation,
    hasResolvedRollKey,
    isEquipmentAfflictionAllowed,
    markResolvedRollKey,
    validateAllocationDraft,
    describeResolution
} from "../../domain/rules/affliction-allocation.mjs";

import {
    AfflictionAllocationDialog
} from "./affliction-allocation-dialog.mjs";


const SYSTEM_ID =
    "metro-2033-yze";

export const AFFLICTIONS_RESOLVED_FLAG =
    "afflictionsResolved";


/** Clés en cours de traitement dans CE client. */
const inFlightKeys =
    new Set();


function escapeHTML(
    value
) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/**
 * Contenu HTML du message de résumé (pur).
 */
export function renderAfflictionSummaryContent({
    actorName,
    rollLabel = null,
    total = 0,
    lines = [],
    closedWithoutChoice = false
} = {}) {

    const items =
        lines
            .map(
                line => `<li>${escapeHTML(line)}</li>`
            )
            .join("");

    return `
        <div class="metro-chat-survival-card metro-chat-afflictions-card">
            <header class="metro-chat-survival-card-header">
                <strong>Afflictions — ${escapeHTML(actorName)}</strong>
            </header>
            ${
                rollLabel
                    ? `<div class="metro-chat-survival-card-dice">${escapeHTML(rollLabel)}</div>`
                    : ""
            }
            <div class="metro-chat-survival-card-summary">
                ${escapeHTML(total)} affliction${total > 1 ? "s" : ""} répartie${total > 1 ? "s" : ""}.
                ${
                    closedWithoutChoice
                        ? "<br><em>Fenêtre fermée sans répartir : tout a été appliqué en dégâts d'attribut.</em>"
                        : ""
                }
            </div>
            <ul class="metro-chat-survival-card-summary">${items}</ul>
        </div>
    `;

}


function createDefaultDependencies() {

    return {

        promptAllocation:
            options =>
                AfflictionAllocationDialog.prompt(
                    options
                ),

        createChatMessage:
            data =>
                ChatMessage.create(
                    data
                ),

        notifyError:
            message =>
                ui.notifications?.error(
                    message
                ),

        logError:
            (...args) =>
                console.error(
                    ...args
                )

    };

}


/**
 * @param {object}  params
 * @param {Actor}   params.actor      Personnage dont le jet est résolu.
 * @param {YZEResult} params.result   Résultat du jet (forcé ou non).
 * @param {ChatMessage|null} params.message  Message du jet (sert de clé).
 * @param {string|null} params.rollLabel     Intitulé du jet (résumé).
 * @param {string|null} params.rollKey       Clé explicite (mêlée).
 * @returns {Promise<object|null>} null si rien n'a été fait.
 */
export async function resolveAfflictionsForRoll(
    {
        actor,
        result,
        message = null,
        rollLabel = null,
        rollKey = null
    } = {},
    dependencies = {}
) {

    const deps = {
        ...createDefaultDependencies(),
        ...dependencies
    };


    try {

        if (
            !actor
            || !result
            || actor.isCharacter !== true
            || actor.isOwner === false
        ) {

            return null;

        }


        const available =
            computeAvailableAfflictions({
                total:
                    actor.getAvailableAfflictions(
                        result
                    ),
                ignored: 0
            });

        if (available <= 0) {

            return null;

        }


        const key =
            rollKey
            ?? message?.id
            ?? null;

        if (!key) {

            deps.logError(
                "Metro 2033 | Afflictions : aucune clé de jet disponible, répartition ignorée."
            );

            return null;

        }


        const memoryKey =
            `${actor.uuid ?? actor.id}|${key}`;

        if (inFlightKeys.has(memoryKey)) {

            return null;

        }

        inFlightKeys.add(memoryKey);


        // ----- Idempotence persistante (flag de l'Actor) ----------

        const alreadyResolved =
            actor.getFlag(
                SYSTEM_ID,
                AFFLICTIONS_RESOLVED_FLAG
            );

        if (hasResolvedRollKey(alreadyResolved, key)) {

            return null;

        }

        try {

            await actor.setFlag(
                SYSTEM_ID,
                AFFLICTIONS_RESOLVED_FLAG,
                markResolvedRollKey(
                    alreadyResolved,
                    key
                )
            );

        }
        catch (error) {

            deps.logError(
                "Metro 2033 | Afflictions : impossible d'enregistrer la garde d'idempotence, aucune affliction appliquée.",
                error
            );

            return null;

        }


        // ----- Contexte de la fenêtre ------------------------------

        const attributeId =
            result.context?.attribute
            ?? null;

        const attributeLabel =
            getAttributeLabel(
                attributeId
            );

        const equipmentAllowed =
            isEquipmentAfflictionAllowed(
                result
            );

        const equipmentItem =
            equipmentAllowed
                ? actor.items?.get?.(
                    result.context.equipment.itemId
                )
                : null;

        // Équipement introuvable : on ne le propose pas.
        const equipment = {
            allowed:
                equipmentAllowed
                && Boolean(equipmentItem),
            label:
                equipmentItem?.name
                ?? null
        };


        // ----- Fenêtre ---------------------------------------------

        const defaultAllocation =
            getDefaultAllocation(
                available
            );

        let allocation = null;

        try {

            allocation =
                await deps.promptAllocation({
                    available,
                    attributeLabel,
                    equipment,
                    rollLabel,
                    actorName:
                        actor.name
                });

        }
        catch (error) {

            deps.logError(
                "Metro 2033 | Afflictions : échec de la fenêtre de répartition, application par défaut (dégâts d'attribut).",
                error
            );

            allocation = null;

        }


        let closedWithoutChoice =
            allocation === null
            || allocation === undefined;

        if (!closedWithoutChoice) {

            const check =
                validateAllocationDraft({
                    available,
                    draft:
                        allocation,
                    equipmentAllowed:
                        equipment.allowed
                });

            if (check.valid) {

                allocation =
                    check.allocation;

            }
            else {

                deps.logError(
                    "Metro 2033 | Afflictions : répartition invalide reçue de la fenêtre, application par défaut.",
                    check.errors
                );

                closedWithoutChoice = true;

            }

        }

        if (closedWithoutChoice) {

            allocation =
                defaultAllocation;

        }


        // ----- Application -----------------------------------------

        let resolution;

        try {

            resolution =
                await actor.resolveRollAfflictions(
                    result,
                    allocation
                );

        }
        catch (error) {

            deps.logError(
                "Metro 2033 | Afflictions : impossible d'appliquer la répartition",
                error
            );

            deps.notifyError(
                error?.message
                ?? "Impossible d'appliquer les afflictions."
            );

            return null;

        }


        // ----- Résumé ------------------------------------------------

        const lines =
            describeResolution(
                resolution,
                {
                    attributeLabel,
                    attributeAfter:
                        attributeId
                            ? actor.getAttribute(
                                attributeId
                            )
                            : null,
                    attributeRequested:
                        allocation.attribute,
                    composureRequested:
                        allocation.composure
                }
            );

        try {

            await deps.createChatMessage({

                speaker:
                    typeof ChatMessage !== "undefined"
                    && typeof ChatMessage.getSpeaker === "function"
                        ? ChatMessage.getSpeaker({ actor })
                        : { alias: actor.name },

                content:
                    renderAfflictionSummaryContent({
                        actorName:
                            actor.name,
                        rollLabel,
                        total:
                            resolution.total,
                        lines,
                        closedWithoutChoice
                    })

            });

        }
        catch (error) {

            deps.logError(
                "Metro 2033 | Afflictions : impossible de poster le résumé",
                error
            );

        }


        return {
            available,
            allocation,
            resolution,
            closedWithoutChoice
        };

    }
    catch (error) {

        deps.logError(
            "Metro 2033 | Afflictions : erreur inattendue",
            error
        );

        return null;

    }

}
