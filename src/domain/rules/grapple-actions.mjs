/**
 * Règles d'actions lorsqu'une saisie est active.
 *
 * Cette couche ne dépend pas de Foundry.
 *
 * Règles :
 *
 * - La cible saisie :
 *   - ne peut pas se déplacer ;
 *   - ne peut effectuer qu'une tentative de libération ;
 *   - la libération coûte une action lente.
 *
 * - Le saisisseur :
 *   - peut maintenir la saisie ;
 *   - peut relâcher volontairement la cible ;
 *   - peut effectuer une attaque de saisie ;
 *   - l'attaque de saisie coûte une action rapide.
 */


/**
 * Identifiants des actions liées à la saisie.
 */
export const GRAPPLE_ACTIONS =
    Object.freeze({

        ESCAPE:
            "grapple-escape",

        ATTACK:
            "grapple-attack",

        RELEASE:
            "grapple-release"

    });


/**
 * Retourne l'identifiant d'un participant
 * enregistré dans l'état de saisie.
 *
 * Compatible avec les anciennes structures
 * utilisant `id` et les nouvelles utilisant
 * `actorId`.
 */
function getParticipantActorId(
    participant
) {

    return (
        participant?.actorId
        ?? participant?.id
        ?? null
    );

}


/**
 * Vérifie qu'une saisie est active.
 */
function isActiveGrapple(
    grapple
) {

    return (
        grapple
        && grapple.state
        && grapple.state.active === true
    );

}


/**
 * Détermine le rôle d'un Actor
 * dans une saisie active.
 *
 * Retour :
 *
 * "attacker"
 * "target"
 * null
 */
export function getGrappleRole(
    grapple,
    actor
) {

    if (
        !isActiveGrapple(grapple)
        || !actor
    ) {

        return null;

    }


    const actorId =
        actor.id
        ?? actor.actorId
        ?? null;


    if (!actorId) {

        return null;

    }


    const attackerId =
        getParticipantActorId(
            grapple.state.attacker
        );


    const targetId =
        getParticipantActorId(
            grapple.state.target
        );


    if (
        actorId === attackerId
    ) {

        return "attacker";

    }


    if (
        actorId === targetId
    ) {

        return "target";

    }


    return null;

}


/**
 * Détermine si un Actor peut se déplacer
 * pendant cette saisie.
 */
export function canMoveDuringGrapple(
    grapple,
    actor
) {

    const role =
        getGrappleRole(
            grapple,
            actor
        );


    /*
     * Un Actor extérieur à cette saisie
     * n'est pas concerné par cette règle.
     */
    if (!role) {

        return true;

    }


    /*
     * La cible saisie ne peut pas se déplacer.
     *
     * Pour l'instant nous ne bloquons pas
     * le déplacement du saisisseur ici :
     * cette fonction représente uniquement
     * la restriction explicitement imposée
     * à la cible.
     */
    return role !== "target";

}


/**
 * Détermine si une action est autorisée
 * pendant une saisie active.
 */
export function canPerformActionDuringGrapple(
    grapple,
    actor,
    actionId
) {

    const role =
        getGrappleRole(
            grapple,
            actor
        );


    /*
     * Actor extérieur à la saisie :
     * aucune restriction provenant
     * de cette saisie.
     */
    if (!role) {

        return true;

    }


    // ============================================================
    // CIBLE SAISIE
    // ============================================================

    if (
        role === "target"
    ) {

        /*
         * Sa seule action possible est
         * la tentative de libération.
         */
        return (
            actionId
            === GRAPPLE_ACTIONS.ESCAPE
        );

    }


    // ============================================================
    // SAISISSEUR
    // ============================================================

    /*
     * Les actions spécifiques à la saisie
     * autorisées au saisisseur.
     *
     * Nous ne bloquons PAS ici toutes ses
     * autres actions : cette fonction permet
     * surtout d'exprimer les restrictions
     * propres aux actions de saisie.
     */
    if (
        actionId
        === GRAPPLE_ACTIONS.ESCAPE
    ) {

        return false;

    }


    return true;

}


/**
 * Retourne les contraintes de saisie
 * d'un Actor sous une forme exploitable
 * ultérieurement par Foundry et l'interface.
 */
export function getGrappleActionState(
    grapple,
    actor
) {

    const role =
        getGrappleRole(
            grapple,
            actor
        );


    if (!role) {

        return {

            grappled:
                false,

            role:
                null,

            canMove:
                true,

            onlyAction:
                null,

            actions: {
                escape:
                    false,

                attack:
                    false,

                release:
                    false
            }

        };

    }


    if (
        role === "target"
    ) {

        return {

            grappled:
                true,

            role:
                "target",

            canMove:
                false,

            onlyAction:
                GRAPPLE_ACTIONS.ESCAPE,

            actions: {
                escape:
                    true,

                attack:
                    false,

                release:
                    false
            }

        };

    }


    return {

        grappled:
            true,

        role:
            "attacker",

        canMove:
            true,

        onlyAction:
            null,

        actions: {
            escape:
                false,

            attack:
                true,

            release:
                true
        }

    };

}