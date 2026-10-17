const {
    SchemaField,
    NumberField,
    StringField,
    BooleanField,
    HTMLField
} = foundry.data.fields;


/**
 * DataModel d'une arme Métro 2033.
 */
export class WeaponDataModel
    extends foundry.abstract.TypeDataModel {

    static defineSchema() {
        return {

            // ====================================================
            // TYPE D'ARME
            // ====================================================

            category:
                new StringField({
                    required: true,
                    initial: "melee",
                    choices: [
                        "melee",
                        "ranged"
                    ]
                }),

                /**
                 * Famille métier de l'arme.
                 *
                 * Ce champ est distinct de `category` :
                 *
                 * - category :
                 *   classification mécanique utilisée
                 *   par le moteur de combat
                 *   ("melee" | "ranged").
                 *
                 * - weaponCategory :
                 *   famille métier utilisée notamment
                 *   par certains Talents.
                 *
                 * Les valeurs sont des identifiants
                 * techniques stables.
                 */
                weaponCategory:
                    new StringField({
                        required: true,
                        nullable: false,
                        blank: true,
                        initial: "",
                        choices: [
                            "",
                            "assaultRifle",
                            "pistol",
                            "submachineGun",
                            "rifle",
                            "rocketLauncher",
                            "shotgun",
                            "lightMachineGun",
                            "heavyMachineGun",
                            "revolver",
                            "bladedWeapon",
                            "bluntWeapon",
                            "unarmed",
                            "incendiaryWeapon",
                            "explosiveWeapon"
                        ]
                    }),                

            /**
             * Prise :
             * - 1M
             * - 2M
             * - 1M/2M
             * - none
             */
            grip:
                new StringField({
                    required: true,
                    initial: "1M",
                    choices: [
                        "none",
                        "1M",
                        "2M",
                        "1M/2M"
                    ]
                }),


            // ====================================================
            // ÉQUIPEMENT
            // ====================================================

            equipped:
                new BooleanField({
                    required: true,
                    initial: false
                }),

            /**
             * Bonus actuel et bonus maximum.
             *
             * current peut atteindre 0 :
             * l'arme est alors hors d'usage.
             */
            bonus:
                new SchemaField({

                    current:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            max: 3,
                            initial: 0
                        }),

                    max:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            max: 3,
                            initial: 0
                        })
                }),

            repairable:
                new BooleanField({
                    required: true,
                    initial: true
                }),


            // ====================================================
            // COMBAT
            // ====================================================

            damage:
                new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    initial: 1
                }),

            /**
             * Certaines armes n'ont pas de Fiabilité.
             * 0 représente ici l'absence de score.
             */
            reliability:
                new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    initial: 0
                }),

            range:
                new StringField({
                    required: true,
                    initial: "contact",
                    choices: [
                        "contact",
                        "short",
                        "medium",
                        "long",
                        "extreme"
                    ]
                }),


            // ====================================================
            // MUNITIONS
            // ====================================================

            /**
             * Indique si cette arme utilise des munitions.
             *
             * false pour la majorité des armes de mêlée.
             */
            usesAmmunition:
                new BooleanField({
                    required: true,
                    initial: false
                }),

            /**
             * Référence documentaire facultative vers l'Item ammunition
             * utilisé pour définir le type de munition accepté par l'arme.
             *
             * Cette référence sert uniquement à l'interface :
             * - afficher la Munition dans la WeaponSheet ;
             * - ouvrir son Item ;
             * - la poster dans le Chat ;
             * - retrouver son system.ammoType lors de son association.
             *
             * Elle ne participe JAMAIS directement aux règles
             * de compatibilité arme / munition.
             *
             * La compatibilité métier continue de reposer exclusivement
             * sur ammunitionType.
             *
             * La suppression de cette référence depuis la WeaponSheet
             * ne doit jamais supprimer l'Item ammunition source.
             */
            ammunitionReferenceUuid:
                new StringField({
                    required: false,
                    nullable: false,
                    initial: ""
                }),                

            /**
             * Identifiant stable du type de munition accepté.
             *
             * Exemples :
             * - "5.45x39"
             * - "7.62x39"
             * - "9x18"
             * - "12g"
             *
             * Cet identifiant sert uniquement à la compatibilité
             * métier entre l'arme et les Items ammunition.
             *
             * Il ne doit pas contenir l'UUID ou l'ID
             * d'un document Foundry.
             */
            ammunitionType:
                new StringField({
                    required: false,
                    nullable: false,
                    initial: ""
                }),

            /**
             * Indique si cette arme accepte
             * les munitions de qualité militaire.
             *
             * Cette propriété est indépendante du type
             * de munition accepté par l'arme.
             *
             * false notamment pour :
             * - les fusils à pompe ;
             * - les arcs ;
             * - les arbalètes ;
             * - les armes lourdes.
             */
            allowsMilitaryAmmunition:
                new BooleanField({
                    required: true,
                    initial: false
                }),

            /**
             * Munition actuellement affectée à l'arme.
             *
             * Malgré le nom historique "magazine", cette structure
             * représente désormais la ressource de munition affectée
             * à l'arme, quel que soit son mode de consommation :
             *
             * - chargeur ;
             * - flèche ;
             * - carreau ;
             * - balle utilisée individuellement ;
             * - autre conteneur compatible.
             *
             * La compatibilité métier reste fondée sur ammoType.
             * sourceAmmoItemId référence uniquement l'Item ammunition
             * précis de l'équipement de l'Actor.
             */
            magazine:
                new SchemaField({

                    /**
                     * Une ressource de munition est-elle actuellement
                     * affectée à l'arme ?
                     *
                     * Le nom "loaded" est conservé pour cette étape
                     * afin d'éviter une migration inutile des données
                     * existantes.
                     */
                    loaded:
                        new BooleanField({
                            required: true,
                            initial: false
                        }),

                    /**
                     * Type métier stable de la munition affectée.
                     */
                    ammoType:
                        new StringField({
                            required: true,
                            nullable: false,
                            initial: ""
                        }),

                    /**
                     * Mode de consommation copié depuis
                     * l'Item ammunition affecté.
                     *
                     * unit :
                     *   consommation de 1 à chaque tir.
                     *
                     * container :
                     *   consommation lors d'un événement
                     *   imposant le remplacement du conteneur.
                     */
                    consumptionMode:
                        new StringField({
                            required: true,
                            nullable: false,
                            initial: "container",
                            choices: [
                                "unit",
                                "container"
                            ]
                        }),

                    /**
                     * Forme physique/logistique de la munition affectée.
                     *
                     * Cette information ne détermine pas à elle seule
                     * la manière dont la munition est consommée.
                     */
                    containerType:
                        new StringField({
                            required: true,
                            nullable: false,
                            initial: "magazine",
                            choices: [
                                "magazine",
                                "cylinder",
                                "belt",
                                "shell",
                                "arrow",
                                "bolt"
                            ]
                        }),

                    quality:
                        new StringField({
                            required: true,
                            nullable: false,
                            initial: "standard",
                            choices: [
                                "standard",
                                "military",
                                "poor"
                            ]
                        }),

                    protectionReduction:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            initial: 0
                        }),

                    ignoresResilience:
                        new BooleanField({
                            required: true,
                            initial: false
                        }),

                    /**
                     * ID de l'Item ammunition actuellement affecté.
                     *
                     * Cet ID permet de retrouver la ressource réelle
                     * dans l'équipement de l'Actor afin notamment
                     * d'en consulter et, plus tard, d'en modifier
                     * la quantité.
                     *
                     * Il ne participe jamais à la compatibilité
                     * arme / munition.
                     */
                    sourceAmmoItemId:
                        new StringField({
                            required: false,
                            nullable: false,
                            initial: ""
                        })

                }),


            // ====================================================
            // AMÉLIORATIONS D'ÉQUIPEMENT (weaponMod)
            // ====================================================

            /**
             * Nombre d'emplacements d'Amélioration d'équipement
             * que CETTE arme précise peut accueillir.
             *
             * Le livre ne définit aucun nombre d'emplacements par
             * arme : c'est un paramétrage que le MJ fait lui-même
             * pour chaque arme de sa table. 0 par défaut (aucun
             * emplacement), y compris pour toutes les entrées du
             * catalogue existantes.
             */
            weaponModSlots:
                new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    initial: 0
                }),


            // ====================================================
            // POISON DE LAME (livre p.204, « POISONS ET BLESSURES »)
            // ====================================================

            /**
             * Poison appliqué sur la lame de cette arme, destiné à
             * se déclencher automatiquement à la prochaine attaque
             * de mêlée réussie infligeant au moins 1 point de
             * dégâts à la VIGUEUR de la cible (cf.
             * `domain/rules/poison.mjs` et
             * `combat/melee-damage-application-service.mjs`).
             *
             * La Toxicité est plafonnée à 6 dans ce DataModel
             * même, conformément au livre (« La Toxicité d'un tel
             * poison ne peut excéder 6 ») — à la différence du
             * Poison ingéré, qui autorise des Toxicités plus
             * élevées.
             */
            poisonedBlade:
                new SchemaField({

                    active:
                        new BooleanField({
                            required: true,
                            nullable: false,
                            initial: false
                        }),

                    effectType:
                        new StringField({
                            required: true,
                            nullable: false,
                            initial: "lethal",
                            choices: [
                                "lethal",
                                "paralyzing",
                                "sleep",
                                "hallucinogenic"
                            ]
                        }),

                    toxicity:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 1,
                            max: 6,
                            initial: 3
                        }),

                    sourceLabel:
                        new StringField({
                            required: true,
                            nullable: false,
                            blank: true,
                            initial: ""
                        })

                }),


            /**
             * Venin d'une arme naturelle de Créature (livre des
             * Monstres) : permanent, déclenché à chaque attaque
             * infligeant au moins 1 point de dégâts à la Vigueur
             * (cf. `domain/rules/weapon-venom.mjs`).
             */
            venom:
                new SchemaField({

                    active:
                        new BooleanField({
                            required: true,
                            nullable: false,
                            initial: false
                        }),

                    effectType:
                        new StringField({
                            required: true,
                            nullable: false,
                            initial: "lethal",
                            choices: [
                                "lethal",
                                "paralyzing",
                                "sleep",
                                "hallucinogenic"
                            ]
                        }),

                    toxicity:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 1,
                            max: 12,
                            initial: 3
                        }),

                    sourceLabel:
                        new StringField({
                            required: true,
                            nullable: false,
                            blank: true,
                            initial: ""
                        })

                }),


            // ====================================================
            // ENCOMBREMENT
            // ====================================================

            /**
             * Le livre utilise notamment :
             * 1/4, 1/2, 1, 2...
             */
            weight:
                new NumberField({
                    required: true,
                    nullable: false,
                    min: 0,
                    initial: 0
                }),


            // ====================================================
            // PROPRIÉTÉS
            // ====================================================

            automatic:
                new BooleanField({
                    required: true,
                    initial: false
                }),

            heavy:
                new BooleanField({
                    required: true,
                    initial: false
                }),

            explosive:
                new BooleanField({
                    required: true,
                    initial: false
                }),

            explosionPower:
                new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    initial: 0
                }),


            // ====================================================
            // ÉCONOMIE
            // ====================================================

            price:
                new SchemaField({

                    buy:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            initial: 0
                        }),

                    sell:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            initial: 0
                        })
                }),


            // ====================================================
            // DESCRIPTION
            // ====================================================

            description:
                new HTMLField({
                    required: false,
                    nullable: false,
                    initial: ""
                }),

            special:
                new HTMLField({
                    required: false,
                    nullable: false,
                    initial: ""
                }),

            /**
             * Notes privées réservées au MJ.
             *
             * Convention commune à tous les Items Métro 2033.
             * Cette donnée ne doit être affichée dans les sheets
             * que lorsque game.user.isGM est vrai.
             */
            gmNotes:
                new HTMLField({
                    required: true,
                    nullable: false,
                    initial: ""
                })
        };
    }


    // ============================================================
    // DONNÉES DÉRIVÉES
    // ============================================================

    /**
     * Une arme à bonus 0 est hors d'usage uniquement
     * si elle possède normalement un bonus.
     */
    get broken() {

        return (
            this.bonus.max > 0
            && this.bonus.current <= 0
        );
    }


    /**
     * L'arme peut-elle fournir des dés d'équipement ?
     */
    get usableEquipmentBonus() {

        if (!this.equipped) {
            return 0;
        }

        if (this.broken) {
            return 0;
        }

        return this.bonus.current;
    }


    /**
     * Compétence normalement associée à l'arme.
     */
    get skillId() {

        switch (this.category) {

            case "melee":
                return "closeCombat";

            case "ranged":
                return "shooting";

            default:
                return null;
        }
    }


    /**
     * L'arme ne pourra plus jamais être réparée.
     */
    get permanentlyDamaged() {

        return !this.repairable;
    }


    /**
     * Une arme hors d'usage dont la réparation
     * est devenue impossible est détruite.
     */
    get destroyed() {

        return (
            this.broken
            && !this.repairable
        );
    }


    /**
     * L'arme a effectivement besoin d'une réparation.
     */
    get damaged() {

        return (
            this.bonus.current
            < this.bonus.max
        );
    }


    /**
     * L'arme nécessite-t-elle effectivement
     * un chargeur / des munitions pour tirer ?
     */
    get requiresAmmunition() {

        return (
            this.usesAmmunition
            && this.category === "ranged"
        );
    }


    /**
     * Le chargeur est-il considéré comme disponible ?
     *
     * Une arme ne nécessitant pas de munitions
     * est considérée comme prête de ce point de vue.
     */
    get magazineLoaded() {

        if (!this.requiresAmmunition) {
            return true;
        }

        return this.magazine.loaded;
    }


    /**
     * Une munition est-elle actuellement affectée à l'arme ?
     *
     * Pour l'instant, loaded reste notre indicateur persistant
     * historique d'affectation.
     */
    get hasAssignedAmmunition() {
        if (!this.requiresAmmunition) {
            return true;
        }

        return (
            this.magazine.loaded
            && this.magazine.sourceAmmoItemId !== ""
            && this.magazine.ammoType !== ""
        );
    }


    /**
     * Mode de consommation de la munition affectée.
     *
     * null si aucune munition n'est affectée.
     */
    get assignedAmmunitionConsumptionMode() {
        if (!this.hasAssignedAmmunition) {
            return null;
        }

        return this.magazine.consumptionMode;
    }    

    /**
     * L'arme peut-elle actuellement effectuer un tir ?
     *
     * Conditions :
     * - l'arme doit être équipée ;
     * - elle ne doit pas être hors d'usage ;
     * - si elle utilise des munitions, un chargeur
     *   doit être chargé ;
     * - le type de munition chargé doit être compatible.
     */
    get canFire() {

        if (!this.equipped) {
            return false;
        }

        if (this.broken) {
            return false;
        }

        if (this.category !== "ranged") {
            return false;
        }

        if (!this.requiresAmmunition) {
            return true;
        }

        if (!this.hasAssignedAmmunition) {
            return false;
        }

        return (
            this.magazine.ammoType
            === this.ammunitionType
        );
    }


    /**
     * L'arme peut-elle actuellement être utilisée
     * pour effectuer une attaque ?
     *
     * Ce getter fournit une interface commune
     * à la CharacterSheet :
     *
     * - mêlée -> arme équipée et utilisable ;
     * - distance -> règles complètes de canFire.
     */
    get canAttack() {

        if (!this.equipped) {
            return false;
        }

        if (this.broken) {
            return false;
        }

        if (this.category === "melee") {
            return true;
        }

        if (this.category === "ranged") {
            return this.canFire;
        }

        return false;
    }


    /**
     * Qualité de la munition actuellement chargée.
     */
    get loadedAmmoQuality() {

        if (!this.magazine.loaded) {
            return null;
        }

        return this.magazine.quality;
    }


    /**
     * Réduction de Protection apportée
     * par la munition actuellement chargée.
     */
    get loadedProtectionReduction() {

        if (!this.magazine.loaded) {
            return 0;
        }

        return this.magazine.protectionReduction;
    }


    /**
     * La munition actuellement chargée
     * ignore-t-elle la résilience ?
     */
    get loadedAmmoIgnoresResilience() {

        if (!this.magazine.loaded) {
            return false;
        }

        return this.magazine.ignoresResilience;
    }


    /**
     * L'arme possède-t-elle effectivement
     * un effet d'explosion ?
     */
    get hasExplosion() {

        return (
            this.explosive === true
            && this.explosionPower > 0
        );
    }
}