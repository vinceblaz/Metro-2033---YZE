/**
 * Construit la liste des Acteurs proposés au MJ dans les
 * fenêtres de lancement des macros de jets (Terreur, Asphyxie,
 * Poison, Maladie...) : tous les Personnages et PNJ du monde,
 * avec une pré-sélection des Acteurs actuellement contrôlés sur
 * le canevas (confort d'usage en combat, sans jamais imposer un
 * choix).
 *
 * Périmètre volontairement limité à `character`/`npc` (comme
 * pour le jet de Terreur) : les Créatures du bestiaire utilisent
 * un DataModel différent, non couvert par ces macros pour
 * l'instant.
 */
export function buildLivingActorOptions({
    types = ["character", "npc"]
} = {}) {

    const controlledActorIds =
        new Set(
            (canvas?.tokens?.controlled ?? [])
                .map(token => token.actor?.id)
                .filter(Boolean)
        );


    return game.actors
        .filter(
            actor => types.includes(actor.type)
        )
        .map(
            actor => ({

                id: actor.id,
                name: actor.name,

                preSelected:
                    controlledActorIds.has(actor.id)

            })
        )
        .sort(
            (a, b) => a.name.localeCompare(b.name)
        );

}
