import {
    YZERollChat
} from "../chat/yze-roll-chat.mjs";

import {
    MeleeAttackWorkflowService
} from "../../combat/melee-attack-workflow-service.mjs";

import {
    MeleeAttackChat
} from "../../combat/melee-attack-chat.mjs";

import {
    RangedAttackPreparationService
} from "../../action-resolution/ranged-attack-preparation-service.mjs";

import {
    ActionModifierDialog
} from "../applications/action-modifier-dialog.mjs";

import {
    resolveEmbeddedWeaponAttack
} from "../../domain/rules/embedded-weapon-attack.mjs";

import {
    buildEmbeddedItemTooltip
} from "../../domain/rules/embedded-item-tooltip.mjs";

import {
    summarizeProtection
} from "../../domain/rules/embedded-protection-summary.mjs";


/**
 * Attaques depuis les fiches PNJ et Créature.
 *
 * Ces fiches n'ont pas la table de combat détaillée de la fiche
 * Personnage : chaque arme équipée y reçoit un bouton Frapper
 * (mêlée) ou Tirer (distance), qui emprunte exactement les mêmes
 * services que la fiche Personnage (préparation, fenêtre de
 * modificateurs, Actor.rollRangedAttack, workflow de mêlée).
 *
 * Rafale disponible pour les armes automatiques. Volontairement
 * absents (spécifiques au Personnage) : Améliorations d'arme, Stress.
 */


/**
 * ViewModel des armes embarquées, avec leur bouton d'attaque.
 */
export function prepareEmbeddedWeapons(actor) {

    return actor.items
        .filter(item => item.type === "weapon")
        .map(item => {

            const system = item.system ?? {};
            const isRanged = system.category === "ranged";
            const requiresAmmunition = system.requiresAmmunition === true;
            const assignedId = system.magazine?.sourceAmmoItemId ?? "";

            const available =
                (
                    isRanged
                    && requiresAmmunition
                    && typeof actor.getAvailableAmmunitionForWeapon === "function"
                )
                    ? actor.getAvailableAmmunitionForWeapon(item).map(ammo => ({
                        id: ammo.id,
                        name: ammo.name,
                        quantity: Number(ammo.system?.quantity ?? 0),
                        selected: ammo.id === assignedId
                    }))
                    : [];

            return {

                id: item.id,
                name: item.name,
                img: item.img,

                tooltip: buildEmbeddedItemTooltip(item),

                equipped: system.equipped === true,

                isRanged,
                damage: Number(system.damage ?? 0),
                bonus: Number(system.bonus?.current ?? 0),

                ammunition: {
                    required: isRanged && requiresAmmunition,
                    available
                },

                attack: resolveEmbeddedWeaponAttack(item)

            };

        });

}


/**
 * ViewModel des protections embarquées (équipables).
 */
export function prepareEmbeddedProtections(actor) {

    return actor.items
        .filter(item => item.type === "armor")
        .map(item => ({

            id: item.id,
            name: item.name,
            img: item.img,
            tooltip: buildEmbeddedItemTooltip(item),
            equipped: item.system?.equipped === true,
            summary: summarizeProtection(item.system)

        }));

}


/**
 * ViewModel des munitions embarquées.
 */
export function prepareEmbeddedAmmunition(actor) {

    return actor.items
        .filter(item => item.type === "ammunition")
        .map(item => ({

            id: item.id,
            name: item.name,
            img: item.img,
            tooltip: buildEmbeddedItemTooltip(item),
            quantity: Number(item.system?.quantity ?? 0)

        }));

}


/**
 * ViewModel des objets et outils embarqués (Équipement,
 * Consommable, Amélioration d'arme) : ils étaient déposables sur
 * la fiche mais n'y étaient pas listés.
 */
const GEAR_TYPE_LABELS = {
    equipment: "Équipement",
    consumable: "Consommable",
    weaponMod: "Amélioration"
};

export function prepareEmbeddedGear(actor) {

    return actor.items
        .filter(item => item.type in GEAR_TYPE_LABELS)
        .map(item => {

            const quantity = item.system?.quantity;

            return {

                id: item.id,
                name: item.name,
                img: item.img,
                tooltip: buildEmbeddedItemTooltip(item),
                typeLabel: GEAR_TYPE_LABELS[item.type],

                canEquip: item.type === "equipment",
                equipped: item.system?.equipped === true,

                quantityLabel:
                    (quantity && typeof quantity === "object")
                        ? `${Number(quantity.current ?? 0)}/${Number(quantity.max ?? 0)}`
                        : ""

            };

        });

}


/**
 * États Foundry suivis par le système (Asphyxié, Empoisonné,
 * Malade, En feu...), pour l'onglet Survie.
 */
export function prepareEmbeddedStatusEffects(actor) {

    return (CONFIG.Metro2033?.trackedStatusEffects ?? [])
        .map(({ id, name, img }) => ({
            id,
            name,
            img,
            active: actor.statuses?.has(id) === true
        }));

}


function getSingleTarget() {

    const targets = [...game.user.targets];

    if (targets.length === 0) {

        ui.notifications.warn(
            "Sélectionnez une cible avant d'effectuer l'attaque."
        );

        return null;

    }

    if (targets.length > 1) {

        ui.notifications.warn(
            "Une attaque ne peut cibler qu'un seul Token à la fois."
        );

        return null;

    }

    return targets[0];

}


async function launchRangedAttack(actor, weapon, target, burstFire = false) {

    const { preparation } =
        RangedAttackPreparationService.create(
            actor,
            weapon,
            { burstFire }
        );

    const resolved =
        await ActionModifierDialog.prompt(
            preparation,
            {
                title: `${actor.name} — ${burstFire ? "Rafale" : "Tir"} avec ${weapon.name}`,
                confirmLabel: burstFire ? "Tirer en rafale" : "Tirer"
            }
        );

    // Annuler / X : aucun jet, aucune munition, aucun message.
    if (!resolved) {
        return;
    }

    const totals = resolved.totals ?? {};

    const equipment =
        Number(totals.weapon ?? 0)
        + Number(totals.equipment ?? 0);

    const adjustment =
        Number(totals.talent ?? 0)
        + Number(totals.difficulty ?? 0)
        + Number(totals.modifier ?? 0)
        + Number(totals.stressBonus ?? 0);

    const result =
        await actor.rollRangedAttack(
            weapon,
            {
                target,
                burstFire,
                attributeOverride: resolved.base?.attribute ?? null,
                skillOverride: resolved.base?.skill ?? null,
                equipment,
                stressOverride: resolved.base?.stress ?? null,
                extraStressDie: Number(totals.extraStressDie ?? 0),
                bonus: Math.max(0, adjustment),
                penalty: Math.max(0, -adjustment),
                context: {
                    preparation: {
                        base: foundry.utils.deepClone(resolved.base ?? {}),
                        sources: foundry.utils.deepClone(resolved.sources ?? []),
                        selectedSources: foundry.utils.deepClone(resolved.selectedSources ?? []),
                        difficulty: foundry.utils.deepClone(resolved.difficulty ?? null),
                        totals: foundry.utils.deepClone(resolved.totals ?? {})
                    }
                }
            }
        );

    await YZERollChat.createMessage(result);

}


async function launchMeleeAttack(actor, weapon, target) {

    const combat = game.combat;

    if (!combat) {

        throw new Error(
            "Une attaque de mêlée nécessite un Combat actif."
        );

    }

    const defender =
        target.actor
        ?? target.document?.actor
        ?? null;

    if (!defender) {

        throw new Error(
            "L'Actor de la cible est introuvable."
        );

    }

    /*
     * Les Tokens PNJ / Créature sont le plus souvent non liés : leur
     * Actor est synthétique et ses Items ne se retrouvent pas via
     * game.actors. Le workflow doit donc connaître le Token attaquant
     * pour retrouver l'arme.
     */
    const attackerToken =
        actor.token
        ?? actor.getActiveTokens()[0]
        ?? null;

    const workflow =
        await MeleeAttackWorkflowService.create(
            combat,
            {
                attacker: actor,
                defender,
                weapon,
                attackerToken,
                defenderToken: target,
                canBlock: true
            }
        );

    await MeleeAttackChat.createMessage(
        combat,
        workflow
    );

}


/**
 * Lance l'attaque d'une arme embarquée.
 */
export async function launchEmbeddedWeaponAttack(
    actor,
    weaponId,
    attackType
) {

    const target = getSingleTarget();

    if (!target) {
        return;
    }

    const weapon = actor.items.get(weaponId);

    if (!weapon) {

        ui.notifications.error("Arme introuvable.");

        return;

    }

    try {

        if (attackType === "ranged" || attackType === "burst") {
            await launchRangedAttack(actor, weapon, target, attackType === "burst");
        }
        else if (attackType === "melee") {
            await launchMeleeAttack(actor, weapon, target);
        }
        else {
            throw new Error(`Type d'attaque inconnu : ${attackType}`);
        }

    }
    catch (error) {

        console.error("Métro 2033 | Erreur attaque :", error);

        ui.notifications.error(
            error.message ?? "Impossible d'effectuer l'attaque."
        );

    }

}


/**
 * Branche les boutons Frapper/Tirer et le commutateur
 * « équipée » d'une fiche PNJ ou Créature.
 */
export function bindEmbeddedWeaponListeners(sheet) {

    sheet.element
        .querySelectorAll("[data-action='weapon-attack']")
        .forEach(button => {

            button.addEventListener("click", async event => {

                event.preventDefault();

                await launchEmbeddedWeaponAttack(
                    sheet.actor,
                    button.dataset.itemId,
                    button.dataset.attackType
                );

            });

        });

    sheet.element
        .querySelectorAll(
            "[data-action='toggle-weapon-equipped'], [data-action='toggle-item-equipped']"
        )
        .forEach(button => {

            button.addEventListener("click", async event => {

                event.preventDefault();

                const item =
                    sheet.actor.items.get(button.dataset.itemId);

                if (!item) {
                    return;
                }

                await item.update({
                    "system.equipped":
                        item.system?.equipped !== true
                });

            });

        });

    sheet.element
        .querySelectorAll("select[data-action='assign-ammunition']")
        .forEach(select => {

            select.addEventListener("change", async event => {

                const weapon =
                    sheet.actor.items.get(select.dataset.itemId);

                const ammunitionId = event.currentTarget.value;

                // « Aucune » : pas de désaffectation (comme la fiche Personnage).
                if (!weapon || !ammunitionId) {
                    await sheet.render();
                    return;
                }

                const ammunition = sheet.actor.items.get(ammunitionId);

                if (!ammunition) {
                    ui.notifications.error("Munition introuvable.");
                    await sheet.render();
                    return;
                }

                try {

                    const result =
                        await sheet.actor.assignAmmunitionToWeapon(
                            weapon,
                            ammunition
                        );

                    if (result?.applied === false) {
                        ui.notifications.warn(
                            "Cette munition ne peut pas être affectée à cette arme."
                        );
                    }

                }
                catch (error) {

                    console.error(
                        "Métro 2033 | Erreur lors de l'affectation de la munition.",
                        error
                    );

                    ui.notifications.error(
                        "Impossible d'affecter cette munition."
                    );

                }

            });

        });

    sheet.element
        .querySelectorAll("[data-action='toggle-status-effect']")
        .forEach(control => {

            control.addEventListener("click", async event => {

                event.preventDefault();
                event.stopPropagation();

                if (!game.user?.isGM) {
                    ui.notifications?.warn(
                        "Seul le MJ peut activer ou désactiver cet état."
                    );
                    return;
                }

                const statusId = control.dataset.statusId;

                if (!statusId) {
                    return;
                }

                const active = sheet.actor.statuses?.has(statusId) === true;

                try {
                    await sheet.actor.toggleStatusEffect(statusId, { active: !active });
                }
                catch (error) {

                    console.error(
                        `Métro 2033 | Impossible de basculer l'état « ${statusId} ».`,
                        error
                    );

                    ui.notifications?.warn("Impossible de basculer cet état.");

                }

            });

        });

    bindSheetTabs(sheet);

}


/**
 * Onglets des fiches PNJ / Créature. L'onglet actif est mémorisé
 * sur la fiche pour survivre aux re-rendus.
 */
export function bindSheetTabs(sheet) {

    const tabs = sheet.element.querySelectorAll("[data-sheet-tab]");
    const panels = sheet.element.querySelectorAll("[data-sheet-tab-panel]");

    if (tabs.length === 0 || panels.length === 0) {
        return;
    }

    const activate = tabId => {

        sheet._activeSheetTab = tabId;

        tabs.forEach(tab => {
            const active = tab.dataset.sheetTab === tabId;
            tab.classList.toggle("is-active", active);
            tab.setAttribute("aria-selected", active ? "true" : "false");
        });

        panels.forEach(panel => {
            const active = panel.dataset.sheetTabPanel === tabId;
            panel.classList.toggle("is-active", active);
            panel.hidden = !active;
        });

    };

    activate(sheet._activeSheetTab ?? "skills");

    tabs.forEach(tab => {
        tab.addEventListener("click", event => {
            event.preventDefault();
            activate(tab.dataset.sheetTab);
        });
    });

}
