/**
 * Résolution des afflictions spécifiques à Métro 2033.
 *
 * Le moteur YZE détecte les afflictions.
 * Cette couche décide comment elles sont appliquées
 * aux données du personnage.
 */


/**
 * Vérifie une quantité d'afflictions.
 */
function validateAmount(
    value,
    name
) {

    if (
        !Number.isInteger(value)
        || value < 0
    ) {

        throw new TypeError(
            `${name} doit être un entier positif ou nul.`
        );

    }

}


/**
 * Résout les afflictions d'un jet.
 *
 * allocation :
 *
 * {
 *     attribute: 1,
 *     composure: 1,
 *     stress: 0
 * }
 */
export async function resolveAfflictions(
    actor,
    result,
    {
        attribute = 0,
        composure = 0,
        stress = 0,
        equipment = 0,

        /*
         * Talents généraux Imperturbable / Mental d'acier /
         * Nerfs d'acier / Résistance (livre, p.172-183) :
         * "Vous pouvez ignorer une affliction (« 1 ») sur tous
         * vos jets forcés dépendant de l'attribut [EMPATHIE /
         * ESPRIT / AGILITÉ / VIGUEUR]."
         *
         * Nombre d'afflictions à retrancher du total disponible
         * AVANT répartition, calculé par l'appelant (qui a accès
         * à l'Actor et à ses Talents) selon l'Attribut du jet.
         * Cette fonction reste pure : elle ne connaît aucun
         * Talent, seulement un nombre déjà déterminé.
         */
        ignoredAfflictions = 0
    } = {}
) {

    if (!actor) {

        throw new TypeError(
            "resolveAfflictions nécessite un Actor."
        );

    }


    if (!result) {

        throw new TypeError(
            "resolveAfflictions nécessite un résultat de jet."
        );

    }


    validateAmount(
        attribute,
        "attribute"
    );

    validateAmount(
        composure,
        "composure"
    );

    validateAmount(
        stress,
        "stress"
    );

    validateAmount(
        equipment,
        "equipment"
    );

    validateAmount(
        ignoredAfflictions,
        "ignoredAfflictions"
    );


    const available =
        Math.max(
            0,
            result.afflictions
            - ignoredAfflictions
        );


    const allocated =
        attribute
        + composure
        + stress
        + equipment;


    /*
     * Toutes les afflictions doivent être attribuées.
     */
    if (allocated !== available) {

        throw new Error(
            `Répartition invalide : ${allocated} affliction(s) attribuée(s) pour ${available} disponible(s).`
        );

    }

    /*
    * Une seule affliction maximum peut être
    * appliquée à l'équipement utilisé.
    */
    if (equipment > 1) {

        throw new Error(
            "Une seule affliction peut être appliquée à l'équipement sur un même jet."
        );

    }

    /*
    * La possibilité d'endommager l'équipement
    * n'existe que sur un jet forcé.
    */
    if (
        equipment > 0
        && result.pushCount === 0
    ) {

        throw new Error(
            "Une affliction ne peut être appliquée à l'équipement que sur un jet forcé."
        );

    }

    /*
    * L'équipement doit réellement avoir fourni
    * au moins un dé au jet.
    */
    if (
        equipment > 0
        && result.pool?.equipment <= 0
    ) {

        throw new Error(
            "Aucun dé d'équipement n'a été utilisé sur ce jet."
        );

    }

    /*
    * Le contexte doit identifier précisément
    * l'équipement utilisé.
    */
    if (
        equipment > 0
        && !result.context?.equipment?.itemId
    ) {

        throw new Error(
            "Le jet ne contient aucun équipement identifiable."
        );

    }


    const attributeId =
        result.context?.attribute;


    if (
        attribute > 0
        && !attributeId
    ) {

        throw new Error(
            "Le résultat ne contient pas l'attribut concerné."
        );

    }


    const resolution = {

        total:
            available,

        attribute: {
            id:
                attributeId ?? null,

            applied:
                0
        },

        composure: {
            applied:
                0,

            reachedBreakingPoint:
                false
        },

        stress: {
            requested:
                stress,

            added:
                0,

            limitExceeded:
                false
        },

        equipment: {

            requested:
                equipment,

            applied:
                false,

            itemId:
                null,

            itemName:
                null,

            reliability:
                null,

            prevented:
                false,

            damage:
                null
        }        

    };


    // ============================================================
    // DÉGÂTS D'ATTRIBUT
    // ============================================================

    if (attribute > 0) {

        const before =
            actor.getAttribute(
                attributeId
            );


        await actor.takeAttributeDamage(
            attributeId,
            attribute
        );


        const after =
            actor.getAttribute(
                attributeId
            );


        resolution.attribute.applied =
            before - after;

    }


    // ============================================================
    // SANG-FROID
    // ============================================================

    if (composure > 0) {

        const resultComposure =
            await actor.addComposure(
                composure
            );


        resolution.composure.applied =
            resultComposure.added;


        resolution.composure.reachedBreakingPoint =
            resultComposure.reachedBreakingPoint;

    }


    // ============================================================
    // STRESS
    // ============================================================

    if (stress > 0) {

        /*
         * On applique les dés un par un.
         *
         * C'est important car le passage potentiel
         * au sixième dé est une règle particulière.
         */
        for (
            let index = 0;
            index < stress;
            index++
        ) {

            const stressResult =
                await actor.addStress(1);


            resolution.stress.added +=
                stressResult.added;


            if (
                stressResult.exceedsLimit
            ) {

                resolution.stress.limitExceeded =
                    true;

            }

        }

    }

    // ============================================================
    // ÉQUIPEMENT
    // ============================================================

    if (equipment > 0) {

        const itemId =
            result.context
                .equipment
                .itemId;


        const item =
            actor.items.get(
                itemId
            );


        if (!item) {

            throw new Error(
                "L'équipement utilisé pour ce jet n'existe plus sur l'Actor."
            );

        }


        const equipmentResult =
            await actor.applyEquipmentAffliction(
                item
            );


        resolution.equipment = {

            requested:
                1,

            applied:
                true,

            itemId:
                item.id,

            itemName:
                item.name,

            reliability:
                equipmentResult.reliability,

            prevented:
                equipmentResult.prevented,

            damage:
                equipmentResult.damage

        };

    }    


    return resolution;

}