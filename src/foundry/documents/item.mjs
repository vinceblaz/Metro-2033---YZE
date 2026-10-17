import {
    canAcquireArchetype,
    canAcquireTalent
} from "../../domain/rules/embedded-item-acquisition.mjs";


/**
 * Classe Document unique pour tous les Items Métro 2033.
 *
 * Centralise les comportements communs aux Items du système
 * qui doivent s'appliquer indépendamment de l'interface
 * utilisée pour créer les Documents.
 */
export class MetroItem extends Item {


    /**
     * Vérifications globales exécutées avant une opération
     * de création d'Items.
     *
     * Garantit notamment :
     *
     * - qu'un Talent possède toujours un identifiant métier
     *   stable system.key ;
     *
     * - qu'un Talent ne puisse pas être acquis
     *   au-delà de son maxLevel ;
     *
     * - qu'un Actor Métro 2033 ne puisse jamais posséder
     *   plus d'un Archétype.
     */
    static async _preCreateOperation(
        documents,
        operation,
        user
    ) {

        const allowed =
            await super._preCreateOperation(
                documents,
                operation,
                user
            );

        if (allowed === false) {
            return false;
        }


        // ====================================================
        // IDENTIFIANT MÉTIER DES TALENTS
        // ====================================================

        for (const document of documents) {

            if (
                document?.type !== "talent"
            ) {
                continue;
            }


            const existingKey =
                String(
                    document.system?.key
                    ?? ""
                ).trim();


            /**
             * Une copie d'un Talent existant possède déjà
             * son key : on le conserve impérativement.
             */
            if (existingKey) {
                continue;
            }


            /**
             * Nouveau Talent sans key.
             *
             * Le key est généré une seule fois puis fera
             * partie des données du Document.
             *
             * Toute copie ultérieure conservera donc
             * automatiquement cette identité métier.
             */
            const generatedKey =
                `talent-${foundry.utils.randomID(16)}`;


            document.updateSource({
                "system.key":
                    generatedKey
            });

        }


        // ====================================================
        // UNIQUEMENT POUR LES ITEMS EMBARQUÉS DANS UN ACTOR
        // ====================================================

        const parent =
            operation?.parent;

        if (!(parent instanceof Actor)) {
            return allowed;
        }


        // ====================================================
        // TALENTS ENTRANTS
        // ====================================================

        const incomingTalents =
            documents.filter(
                item =>
                    item?.type === "talent"
            );


        // ====================================================
        // TALENTS DÉJÀ POSSÉDÉS
        // ====================================================

        const ownedTalents =
            parent.items
                .filter(
                    item =>
                        item.type === "talent"
                )
                .map(
                    item => ({
                        key:
                            item.system?.key
                            ?? ""
                    })
                );


        // ====================================================
        // RÈGLE MÉTIER DES TALENTS
        // ====================================================

        /**
         * Cette liste simulée commence avec les Talents
         * réellement possédés.
         *
         * Chaque Talent entrant autorisé y est ensuite ajouté,
         * ce qui permet de prendre correctement en compte
         * plusieurs acquisitions du même Talent dans une seule
         * opération.
         *
         * L'opération entière sera refusée dès qu'une acquisition
         * dépasserait maxLevel.
         */
        const simulatedOwnedTalents = [
            ...ownedTalents
        ];


        for (const incomingTalent of incomingTalents) {

            const talentData = {

                key:
                    incomingTalent.system?.key
                    ?? "",

                maxLevel:
                    incomingTalent.system?.maxLevel
                    ?? 1

            };


            const acquisition =
                canAcquireTalent({
                    talent:
                        talentData,

                    ownedTalents:
                        simulatedOwnedTalents
                });


            if (!acquisition.allowed) {

                if (
                    acquisition.reason
                    === "talent-max-level-reached"
                ) {

                    ui.notifications.warn(
                        `${parent.name} possède déjà le niveau maximum `
                        + `de ${incomingTalent.name} `
                        + `(${acquisition.currentLevel}/${acquisition.maxLevel}).`
                    );

                } else {

                    ui.notifications.warn(
                        `Impossible d'acquérir le Talent ${incomingTalent.name}.`
                    );

                }

                return false;
            }


            /**
             * Le Talent est considéré comme acquis pour
             * la suite de cette même opération.
             *
             * Cela permet notamment :
             *
             * - niveau 1 + deux copies entrantes, maxLevel 3
             *   => autorisé ;
             *
             * - niveau 2 + deux copies entrantes, maxLevel 3
             *   => refus atomique.
             */
            simulatedOwnedTalents.push({
                key:
                    acquisition.key
            });

        }


        // ====================================================
        // ARCHÉTYPES ENTRANTS
        // ====================================================

        const incomingArchetypes =
            documents.filter(
                item =>
                    item?.type === "archetype"
            );

        if (incomingArchetypes.length === 0) {
            return allowed;
        }


        // ====================================================
        // ARCHÉTYPES DÉJÀ POSSÉDÉS
        // ====================================================

        const ownedArchetypes =
            parent.items.filter(
                item =>
                    item.type === "archetype"
            );


        // ====================================================
        // RÈGLE MÉTIER DES ARCHÉTYPES
        // ====================================================

        const acquisition =
            canAcquireArchetype({
                ownedArchetypes,
                incomingArchetypes
            });

        if (acquisition.allowed) {
            return allowed;
        }


        // ====================================================
        // REFUS ARCHÉTYPE
        // ====================================================

        let message =
            `${parent.name} possède déjà un Archétype.`;

        if (
            acquisition.reason
            === "multiple-archetypes"
        ) {
            message =
                "Il est impossible d'ajouter plusieurs Archétypes simultanément.";
        }

        ui.notifications.warn(message);

        return false;
    }

}