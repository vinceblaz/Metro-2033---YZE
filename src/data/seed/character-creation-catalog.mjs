/**
 * Données propres à la création de Personnage (livre de
 * règles, p.163-171 : encadrés par archétype), non reprises
 * dans `talent-archetype-catalog.mjs` (qui note explicitement
 * que « Fierté / Honte / Liens avec les autres PJ ne sont pas
 * repris ici : ils relèvent du futur chantier « Création de
 * PJ » »).
 *
 * Donnée pure, aucune dépendance Foundry. Consommée par
 * l'assistant de création de Personnage
 * (`character-creation-wizard-view-model.mjs`) pour proposer
 * les suggestions du livre à chaque étape, sans jamais les
 * imposer : le joueur peut toujours écrire son propre texte
 * (« ou créez-en une », p.164 et suivantes).
 *
 * Clé `archetypeKey` alignée sur `ARCHETYPE_DEFINITIONS`
 * (domain/rules/archetypes.mjs) et sur `ARCHETYPES`
 * (talent-archetype-catalog.mjs).
 */

export const CHARACTER_CREATION_OPTIONS = {

    diplomat: {
        typicalNames: [
            "Miroslav Abramovitch", "Mikhaïl Babykine", "Pavel Grettchenko",
            "Ivanna Antonova", "Alyona Vodoleïeva", "Darya Zakharina"
        ],
        pride: [
            "On me dit souvent que je suis le/la meilleur(e).",
            "On dit que mon sourire suffit à réchauffer les cœurs."
        ],
        shame: [
            "Je dois faire d'énormes efforts pour me contrôler, ma légendaire patience m'a abandonné(e).",
            "Et si tout ça ne servait à rien ? Peu importe nos actions, j'ai le sentiment que nous sommes condamnés…"
        ],
        bonds: [
            "Je ne lui fais pas confiance.",
            "Je sens qu'il/elle cache quelque chose et je dois savoir quoi.",
            "C'est mon frère/ma sœur/mon père/ma mère."
        ]
    },

    scout: {
        typicalNames: [
            "Stepan Aksarov", "Youri Charapov", "Vadim Pavlenko",
            "Nadejda Balakina", "Nikita Khorkova", "Raïssa Sorokina"
        ],
        pride: [
            "Les autres peuvent toujours compter sur moi !",
            "Je ne connais pas la peur !"
        ],
        shame: [
            "Je ne partagerai jamais mes vivres avec personne. Chacun pour soi !",
            "Je prends parfois des risques inconsidérés…"
        ],
        bonds: [
            "Sans moi, il/elle n'a aucune chance.",
            "Il/elle ne sait pas que je suis son père/sa mère.",
            "Je l'admire !"
        ]
    },

    infiltrator: {
        typicalNames: [
            "Aleksandr Balakhnov", "Fiodor Golovine", "Andreï Vasnev",
            "Sofia Domacheva", "Véra Kachkanova", "Ksénia Zabolotnia"
        ],
        pride: [
            "Je ne rate jamais ma cible.",
            "Je suis à l'aise dans toutes les situations."
        ],
        shame: [
            "J'ai ce monde en horreur. Un dernier acte d'éclat et je pourrai tirer ma révérence.",
            "Parfois, j'hésite à changer de camp."
        ],
        bonds: [
            "Il/elle ne me croit pas compétent(e), je vais lui prouver le contraire.",
            "Il/elle est bizarre, mais je l'apprécie.",
            "Il/elle me comprend."
        ]
    },

    mechanic: {
        typicalNames: [
            "Dimitri Emski", "Bogdan Tchoudinov", "Anatoli Yasneïev",
            "Irina Chichkina", "Lioudmila Khabalova", "Oksana Soukharnikova"
        ],
        pride: [
            "Je connais un sacré paquet de trucs !",
            "Je peux tout réparer."
        ],
        shame: [
            "Je n'ai jamais connu l'amour.",
            "J'ai abandonné mon/ma conjoint(e) et mon/mes enfant(s). Je ne sais pas ce qu'ils sont devenus."
        ],
        bonds: [
            "Je ressens quelque chose de fort pour lui/elle.",
            "Il/elle pense être meilleur(e) que moi.",
            "Il/elle est complètement siphonné(e)."
        ]
    },

    medic: {
        typicalNames: [
            "Alekseï Lebedinski", "Stanislav Nikitine", "Vladimir Oborine",
            "Anastasia Mineïeva", "Ekaterina Netchaïeva", "Svetlana Pozdniakova"
        ],
        pride: [
            "Je ne laisserai jamais un camarade derrière !",
            "Tout le monde m'adore."
        ],
        shame: [
            "Je ne peux pas contrôler ma peur.",
            "Je suis claustrophobe."
        ],
        bonds: [
            "Je sais pertinemment qu'il/elle a des sentiments forts pour moi.",
            "Il/elle m'a brutalisé(e) lorsque nous étions plus jeunes, s'en souvient-il/elle seulement ?",
            "Je ne peux pas m'empêcher d'être mal à l'aise en sa présence."
        ]
    },

    soldier: {
        typicalNames: [
            "Lioubov Balakine", "Micha Drougov", "Artiom Vassiliev",
            "Zinaïda Alekseïeva", "Natalia Golovtchenko", "Larissa Ivankova"
        ],
        pride: [
            "Jamais je ne reculerai devant la mort !",
            "J'ai un moral à toute épreuve."
        ],
        shame: [
            "Ma vie n'a plus la moindre importance.",
            "Je crois que je suis un peu dingue… non… complètement dingue en fait !"
        ],
        bonds: [
            "Je sais que je peux compter sur lui/elle.",
            "Ses parents m'ont élevé(e) comme leur fils/fille.",
            "Je suis sûr(e) qu'il/elle peut mettre nos vies en danger à tout moment."
        ]
    },

    strategist: {
        typicalNames: [
            "Arkadi Blatov", "Nikolaï Oulianov", "Vassili Tokarev",
            "Yelena Chvernikova", "Yevguenia Emski", "Galina Tchernikova"
        ],
        pride: [
            "Rien n'échappe à ma sagacité.",
            "Je sais m'adapter à toutes les situations."
        ],
        shame: [
            "J'ai le syndrome du sauveur.",
            "Je suis coupable d'une énorme erreur qui a coûté la vie à de nombreux camarades."
        ],
        bonds: [
            "Je sais que je peux me reposer sur lui/elle.",
            "Il/elle croit que je vais tout faire à sa place.",
            "Il/elle pourrait perdre les pédales à tout moment, je dois le/la surveiller de près."
        ]
    },

    trader: {
        typicalNames: [
            "Denis Andreïev", "Vladislav Fedine", "Yuri Oussenko",
            "Tatiana Cherkova", "Anya Petrova", "Olga Toporova"
        ],
        pride: [
            "Je ne me laisse jamais intimider.",
            "Je peux embobiner n'importe qui."
        ],
        shame: [
            "Je suis l'ami(e) d'un(e) traître(sse), il/elle n'a pas disparu, mais rejoint l'autre camp… et nous communiquons encore ensemble.",
            "Ma survie prime avant tout."
        ],
        bonds: [
            "Il/elle est moins stupide que les autres.",
            "C'est la seule personne qui sache vraiment qui je suis au fond de moi.",
            "Il/elle me tape sur les nerfs."
        ]
    }

};


/**
 * Retourne les options de création (noms/fierté/honte/liens)
 * pour un archétype, ou `null` si la clé est inconnue.
 */
export function getCharacterCreationOptions(archetypeKey) {
    return CHARACTER_CREATION_OPTIONS[archetypeKey] ?? null;
}
