/**
 * Compare deux participants selon l'ordre
 * d'initiative de Métro 2033.
 *
 * Une initiative numérique plus faible agit
 * avant une initiative plus élevée.
 *
 * Les participants sans initiative sont
 * placés après ceux qui en possèdent une.
 *
 * En cas d'égalité, l'identifiant fournit
 * un ordre déterministe.
 */
export function compareMetroInitiative(
    a,
    b
) {

    const hasInitiativeA =
        a?.initiative !== null
        && a?.initiative !== undefined
        && Number.isFinite(
            Number(a.initiative)
        );

    const hasInitiativeB =
        b?.initiative !== null
        && b?.initiative !== undefined
        && Number.isFinite(
            Number(b.initiative)
        );


    const ia =
        hasInitiativeA
            ? Number(a.initiative)
            : Infinity;

    const ib =
        hasInitiativeB
            ? Number(b.initiative)
            : Infinity;


    return (
        (ia - ib)
        || (
            a.id > b.id
                ? 1
                : -1
        )
    );
}