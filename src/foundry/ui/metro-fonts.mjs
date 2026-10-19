/**
 * Enregistre les polices du système auprès de Foundry : elles apparaissent
 * dans le menu de police de l'éditeur de Journal. Le chargement visuel est
 * déjà assuré par les @font-face de styles/metro-journal.css ; si un
 * fichier est absent de fonts/, la police retombe sur la suivante.
 */

const BASE = "systems/metro-2033-yze/fonts/";

export const METRO_FONT_DEFINITIONS = Object.freeze({
    "Special Elite": {
        editor: true,
        fonts: [{ urls: [`${BASE}SpecialElite-Regular.ttf`] }]
    },
    "Courier Prime": {
        editor: true,
        fonts: [
            { urls: [`${BASE}CourierPrime-Regular.ttf`] },
            { urls: [`${BASE}CourierPrime-Italic.ttf`], style: "italic" },
            { urls: [`${BASE}CourierPrime-Bold.ttf`], weight: 700 },
            { urls: [`${BASE}CourierPrime-BoldItalic.ttf`], weight: 700, style: "italic" }
        ]
    }
});

export function registerMetroFonts() {

    for (const [name, definition] of Object.entries(METRO_FONT_DEFINITIONS)) {
        CONFIG.fontDefinitions[name] ??= definition;
    }
}
