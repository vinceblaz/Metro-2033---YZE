/**
 * Insère le logo Métro 2033 sous le titre « Foundry Virtual Tabletop »
 * de l'onglet Paramètres. Best effort : repère le bloc « Version N Stable »
 * dans le rendu, sans dépendre d'une classe CSS précise.
 */

const LOGO_PATH = "systems/metro-2033-yze/ui/misc/logo-metro2033.webp";
const MARKER = "data-metro-logo";

export function insertSettingsLogo(root) {

    if (!root?.querySelector || root.querySelector(`[${MARKER}]`)) return false;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let anchor = null;

    while (walker.nextNode()) {
        if (/Version\s+\d+/i.test(walker.currentNode.textContent)) {
            anchor = walker.currentNode.parentElement;
            break;
        }
    }

    if (!anchor) return false;

    const img = document.createElement("img");
    img.src = LOGO_PATH;
    img.alt = "Métro 2033";
    img.className = "metro-settings-logo";
    img.setAttribute(MARKER, "true");

    anchor.insertAdjacentElement("afterend", img);

    return true;
}

export function registerSettingsLogoHook() {

    const tryInsert = () => {
        const root = document.getElementById("settings");
        if (root) insertSettingsLogo(root);
    };

    Hooks.on("renderSettings", (app, html) => {
        const root = html instanceof HTMLElement ? html : html?.[0] ?? app?.element;
        insertSettingsLogo(root);
        tryInsert();
    });

    // Filet de sécurité : l'onglet peut être rendu sans déclencher le hook attendu.
    new MutationObserver(tryInsert).observe(
        document.body,
        { childList: true, subtree: true }
    );

    tryInsert();
}
