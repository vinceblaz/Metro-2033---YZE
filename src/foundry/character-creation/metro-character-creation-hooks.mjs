import {
    CharacterCreationWizardApplication
} from "../applications/character-creation-wizard-application.mjs";


/**
 * Ouvre l'Assistant de création de Personnage.
 *
 * Point d'entrée public garanti, indépendant de toute
 * structure DOM : appelable depuis une macro ou la console
 * tant que l'intégration au répertoire des Actors n'est pas
 * éprouvée en jeu réel.
 */
export function openCharacterCreationWizard() {

    const application = new CharacterCreationWizardApplication();

    application.render({ force: true });

    return application;
}


/*
 * Sélecteurs candidats pour l'en-tête du répertoire des
 * Actors, du plus spécifique au plus générique. La structure
 * DOM exacte varie entre versions de Foundry (v10-v12 :
 * `.directory-header` ; v13+ ApplicationV2 : souvent une zone
 * `.header-actions` à l'intérieur de ce même en-tête) : on
 * essaie plusieurs pistes plutôt que de parier sur une seule.
 *
 * Volontairement AUCUN élément générique en dernier recours
 * (l'ancienne version retombait sur la racine entière de
 * l'application, ce qui plaçait le bouton hors de vue, en bas
 * de la liste des Actors, plutôt que dans son en-tête).
 */
const ACTOR_DIRECTORY_HEADER_SELECTORS = [
    ".directory-header .header-actions",
    ".directory-header .action-buttons",
    ".directory-header",
    ".header-actions",
    ".action-buttons"
];


function createOpenWizardButton() {

    const button = document.createElement("button");

    button.type = "button";
    button.dataset.action = "metro-open-character-creation-wizard";
    button.className = "metro-character-creation-open-wizard";
    button.title = "Créer un Personnage (Assistant Métro 2033)";
    button.innerHTML = '<i class="fa-solid fa-user-plus"></i> Nouveau Personnage';

    button.addEventListener("click", (event) => {
        event.preventDefault();
        openCharacterCreationWizard();
    });

    return button;
}


/**
 * Ajoute, de façon best-effort, un bouton d'ouverture dans
 * l'en-tête du répertoire des Actors.
 *
 * La structure DOM du répertoire peut varier entre
 * versions/mises à jour de Foundry, et l'en-tête peut ne pas
 * encore exister au moment précis où ce hook se déclenche (le
 * répertoire se re-rendant régulièrement, par exemple à chaque
 * création/suppression d'Actor). Cette fonction ne doit donc
 * jamais faire échouer le hook : si aucun en-tête connu n'est
 * trouvé, elle abandonne silencieusement plutôt que d'accrocher
 * le bouton n'importe où — un prochain rendu réessaiera. Toute
 * erreur est journalisée et ignorée, sans empêcher le point
 * d'entrée garanti (game.metro2033.openCharacterCreationWizard)
 * de fonctionner.
 */
function injectActorDirectoryButton(app, html) {

    try {

        const root = html?.jquery ? html[0] : html;

        if (!root || typeof root.querySelector !== "function") {
            return;
        }

        if (root.querySelector('[data-action="metro-open-character-creation-wizard"]')) {
            return;
        }

        const header = ACTOR_DIRECTORY_HEADER_SELECTORS
            .map((selector) => root.querySelector(selector))
            .find((element) => element);

        if (!header) {
            return;
        }

        header.appendChild(createOpenWizardButton());

    } catch (error) {

        console.error(
            "Métro 2033 | Impossible d'ajouter le bouton de création de Personnage au répertoire des Actors.",
            error
        );
    }
}


/**
 * Relais générique : le répertoire des Actors peut aussi se
 * (re)rendre sans déclencher spécifiquement
 * `renderActorDirectory` selon la version de Foundry (par
 * exemple via `renderSidebarTab`). On filtre sur l'onglet
 * Actors pour ne rien injecter ailleurs.
 */
function injectActorDirectoryButtonFromSidebarTab(app, html) {

    const isActorsTab =
        app?.tabName === "actors"
        || app?.id === "actors"
        || app?.constructor?.name === "ActorDirectory";

    if (!isActorsTab) {
        return;
    }

    injectActorDirectoryButton(app, html);
}


const CHARACTER_CREATION_MACRO_NAME = "Métro 2033 — Créer un Personnage";
const CHARACTER_CREATION_MACRO_COMMAND = "game.metro2033.openCharacterCreationWizard();";


/**
 * Point d'entrée robuste, indépendant de toute structure DOM :
 * crée (une seule fois) une Macro appelant l'Assistant et
 * l'accroche au premier emplacement libre de la barre de
 * raccourcis de l'utilisateur courant.
 *
 * L'injection du bouton dans l'en-tête du répertoire des Actors
 * (ci-dessus) reste tentée en complément, mais elle dépend d'une
 * structure DOM non vérifiable depuis cet environnement de
 * développement (pas d'accès direct à une instance Foundry
 * réelle). La Macro, elle, repose uniquement sur l'API
 * officielle de Foundry (Macro.create / assignHotbarMacro) et ne
 * peut donc pas se retrouver invisible pour une raison de
 * sélecteur CSS incorrect.
 *
 * Best-effort volontaire : la création de Macro de script est
 * par défaut réservée au MJ/Assistant-MJ (permission
 * `MACRO_SCRIPT` du cœur Foundry). Pour un simple Joueur sans
 * cette permission, la tentative échoue silencieusement (avertissement
 * en console) — `game.metro2033.openCharacterCreationWizard()`
 * reste alors la solution de repli, ou le MJ peut lui assigner
 * lui-même la Macro depuis son propre monde.
 */
async function ensureCharacterCreationMacro() {

    try {

        let macro = game.macros?.find(
            (candidate) =>
                candidate.name === CHARACTER_CREATION_MACRO_NAME
                && candidate.command === CHARACTER_CREATION_MACRO_COMMAND
        );

        if (!macro) {

            macro = await Macro.create({
                name: CHARACTER_CREATION_MACRO_NAME,
                type: "script",
                img: "icons/svg/upgrade.svg",
                command: CHARACTER_CREATION_MACRO_COMMAND,
                scope: "global"
            });
        }

        if (!macro) {
            return;
        }

        const hotbar = game.user?.hotbar ?? {};

        const alreadyOnHotbar = Object.values(hotbar).includes(macro.id);

        if (alreadyOnHotbar) {
            return;
        }

        const firstEmptySlot = Array.from({ length: 50 }, (unused, index) => index + 1)
            .find((slot) => !hotbar[slot]);

        if (firstEmptySlot) {
            await game.user.assignHotbarMacro(macro, firstEmptySlot);

            console.log(
                `Métro 2033 | Macro « ${CHARACTER_CREATION_MACRO_NAME} » ajoutée à l'emplacement ${firstEmptySlot} de votre barre de raccourcis.`
            );
        }

    } catch (error) {

        console.warn(
            "Métro 2033 | Impossible de créer/assigner automatiquement la macro de création de Personnage (permissions insuffisantes pour ce compte ?). "
            + "Utilisez game.metro2033.openCharacterCreationWizard() en console, ou demandez au MJ de vous partager la macro.",
            error
        );
    }
}


/**
 * Enregistre les points d'entrée Foundry de l'Assistant de
 * création de Personnage.
 */
export function registerCharacterCreationHooks() {

    game.metro2033 = game.metro2033 ?? {};
    game.metro2033.openCharacterCreationWizard = openCharacterCreationWizard;

    Hooks.on("renderActorDirectory", injectActorDirectoryButton);
    Hooks.on("renderSidebarTab", injectActorDirectoryButtonFromSidebarTab);

    // Volontairement non attendu (best-effort, ne doit jamais
    // bloquer le reste du hook "ready").
    ensureCharacterCreationMacro();
}
