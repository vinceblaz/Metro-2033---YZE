/**
 * Règles d'acquisition des Embedded Items d'un Actor.
 *
 * Ce module ne dépend pas de Foundry.
 *
 * Il décide uniquement si un Item peut être ajouté
 * à partir de données métier déjà normalisées.
 */


/**
 * Vérifie si un Talent peut être acquis.
 *
 * Convention :
 *
 * - system.key est l'identifiant métier stable
 *   de la définition d'un Talent ;
 *
 * - plusieurs Embedded Items peuvent partager
 *   le même system.key ;
 *
 * - le nombre d'instances possédées avec ce key
 *   représente le niveau actuel du Talent ;
 *
 * - une nouvelle acquisition est autorisée
 *   tant que ce niveau reste inférieur
 *   au maxLevel de la définition ;
 *
 * - le nom et l'identifiant Foundry de l'Item
 *   ne participent jamais à cette comparaison.
 */
export function canAcquireTalent({
    talent,
    ownedTalents = []
} = {}) {

    const key =
        String(
            talent?.key
            ?? ""
        ).trim();


    /*
     * Une donnée sans identité métier exploitable
     * n'est pas bloquée par cette règle.
     *
     * La validation structurelle du Talent relève
     * de son DataModel.
     */
    if (!key) {

        return {
            allowed: true,
            reason: null
        };

    }


    // ========================================================
    // NIVEAU MAXIMUM
    // ========================================================

    const rawMaxLevel =
        Number(
            talent?.maxLevel
            ?? 1
        );


    /*
     * Le DataModel garantit normalement 1 à 5.
     *
     * La règle métier reste néanmoins défensive
     * afin de rester indépendante de Foundry.
     */
    const maxLevel =
        Number.isFinite(rawMaxLevel)
            ? Math.min(
                5,
                Math.max(
                    1,
                    Math.trunc(rawMaxLevel)
                )
            )
            : 1;


    // ========================================================
    // NIVEAU ACTUEL
    // ========================================================

    const currentLevel =
        ownedTalents.filter(
            ownedTalent =>
                String(
                    ownedTalent?.key
                    ?? ""
                ).trim()
                === key
        ).length;


    // ========================================================
    // NIVEAU MAXIMUM ATTEINT
    // ========================================================

    if (
        currentLevel
        >= maxLevel
    ) {

        return {
            allowed: false,
            reason: "talent-max-level-reached",
            key,
            currentLevel,
            maxLevel
        };

    }


    // ========================================================
    // ACQUISITION AUTORISÉE
    // ========================================================

    return {
        allowed: true,
        reason: null,
        key,
        currentLevel,
        nextLevel:
            currentLevel + 1,
        maxLevel
    };

}

/**
 * Vérifie si un Archétype peut être acquis.
 *
 * Convention :
 *
 * - un Actor peut posséder zéro ou un seul
 *   Embedded Item de type "archetype" ;
 * - la présence d'un Archétype existant suffit
 *   à refuser toute nouvelle acquisition ;
 * - il n'existe aucun remplacement automatique ;
 * - la comparaison par system.key n'est donc
 *   pas nécessaire ici.
 */
export function canAcquireArchetype({
    ownedArchetypes = [],
    incomingArchetypes = null
} = {}) {

    const ownedCount =
        ownedArchetypes.length;


    // ========================================================
    // APPEL HISTORIQUE / ACQUISITION UNITAIRE
    // ========================================================

    if (incomingArchetypes === null) {

        if (ownedCount > 0) {
            return {
                allowed: false,
                reason: "archetype-already-owned"
            };
        }

        return {
            allowed: true,
            reason: null
        };
    }


    const incomingCount =
        incomingArchetypes.length;


    // ========================================================
    // ARCHÉTYPE DÉJÀ POSSÉDÉ
    // ========================================================

    if (
        ownedCount > 0
        && incomingCount > 0
    ) {
        return {
            allowed: false,
            reason: "archetype-already-owned"
        };
    }


    // ========================================================
    // PLUSIEURS ARCHÉTYPES DANS LA MÊME ACQUISITION
    // ========================================================

    if (incomingCount > 1) {
        return {
            allowed: false,
            reason: "multiple-archetypes"
        };
    }


    return {
        allowed: true,
        reason: null
    };
}