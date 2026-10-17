import { YZERoll }
    from "../rolls/yze-roll.mjs";


/**
 * Nombre maximum absolu de Push
 * autorisés dans Métro 2033.
 *
 * Aucun troisième Push n'est possible.
 */
export const METRO_MAX_PUSHES = 2;


/**
 * Force un jet selon les règles spécifiques
 * de Métro 2033.
 *
 * Premier Push :
 * - gratuit ;
 * - comportement YZE normal.
 *
 * Second Push :
 * - nécessite pour l'instant de subir 1 Stress ;
 * - le nouveau dé participe à la relance ;
 * - jamais de troisième Push.
 *
 * Les talents autorisant un second Push seront
 * branchés ici ultérieurement.
 *
 * rollerProvider : fonction optionnelle async
 * ({normal, stress}) => {drawDie, physicalRoll},
 * appelée une fois les dés à relancer décomptés,
 * permettant à une intégration (ex. Foundry) de
 * faire précéder la résolution d'un véritable jet
 * physique. Sans rollerProvider, comportement
 * historique inchangé (Math.random, via YZERoll).
 */
export async function pushMetroRoll(
    actor,
    result,
    {
        useStress = false,
        rollerProvider = null
    } = {}
) {

    if (!actor) {

        throw new TypeError(
            "pushMetroRoll nécessite un Actor."
        );

    }


    if (!result) {

        throw new TypeError(
            "pushMetroRoll nécessite un résultat de jet."
        );

    }


    // ============================================================
    // TROISIÈME PUSH : TOUJOURS INTERDIT
    // ============================================================

    if (
        result.pushCount
        >= METRO_MAX_PUSHES
    ) {

        throw new Error(
            "Un même jet ne peut jamais être forcé une troisième fois."
        );

    }


    // ============================================================
    // PREMIER PUSH
    // ============================================================

    if (result.pushCount === 0) {

        const counts =
            YZERoll.countPushDiceToRoll(
                result,
                {
                    additionalStressDice: 0
                }
            );


        const roller =
            rollerProvider
                ? await rollerProvider(counts)
                : null;


        const pushed =
            YZERoll.push(
                result,
                {
                    maxPushes: 1,

                    drawDie:
                        roller?.drawDie
                        ?? null
                }
            );


        if (roller?.physicalRoll) {

            pushed.physicalRoll =
                roller.physicalRoll;

        }


        /*
         * Des dés de Stress peuvent obtenir 6
         * pendant ce Push et disparaître.
         */
        const newlyEliminated =
            pushed.eliminatedStress
            - result.eliminatedStress;


        if (newlyEliminated > 0) {

            await actor.removeStress(
                newlyEliminated
            );

        }


        return pushed;

    }


    // ============================================================
    // SECOND PUSH
    // ============================================================

    if (!useStress) {

        throw new Error(
            "Le second Push nécessite de subir un dé de Stress."
        );

    }


    /*
     * Le Stress est appliqué AVANT la relance
     * afin que le nouveau dé participe au jet.
     */
    const stressChange =
        await actor.addStress(1);


    /*
     * Normalement : 1.
     *
     * Si le personnage était déjà à sa limite,
     * aucun sixième dé n'est réellement ajouté.
     * stressChange.exceedsLimit signalera plus tard
     * la règle Repousser ses limites.
     */
    const additionalStressDice =
        stressChange.added;


    const counts =
        YZERoll.countPushDiceToRoll(
            result,
            {
                additionalStressDice
            }
        );


    const roller =
        rollerProvider
            ? await rollerProvider(counts)
            : null;


    const pushed =
        YZERoll.push(
            result,
            {
                maxPushes:
                    METRO_MAX_PUSHES,

                additionalStressDice,

                /*
                 * Règle spéciale :
                 * lors du second Push,
                 * seules les afflictions de Stress
                 * de l'ultime relance sont comptées.
                 */
                resetStressAfflictions:
                    true,

                drawDie:
                    roller?.drawDie
                    ?? null
            }
        );


    if (roller?.physicalRoll) {

        pushed.physicalRoll =
            roller.physicalRoll;

    }


    const newlyEliminated =
        pushed.eliminatedStress
        - result.eliminatedStress;


    if (newlyEliminated > 0) {

        await actor.removeStress(
            newlyEliminated
        );

    }


    /*
     * Le context sert à conserver les informations
     * nécessaires à l'interface et aux règles suivantes.
     */
    pushed.context.metro = {

        ...(
            pushed.context.metro
            ?? {}
        ),

        secondPush: true,

        stressCost: true,

        stressAdded:
            stressChange.added,

        stressLimitExceeded:
            stressChange.exceedsLimit

    };


    return pushed;

}