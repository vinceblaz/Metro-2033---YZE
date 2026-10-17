/**
 * Petits utilitaires HTML partagés par les fenêtres de
 * lancement des macros de jets (Terreur, Asphyxie, Poison,
 * Maladie...).
 *
 * Volontairement sans dépendance à Foundry : ces fonctions ne
 * génèrent/lisent que du HTML/formulaire, elles restent donc
 * testables sans Foundry, à l'image de
 * FoundryMeleeBlockStuntDialog.
 */

export function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/**
 * Génère le fieldset de sélection multiple d'Acteurs, commun
 * aux 4 macros de jets (exigence du porteur du projet : « il
 * faut pouvoir sélectionner plusieurs acteurs »).
 *
 * Norme graphique commune (retour utilisateur du 28/09/2026,
 * jet de Terreur) : liste des Acteurs en tête de fenêtre, en
 * grille à 3 colonnes.
 */
export function renderActorSelectionFieldset({
    actorOptions = [],
    legend = "Personnages soumis à cette attaque"
} = {}) {

    const actorRows =
        actorOptions
            .map(
                actorOption => `
                    <label class="metro-multi-actor-row">
                        <input
                            type="checkbox"
                            name="actor.${escapeHTML(actorOption.id)}"
                            ${actorOption.preSelected ? "checked" : ""}
                        />
                        ${escapeHTML(actorOption.name)}
                    </label>
                `
            )
            .join("");


    return `
        <fieldset>
            <legend>${escapeHTML(legend)}</legend>

            ${
                actorOptions.length > 0
                    ? `<div class="metro-multi-actor-grid">${actorRows}</div>`
                    : "<p>Aucun Acteur disponible (Personnage ou PNJ).</p>"
            }
        </fieldset>
    `;

}


/**
 * Lit les identifiants d'Acteurs cochés dans le formulaire,
 * en rejetant explicitement une sélection vide (exigence
 * commune aux 4 macros : au moins un Acteur ciblé).
 */
export function readSelectedActorIds({
    form,
    actorOptions = []
} = {}) {

    const actorIds =
        actorOptions
            .filter(
                actorOption =>
                    form?.elements?.[
                        `actor.${actorOption.id}`
                    ]?.checked
                    === true
            )
            .map(
                actorOption => actorOption.id
            );


    if (actorIds.length === 0) {

        throw new Error(
            "Sélectionnez au moins un Acteur soumis à cette attaque."
        );

    }


    return actorIds;

}
