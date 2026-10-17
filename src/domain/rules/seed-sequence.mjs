/**
 * Initialisation du système : exécution ordonnée des imports de
 * compendiums (module pur, sans Foundry).
 *
 * Chaque étape est idempotente (les imports retrouvent leurs
 * entrées par `seedKey` et les mettent à jour au lieu de les
 * dupliquer) : relancer la séquence après une mise à jour du
 * système met donc à jour les compendiums sans toucher aux
 * Acteurs et Items déjà présents dans le monde.
 */

/**
 * @param {Array<{key: string, label: string, requires?: string[],
 *   run: () => Promise<any>}>} steps
 * @param {{onStep?: Function}} options
 * @returns {Promise<Array<{key, label, status, result?, error?}>>}
 */
export async function runSeedSequence(
    steps,
    {
        onStep = null
    } = {}
) {

    const report = [];
    const failed = new Set();

    for (const [index, step] of steps.entries()) {

        const blocked =
            (step.requires ?? []).find(
                key => failed.has(key)
            );

        if (blocked) {

            failed.add(step.key);

            report.push({
                key: step.key,
                label: step.label,
                status: "skipped",
                error:
                    `Étape ignorée : « ${blocked} » a échoué.`
            });

            continue;

        }

        if (typeof onStep === "function") {
            onStep(step, index, steps.length);
        }

        try {

            const result =
                await step.run();

            report.push({
                key: step.key,
                label: step.label,
                status: "ok",
                result
            });

        }
        catch (error) {

            failed.add(step.key);

            report.push({
                key: step.key,
                label: step.label,
                status: "error",
                error:
                    error?.message
                    ?? String(error)
            });

        }

    }

    return report;

}


export function summarizeSeedReport(report) {

    const count =
        status =>
            report.filter(
                entry => entry.status === status
            ).length;

    const error = count("error");
    const skipped = count("skipped");

    return {
        ok: count("ok"),
        error,
        skipped,
        success: error === 0 && skipped === 0
    };

}


/**
 * Faut-il (re)lancer l'initialisation ? Vrai à la première
 * installation (aucune version mémorisée) et après toute mise à
 * jour du système (version différente).
 */
export function needsInitialization({
    installedVersion,
    currentVersion
} = {}) {

    if (!currentVersion) {
        return false;
    }

    return installedVersion !== currentVersion;

}
