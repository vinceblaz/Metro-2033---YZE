import {
    InitiativePreparationApplication
} from "../applications/initiative-preparation-application.mjs";


let sharedApplication =
    null;


/**
 * Ouvre (ou réutilise) la fenêtre de
 * Préparation de l'initiative pour le
 * Combat actif.
 *
 * Point d'entrée public garanti,
 * indépendant de toute structure DOM :
 * appelable depuis une macro ou la
 * console tant que l'intégration au
 * Combat Tracker n'est pas éprouvée en
 * jeu réel.
 */
export function openInitiativePreparation({
    combat =
        game.combat
} = {}) {

    if (!combat) {

        ui.notifications.warn(
            "Aucun Combat actif à préparer."
        );


        return null;

    }


    if (
        sharedApplication
        && sharedApplication.combat?.id
            === combat.id
        && sharedApplication.rendered
    ) {

        sharedApplication.bringToFront();


        return sharedApplication;

    }


    sharedApplication =
        new InitiativePreparationApplication({
            combat
        });


    sharedApplication.render({
        force:
            true
    });


    return sharedApplication;

}


/**
 * Ajoute, de façon best-effort, un bouton
 * d'ouverture dans l'en-tête du Combat
 * Tracker.
 *
 * La structure DOM du Combat Tracker peut
 * varier entre versions/mises à jour de
 * Foundry. Cette fonction ne doit donc
 * jamais faire échouer le hook : toute
 * erreur est journalisée et ignorée, sans
 * empêcher le point d'entrée garanti
 * (game.metro2033.openInitiativePreparation)
 * de fonctionner.
 */
function injectCombatTrackerButton(
    app,
    html
) {

    try {

        const root =
            html?.jquery
                ? html[0]
                : html;


        if (
            !root
            || typeof root.querySelector
                !== "function"
        ) {

            return;

        }


        if (
            root.querySelector(
                '[data-action="metro-open-initiative-preparation"]'
            )
        ) {

            return;

        }


        const header =
            root.querySelector(
                ".directory-header"
            )
            ?? root.querySelector(
                ".combat-tracker-header"
            )
            ?? root;


        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.dataset.action =
            "metro-open-initiative-preparation";

        button.className =
            "metro-initiative-open-preparation";

        button.title =
            "Préparation de l'initiative";

        button.innerHTML =
            '<i class="fa-solid fa-cards"></i> Initiative';

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();


                openInitiativePreparation();

            }
        );


        header.appendChild(
            button
        );

    }
    catch (error) {

        console.error(
            "Metro 2033 | Impossible d'ajouter le bouton de préparation de l'initiative au Combat Tracker.",
            error
        );

    }

}


/**
 * Enregistre les points d'entrée Foundry de
 * la fenêtre de Préparation de l'initiative.
 */
export function registerInitiativePreparationHooks() {

    game.metro2033 =
        game.metro2033
        ?? {};

    game.metro2033.openInitiativePreparation =
        openInitiativePreparation;


    Hooks.on(
        "renderCombatTracker",
        injectCombatTrackerButton
    );

}
