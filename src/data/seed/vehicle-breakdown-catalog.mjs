/**
 * Catalogue de la table « VÉHICULES HORS D'ÉTAT » (règles
 * p.211), déclenchée (D6) quand l'Intégrité d'un véhicule
 * atteint 0.
 *
 * Donnée pure, aucune dépendance Foundry. Texte verbatim du
 * livre, non paraphrasé.
 */

export const VEHICLE_BREAKDOWN_RESULTS = [

    {
        key: "vehicle-breakdown-conducteur-touche",
        range: 1,
        name: "Conducteur touché",
        text: "Le conducteur est touché et subit un nombre de points de dégâts à la Vigueur égal à la moitié de ceux subis par le véhicule (arrondis au supérieur)."
    },

    {
        key: "vehicle-breakdown-passager-touche",
        range: 2,
        name: "Passager touché",
        text: "Un passager au hasard est touché et subit un nombre de points de dégâts à la Vigueur égal à la moitié de ceux subis par le véhicule (arrondis à l'inférieur). Si aucun passager n'est présent, c'est le conducteur qui est touché (cf. ci-dessus)."
    },

    {
        key: "vehicle-breakdown-tonneau",
        range: 3,
        name: "Tonneau",
        text: "L'attaque provoque un renversement du véhicule. Le conducteur et les passagers subissent tous un nombre de points de dégâts à la Vigueur égal à la moitié de ceux subis par le véhicule (arrondis à l'inférieur). Le véhicule est renversé."
    },

    {
        key: "vehicle-breakdown-roue-ou-arme-arrachee",
        range: 4,
        name: "Roue ou arme montée arrachée",
        text: "L'arme montée sur le véhicule est arrachée. Si aucune arme n'est montée, une roue est arrachée ; le conducteur doit réussir un jet de Réaction avec un modificateur de –2 pour éviter au véhicule de faire un tonneau (cf. ci-dessus)."
    },

    {
        key: "vehicle-breakdown-moteur-hs",
        range: 5,
        name: "Moteur H.S.",
        text: "Le moteur a été sévèrement touché. Réparer le véhicule imposera un modificateur de –2 au jet de Bricolage (à moins de remplacer totalement le moteur)."
    },

    {
        key: "vehicle-breakdown-explosion-reservoir",
        range: 6,
        name: "Explosion du réservoir",
        text: "Le véhicule explose et tous les gens à l'intérieur subissent les dégâts d'un feu d'Intensité 9 (cf. page 204). Le véhicule n'est pas réparable."
    }

];
