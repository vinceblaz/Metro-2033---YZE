/**
 * Décisions prises lors de la préparation d'un jet (difficulté,
 * sources cochées, modificateur manuel, Stress volontaire), sous
 * forme de lignes lisibles pour la carte de Chat : le Chat est la
 * transcription des règles appliquées. Fonction pure.
 */

const SOURCE_TYPE_LABELS = {
    weapon: "Arme",
    equipment: "Équipement",
    talent: "Talent"
};

function signed(value) {
    return value > 0 ? `+${value}` : `−${Math.abs(value)}`;
}

function dice(value) {
    return Math.abs(value) > 1 ? "dés" : "dé";
}

export function summarizeRollDecisions(preparation) {

    const lines = [];

    if (!preparation) {
        return lines;
    }

    const difficulty = preparation.difficulty;

    if (difficulty?.label) {

        const modifier = Number(difficulty.modifier ?? 0);

        lines.push(
            modifier === 0
                ? `Difficulté : ${difficulty.label}`
                : `Difficulté : ${difficulty.label} (${signed(modifier)} ${dice(modifier)})`
        );
    }

    for (const source of preparation.selectedSources ?? []) {

        const type = SOURCE_TYPE_LABELS[source.type] ?? "Source";
        const bonus = Number(source.bonus ?? 0);

        lines.push(
            bonus === 0
                ? `${type} — ${source.label}`
                : `${type} — ${source.label} : ${signed(bonus)} ${dice(bonus)}`
        );
    }

    const totals = preparation.totals ?? {};
    const manual = Number(totals.modifier ?? 0);

    if (manual !== 0) {
        lines.push(`Modificateur manuel : ${signed(manual)} ${dice(manual)}`);
    }

    if (Number(totals.stressBonus ?? 0) > 0) {
        lines.push(
            `Stress volontaire : +${Number(totals.stressBonus)} dés`
            + ` et ${Number(totals.extraStressDie ?? 0)} dé de Stress supplémentaire`
        );
    }

    return lines;
}
