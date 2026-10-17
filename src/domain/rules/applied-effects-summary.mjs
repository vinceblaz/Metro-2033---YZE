/**
 * Résumé lisible des effets réellement appliqués par un workflow
 * de mêlée (affiché dans la carte de Chat). Fonction pure : lit
 * uniquement le journal `workflow.application.steps`.
 *
 * Seules les étapes appliquées sont listées ; les étapes ignorées
 * (non choisies, aucun dégât...) n'apparaissent pas.
 */

const ATTRIBUTE_LABELS = {
    vigor: "Vigueur",
    agility: "Agilité",
    spirit: "Esprit",
    empathy: "Empathie"
};

function damageLine(who, step) {

    const label = ATTRIBUTE_LABELS[step.attribute] ?? step.attribute ?? "Attribut";

    return `${who} : ${label} −${Number(step.damage ?? 0)}`
        + ` (${Number(step.previous ?? 0)} → ${Number(step.current ?? 0)})`
        + (step.broken === true ? " — Brisé" : "");
}

export function summarizeMeleeAppliedEffects(steps, { attackerName = "L'attaquant", defenderName = "La cible" } = {}) {

    const s = steps ?? {};
    const lines = [];

    if (s.vigorDamage?.applied === true) {
        lines.push(damageLine(defenderName, s.vigorDamage));
    }

    if (s.agilityDamage?.applied === true) {
        lines.push(damageLine(defenderName, s.agilityDamage));
    }

    if (s.protectionDamage?.applied === true) {
        lines.push(
            `Protection de ${defenderName} dégradée de ${Number(s.protectionDamage.appliedDamage ?? 0)}`
        );
    }

    if (s.swapInitiative?.scheduled === true && s.swapInitiative.applied !== true) {
        lines.push(
            `Échange d'initiative programmé au round ${Number(s.swapInitiative.applyRound ?? 0)}`
        );
    }
    else if (s.swapInitiative?.applied === true) {
        lines.push(`Initiative échangée entre ${attackerName} et ${defenderName}`);
    }

    if (s.disarm?.applied === true) {
        lines.push(
            `${s.disarm.targetName ?? defenderName} est désarmé (arme lâchée, à arbitrer par le MJ)`
        );
    }

    if (s.knockdown?.applied === true) {
        const who = s.knockdown.targetName ?? defenderName;
        lines.push(
            s.knockdown.alreadyProne === true
                ? `${who} est déjà à terre`
                : `${who} est renversé`
        );
    }

    if (s.grapple?.applied === true) {
        lines.push(`Lutte engagée entre ${attackerName} et ${defenderName}`);
    }

    if (s.blockCounterAttack?.applied === true) {
        lines.push(`Contre-attaque — ${damageLine(attackerName, s.blockCounterAttack)}`);
    }

    if (s.blockDisarm?.applied === true) {
        lines.push(
            `${s.blockDisarm.targetName ?? attackerName} est désarmé par le blocage (arme lâchée, à arbitrer par le MJ)`
        );
    }

    return lines;
}


/**
 * Éclats de réussite choisis par l'attaquant de mêlée : le Chat
 * affiche ce qui a été décidé avant l'application des effets.
 */
export function summarizeMeleeStunts(stunts) {

    if (!stunts?.resolved) {
        return [];
    }

    const spent = Number(stunts.spent ?? 0);

    if (spent <= 0) {
        return [];
    }

    const effects = stunts.effects ?? {};
    const lines = [
        `Éclats : ${spent} réussite(s) dépensée(s) sur ${Number(stunts.available ?? 0)}`
    ];

    const vigor = Number(effects.vigorDamage ?? 0);
    const agility = Number(effects.agilityDamage ?? 0);

    if (vigor > 0) {
        lines.push(`+${vigor} ${vigor > 1 ? "dégâts" : "dégât"} de Vigueur`);
    }

    if (agility > 0) {
        lines.push(`+${agility} ${agility > 1 ? "dégâts" : "dégât"} d'Agilité`);
    }

    if (effects.swapInitiative === true) {
        lines.push("Échange d'initiative");
    }

    if (effects.disarm === true) {
        lines.push("Désarmement");
    }

    if (effects.knockdown === true) {
        lines.push("Renversement");
    }

    if (effects.grapple === true) {
        lines.push("Lutte");
    }

    return lines;
}


/**
 * Effets d'une attaque à distance, lus dans le ledger d'application
 * (opérations planifiées puis appliquées par « Résoudre les dégâts »).
 */
export function summarizeRangedAppliedEffects(ledger, targetName = "La cible") {

    const lines = [];

    for (const operation of ledger?.operations ?? []) {

        switch (operation.type) {

            case "attribute-damage":
                lines.push(
                    `${targetName} : ${ATTRIBUTE_LABELS[operation.attribute] ?? operation.attribute} −${Number(operation.amount ?? 0)}`
                );
                break;

            case "protection-damage": {
                const where =
                    operation.target === "body" ? " (corps)"
                        : operation.target === "helmet" ? " (casque)"
                            : "";
                lines.push(
                    `Protection de ${targetName}${where} dégradée de ${Number(operation.amount ?? 0)}`
                );
                break;
            }

            case "disarm":
                lines.push(`${targetName} est désarmé (arme lâchée, à arbitrer par le MJ)`);
                break;

            case "knockdown":
                lines.push(`${targetName} est renversé`);
                break;

            case "initiative-swap":
                lines.push("Échange d'initiative programmé au round suivant");
                break;

            case "explosion":
                lines.push("Explosion au contact");
                break;

            default:
                break;
        }

    }

    return lines;
}
