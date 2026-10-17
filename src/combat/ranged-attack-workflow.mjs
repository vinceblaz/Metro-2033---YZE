/**
 * États nommés de l'application d'une attaque à distance
 * (harmonisation UX du Tir sur le gabarit du Corps-à-corps,
 * décision D2 de la Bible v0.9.3 §163).
 *
 * Avant ce chantier, le Tir appliquait ses conséquences
 * automatiquement dès que son `ApplicationLedger` (cf.
 * `domain/rules/ranged-attack-application-ledger.mjs`) ne
 * contenait plus aucune opération bloquée (répartition de
 * Protection, désarmement) — sans aucun état nommé, le seul
 * indicateur étant la liste `blockedOperations` elle-même.
 *
 * Ce module introduit un état explicite supplémentaire,
 * **READY**, entre « plus aucun blocage » et « appliqué » :
 * l'application réelle (dégâts, Protection, effets) n'a
 * désormais lieu qu'après un clic explicite sur le bouton
 * « Résoudre les dégâts » — systématiquement, y compris pour
 * un Tir simple sans Protection ni désarmement en jeu — à
 * l'image du bouton « Résoudre les dommages / effets » du
 * Corps-à-corps (`combat/melee-attack-workflow.mjs`).
 *
 * Volontairement plus léger que le gabarit du Corps-à-corps :
 * le Tir ne connaît ni blocage réciproque, ni prouesses de
 * blocage, ni journal de 9 étapes d'application nommées — son
 * `ApplicationLedger` existant (une simple liste d'opérations
 * avec un statut `pending`/`blocked`) joue déjà ce rôle de
 * journal. Ce module ne fait donc que nommer l'état global
 * qui en découle, sans réécrire le ledger lui-même.
 *
 * Fonctions pures :
 *
 * - aucun Actor Foundry ;
 * - aucun ChatMessage ;
 * - aucune mutation ;
 * - aucune application effective des conséquences.
 */


export const RANGED_ATTACK_APPLICATION_STATUSES =
    Object.freeze({

        BLOCKED:
            "blocked",

        READY:
            "ready",

        APPLIED:
            "applied"

    });


/**
 * Dérive l'état nommé de l'application d'une attaque à
 * distance à partir de la liste des opérations encore
 * bloquées dans son `ApplicationLedger`.
 *
 * Ne renvoie jamais `APPLIED` : seul l'appelant (qui sait si
 * le clic de validation manuelle a déjà eu lieu) peut affirmer
 * que l'application est terminée.
 */
export function resolveRangedAttackApplicationStatus({
    blockedOperations
} = {}) {

    if (
        !Array.isArray(
            blockedOperations
        )
    ) {

        throw new TypeError(
            "La liste des opérations bloquées doit être un tableau."
        );

    }


    return blockedOperations.length > 0
        ? RANGED_ATTACK_APPLICATION_STATUSES.BLOCKED
        : RANGED_ATTACK_APPLICATION_STATUSES.READY;

}


/**
 * Une carte de Chat de Tir doit-elle afficher le bouton de
 * validation manuelle « Résoudre les dégâts » ?
 *
 * Vrai uniquement dans l'état READY : plus aucun blocage, mais
 * l'application n'a pas encore eu lieu.
 */
export function canApplyReadyRangedAttack({
    status
} = {}) {

    return (
        status
        === RANGED_ATTACK_APPLICATION_STATUSES.READY
    );

}


/**
 * L'application d'une attaque à distance est-elle
 * définitivement terminée (plus aucune action possible) ?
 */
export function isRangedAttackApplicationCompleted({
    status
} = {}) {

    return (
        status
        === RANGED_ATTACK_APPLICATION_STATUSES.APPLIED
    );

}
