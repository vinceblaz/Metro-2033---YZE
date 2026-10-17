
import { DicePool }
    from "../../domain/rolls/dice-pool.mjs";

import { YZERoll }
    from "../../domain/rolls/yze-roll.mjs";

import { rollPhysicalDice, createDieDrawer }
    from "../rolls/physical-dice-roller.mjs";

import { ProtectionRoll }
    from "../../domain/rolls/protection-roll.mjs";    
    
import { ExplosionRoll }
    from "../../domain/rolls/explosion-roll.mjs";    

import { StunGrenadeRoll }
    from "../../domain/rolls/stun-grenade-roll.mjs";

import { StunProtectionRoll }
    from "../../domain/rolls/stun-protection-roll.mjs";    

import { MeleeBlockRoll }
    from "../../domain/rolls/melee-block-roll.mjs";

import { CoverRoll }
    from "../../domain/rolls/cover-roll.mjs";

import { getSkillAttribute }
    from "../../domain/rules/skills.mjs";

import { hasTalent as itemsHaveTalent }
    from "../../domain/rules/talent-identity.mjs";

import { getArchetypeDefinition } 
    from "../../domain/rules/archetypes.mjs";    

import { evaluateSkillImprovement } 
    from "../../domain/rules/skill-progression.mjs";

import { evaluateTalentImprovement }
    from "../../domain/rules/talent-progression.mjs";    

import {clampStressDice,
    wouldExceedStressLimit
} from "../../domain/rules/stress.mjs";    

import { pushMetroRoll }
    from "../../domain/rules/push.mjs";

import { resolveAfflictions }
    from "../../domain/rules/afflictions.mjs";    

import { computeAvailableAfflictions }
    from "../../domain/rules/affliction-allocation.mjs";

import { rollReliability }
    from "../../domain/rules/equipment-damage.mjs";  
    
import { resolveEquipmentRepair }
    from "../../domain/rules/equipment-repair.mjs";

import { resolveEquipmentContextFromSources }
    from "../../domain/rules/equipment-affliction-source.mjs";    

import { resolveProtectionDamage }
    from "../../domain/rules/protection-damage.mjs";    

import { resolveArmorRepair }
    from "../../domain/rules/armor-repair.mjs";

import { resolveEncumbrance }
    from "../../domain/rules/encumbrance.mjs";

import { resolveSurvivalReserveEncumbrance }
    from "../../domain/rules/survival-reserve-encumbrance.mjs";

import {
    isAmmunitionCompatible,
    isAmmunitionAvailableForWeapon
}   from "../../domain/rules/ammunition.mjs";

import { resolveAmmunitionConsumption }
    from "../../domain/rules/ammunition-consumption.mjs";

import { resolveRangedAttackDamage }
    from "../../domain/rules/ranged-attack-damage.mjs";   
    
import { resolveRangedStunts }
    from "../../domain/rules/ranged-stunts.mjs";   
    
import { resolveDisarm }
    from "../../domain/rules/disarm.mjs";    

import { resolveKnockdown }
    from "../../domain/rules/knockdown.mjs";

import { resolveExplosionDamage }
    from "../../domain/rules/explosion-damage.mjs";    

import { resolveStunGrenadeDamage }
    from "../../domain/rules/stun-grenade-damage.mjs";  

import { resolveMeleeBlockEligibility }
    from "../../domain/rules/melee-block-eligibility.mjs";

import { resolveMeleeAttack }
    from "../../domain/rules/melee-attack-resolution.mjs";

import { resolveMeleeStunts }
    from "../../domain/rules/melee-stunts.mjs";

import { resolveMeleeAttackDamage }
    from "../../domain/rules/melee-attack-damage.mjs";    

import { StunEffectService }
    from "../../combat/stun-effect-service.mjs";

import { MeleeStuntService }
    from "../../combat/melee-stunt-service.mjs";

import { GrappleService }
    from "../../combat/grapple-service.mjs";




/**
 * Classe Document unique pour tous les Actors Métro 2033.
 *
 * Les comportements spécifiques sont contrôlés
 * selon this.type.
 */
export class MetroActor extends Actor {


    prepareDerivedData() {

        super.prepareDerivedData();


        this._applyComposureMaxFromTalents();

    }


    /**
     * Talent général Maîtrise de soi (livre, p.166) :
     * "Votre maximum de sang-froid passe à 6. Supérieur :
     * votre maximum de sang-froid passe à 7."
     *
     * Donnée DÉRIVÉE : ne modifie que la valeur en mémoire de
     * cette préparation (jamais persistée en base), recalculée
     * à chaque appel de prepareDerivedData() — exactement comme
     * n'importe quelle autre valeur dérivée Foundry (bonus
     * d'armure, etc.). Le plafond `max: 5` du schema
     * (`character-model.mjs`) décrit uniquement la valeur de
     * base sans Talent ; il n'est jamais modifié ici.
     */
    _applyComposureMaxFromTalents() {

        if (!this.isCharacter) {

            return;

        }


        const composure =
            this.system.stress
                ?.composure;

        if (!composure) {

            return;

        }


        const selfControlTalent =
            this.items.find(
                item =>
                    item.type === "talent"
                    && item.system?.key
                        === "selfControl"
            );

        if (!selfControlTalent) {

            return;

        }


        const advanced =
            Number(
                selfControlTalent.system
                    ?.level
                ?? 1
            )
            >= 2;


        composure.max =
            advanced
                ? 7
                : 6;

    }


    // ============================================================
    // TYPE
    // ============================================================

    get isCharacter() {

        return this.type === "character";

    }


    get isNPC() {

        return this.type === "npc";

    }


    get isCreature() {

        return this.type === "creature";

    }


    get isVehicle() {

        return this.type === "vehicle";

    }


    /**
     * Vérifie que cette opération concerne
     * un personnage.
     */
    _assertCharacter() {

        if (!this.isCharacter) {

            throw new Error(
                `Cette opération nécessite un Actor de type character. Type actuel : ${this.type}`
            );

        }

    }

    get isLivingActor() {

        return [
            "character",
            "npc",
            "creature"
        ].includes(
            this.type
        );
    }    

    _assertLivingActor() {

        if (!this.isLivingActor) {

            throw new Error(
                `L'Actor ${this.type} ne peut pas utiliser cette règle.`
            );

        }

    }    

    /**
     * Construit l'instantané canonique d'une cible
     * utilisée par une attaque de Combat.
     *
     * Accepte :
     * - un Token placeable ;
     * - un TokenDocument.
     *
     * La cible est enregistrée dans le YZEResult
     * sous forme de données simples afin de pouvoir
     * survivre à la sérialisation dans le Chat.
     */
    _createAttackTargetContext(
        target
    ) {

        this._assertLivingActor();


        if (!target) {

            throw new Error(
                "Une cible doit être sélectionnée avant de lancer une attaque."
            );

        }


        /*
        * game.user.targets contient normalement
        * des Token placeables.
        *
        * On accepte également directement
        * un TokenDocument pour ne pas lier
        * la règle métier à une seule interface.
        */
        const tokenDocument =
            target.document
            ?? target;


        const targetActor =
            target.actor
            ?? tokenDocument.actor
            ?? null;


        if (!targetActor) {

            throw new Error(
                "Le Token ciblé ne possède aucun Actor."
            );

        }


        if (
            ![
                "character",
                "npc",
                "creature"
            ].includes(
                targetActor.type
            )
        ) {

            throw new Error(
                "La cible de cette attaque doit être un Actor vivant."
            );

        }


        if (
            targetActor.id
            === this.id
        ) {

            throw new Error(
                "Un Actor ne peut pas se cibler lui-même avec cette attaque."
            );

        }


        const tokenUuid =
            tokenDocument.uuid
            ?? "";


        if (!tokenUuid) {

            throw new Error(
                "Le Token ciblé ne possède pas d'UUID valide."
            );

        }


        return {

            tokenId:
                tokenDocument.id
                ?? null,

            tokenUuid,

            actorId:
                targetActor.id,

            actorUuid:
                targetActor.uuid,

            name:
                tokenDocument.name
                ?? targetActor.name

        };

    }

    /**
     * Vérifie qu'une action est autorisée
     * dans l'état de combat actuel de l'Actor.
     *
     * Pour l'instant, cette validation sert
     * principalement aux restrictions de saisie.
     */
    _assertActionAllowed(
        actionId,
        {
            combat = game.combat
        } = {}
    ) {

        this._assertLivingActor();


        if (
            typeof actionId !== "string"
            || actionId.length === 0
        ) {

            throw new TypeError(
                "Un identifiant d'action est nécessaire."
            );

        }


        /*
        * Hors combat, aucune restriction
        * de saisie n'est applicable.
        */
        if (!combat) {

            return true;

        }


        const allowed =
            GrappleService.canActorPerformAction(
                combat,
                this,
                actionId
            );


        if (!allowed) {

            const state =
                GrappleService.getActionState(
                    combat,
                    this
                );


            if (
                state.role === "target"
                && state.onlyAction === "grapple-escape"
            ) {

                throw new Error(
                    `${this.name} est saisi : sa seule action possible est de tenter de se libérer.`
                );

            }


            throw new Error(
                `Action interdite : ${actionId}.`
            );

        }


        return true;

    }

    // ============================================================
    // ATTRIBUTS
    // ============================================================

    getAttribute(attributeId) {

        this._assertLivingActor();

        return this.system.attributes?.[attributeId]?.value
            ?? null;

    }


    getAttributeMax(attributeId) {

        this._assertLivingActor();

        return this.system.attributes?.[attributeId]?.max
            ?? null;

    }

    /**
     * Effectue un test d'attribut pur.
     *
     * Un test d'attribut utilise :
     *
     * - la valeur d'attribut validée lors de la préparation ;
     * - aucun dé de compétence ;
     * - les éventuels dés d'équipement sélectionnés ;
     * - les dés de Stress du personnage ;
     * - les éventuels bonus / malus ;
     * - les modificateurs temporaires applicables.
     *
     * La résolution du jet reste entièrement
     * déléguée au moteur YZE.
     *
     * extraStressDie : cf. le commentaire équivalent sur
     * rollSkill() (« Subir 1 Stress pour +3 », livre p.190).
     */
    async rollAttribute(
        attributeId,
        {
            attributeOverride = null,
            equipment = 0,
            stressOverride = null,
            extraStressDie = 0,
            bonus = 0,
            penalty = 0,
            context = {}
        } = {}
    ) {

        this._assertCharacter();


        // --------------------------------------------------------
        // 1. ATTRIBUT
        // --------------------------------------------------------

        const actorAttribute =
            this.getAttribute(
                attributeId
            );


        if (actorAttribute === null) {

            throw new Error(
                `Attribut inconnu : ${attributeId}`
            );

        }


        const preparedAttribute =
            Number(
                attributeOverride
            );


        const attribute =
            (
                attributeOverride !== null
                && Number.isFinite(
                    preparedAttribute
                )
            )
                ? Math.max(
                    0,
                    preparedAttribute
                )
                : actorAttribute;


        // --------------------------------------------------------
        // 2. STRESS
        // --------------------------------------------------------

        const actorStress =
            this.system.stress?.dice
            ?? 0;


        const preparedStress =
            Number(
                stressOverride
            );


        const baseStress =
            (
                stressOverride !== null
                && Number.isFinite(
                    preparedStress
                )
            )
                ? Math.max(
                    0,
                    preparedStress
                )
                : actorStress;


        const normalizedExtraStressDie =
            Math.max(
                0,
                Number(
                    extraStressDie
                ) || 0
            );


        const stress =
            baseStress
            + normalizedExtraStressDie;


        // --------------------------------------------------------
        // 3. EFFETS TEMPORAIRES
        // --------------------------------------------------------

        const stunPenalty =
            StunEffectService.getPenalty({
                actor:
                    this,

                combat:
                    game.combat
            });


        const effectivePenalty =
            penalty
            + stunPenalty;


        // --------------------------------------------------------
        // 4. POOL
        // --------------------------------------------------------

        const pool =
            new DicePool({

                attribute,

                skill:
                    0,

                equipment:
                    Math.max(
                        0,
                        Number(
                            equipment
                        ) || 0
                    ),

                stress,

                bonus,

                penalty:
                    effectivePenalty

            });


        // --------------------------------------------------------
        // 5. JET PHYSIQUE FOUNDRY, PUIS RÉSOLUTION YZE
        // --------------------------------------------------------

        /*
        * Chaque jet déclenche désormais un véritable jet
        * Foundry (visible dans le tchat, animé par Dice So
        * Nice si présent) : les faces réellement obtenues
        * sont celles qui pilotent la résolution métier.
        */
        const diceToRoll =
            YZERoll.countInitialDiceToRoll(
                pool
            );


        const {
            roll: physicalRoll,
            values: physicalDiceValues
        } =
            await rollPhysicalDice({

                normal:
                    diceToRoll.normal,

                stress:
                    diceToRoll.stress

            });


        const drawDie =
            physicalDiceValues.length > 0
                ? createDieDrawer(
                    physicalDiceValues
                )
                : null;


        const result =
            YZERoll.roll(
                pool,
                {
                    ...context,

                    action:
                        "attribute-roll",

                    actorId:
                        this.id,

                    actorUuid:
                        this.uuid,

                    actorName:
                        this.name,

                    attribute:
                        attributeId,

                    skill:
                        null,

                    equipment:
                        null,

                    temporaryModifiers: {
                        stunPenalty
                    }
                },
                {
                    drawDie
                }
            );


        if (physicalRoll) {

            result.physicalRoll =
                physicalRoll;

        }


        // --------------------------------------------------------
        // 6. DÉS DE STRESS ÉLIMINÉS
        // --------------------------------------------------------

        /*
        * Comme pour rollSkill(), un 6 obtenu
        * sur un dé de Stress élimine réellement
        * ce dé du personnage.
        */
        if (
            result.eliminatedStress > 0
        ) {

            await this.removeStress(
                result.eliminatedStress
            );

        }


        // --------------------------------------------------------
        // 7. DÉ DE STRESS « SUBIR 1 STRESS POUR +3 »
        // --------------------------------------------------------

        /*
        * Cf. le commentaire équivalent dans rollSkill() : persisté
        * après résolution, quel que soit le résultat du jet.
        */
        if (
            normalizedExtraStressDie > 0
        ) {

            await this.addStress(
                normalizedExtraStressDie
            );

        }


        return result;

    }

    async takeAttributeDamage(
        attributeId,
        amount = 1
    ) {

        this._assertLivingActor();


        const current =
            this.getAttribute(attributeId);


        if (current === null) {

            throw new Error(
                `Attribut inconnu : ${attributeId}`
            );

        }


        if (
            !Number.isInteger(amount)
            || amount < 0
        ) {

            throw new Error(
                "La quantité de dégâts doit être un entier positif."
            );

        }


        const newValue =
            Math.max(
                0,
                current - amount
            );


        await this.update({

            [`system.attributes.${attributeId}.value`]:
                newValue

        });


        return {

            attribute:
                attributeId,

            previous:
                current,

            current:
                newValue,

            damage:
                current - newValue,

            requestedDamage:
                amount,

            overflow:
                Math.max(
                    0,
                    amount - current
                ),

            broken:
                newValue === 0

        };

    }

    /**
     * Restaure des points d'un Attribut, sans jamais dépasser
     * son maximum (soin d'Attribut, ex. Second souffle).
     *
     * Symétrique de takeAttributeDamage : quantité entière
     * positive ou nulle ; ne fait jamais reculer l'Attribut.
     */
    async recoverAttribute(
        attributeId,
        amount = 1
    ) {

        this._assertLivingActor();


        const current =
            this.getAttribute(attributeId);


        if (current === null) {

            throw new Error(
                `Attribut inconnu : ${attributeId}`
            );

        }


        if (
            !Number.isInteger(amount)
            || amount < 0
        ) {

            throw new Error(
                "La quantité à récupérer doit être un entier positif ou nul."
            );

        }


        const max =
            this.getAttributeMax(attributeId)
            ?? current;


        const newValue =
            Math.max(
                current,
                Math.min(
                    max,
                    current + amount
                )
            );


        if (newValue !== current) {

            await this.update({

                [`system.attributes.${attributeId}.value`]:
                    newValue

            });

        }


        return {

            attribute:
                attributeId,

            previous:
                current,

            current:
                newValue,

            recovered:
                newValue - current,

            requestedAmount:
                amount

        };

    }


    /**
     * L'Actor possède-t-il ce Talent ? Identification par clé
     * métier (`system.key`) avec repli par nom, cf.
     * domain/rules/talent-identity.mjs.
     */
    hasTalent(
        identity
    ) {

        return itemsHaveTalent(
            this.items,
            identity
        );

    }

    // ============================================================
    // ARCHÉTYPE
    // ============================================================

    /**
     * Retourne l'Item Archétype embarqué
     * du personnage.
     *
     * Convention métier :
     *
     * - un personnage peut posséder zéro
     *   ou un Item de type "archetype" ;
     * - cette méthode constitue le point d'accès
     *   centralisé à cet Item ;
     * - aucune autre règle métier ne doit rechercher
     *   directement l'Archétype avec items.find().
     *
     * L'invariant d'unicité sera sécurisé
     * séparément lors de l'acquisition.
     */
    getArchetypeItem(
    ) {

        this._assertCharacter();


        return (
            this.items.find(
                item =>
                    item.type
                    === "archetype"
            )
            ?? null
        );

    }

    /**
     * Retourne la définition métier
     * de l'Archétype du personnage.
     *
     * La définition est déterminée exclusivement
     * à partir de l'Item Archétype embarqué.
     *
     * Un personnage sans Item Archétype
     * ne possède aucune définition d'Archétype.
     */
    getArchetypeDefinition(
        
    ) {

        this._assertCharacter();


        // --------------------------------------------------------
        // 1. ITEM ARCHÉTYPE
        // --------------------------------------------------------

        const archetypeItem =
            this.getArchetypeItem();


        if (!archetypeItem) {

            return null;

        }


        // --------------------------------------------------------
        // 2. IDENTIFIANT MÉTIER
        // --------------------------------------------------------

        const archetypeKey =
            String(
                archetypeItem.system?.key
                ?? ""
            ).trim();


        if (!archetypeKey) {

            return null;

        }


        // --------------------------------------------------------
        // 3. DÉFINITION CANONIQUE
        // --------------------------------------------------------

        return getArchetypeDefinition(
            archetypeKey
        );

    }


    /**
     * Retourne l'attribut d'Archétype effectif
     * du personnage.
     *
     * Pour les Archétypes sans choix, il provient
     * directement de leur définition canonique.
     *
     * Pour les Archétypes avec choix, il provient
     * exclusivement de la configuration de
     * l'Item Archétype embarqué.
     */
    getArchetypeAttribute(
        
    ) {

        this._assertCharacter();


        const definition =
            this.getArchetypeDefinition();


        if (!definition) {

            return null;

        }


        // --------------------------------------------------------
        // 1. ATTRIBUT FIXE
        // --------------------------------------------------------

        if (definition.attribute) {

            return definition.attribute;

        }


        // --------------------------------------------------------
        // 2. ITEM ARCHÉTYPE
        // --------------------------------------------------------

        const archetypeItem =
            this.getArchetypeItem();


        if (!archetypeItem) {

            return null;

        }


        // --------------------------------------------------------
        // 3. ATTRIBUT CHOISI
        // --------------------------------------------------------

        const selectedAttribute =
            archetypeItem.system
                ?.configuration
                ?.attribute
            ?? "";


        // --------------------------------------------------------
        // 4. VALIDATION CONTRE LA DÉFINITION
        // --------------------------------------------------------

        if (
            definition.attributeChoices
                ?.includes(
                    selectedAttribute
                )
        ) {

            return selectedAttribute;

        }


        return null;

    }


    /**
     * Retourne les compétences d'Archétype
     * effectives du personnage.
     *
     * Les compétences fixes proviennent
     * de la définition canonique.
     *
     * Les éventuelles compétences choisies
     * proviennent exclusivement de la configuration
     * de l'Item Archétype embarqué.
     */
    getArchetypeSkills(
        
    ) {

        this._assertCharacter();


        const definition =
            this.getArchetypeDefinition();


        if (!definition) {

            return [];

        }


        // --------------------------------------------------------
        // 1. COMPÉTENCES FIXES
        // --------------------------------------------------------

        const skills = [
            ...(definition.skills ?? [])
        ];


        const skillChoices =
            definition.skillChoices
            ?? [];


        // --------------------------------------------------------
        // 2. COMPÉTENCE CHOISIE
        // --------------------------------------------------------

        if (skillChoices.length > 0) {

            const archetypeItem =
                this.getArchetypeItem();


            const selectedSkill =
                archetypeItem?.system
                    ?.configuration
                    ?.skill
                ?? "";


            const allowed =
                skillChoices.some(
                    choices =>
                        choices.includes(
                            selectedSkill
                        )
                );


            if (allowed) {

                skills.push(
                    selectedSkill
                );

            }

        }


        // --------------------------------------------------------
        // 3. RÉSULTAT UNIQUE
        // --------------------------------------------------------

        return [
            ...new Set(
                skills
            )
        ];

    }


    /**
     * Indique si une compétence bénéficie
     * des règles de compétence d'archétype.
     */
    isArchetypeSkill(
        skillId
    ) {

        this._assertCharacter();


        if (
            this.getSkill(
                skillId
            ) === null
        ) {

            return false;

        }


        return this
            .getArchetypeSkills()
            .includes(
                skillId
            );

    }


    // ============================================================
    // COMPÉTENCES
    // ============================================================

    getSkill(skillId) {

        this._assertLivingActor();

        return this.system.skills?.[skillId]
            ?? null;

    }


    getSkillAttribute(skillId) {

        this._assertLivingActor();

        return getSkillAttribute(skillId);

    }


    getSkillPool(skillId) {

        this._assertLivingActor();


        const attributeId =
            this.getSkillAttribute(skillId);


        if (!attributeId) {

            return null;

        }


        const attribute =
            this.getAttribute(attributeId);

        const skill =
            this.getSkill(skillId);


        if (
            attribute === null
            || skill === null
        ) {

            return null;

        }


        return attribute + skill;

    }


    /**
     * Augmente une compétence d'un niveau
     * en dépensant les XP nécessaires.
     *
     * Cette méthode constitue le point d'entrée
     * Foundry de la progression d'une compétence.
     *
     * Les règles de coût et de limite sont déléguées
     * au domaine via evaluateSkillImprovement().
     *
     * IMPORTANT :
     *
     * Pour le passage 0 -> 1, la condition narrative
     * d'apprentissage n'est pas automatisée.
     *
     * requiresGMApproval indique simplement au workflow
     * qu'une décision du MJ est nécessaire avant
     * d'appeler cette méthode.
     *
     * À ce stade du projet, isArchetypeSkill est fourni
     * explicitement. Il sera ultérieurement déterminé
     * automatiquement lorsque les archétypes disposeront
     * de leur définition métier.
     */
    async improveSkill(
        skillId
    ) {

        this._assertCharacter();


        // --------------------------------------------------------
        // 1. COMPÉTENCE
        // --------------------------------------------------------

        const currentLevel =
            this.getSkill(
                skillId
            );


        if (currentLevel === null) {

            throw new Error(
                `Compétence inconnue : ${skillId}`
            );

        }


        // --------------------------------------------------------
        // 2. XP DISPONIBLES / DÉPENSÉS
        // --------------------------------------------------------

        const availableXp =
            Number(
                this.system.progression
                    ?.xp?.available
                ?? 0
            );


        const spentXp =
            Number(
                this.system.progression
                    ?.xp?.spent
                ?? 0
            );


        // --------------------------------------------------------
        // 3. ÉVALUATION MÉTIER
        // --------------------------------------------------------
        const isArchetypeSkill =
            this.isArchetypeSkill(
                skillId
            );

            
        const evaluation =
            evaluateSkillImprovement({

                currentLevel,

                availableXp,

                isArchetypeSkill

            });


        // --------------------------------------------------------
        // 4. AUGMENTATION REFUSÉE
        // --------------------------------------------------------

        if (!evaluation.allowed) {

            return {

                applied:
                    false,

                skillId,

                ...evaluation

            };

        }


        // --------------------------------------------------------
        // 5. SÉCURITÉ — VALIDATION MJ
        // --------------------------------------------------------

        /*
        * Le passage 0 -> 1 nécessite une décision
        * narrative du MJ.
        *
        * Cette méthode ne tente volontairement pas
        * de déterminer si la condition du livre
        * a été remplie.
        *
        * Le workflow UI devra obtenir l'autorisation
        * avant d'appeler improveSkill().
        */
        if (
            evaluation.requiresGMApproval
            && !game.user.isGM
        ) {

            return {

                applied:
                    false,

                skillId,

                reason:
                    "gm-approval-required",

                ...evaluation,

                allowed:
                    false

            };

        }


        // --------------------------------------------------------
        // 6. NOUVELLES VALEURS
        // --------------------------------------------------------

        const targetLevel =
            evaluation.targetLevel;


        const cost =
            evaluation.cost;


        const remainingXp =
            availableXp
            - cost;


        const newSpentXp =
            spentXp
            + cost;


        // --------------------------------------------------------
        // 7. MISE À JOUR UNIQUE DE L'ACTOR
        // --------------------------------------------------------

        /*
        * La compétence et les deux compteurs d'XP
        * sont persistés dans une seule opération
        * Foundry.
        *
        * On évite ainsi :
        *
        * - compétence augmentée sans débit d'XP ;
        * - XP débités sans augmentation ;
        * - état intermédiaire observable.
        */
        await this.update({

            [`system.skills.${skillId}`]:
                targetLevel,

            "system.progression.xp.available":
                remainingXp,

            "system.progression.xp.spent":
                newSpentXp

        });


        // --------------------------------------------------------
        // 8. RÉSULTAT STRUCTURÉ
        // --------------------------------------------------------

        return {

            applied:
                true,

            skillId,

            previousLevel:
                currentLevel,

            currentLevel:
                targetLevel,

            cost,

            xp: {

                previousAvailable:
                    availableXp,

                available:
                    remainingXp,

                previousSpent:
                    spentXp,

                spent:
                    newSpentXp

            },

            isArchetypeSkill:
                Boolean(
                    isArchetypeSkill
                ),

            requiresGMApproval:
                evaluation.requiresGMApproval

        };

    }    


    // ============================================================
    // TALENTS
    // ============================================================

    /**
     * Améliore d'un niveau un Talent déjà possédé.
     *
     * Convention métier :
     *
     * - system.key identifie le Talent métier ;
     * - le niveau actuel correspond au nombre
     *   d'Items Talent embarqués partageant ce key ;
     * - system.maxLevel définit le niveau maximum ;
     * - chaque niveau supplémentaire coûte 5 XP.
     *
     * L'amélioration est matérialisée par la création
     * d'une nouvelle copie embarquée du Talent.
     *
     * Cette méthode ne gère PAS les éventuels
     * prérequis narratifs d'apprentissage.
     */
    async improveTalent(
        talentId
    ) {

        this._assertCharacter();


        // ========================================================
        // 1. RETROUVER LE TALENT EMBARQUÉ
        // ========================================================

        if (
            typeof talentId !== "string"
            || talentId.length === 0
        ) {

            throw new TypeError(
                "Un identifiant de Talent est nécessaire."
            );

        }


        const talent =
            this.items.get(
                talentId
            );


        if (!talent) {

            throw new Error(
                `Talent introuvable : ${talentId}`
            );

        }


        if (
            talent.type !== "talent"
        ) {

            throw new Error(
                `L'Item ${talentId} n'est pas un Talent.`
            );

        }


        if (
            talent.actor?.id
            !== this.id
        ) {

            throw new Error(
                "Le Talent n'appartient pas à cet Actor."
            );

        }


        // ========================================================
        // 2. IDENTITÉ MÉTIER
        // ========================================================

        const talentKey =
            String(
                talent.system?.key
                ?? ""
            ).trim();


        if (!talentKey) {

            throw new Error(
                "Le Talent ne possède aucun system.key valide."
            );

        }


        // ========================================================
        // 3. NIVEAU ACTUEL
        // ========================================================

        const ownedTalentInstances =
            this.items.filter(
                item =>
                    item.type === "talent"
                    && String(
                        item.system?.key
                        ?? ""
                    ).trim() === talentKey
            );


        const currentLevel =
            ownedTalentInstances.length;


        // ========================================================
        // 4. NIVEAU MAXIMUM
        // ========================================================

        const maxLevel =
            Number(
                talent.system?.maxLevel
                ?? 1
            );


        // ========================================================
        // 5. XP
        // ========================================================

        const availableXp =
            Number(
                this.system.progression
                    ?.xp?.available
                ?? 0
            );


        const spentXp =
            Number(
                this.system.progression
                    ?.xp?.spent
                ?? 0
            );


        // ========================================================
        // 6. ÉVALUATION MÉTIER
        // ========================================================

        const evaluation =
            evaluateTalentImprovement({

                currentLevel,

                maxLevel,

                availableXp

            });


        // ========================================================
        // 7. PROGRESSION REFUSÉE
        // ========================================================

        if (
            !evaluation.allowed
        ) {

            return {

                applied:
                    false,

                talentId:
                    talent.id,

                talentUuid:
                    talent.uuid,

                talentName:
                    talent.name,

                talentKey,

                ...evaluation

            };

        }


        const cost =
            evaluation.cost;


        const targetLevel =
            evaluation.targetLevel;


        const remainingXp =
            availableXp
            - cost;


        const newSpentXp =
            spentXp
            + cost;


        // ========================================================
        // 8. PRÉPARER LA NOUVELLE INSTANCE
        // ========================================================

        /*
        * toObject() fournit les données nécessaires
        * à la création d'une nouvelle copie embarquée.
        *
        * On retire _id afin que Foundry attribue
        * un nouvel identifiant de Document.
        *
        * system.key est conservé : les deux Items
        * représentent donc des niveaux du même Talent.
        */
        const talentData =
            talent.toObject();


        delete talentData._id;


        // ========================================================
        // 9. CRÉER LE NOUVEAU NIVEAU
        // ========================================================

        const createdTalents =
            await this.createEmbeddedDocuments(
                "Item",
                [
                    talentData
                ]
            );


        const createdTalent =
            createdTalents?.[0]
            ?? null;


        if (!createdTalent) {

            throw new Error(
                `Impossible de créer le niveau ${targetLevel} du Talent ${talent.name}.`
            );

        }


        // ========================================================
        // 10. DÉBITER LES XP
        // ========================================================

        try {

            await this.update({

                "system.progression.xp.available":
                    remainingXp,

                "system.progression.xp.spent":
                    newSpentXp

            });

        }
        catch (error) {

            /*
            * Compensation transactionnelle :
            *
            * la création du nouveau niveau a réussi,
            * mais le débit des XP a échoué.
            *
            * On détruit uniquement l'instance créée
            * par cette opération afin de revenir
            * à l'état initial.
            */
            try {

                await this.deleteEmbeddedDocuments(
                    "Item",
                    [
                        createdTalent.id
                    ]
                );

            }
            catch (rollbackError) {

                console.error(
                    "METRO 2033 | Échec du rollback d'une progression de Talent.",
                    {
                        actor:
                            this,

                        talent:
                            createdTalent,

                        originalError:
                            error,

                        rollbackError
                    }
                );

            }


            throw error;

        }


        // ========================================================
        // 11. RÉSULTAT STRUCTURÉ
        // ========================================================

        return {

            applied:
                true,

            talentId:
                talent.id,

            talentUuid:
                talent.uuid,

            talentName:
                talent.name,

            talentKey,

            createdTalentId:
                createdTalent.id,

            createdTalentUuid:
                createdTalent.uuid,

            previousLevel:
                currentLevel,

            currentLevel:
                targetLevel,

            maxLevel,

            cost,

            xp: {

                previousAvailable:
                    availableXp,

                available:
                    remainingXp,

                previousSpent:
                    spentXp,

                spent:
                    newSpentXp

            }

        };

    }

    /**
     * Effectue un jet de compétence.
     *
     * Un jet préparé peut fournir explicitement :
     *
     * - la valeur d'attribut ;
     * - la valeur de compétence ;
     * - les dés d'équipement sélectionnés ;
     * - les dés de Stress ;
     * - les bonus / malus ;
     * - le contexte de préparation.
     *
     * La détermination des sources applicables appartient
     * au service de préparation, pas à cette méthode.
     *
     * equipmentItem est conservé temporairement pour
     * les workflows spécialisés existants, notamment
     * les attaques à distance.
     *
     * extraStressDie (livre, p.190, « Subir 1 Stress pour +3 ») :
     * un dé de Stress supplémentaire, propre à CE jet, qui
     * rejoint le pool sans être lu depuis
     * `actor.system.stress.dice` au préalable — il n'est persisté
     * sur l'Actor qu'après résolution du jet (Bible §25.2 :
     * conséquence appliquée après coup, jamais avant), quel que
     * soit le résultat du jet (c'est le coût du +3, pas une
     * conséquence d'un échec).
     */
    async rollSkill(
        skillId,
        {
            attributeOverride = null,
            skillOverride = null,
            equipmentItem = null,
            equipment = null,
            stressOverride = null,
            extraStressDie = 0,
            bonus = 0,
            penalty = 0,
            context = {}
        } = {}
    ) {

        /*
        * Les PNJ et Créatures utilisent le même jet de
        * compétence que les Personnages (livre p.193) ;
        * seul le Stress, réservé aux PJ, ne s'applique pas.
        */
        this._assertLivingActor();


        // --------------------------------------------------------
        // 1. COMPÉTENCE ET ATTRIBUT ASSOCIÉ
        // --------------------------------------------------------

        const attributeId =
            this.getSkillAttribute(
                skillId
            );


        if (!attributeId) {

            throw new Error(
                `Compétence inconnue : ${skillId}`
            );

        }


        const actorAttribute =
            this.getAttribute(
                attributeId
            );


        const actorSkill =
            this.getSkill(
                skillId
            );


        if (
            actorAttribute === null
            || actorSkill === null
        ) {

            throw new Error(
                `Compétence inconnue : ${skillId}`
            );

        }


        // --------------------------------------------------------
        // 2. VALEURS PRÉPARÉES
        // --------------------------------------------------------

        const preparedAttribute =
            Number(
                attributeOverride
            );


        const attribute =
            (
                attributeOverride !== null
                && Number.isFinite(
                    preparedAttribute
                )
            )
                ? Math.max(
                    0,
                    preparedAttribute
                )
                : actorAttribute;


        const preparedSkill =
            Number(
                skillOverride
            );


        const skill =
            (
                skillOverride !== null
                && Number.isFinite(
                    preparedSkill
                )
            )
                ? Math.max(
                    0,
                    preparedSkill
                )
                : actorSkill;


        // --------------------------------------------------------
        // 3. ÉQUIPEMENT
        // --------------------------------------------------------

        let equipmentDice =
            Math.max(
                0,
                Number(
                    equipment
                ) || 0
            );


        let equipmentContext =
            null;


        /*
        * Compatibilité avec les workflows spécialisés
        * existants, notamment les attaques.
        *
        * Dans ce cas précis, l'Item utilisé fait partie
        * intrinsèque de l'action et reste validé ici.
        *
        * Les Equipment génériques proposés par la
        * préparation universelle ne passent PAS
        * par cette branche.
        */
        if (equipmentItem) {

            if (
                equipmentItem.actor?.id
                !== this.id
            ) {

                throw new Error(
                    "L'équipement utilisé n'appartient pas à cet Actor."
                );

            }


            if (
                equipmentItem.system?.equipped
                !== true
            ) {

                throw new Error(
                    "L'équipement utilisé doit être équipé."
                );

            }


            if (
                equipmentItem.system?.broken
                === true
            ) {

                throw new Error(
                    "L'équipement utilisé est hors d'usage."
                );

            }


            if (
                equipmentItem.system?.skillId
                !== skillId
            ) {

                throw new Error(
                    `Cet équipement ne peut pas être utilisé avec la compétence ${skillId}.`
                );

            }


            equipmentDice =
                Math.max(
                    0,
                    Number(
                        equipmentItem.system
                            ?.usableEquipmentBonus
                    ) || 0
                );


            equipmentContext = {

                itemId:
                    equipmentItem.id,

                itemUuid:
                    equipmentItem.uuid,

                itemName:
                    equipmentItem.name,

                itemType:
                    equipmentItem.type

            };

        }


        /*
        * Jet préparé (fenêtre de préparation) : l'Item n'est pas
        * transmis, seul le total de dés l'est. On retrouve alors
        * l'équipement cochant des dés, afin que la répartition des
        * afflictions puisse proposer « Équipement ».
        */
        if (
            equipmentContext === null
            && equipmentDice > 0
        ) {

            equipmentContext =
                resolveEquipmentContextFromSources(
                    context?.preparation
                        ?.selectedSources,
                    itemId =>
                        this.items.get(
                            itemId
                        )
                );

        }


        // --------------------------------------------------------
        // 4. STRESS
        // --------------------------------------------------------

        const actorStress =
            this.system.stress?.dice
            ?? 0;


        const preparedStress =
            Number(
                stressOverride
            );


        const baseStress =
            (
                stressOverride !== null
                && Number.isFinite(
                    preparedStress
                )
            )
                ? Math.max(
                    0,
                    preparedStress
                )
                : actorStress;


        const normalizedExtraStressDie =
            Math.max(
                0,
                Number(
                    extraStressDie
                ) || 0
            );


        const stress =
            baseStress
            + normalizedExtraStressDie;


        // --------------------------------------------------------
        // 5. EFFETS TEMPORAIRES
        // --------------------------------------------------------

        const stunPenalty =
            StunEffectService.getPenalty({
                actor:
                    this,

                combat:
                    game.combat
            });


        const effectivePenalty =
            penalty
            + stunPenalty;


        // --------------------------------------------------------
        // 6. POOL
        // --------------------------------------------------------

        const pool =
            new DicePool({

                attribute,

                skill,

                equipment:
                    equipmentDice,

                stress,

                bonus,

                penalty:
                    effectivePenalty

            });


        // --------------------------------------------------------
        // 7. JET PHYSIQUE FOUNDRY, PUIS RÉSOLUTION YZE
        // --------------------------------------------------------

        /*
        * Cf. le commentaire équivalent dans rollAttribute().
        */
        const diceToRoll =
            YZERoll.countInitialDiceToRoll(
                pool
            );


        const {
            roll: physicalRoll,
            values: physicalDiceValues
        } =
            await rollPhysicalDice({

                normal:
                    diceToRoll.normal,

                stress:
                    diceToRoll.stress

            });


        const drawDie =
            physicalDiceValues.length > 0
                ? createDieDrawer(
                    physicalDiceValues
                )
                : null;


        const result =
            YZERoll.roll(
                pool,
                {
                    ...context,

                    action:
                        context.action
                        ?? "skill-roll",

                    actorId:
                        this.id,

                    actorUuid:
                        this.uuid,

                    actorName:
                        this.name,

                    skill:
                        skillId,

                    attribute:
                        attributeId,

                    /*
                    * Un workflow spécialisé peut encore
                    * fournir son propre Item.
                    *
                    * Pour la préparation universelle,
                    * les sources sélectionnées sont déjà
                    * conservées dans context.
                    */
                    equipment:
                        equipmentContext,

                    temporaryModifiers: {
                        stunPenalty
                    }
                },
                {
                    drawDie
                }
            );


        if (physicalRoll) {

            result.physicalRoll =
                physicalRoll;

        }


        // --------------------------------------------------------
        // 8. DÉS DE STRESS ÉLIMINÉS
        // --------------------------------------------------------

        if (
            this.isCharacter
            && result.eliminatedStress > 0
        ) {

            await this.removeStress(
                result.eliminatedStress
            );

        }


        // --------------------------------------------------------
        // 9. DÉ DE STRESS « SUBIR 1 STRESS POUR +3 »
        // --------------------------------------------------------

        /*
        * Persisté APRÈS résolution du jet, quel que soit son
        * résultat (Bible §25.2) : ce dé supplémentaire a déjà
        * rejoint le pool à l'étape 4, ce n'est qu'ici qu'il
        * devient un dé de Stress permanent du personnage.
        */
        if (
            this.isCharacter
            && normalizedExtraStressDie > 0
        ) {

            await this.addStress(
                normalizedExtraStressDie
            );

        }


        return result;

    }


    async pushRoll(
        result,
        options = {}
    ) {

        this._assertCharacter();

        /*
        * Cf. rollAttribute()/rollSkill() : un Push
        * déclenche lui aussi un véritable jet Foundry
        * pour les dés effectivement relancés.
        */
        return pushMetroRoll(
            this,
            result,
            {
                ...options,

                rollerProvider:
                    async counts => {

                        const {
                            roll: physicalRoll,
                            values
                        } =
                            await rollPhysicalDice({

                                normal:
                                    counts.normal,

                                stress:
                                    counts.stress,

                                /*
                                * Un Push ajoute son Roll à un
                                * ChatMessage déjà existant via
                                * message.update() (cf.
                                * YZERollChat.updateMessage) :
                                * Dice So Nice n'anime pas une
                                * mise à jour. Contrairement au
                                * jet initial, l'animation doit
                                * donc être déclenchée ici.
                                */
                                forceAnimation:
                                    true

                            });


                        return {

                            physicalRoll,

                            drawDie:
                                values.length > 0
                                    ? createDieDrawer(
                                        values
                                    )
                                    : null

                        };

                    }
            }
        );

    }

    async pushRangedAttack(
        result,
        {
            useStress = false,
            causedByPoorAmmunition = false
        } = {}
    ) {

        this._assertCharacter();


        if (!result) {

            throw new TypeError(
                "pushRangedAttack nécessite un résultat de jet."
            );

        }


        if (
            result.context
                ?.attack
                ?.type
            !== "ranged"
        ) {

            throw new Error(
                "Ce résultat n'est pas une attaque à distance."
            );

        }


        const weaponId =
            result.context
                ?.attack
                ?.weapon
                ?.id;


        if (!weaponId) {

            throw new Error(
                "L'arme utilisée pour cette attaque est absente du contexte."
            );

        }


        const weapon =
            this.items.get(
                weaponId
            );


        if (!weapon) {

            throw new Error(
                "L'arme utilisée pour cette attaque n'existe plus sur cet Actor."
            );

        }


        const pushedResult =
            await this.pushRoll(
                result,
                {
                    useStress
                }
            );


        const requiresAmmunition =
            pushedResult.context
                ?.attack
                ?.ammunition
                ?.required
            === true;


        if (requiresAmmunition) {

            await this.resolveMagazineAfterShot(
                weapon,
                pushedResult,
                {
                    event:
                        "push",

                    causedByPoorAmmunition
                }
            );

        }


        return pushedResult;

    }    

    // ============================================================
    // STRESS
    // ============================================================

    async addStress(amount = 1) {

        this._assertCharacter();


        if (
            !Number.isInteger(amount)
            || amount <= 0
        ) {

            throw new Error(
                "La quantité de Stress doit être un entier supérieur à zéro."
            );

        }


        const current =
            this.system.stress?.dice ?? 0;


        const exceedsLimit =
            wouldExceedStressLimit(
                current,
                amount
            );


        const newValue =
            clampStressDice(
                current + amount
            );


        await this.update({

            "system.stress.dice":
                newValue

        });


        return {

            previous:
                current,

            current:
                newValue,

            added:
                newValue - current,

            exceedsLimit

        };

    }


    async removeStress(amount = 1) {

        this._assertCharacter();


        if (
            !Number.isInteger(amount)
            || amount <= 0
        ) {

            throw new Error(
                "La quantité de Stress doit être un entier supérieur à zéro."
            );

        }


        const current =
            this.system.stress?.dice ?? 0;


        const newValue =
            Math.max(
                0,
                current - amount
            );


        await this.update({

            "system.stress.dice":
                newValue

        });


        return {

            previous:
                current,

            current:
                newValue,

            removed:
                current - newValue

        };

    }

    async addComposure(
        amount = 1
    ) {

        this._assertCharacter();


        if (
            !Number.isInteger(amount)
            || amount <= 0
        ) {

            throw new Error(
                "La quantité de Sang-froid doit être un entier supérieur à zéro."
            );

        }


        const current =
            this.system.stress?.composure?.current
            ?? 0;

        const max =
            this.system.stress?.composure?.max
            ?? 5;


        const newValue =
            Math.min(
                max,
                current + amount
            );


        await this.update({

            "system.stress.composure.current":
                newValue

        });


        return {

            previous:
                current,

            current:
                newValue,

            added:
                newValue - current,

            reachedBreakingPoint:
                newValue >= max

        };
    } 


    async removeComposure(
        amount = 1
    ) {

        this._assertCharacter();


        if (
            !Number.isInteger(amount)
            || amount <= 0
        ) {

            throw new Error(
                "La quantité de Sang-froid doit être un entier supérieur à zéro."
            );

        }


        const current =
            this.system.stress?.composure?.current
            ?? 0;


        const newValue =
            Math.max(
                0,
                current - amount
            );


        await this.update({

            "system.stress.composure.current":
                newValue

        });


        return {

            previous:
                current,

            current:
                newValue,

            removed:
                current - newValue

        };

    }

    /*
     * Talents généraux Imperturbable / Mental d'acier / Nerfs
     * d'acier / Résistance (livre, p.172-183) : "Vous pouvez
     * ignorer une affliction (« 1 ») sur tous vos jets forcés
     * dépendant de l'attribut [EMPATHIE / ESPRIT / AGILITÉ /
     * VIGUEUR]." Chacun ne s'applique qu'à UN seul Attribut ;
     * un même Personnage ne peut normalement en avoir qu'un qui
     * corresponde à l'Attribut du jet en cours.
     */
    static IGNORE_AFFLICTION_TALENT_KEYS_BY_ATTRIBUTE = {

        empathy:
            "unflappable",

        spirit:
            "steelMind",

        agility:
            "steelNerves",

        vigor:
            "resilience"

    };

    /**
     * Nombre d'afflictions ignorées par un Talent pour CE jet
     * (0 si aucun Talent pertinent, ou si le jet n'a pas été
     * forcé — "tous vos jets FORCÉS").
     */
    _getIgnoredAfflictionsCount(
        result
    ) {

        if (
            Number(
                result?.pushCount
                ?? 0
            )
            <= 0
        ) {

            return 0;

        }


        const attributeId =
            result?.context
                ?.attribute;

        const talentKey =
            this.constructor
                .IGNORE_AFFLICTION_TALENT_KEYS_BY_ATTRIBUTE[
                    attributeId
                ];

        if (!talentKey) {

            return 0;

        }


        const hasTalent =
            this.items.some(
                item =>
                    item.type === "talent"
                    && item.system?.key
                        === talentKey
            );


        return hasTalent
            ? 1
            : 0;

    }


    /**
     * Nombre d'afflictions d'un jet qu'il reste à répartir
     * (total du jet - afflictions ignorées par un Talent,
     * jamais sous 0). Même calcul que celui de
     * resolveRollAfflictions : utilisé par la fenêtre de
     * répartition pour connaître le nombre exact à attribuer.
     */
    getAvailableAfflictions(
        result
    ) {

        this._assertCharacter();


        return computeAvailableAfflictions({

            total:
                result?.afflictions
                ?? 0,

            ignored:
                this._getIgnoredAfflictionsCount(
                    result
                )

        });

    }


    async resolveRollAfflictions(
        result,
        allocation = {}
    ) {

        this._assertCharacter();


        const ignoredAfflictions =
            this._getIgnoredAfflictionsCount(
                result
            );


        return resolveAfflictions(
            this,
            result,
            {

                ...allocation,

                ignoredAfflictions

            }
        );

    }

    // ============================================================
    // RESSOURCES
    // ============================================================

    hasResource(
        resourceId,
        amount = 1
    ) {

        this._assertCharacter();


        const value =
            this.system.survival?.[resourceId];


        if (value === undefined) {

            return false;

        }


        return value >= amount;

    }


    async consumeResource(
        resourceId,
        amount = 1
    ) {

        this._assertCharacter();


        if (
            !Number.isInteger(amount)
            || amount <= 0
        ) {

            throw new Error(
                "La quantité doit être un entier supérieur à zéro."
            );

        }


        if (
            !this.hasResource(
                resourceId,
                amount
            )
        ) {

            throw new Error(
                `Ressource insuffisante : ${resourceId}`
            );

        }


        const current =
            this.system.survival[resourceId];


        return this.update({

            [`system.survival.${resourceId}`]:
                current - amount

        });

    }


    // ============================================================
    // ÉQUIPEMENT
    // ============================================================

    getEquippedItems() {

        return this.items.filter(

            item =>
                item.system?.equipped === true

        );

    }

    /**
     * Types d'Item comptant dans l'encombrement.
     *
     * Les Talents, Archétypes, Blessures critiques et
     * Traumatismes psychologiques ne sont pas des objets
     * physiques transportés.
     */
    static ENCUMBRANCE_ITEM_TYPES = [
        "weapon",
        "armor",
        "ammunition",
        "equipment",
        "consumable"
    ];

    /**
     * Résout l'état d'encombrement courant du personnage.
     *
     * S'appuie sur la Vigueur de base (max, pas réduite
     * par des dégâts) et sur le poids de tous les Items
     * physiquement transportés.
     */
    getEncumbrance() {

        this._assertCharacter();


        const baseVigor =
            this.system.attributes
                ?.vigor?.max
            ?? 0;


        /*
         * Talent général Bête de somme (livre, p.164) :
         * "Vous pouvez transporter deux fois plus
         * d'équipement sans être encombré."
         *
         * Implémenté en doublant la Vigueur transmise à
         * resolveEncumbrance() : la capacité normale
         * (Vigueur x2) ET la capacité critique (Vigueur x4)
         * doublent toutes les deux, ce qui conserve le ratio
         * existant entre les deux seuils plutôt que d'en
         * fabriquer un nouveau non précisé par le livre.
         */
        const hasBeastOfBurden =
            this.items.some(
                item =>
                    item.type === "talent"
                    && item.system?.key
                        === "beastOfBurden"
            );

        const vigor =
            hasBeastOfBurden
                ? baseVigor * 2
                : baseVigor;


        const items =
            this.items.filter(
                item =>
                    this.constructor
                        .ENCUMBRANCE_ITEM_TYPES
                        .includes(item.type)
            )
            .map(
                item => ({
                    weight:
                        Number(
                            item.system?.weight
                            ?? 0
                        )
                })
            );


        /*
         * Les réserves de survie (Eau, Nourriture, Énergie)
         * ne sont pas des Items : ce sont des jauges de
         * l'Actor (system.survival.*). Leur encombrement
         * suit un barème dédié (p.175) plutôt que le champ
         * "weight" d'un Item, mais il s'additionne bien au
         * même total d'encombrement porté.
         */
        const reserveEncumbrance =
            this.getSurvivalReserveEncumbrance();

        if (reserveEncumbrance.total > 0) {

            items.push({
                weight:
                    reserveEncumbrance.total
            });

        }


        return resolveEncumbrance({
            vigor,
            items
        });

    }


    /**
     * Résout l'encombrement des réserves de survie
     * (Eau, Nourriture, Énergie) selon le barème p.175.
     */
    getSurvivalReserveEncumbrance() {

        this._assertCharacter();


        return resolveSurvivalReserveEncumbrance({

            water:
                Number(
                    this.system.survival
                        ?.water
                    ?? 0
                ),

            food:
                Number(
                    this.system.survival
                        ?.food
                    ?? 0
                ),

            energy:
                Number(
                    this.system.survival
                        ?.energy
                    ?? 0
                )

        });

    }

    getEquipmentForSkill(skillId) {

        this._assertCharacter();


        return this.items.filter(
            item => {

                if (
                    item.type !== "weapon"
                ) {

                    return false;

                }


                if (
                    !item.system?.equipped
                ) {

                    return false;

                }


                if (
                    item.system?.broken
                ) {

                    return false;

                }


                return (
                    item.system?.skillId
                    === skillId
                );

            }
        );

    }    

    getEquipmentBonusForSkill(skillId) {

        const equipment =
            this.getEquipmentForSkill(
                skillId
            );


        return equipment.reduce(
            (total, item) => {

                return (
                    total
                    + (
                        item.system
                            ?.usableEquipmentBonus
                        ?? 0
                    )
                );

            },
            0
        );

    }   
    
    async damageEquipment(
        item,
        amount = 1
    ) {

        this._assertCharacter();


        if (!item) {

            throw new TypeError(
                "damageEquipment nécessite un Item."
            );

        }


        if (
            item.actor?.id
            !== this.id
        ) {

            throw new Error(
                "L'équipement n'appartient pas à cet Actor."
            );

        }


        if (
            !Number.isInteger(amount)
            || amount <= 0
        ) {

            throw new TypeError(
                "La quantité de dégâts d'équipement doit être un entier supérieur à zéro."
            );

        }


        const current =
            item.system?.bonus?.current
            ?? 0;


        const next =
            Math.max(
                0,
                current - amount
            );


        await item.update({

            "system.bonus.current":
                next

        });


        return {

            itemId:
                item.id,

            itemName:
                item.name,

            previous:
                current,

            current:
                next,

            lost:
                current - next,

            broken:
                (
                    item.system?.bonus?.max > 0
                    && next <= 0
                )

        };

    }    

    async applyEquipmentAffliction(
        item
    ) {

        this._assertCharacter();


        if (!item) {

            throw new TypeError(
                "applyEquipmentAffliction nécessite un Item."
            );

        }


        if (
            item.actor?.id
            !== this.id
        ) {

            throw new Error(
                "L'équipement n'appartient pas à cet Actor."
            );

        }


        const reliability =
            item.system?.reliability
            ?? 0;


        const reliabilityRoll =
            rollReliability(
                reliability
            );


        /*
        * Une réussite de Fiabilité annule
        * l'affliction appliquée à l'arme.
        */
        if (
            reliabilityRoll.success
        ) {

            return {

                itemId:
                    item.id,

                itemName:
                    item.name,

                prevented:
                    true,

                reliability:
                    reliabilityRoll,

                damage:
                    null

            };

        }


        const damage =
            await this.damageEquipment(
                item,
                1
            );


        return {

            itemId:
                item.id,

            itemName:
                item.name,

            prevented:
                false,

            reliability:
                reliabilityRoll,

            damage

        };

    }    

    async repairEquipment(
        item,
        rollResult
    ) {

        this._assertCharacter();


        if (!item) {

            throw new TypeError(
                "repairEquipment nécessite un Item."
            );

        }


        if (!rollResult) {

            throw new TypeError(
                "repairEquipment nécessite un résultat de jet."
            );

        }


        if (
            item.actor?.id
            !== this.id
        ) {

            throw new Error(
                "L'équipement n'appartient pas à cet Actor."
            );

        }


        if (
            rollResult.context?.skill
            !== "repair"
        ) {

            throw new Error(
                "La réparation nécessite un jet de Bricolage."
            );

        }


        const current =
            item.system?.bonus?.current
            ?? 0;


        const max =
            item.system?.bonus?.max
            ?? 0;


        const repairable =
            item.system?.repairable
            ?? true;


        const resolution =
            resolveEquipmentRepair({

                current,

                max,

                successes:
                    rollResult.successes,

                repairable

            });


        await item.update({

            "system.bonus.current":
                resolution.current,

            "system.repairable":
                resolution.repairable

        });


        return {

            itemId:
                item.id,

            itemName:
                item.name,

            ...resolution

        };

    }    

    getProtectionSource() {

        this._assertLivingActor();


        // ============================================================
        // PROTECTION NATURELLE
        // ============================================================

        const naturalProtection =
            this.system?.naturalProtection;


        if (
            naturalProtection
            && naturalProtection.value > 0
        ) {

            /*
            * Priorité absolue.
            *
            * Aucune armure ni aucun casque
            * n'est ajouté à cette valeur.
            */
            return {

                type:
                    "natural",

                value:
                    naturalProtection.value,

                coverage:
                    "all",

                resilience:
                    naturalProtection.resilience
                    ?? false,

                resilienceCondition:
                    naturalProtection.resilienceCondition
                    ?? "",

                degradable:
                    false,

                bodyArmor:
                    null,

                helmet:
                    null

            };

        }


        // ============================================================
        // PROTECTIONS PORTÉES
        // ============================================================

        const equippedArmor =
            this.items.filter(
                item =>
                    item.type === "armor"
                    && item.system?.equipped
            );


        const bodyArmors =
            equippedArmor.filter(
                item =>
                    item.system?.category
                    === "body"
            );


        const helmets =
            equippedArmor.filter(
                item =>
                    item.system?.category
                    === "helmet"
            );


        /*
        * Le livre interdit plusieurs protections
        * corporelles ou plusieurs casques simultanés.
        *
        * On refuse plutôt que de choisir silencieusement.
        */
        if (bodyArmors.length > 1) {

            throw new Error(
                "Un Actor ne peut porter qu'une seule protection corporelle à la fois."
            );

        }


        if (helmets.length > 1) {

            throw new Error(
                "Un Actor ne peut porter qu'un seul casque à la fois."
            );

        }


        const bodyArmor =
            bodyArmors[0]
            ?? null;


        const helmet =
            helmets[0]
            ?? null;


        const bodyValue =
            bodyArmor?.system
                ?.usableProtection
            ?? 0;


        const helmetValue =
            helmet?.system
                ?.usableProtection
            ?? 0;


        const value =
            bodyValue
            + helmetValue;


        /*
        * Résilience n'ajoute qu'un point
        * d'absorption automatique au jet.
        */
        const resilience =
            Boolean(
                bodyArmor?.system?.activeResilience
                || helmet?.system?.activeResilience
            );


        return {

            type:
                "worn",

            value,

            coverage:
                "body-head",

            resilience,

            resilienceCondition:
                "",

            degradable:
                true,

            bodyArmor:
                bodyArmor
                    ? {
                        itemId:
                            bodyArmor.id,

                        itemUuid:
                            bodyArmor.uuid,

                        itemName:
                            bodyArmor.name,

                        value:
                            bodyValue
                    }
                    : null,

            helmet:
                helmet
                    ? {
                        itemId:
                            helmet.id,

                        itemUuid:
                            helmet.uuid,

                        itemName:
                            helmet.name,

                        value:
                            helmetValue
                    }
                    : null

        };

    }    

    rollProtection(
        incomingDamage,
        {
            protectionReduction = 0,
            ignoreWornResilience = false
        } = {}
    ) {

        this._assertLivingActor();


        const source =
            this.getProtectionSource();


        return ProtectionRoll.roll(
            source,
            {
                incomingDamage,
                protectionReduction,
                ignoreWornResilience
            }
        );

    }

    rollProtectionAgainstWeapon(
        incomingDamage,
        weapon
    ) {

        this._assertLivingActor();


        if (!weapon) {

            throw new TypeError(
                "Une arme est nécessaire."
            );

        }


        if (
            weapon.type !== "weapon"
        ) {

            throw new Error(
                "L'Item fourni n'est pas une arme."
            );

        }


        return this.rollProtection(
            incomingDamage,
            {
                protectionReduction:
                    weapon.system
                        ?.loadedProtectionReduction
                    ?? 0,

                ignoreWornResilience:
                    weapon.system
                        ?.loadedAmmoIgnoresResilience
                    ?? false
            }
        );

    }    

    async resolveProtectionDamage(
        result,
        target = null
    ) {

        this._assertLivingActor();


        if (!result) {

            throw new TypeError(
                "resolveProtectionDamage nécessite un résultat de Protection."
            );

        }


        // ============================================================
        // AUCUNE DÉGRADATION
        // ============================================================

        if (
            !Number.isInteger(result.protectionDamage)
            || result.protectionDamage < 0
        ) {

            throw new TypeError(
                "Le résultat contient une dégradation de Protection invalide."
            );

        }


        if (result.protectionDamage === 0) {

            return {
                applied: false,
                reason: "no-damage",
                damage: 0
            };

        }


        // ============================================================
        // PROTECTION NATURELLE
        // ============================================================

        if (
            result.source?.type === "natural"
        ) {

            /*
            * Sécurité supplémentaire :
            * ProtectionRoll devrait déjà produire
            * protectionDamage = 0 pour une source naturelle.
            */
            return {
                applied: false,
                reason: "natural-protection",
                damage: 0
            };

        }


        if (
            result.source?.type !== "worn"
        ) {

            throw new Error(
                "La source de Protection ne peut pas être dégradée."
            );

        }


        // ============================================================
        // PIÈCES DISPONIBLES
        // ============================================================

        const bodyData =
            result.source.bodyArmor
            ?? null;


        const helmetData =
            result.source.helmet
            ?? null;


        if (
            !bodyData
            && !helmetData
        ) {

            throw new Error(
                "Aucune protection portée ne peut recevoir la dégradation."
            );

        }


        // ============================================================
        // CHOIX AUTOMATIQUE SI UNE SEULE PIÈCE
        // ============================================================

        let resolvedTarget =
            target;


        if (
            bodyData
            && !helmetData
        ) {

            resolvedTarget =
                "body";

        }


        if (
            helmetData
            && !bodyData
        ) {

            resolvedTarget =
                "helmet";

        }


        // ============================================================
        // CHOIX OBLIGATOIRE SI ARMURE + CASQUE
        // ============================================================

        if (
            bodyData
            && helmetData
            && !resolvedTarget
        ) {

            throw new Error(
                "Choisissez l'armure corporelle ou le casque pour appliquer la dégradation."
            );

        }


        if (
            ![
                "body",
                "helmet"
            ].includes(
                resolvedTarget
            )
        ) {

            throw new Error(
                `Cible de Protection invalide : ${resolvedTarget}.`
            );

        }


        const targetData =
            resolvedTarget === "body"
                ? bodyData
                : helmetData;


        if (!targetData) {

            throw new Error(
                `Aucune protection de type ${resolvedTarget} n'était utilisée pour ce jet.`
            );

        }


        // ============================================================
        // RÉSOLUTION DE L'ITEM EMBARQUÉ
        // ============================================================

        const item =
            this.items.get(
                targetData.itemId
            );


        if (!item) {

            throw new Error(
                "La protection utilisée lors du jet n'existe plus sur cet Actor."
            );

        }


        if (
            item.type !== "armor"
        ) {

            throw new Error(
                "L'Item sélectionné n'est pas une protection."
            );

        }


        const current =
            item.system?.protection?.current
            ?? 0;


        const resolution =
            resolveProtectionDamage({

                current,

                damage:
                    result.protectionDamage

            });


        // ============================================================
        // APPLICATION FOUNDRY
        // ============================================================

        const updateData = {

            "system.protection.current":
                resolution.current

        };


        /*
        * Si une armure possédant Résilience
        * tombe hors d'usage, elle perd temporairement
        * l'accès à ce trait.
        */
        if (
            resolution.broken
            && item.system?.resilience
        ) {

            updateData["system.resilienceLost"] =
                true;

        }


        await item.update(
            updateData
        );


        return {

            applied:
                true,

            target:
                resolvedTarget,

            itemId:
                item.id,

            itemName:
                item.name,

            ...resolution

        };

    }    

    async repairArmor(
        item,
        rollResult
    ) {

        this._assertLivingActor();


        if (!item) {

            throw new TypeError(
                "repairArmor nécessite un Item."
            );

        }


        if (!rollResult) {

            throw new TypeError(
                "repairArmor nécessite un résultat de jet."
            );

        }


        if (
            item.actor?.id !== this.id
        ) {

            throw new Error(
                "La protection n'appartient pas à cet Actor."
            );

        }


        if (
            item.type !== "armor"
        ) {

            throw new Error(
                "repairArmor nécessite un Item de type armor."
            );

        }


        if (
            rollResult.context?.skill
            !== "repair"
        ) {

            throw new Error(
                "La réparation nécessite un jet de Bricolage."
            );

        }


        const current =
            item.system?.protection?.current
            ?? 0;


        const max =
            item.system?.protection?.max
            ?? 0;


        const hasResilience =
            item.system?.resilience
            ?? false;


        const resilienceLost =
            item.system?.resilienceLost
            ?? false;


        const resolution =
            resolveArmorRepair({

                current,

                max,

                successes:
                    rollResult.successes,

                hasResilience,

                resilienceLost

            });


        await item.update({

            "system.protection.current":
                resolution.current,

            "system.resilienceLost":
                resolution.resilienceLost

        });


        return {

            itemId:
                item.id,

            itemName:
                item.name,

            ...resolution

        };

    }    

    /**
     * Retourne les Items ammunition disponibles
     * et compatibles avec une arme donnée.
     *
     * Cette méthode servira notamment à construire
     * la liste déroulante de l'onglet Combat.
     */
    getAvailableAmmunitionForWeapon(
        weapon
    ) {

        this._assertLivingActor();


        if (!weapon) {

            throw new TypeError(
                "Une arme est nécessaire."
            );

        }


        if (
            weapon.actor?.id !== this.id
        ) {

            throw new Error(
                "L'arme n'appartient pas à cet Actor."
            );

        }


        if (
            weapon.type !== "weapon"
        ) {

            throw new Error(
                "L'Item sélectionné n'est pas une arme."
            );

        }


        return this.items.filter(
            ammunition =>
                isAmmunitionAvailableForWeapon(
                    weapon,
                    ammunition
                )
        );

    }

    async assignAmmunitionToWeapon(
        weapon,
        ammunition
    ) {

        this._assertLivingActor();


        if (!weapon) {

            throw new TypeError(
                "assignAmmunitionToWeapon nécessite une arme."
            );

        }


        if (!ammunition) {

            throw new TypeError(
                "assignAmmunitionToWeapon nécessite des munitions."
            );

        }


        if (
            weapon.actor?.id !== this.id
        ) {

            throw new Error(
                "L'arme n'appartient pas à cet Actor."
            );

        }


        if (
            ammunition.actor?.id !== this.id
        ) {

            throw new Error(
                "Les munitions n'appartiennent pas à cet Actor."
            );

        }


        if (
            weapon.type !== "weapon"
        ) {

            throw new Error(
                "L'Item sélectionné n'est pas une arme."
            );

        }


        if (
            ammunition.type !== "ammunition"
        ) {

            throw new Error(
                "L'Item sélectionné n'est pas une munition."
            );

        }


        if (
            !weapon.system?.usesAmmunition
        ) {

            throw new Error(
                "Cette arme n'utilise pas de munitions."
            );

        }


        if (
            !isAmmunitionAvailableForWeapon(
                weapon,
                ammunition
            )
        ) {

            throw new Error(
                "Ces munitions ne sont pas disponibles ou ne sont pas compatibles avec cette arme."
            );

        }


        const previousMagazine = {

            loaded:
                weapon.system?.magazine?.loaded
                ?? false,

            sourceAmmoItemId:
                weapon.system?.magazine?.sourceAmmoItemId
                ?? "",

            ammoType:
                weapon.system?.magazine?.ammoType
                ?? ""

        };


        /*
        * IMPORTANT :
        *
        * Une simple affectation ne consomme
        * aucune quantité de munition.
        */
        await weapon.update({

            "system.magazine.loaded":
                true,

            "system.magazine.ammoType":
                ammunition.system.ammoType,

            "system.magazine.consumptionMode":
                ammunition.system.consumptionMode,

            "system.magazine.containerType":
                ammunition.system.containerType,

            "system.magazine.quality":
                ammunition.system.quality,

            "system.magazine.protectionReduction":
                ammunition.system.protectionReduction,

            "system.magazine.ignoresResilience":
                ammunition.system.ignoresResilience,

            "system.magazine.sourceAmmoItemId":
                ammunition.id

        });


        return {

            weaponId:
                weapon.id,

            weaponName:
                weapon.name,

            ammunitionId:
                ammunition.id,

            ammunitionName:
                ammunition.name,

            previousMagazine,

            assignedAmmunition: {

                ammoType:
                    ammunition.system.ammoType,

                consumptionMode:
                    ammunition.system.consumptionMode,

                containerType:
                    ammunition.system.containerType,

                quality:
                    ammunition.system.quality,

                protectionReduction:
                    ammunition.system.protectionReduction,

                ignoresResilience:
                    ammunition.system.ignoresResilience

            },

            quantity:
                ammunition.system.quantity

        };

    }  

    async resolveMagazineAfterShot(
        weapon,
        rollResult,
        {
            event = "shot",
            causedByPoorAmmunition = false,
            burstFire = false
        } = {}
    ) {

        this._assertLivingActor();


        // ============================================================
        // VALIDATION
        // ============================================================

        if (!weapon) {

            throw new TypeError(
                "resolveMagazineAfterShot nécessite une arme."
            );

        }


        if (!rollResult) {

            throw new TypeError(
                "resolveMagazineAfterShot nécessite un résultat de jet."
            );

        }


        if (
            weapon.actor?.id !== this.id
        ) {

            throw new Error(
                "L'arme n'appartient pas à cet Actor."
            );

        }


        if (
            weapon.type !== "weapon"
        ) {

            throw new Error(
                "L'Item sélectionné n'est pas une arme."
            );

        }


        if (
            !weapon.system?.requiresAmmunition
        ) {

            return {
                consumed: false,
                amount: 0,
                reason: "ammunition-not-required",

                weaponId:
                    weapon.id,

                weaponName:
                    weapon.name
            };

        }


        // ============================================================
        // MUNITION AFFECTÉE
        // ============================================================

        const ammunitionId =
            weapon.system?.magazine
                ?.sourceAmmoItemId
            ?? "";


        if (!ammunitionId) {

            throw new Error(
                "Aucune ressource de munition n'est affectée à cette arme."
            );

        }


        const ammunition =
            this.items.get(
                ammunitionId
            );


        if (
            !ammunition
            || ammunition.type !== "ammunition"
        ) {

            /*
            * La référence est devenue invalide.
            *
            * On nettoie l'affectation afin que
            * l'arme ne reste pas artificiellement
            * considérée comme chargée.
            */
            await weapon.update({

                "system.magazine.loaded":
                    false,

                "system.magazine.ammoType":
                    "",

                "system.magazine.sourceAmmoItemId":
                    ""

            });


            throw new Error(
                "La ressource de munition affectée à cette arme n'existe plus."
            );

        }


        // ============================================================
        // RÉSOLUTION MÉTIER
        // ============================================================

        const resolution =
            resolveAmmunitionConsumption({

                ammo: {
                    consumptionMode:
                        weapon.system?.magazine
                            ?.consumptionMode
                        ?? ammunition.system
                            ?.consumptionMode
                },

                rollResult,

                event,

                burstFire,

                causedByPoorAmmunition

            });


        /*
        * Aucun stock à modifier.
        */
        if (!resolution.consume) {

            return {

                consumed:
                    false,

                amount:
                    0,

                weaponId:
                    weapon.id,

                weaponName:
                    weapon.name,

                ammunitionId:
                    ammunition.id,

                ammunitionName:
                    ammunition.name,

                remaining:
                    ammunition.system?.quantity
                    ?? 0,

                assignmentCleared:
                    false,

                ...resolution

            };

        }


        // ============================================================
        // STOCK
        // ============================================================

        const currentQuantity =
            ammunition.system?.quantity
            ?? 0;


        if (
            !Number.isInteger(
                currentQuantity
            )
            || currentQuantity <= 0
        ) {

            await weapon.update({

                "system.magazine.loaded":
                    false,

                "system.magazine.ammoType":
                    "",

                "system.magazine.sourceAmmoItemId":
                    ""

            });


            return {

                consumed:
                    false,

                amount:
                    0,

                weaponId:
                    weapon.id,

                weaponName:
                    weapon.name,

                ammunitionId:
                    ammunition.id,

                ammunitionName:
                    ammunition.name,

                remaining:
                    0,

                assignmentCleared:
                    true,

                reason:
                    "ammunition-depleted"

            };

        }


        const amount =
            Math.min(
                resolution.amount,
                currentQuantity
            );


        const remaining =
            currentQuantity
            - amount;


        // ============================================================
        // CONSOMMATION
        // ============================================================

        await ammunition.update({

            "system.quantity":
                remaining

        });


        // ============================================================
        // ÉPUISEMENT DU STOCK
        // ============================================================

        let assignmentCleared =
            false;


        if (
            remaining === 0
        ) {

            try {

                await weapon.update({

                    "system.magazine.loaded":
                        false,

                    "system.magazine.ammoType":
                        "",

                    "system.magazine.sourceAmmoItemId":
                        ""

                });


                assignmentCleared =
                    true;

            }
            catch (error) {

                /*
                * Compensation :
                *
                * si le nettoyage de l'arme échoue,
                * on restaure le stock afin d'éviter
                * un état incohérent entre les deux Items.
                */
                await ammunition.update({

                    "system.quantity":
                        currentQuantity

                });


                throw error;

            }

        }


        // ============================================================
        // RÉSULTAT
        // ============================================================

        return {

            consumed:
                true,

            amount,

            weaponId:
                weapon.id,

            weaponName:
                weapon.name,

            ammunitionId:
                ammunition.id,

            ammunitionName:
                ammunition.name,

            previousQuantity:
                currentQuantity,

            remaining,

            assignmentCleared,

            ...resolution

        };

    }

    async rollRangedAttack(
        weapon,
        {
            target = null,
            combat = game.combat,
            attributeOverride = null,
            skillOverride = null,
            equipment = null,
            stressOverride = null,
            extraStressDie = 0,

            bonus = 0,
            penalty = 0,

            burstFire = false,

            context = {}
        } = {}
    ){

        this._assertLivingActor();
        this._assertActionAllowed(
        "ranged-attack"
        );

        const targetContext =
        this._createAttackTargetContext(
            target
        );


        // ============================================================
        // VALIDATION DE L'ARME
        // ============================================================

        if (!weapon) {

            throw new TypeError(
                "rollRangedAttack nécessite une arme."
            );

        }


        if (
            weapon.actor?.id !== this.id
        ) {

            throw new Error(
                "L'arme n'appartient pas à cet Actor."
            );

        }


        if (
            weapon.type !== "weapon"
        ) {

            throw new Error(
                "L'Item sélectionné n'est pas une arme."
            );

        }


        if (
            weapon.system?.category !== "ranged"
        ) {

            throw new Error(
                "Cette arme n'est pas une arme à distance."
            );

        }


        // ============================================================
        // ÉTAT DE L'ARME ET MUNITIONS
        // ============================================================

        const requiresAmmunition =
            weapon.system?.requiresAmmunition
            ?? false;

        if (
            requiresAmmunition
        ) {

            const ammunitionId =
                weapon.system?.magazine
                    ?.sourceAmmoItemId
                ?? "";


            const ammunition =
                ammunitionId
                    ? this.items.get(
                        ammunitionId
                    )
                    : null;


            if (
                !ammunition
                || ammunition.type !== "ammunition"
                || (ammunition.system?.quantity ?? 0) <= 0
            ) {

                /*
                * L'affectation n'est plus utilisable.
                *
                * On la nettoie avant toute consommation
                * d'action ou tout jet.
                */
                await weapon.update({

                    "system.magazine.loaded":
                        false,

                    "system.magazine.ammoType":
                        "",

                    "system.magazine.sourceAmmoItemId":
                        ""

                });


                throw new Error(
                    "Aucune munition disponible n'est actuellement affectée à cette arme."
                );

            }

        }            

        if (
            !weapon.system?.canFire
        ) {

            /*
            * canFire constitue la règle métier centrale
            * déterminant si l'arme peut effectivement tirer.
            *
            * Les contrôles ci-dessous servent uniquement
            * à fournir un message d'erreur précis.
            */

            if (
                !weapon.system?.equipped
            ) {

                throw new Error(
                    "L'arme doit être équipée pour tirer."
                );

            }


            if (
                weapon.system?.broken
            ) {

                throw new Error(
                    "Cette arme est hors d'usage."
                );

            }


            if (
                requiresAmmunition
                && !weapon.system?.magazine?.loaded
            ) {

                throw new Error(
                    "Le chargeur de cette arme est vide."
                );

            }


            if (
                requiresAmmunition
                && weapon.system?.magazine?.ammoType
                    !== weapon.system?.ammunitionType
            ) {

                throw new Error(
                    "Les munitions chargées ne sont pas compatibles avec cette arme."
                );

            }


            throw new Error(
                "Cette arme ne peut pas tirer."
            );

        }


        // ============================================================
        // RAFALE
        // ============================================================

        if (
            burstFire
            && !weapon.system?.automatic
        ) {

            throw new Error(
                "Cette arme ne permet pas le tir en rafale."
            );

        }


        // ============================================================
        // INSTANTANÉ DE L'ATTAQUE
        // ============================================================

        const attackContext = {

            ...context,

            combatId:
                combat?.id
                ?? null,

            target:
                targetContext,

            attack: {

                type:
                    "ranged",

                weapon: {

                    id:
                        weapon.id,

                    uuid:
                        weapon.uuid,

                    name:
                        weapon.name,

                    damage:
                        weapon.system?.damage
                        ?? 0,

                    range:
                        weapon.system?.range
                        ?? "contact",

                    automatic:
                        weapon.system?.automatic
                        ?? false,

                    explosive:
                        weapon.system?.explosive
                        ?? false,

                    explosionPower:
                        weapon.system?.explosionPower
                        ?? 0,
                    special:
                        weapon.system?.special
                        ?? ""

                },

                ammunition: {

                    required:
                        requiresAmmunition,

                    loaded:
                        weapon.system?.magazineLoaded
                        ?? true,

                    ammoType:
                        requiresAmmunition
                            ? weapon.system
                                ?.magazine
                                ?.ammoType
                                ?? ""
                            : null,

                    quality:
                        requiresAmmunition
                            ? weapon.system
                                ?.loadedAmmoQuality
                            : null,

                    protectionReduction:
                        requiresAmmunition
                            ? weapon.system
                                ?.loadedProtectionReduction
                                ?? 0
                            : 0,

                    ignoresResilience:
                        requiresAmmunition
                            ? weapon.system
                                ?.loadedAmmoIgnoresResilience
                                ?? false
                            : false

                },

                burstFire

            }

        };

        // ============================================================
        // JET DE TIR
        // ============================================================

        const preparedEquipment =
            (
                equipment !== null
                && Number.isFinite(
                    Number(
                        equipment
                    )
                )
            )
                ? Math.max(
                    0,
                    Number(
                        equipment
                    )
                )
                : null;


        const result =
            await this.rollSkill(
                "shooting",
                {
                    /*
                    * Compatibilité historique :
                    *
                    * sans préparation universelle,
                    * l'arme continue à fournir elle-même
                    * ses dés d'Équipement.
                    *
                    * Avec préparation universelle,
                    * le total déjà résolu est transmis
                    * directement dans equipment.
                    */
                    equipmentItem:
                        preparedEquipment === null
                            ? weapon
                            : null,

                    equipment:
                        preparedEquipment,

                    attributeOverride,

                    skillOverride,

                    stressOverride,

                    extraStressDie,

                    bonus,

                    penalty,

                    context:
                        attackContext
                }
            );


        /*
        * Une rafale vide automatiquement
        * le chargeur après l'attaque.
        *
        * Pour un tir normal, aucune consommation
        * n'est encore appliquée ici :
        * elle dépendra éventuellement d'un Push
        * et de ses afflictions.
        */
        if (
            requiresAmmunition
        ) {

            await this.resolveMagazineAfterShot(
                weapon,
                result,
                {
                    event:
                        "shot",

                    burstFire
                }
            );

        }


        return result;

    }    

    resolveRangedAttackDamage(
        rollResult,
        {
            bonusDamage = null
        } = {}
    ) {

        this._assertLivingActor();


        if (!rollResult) {

            throw new TypeError(
                "Un résultat d'attaque est nécessaire."
            );

        }


        if (
            rollResult.context
                ?.attack
                ?.type
            !== "ranged"
        ) {

            throw new Error(
                "Ce résultat n'est pas une attaque à distance."
            );

        }


        const baseDamage =
            rollResult.context
                ?.attack
                ?.weapon
                ?.damage;


        if (
            !Number.isInteger(baseDamage)
        ) {

            throw new Error(
                "Les dégâts de l'arme sont absents du contexte d'attaque."
            );

        }


        return resolveRangedAttackDamage({
            rollResult,
            baseDamage,
            bonusDamage
        });

    }    

    async resolveRangedAttackAgainst(
        target,
        rollResult,
        {
            stuntAllocation = {},
            protectionDamageTarget = null
        } = {}
    ) {

        this._assertLivingActor();


        if (!target) {

            throw new TypeError(
                "Une cible est nécessaire."
            );

        }


        if (!rollResult) {

            throw new TypeError(
                "Un résultat d'attaque est nécessaire."
            );

        }


        if (!target.isLivingActor) {

            throw new Error(
                "La cible doit être un Actor vivant."
            );

        }


        if (
            rollResult.context
                ?.attack
                ?.type !== "ranged"
        ) {

            throw new Error(
                "Ce résultat n'est pas une attaque à distance."
            );

        }


        // ============================================================
        // 1. ACTIONS D'ÉCLAT
        // ============================================================

        const explosive =
            rollResult.context
                ?.attack
                ?.weapon
                ?.explosive
            ?? false;


        const stunts =
            resolveRangedStunts({

                rollResult,

                allocation:
                    stuntAllocation,

                explosive

            });


        // ============================================================
        // 2. DÉGÂTS PHYSIQUES
        //
        // Les dégâts supplémentaires à la Vigueur
        // font partie des dégâts de l'attaque et passent
        // donc par la Protection.
        // ============================================================

        const damage =
            this.resolveRangedAttackDamage(
                rollResult,
                {
                    bonusDamage:
                        stunts.effects.vigorDamage
                }
            );


        // ============================================================
        // 3. ÉCHEC
        // ============================================================

        if (!damage.hit) {

            return {

                hit:
                    false,

                attackerId:
                    this.id,

                targetId:
                    target.id,

                damage,

                stunts,

                protection:
                    null,

                protectionDamage:
                    null,

                vigorDamage:
                    null,

                spiritDamage:
                    null,

                pendingEffects:
                    null

            };

        }


        // ============================================================
        // 4. CONTEXTE DES MUNITIONS
        // ============================================================

        const ammunition =
            rollResult.context
                ?.attack
                ?.ammunition
            ?? {};


        const protectionReduction =
            ammunition.protectionReduction
            ?? 0;


        const ignoreWornResilience =
            ammunition.ignoresResilience
            ?? false;


        // ============================================================
        // 5. PROTECTION
        // ============================================================

        const protection =
            target.rollProtection(
                damage.rawDamage,
                {
                    protectionReduction,
                    ignoreWornResilience
                }
            );


        // ============================================================
        // 6. DÉGRADATION DE LA PROTECTION
        // ============================================================

        let protectionDamage =
            null;


        if (
            protection.protectionDamage > 0
        ) {

            protectionDamage =
                await target.resolveProtectionDamage(
                    protection,
                    protectionDamageTarget
                );

        }


        // ============================================================
        // 7. DÉGÂTS À LA VIGUEUR
        // ============================================================

        let vigorDamage =
            null;


        if (
            protection.remainingDamage > 0
        ) {

            vigorDamage =
                await target.takeAttributeDamage(
                    "vigor",
                    protection.remainingDamage
                );

        }


        // ============================================================
        // 8. DÉGÂTS À L'ESPRIT
        //
        // Cette action d'éclat est distincte des dégâts
        // physiques et n'est donc pas réduite par l'armure.
        // ============================================================

        let spiritDamage =
            null;


        if (
            stunts.effects.spiritDamage > 0
        ) {

            spiritDamage =
                await target.takeAttributeDamage(
                    "spirit",
                    stunts.effects.spiritDamage
                );

        }


        // ============================================================
        // 9. EFFETS À RÉSOUDRE PAR LE COMBAT / L'INTERFACE
        //
        // On ne modifie pas encore automatiquement initiative,
        // position ou équipement.
        // ============================================================

        const pendingEffects = {

            swapInitiative:
                stunts.effects.swapInitiative,

            disarm:
                stunts.effects.disarm,

            knockdown:
                stunts.effects.knockdown,

            grenade:
                stunts.effects.grenade

        };


        // ============================================================
        // 10. RÉSULTAT GLOBAL
        // ============================================================

        return {

            hit:
                true,

            attackerId:
                this.id,

            attackerName:
                this.name,

            targetId:
                target.id,

            targetName:
                target.name,

            weapon:
                rollResult.context.attack.weapon,

            ammunition:
                rollResult.context.attack.ammunition,

            stunts,

            damage,

            protection,

            protectionDamage,

            vigorDamage,

            spiritDamage,

            pendingEffects

        };

    }

    /**
     * Retourne l'arme actuellement équipée
     * pour une catégorie donnée.
     *
     * Catégories autorisées :
     * - melee
     * - ranged
     */
    getEquippedWeaponByCategory(
        category
    ) {

        this._assertLivingActor();


        if (
            ![
                "melee",
                "ranged"
            ].includes(
                category
            )
        ) {

            throw new Error(
                `Catégorie d'arme inconnue : ${category}`
            );

        }


        return this.items.find(
            item =>
                item.type === "weapon"
                && item.system?.category === category
                && item.system?.equipped === true
        )
        ?? null;

    }


    /**
     * Équipe ou déséquipe une arme.
     *
     * Une seule arme de mêlée et une seule arme
     * de tir peuvent être équipées simultanément.
     *
     * Le système refuse une seconde arme
     * de la même catégorie.
     */
    async setWeaponEquipped(
        weapon,
        equipped
    ) {

        this._assertLivingActor();


        if (!weapon) {

            throw new TypeError(
                "setWeaponEquipped nécessite une arme."
            );

        }


        if (
            weapon.actor?.id
            !== this.id
        ) {

            throw new Error(
                "L'arme n'appartient pas à cet Actor."
            );

        }


        if (
            weapon.type !== "weapon"
        ) {

            throw new Error(
                "L'Item sélectionné n'est pas une arme."
            );

        }


        const category =
            weapon.system?.category
            ?? "";


        if (
            ![
                "melee",
                "ranged"
            ].includes(
                category
            )
        ) {

            throw new Error(
                "Cette arme possède une catégorie invalide."
            );

        }


        const targetState =
            equipped === true;


        /*
        * DÉSÉQUIPEMENT
        *
        * Toujours autorisé.
        */
        if (!targetState) {

            await weapon.update({

                "system.equipped":
                    false

            });


            return {

                applied:
                    true,

                weaponId:
                    weapon.id,

                weaponName:
                    weapon.name,

                equipped:
                    false,

                category

            };

        }


        /*
        * L'arme est déjà équipée.
        */
        if (
            weapon.system?.equipped
            === true
        ) {

            return {

                applied:
                    false,

                reason:
                    "already-equipped",

                weaponId:
                    weapon.id,

                weaponName:
                    weapon.name,

                equipped:
                    true,

                category

            };

        }


        /*
        * Recherche d'une autre arme équipée
        * de la même catégorie.
        */
        const existing =
            this.items.find(
                item =>
                    item.id !== weapon.id
                    && item.type === "weapon"
                    && item.system?.category === category
                    && item.system?.equipped === true
            )
            ?? null;


        if (existing) {

            return {

                applied:
                    false,

                reason:
                    "weapon-category-already-equipped",

                weaponId:
                    weapon.id,

                weaponName:
                    weapon.name,

                category,

                existingWeaponId:
                    existing.id,

                existingWeaponName:
                    existing.name

            };

        }


        /*
        * Toutes les validations sont terminées.
        */
        await weapon.update({

            "system.equipped":
                true

        });


        return {

            applied:
                true,

            weaponId:
                weapon.id,

            weaponName:
                weapon.name,

            equipped:
                true,

            category

        };

    }    

    // ============================================================
    // EFFETS DE COMBAT
    // ============================================================

    async applyDisarm(
        item = null
    ) {

        this._assertLivingActor();


        const resolution =
            resolveDisarm({
                target: this,
                item
            });


        /*
        * Aucun objet n'a encore été choisi.
        *
        * On laisse la future interface demander
        * au joueur/MJ quel objet doit être lâché.
        */
        if (!resolution.applied) {

            return resolution;

        }


        /*
        * Le désarmement ne détruit pas l'objet
        * et ne le retire pas de l'inventaire.
        *
        * Il cesse simplement d'être équipé.
        */
        await item.update({

            "system.equipped":
                false

        });


        return {

            ...resolution,

            equipped:
                false

        };

    }
        
    async applyKnockdown() {

        this._assertLivingActor();


        const resolution =
            resolveKnockdown({
                target: this
            });


        if (!resolution.applied) {

            return resolution;

        }


        await this.update({
            "system.conditions.prone":
                true
        });


        return resolution;

    }


    async standUp() {

        this._assertLivingActor();


        const currentlyProne =
            this.system?.conditions?.prone
            === true;


        if (!currentlyProne) {

            return {
                applied: false,
                actorId: this.id,
                actorName: this.name,
                previous: false,
                current: false,
                reason: "not-prone",
                actionCost: null
            };

        }


        await this.update({
            "system.conditions.prone":
                false
        });


        return {
            applied: true,
            actorId: this.id,
            actorName: this.name,
            previous: true,
            current: false,
            reason: "stood-up",

            /*
            * Le livre indique que se relever
            * nécessite une action rapide.
            *
            * Nous mémorisons cette information,
            * sans encore gérer automatiquement
            * l'économie d'actions du round.
            */
            actionCost: "fast"
        };

    }

    // ============================================================
    // EXPLOSIONS
    // ============================================================

    async resolveExplosion({
        power,
        range = "short",
        cover = null
    } = {}) {

        this._assertLivingActor();


        // --------------------------------------------------------
        // 1. JET D'EXPLOSION
        // --------------------------------------------------------

        const explosion =
            ExplosionRoll.roll(
                power,
                { range }
            );


        /*
        * Hors de la zone d'effet :
        * aucune autre résolution nécessaire.
        */
        if (!explosion.affected) {

            return {
                explosion,
                cover: null,
                protection: null,
                damage: resolveExplosionDamage({
                    explosionResult: explosion
                }),
                vigorDamage: null,
                knockdown: null
            };

        }


        // --------------------------------------------------------
        // 2. ABRI
        // --------------------------------------------------------

        let coverResult = null;
        let damageAfterCover =
            explosion.rawDamage;


        if (
            cover
            && (cover.value ?? 0) > 0
            && explosion.rawDamage > 0
        ) {

            coverResult =
                CoverRoll.roll({
                    value:
                        cover.value,

                    incomingDamage:
                        explosion.rawDamage,

                    range,

                    totalCover:
                        cover.totalCover ?? false,

                    contactAllowed:
                        cover.contactAllowed ?? true,

                    protectionReduction:
                        cover.protectionReduction ?? 0
                });


            damageAfterCover =
                coverResult.remainingDamage;

        }


        // --------------------------------------------------------
        // 3. PROTECTION PERSONNELLE
        // --------------------------------------------------------

        let protectionResult = null;
        let remainingDamage =
            damageAfterCover;


        if (damageAfterCover > 0) {

            /*
            * Les explosions ignorent la Résilience
            * des protections portées.
            */
            protectionResult =
                this.rollProtection(
                    damageAfterCover,
                    {
                        ignoreWornResilience:
                            true
                    }
                );


            remainingDamage =
                protectionResult.remainingDamage;

        }


        // --------------------------------------------------------
        // 4. RÉSOLUTION FINALE DES DÉGÂTS
        // --------------------------------------------------------

        const damage =
            resolveExplosionDamage({

                /*
                * Le resolver final doit travailler
                * sur les dégâts restant après l'abri.
                */
                explosionResult: {
                    ...explosion,
                    rawDamage:
                        damageAfterCover
                },

                protectionResult
            });


        /*
        * On conserve également le total réellement
        * restant après les deux couches.
        */
        damage.remainingDamage =
            remainingDamage;

        damage.takesDamage =
            remainingDamage > 0;

        damage.knockdown =
            remainingDamage > 0;


        // --------------------------------------------------------
        // 5. DÉGÂTS DE VIGUEUR
        // --------------------------------------------------------

        let vigorDamage = null;


        if (remainingDamage > 0) {

            vigorDamage =
                await this.takeAttributeDamage(
                    "vigor",
                    remainingDamage
                );

        }


        // --------------------------------------------------------
        // 6. MISE AU SOL
        // --------------------------------------------------------

        let knockdown = null;


        if (remainingDamage > 0) {

            knockdown =
                await this.applyKnockdown();

        }


        return {
            explosion,

            cover:
                coverResult,

            protection:
                protectionResult,

            damage,

            vigorDamage,

            knockdown
        };
    }

    // ============================================================
    // STUN GRENADES
    // ============================================================

    async resolveStunGrenade({
        power = 5,
        range = "short",
        cover = null
    } = {}) {

        this._assertLivingActor();


        // --------------------------------------------------------
        // 1. Jet de grenade étourdissante
        // --------------------------------------------------------

        const stun =
            StunGrenadeRoll.roll({
                power,
                range
            });


        if (!stun.affected) {

            return {
                stun,

                protectionSetup: null,
                protection: null,

                spiritDamage: null,

                stunned: false
            };

        }


        // --------------------------------------------------------
        // 2. Abri
        // --------------------------------------------------------

        const coverProtection =
            Math.max(
                0,
                cover?.value ?? 0
            );


        // --------------------------------------------------------
        // 3. Casque équipé uniquement
        // --------------------------------------------------------

        const helmet =
            this.getEquippedHelmet();


        const helmetProtection =
            helmet?.system
                ?.usableProtection
            ?? 0;


        // --------------------------------------------------------
        // 4. Déterminer les dés de Protection
        // --------------------------------------------------------

        const protectionSetup =
            resolveStunGrenadeDamage({
                stunResult:
                    stun,

                coverProtection,

                helmetProtection
            });


        // --------------------------------------------------------
        // 5. Jet de Protection
        // --------------------------------------------------------

        const protection =
            StunProtectionRoll.roll({
                incomingDamage:
                    stun.rawSpiritDamage,

                coverProtection:
                    protectionSetup
                        .coverProtection,

                helmetProtection:
                    protectionSetup
                        .helmetProtection
            });


        // --------------------------------------------------------
        // 6. Dégâts d'Esprit
        // --------------------------------------------------------

        let spiritDamage = null;


        if (
            protection
                .remainingSpiritDamage
            > 0
        ) {

            spiritDamage =
                await this.takeAttributeDamage(
                    "spirit",
                    protection
                        .remainingSpiritDamage
                );

        }


        return {
            stun,

            protectionSetup,

            protection,

            helmet: helmet
                ? {
                    id:
                        helmet.id,

                    uuid:
                        helmet.uuid,

                    name:
                        helmet.name
                }
                : null,

            spiritDamage,

            /*
            * On expose déjà le résultat mécanique,
            * mais on n'applique PAS encore le -2.
            */
            stunned:
                protection.stunned
        };
    }

    getEquippedHelmet() {

        this._assertLivingActor();

        return this.items.find(
            item =>
                item.type === "armor"
                && item.system?.category === "helmet"
                && item.system?.equipped === true
                && item.system?.broken !== true
                && (item.system?.usableProtection ?? 0) > 0
        ) ?? null;

    }

    // ============================================================
    // MELEE BLOCK
    // ============================================================

    async rollMeleeBlock({
        attackType = "unarmed",
        blockable = true,
        blockingItem = null,
        attributeId = "vigor",
        bonus = 0,
        penalty = 0,
        extraStressDie = 0,
        preparationContext = null,
        combat = game.combat
    } = {}) {

        this._assertLivingActor();
        this._assertActionAllowed(
            "melee-block",
            {
                combat
            }
        );



        // --------------------------------------------------------
        // 1. Vérifier l'objet de blocage
        // --------------------------------------------------------

        let equipmentDice = 0;
        let equipmentContext = null;


        if (blockingItem) {

            if (
                blockingItem.actor?.id
                !== this.id
            ) {
                throw new Error(
                    "L'objet de blocage n'appartient pas à cet Actor."
                );
            }


            if (
                blockingItem.system?.equipped
                !== true
            ) {
                throw new Error(
                    "L'objet utilisé pour bloquer doit être équipé."
                );
            }


            if (
                blockingItem.system?.broken
                === true
            ) {
                throw new Error(
                    "Un objet hors d'usage ne peut pas servir à bloquer."
                );
            }


            equipmentDice =
                blockingItem.system
                    ?.usableEquipmentBonus
                ?? 0;


            equipmentContext = {
                itemId:
                    blockingItem.id,

                itemUuid:
                    blockingItem.uuid,

                itemName:
                    blockingItem.name,

                itemType:
                    blockingItem.type
            };

        }

        // --------------------------------------------------------
        // 2. Éligibilité du blocage
        // --------------------------------------------------------

        const eligibility =
            resolveMeleeBlockEligibility({

                attack: {
                    type:
                        attackType,

                    blockable
                },

                defense: {
                    hasBlockingItem:
                        blockingItem !== null
                }

            });


        if (!eligibility.eligible) {

            return {
                rolled: false,

                eligibility,

                roll: null
            };

        }


        // --------------------------------------------------------
        // 3. Attribut
        // --------------------------------------------------------

        if (
            ![
                "vigor",
                "agility"
            ].includes(attributeId)
        ) {
            throw new Error(
                `Attribut de blocage invalide : ${attributeId}`
            );
        }


        const attribute =
            this.getAttribute(
                attributeId
            );


        /*
        * Le blocage utilise Corps à corps.
        */
        const skill =
            this.getSkill(
                "closeCombat"
            );


        const stress =
            (this.system.stress?.dice ?? 0)
            + Math.max(
                0,
                Number(extraStressDie) || 0
            );


        // --------------------------------------------------------
        // 4. Effets temporaires
        // --------------------------------------------------------

        const stunPenalty =
            StunEffectService.getPenalty({
                actor:
                    this,

                combat:
                    game.combat
            });


        const effectivePenalty =
            penalty
            + stunPenalty;


        // --------------------------------------------------------
        // 5. Jet
        // --------------------------------------------------------

        const block =
            MeleeBlockRoll.roll({

                attribute,

                skill,

                equipment:
                    equipmentDice,

                stress,

                bonus,

                penalty:
                    effectivePenalty,

                context: {
                    actorId:
                        this.id,

                    actorUuid:
                        this.uuid,

                    actorName:
                        this.name,

                    skill:
                        "closeCombat",

                    attributeId,

                    equipment:
                        equipmentContext,

                    temporaryModifiers: {
                        stunPenalty
                    },
                    preparation:
                        preparationContext
                        ?? undefined
                }

            });


        // --------------------------------------------------------
        // 6. Élimination des dés de Stress
        // --------------------------------------------------------

        if (
            this.isCharacter
            && block.roll.eliminatedStress > 0
        ) {

            await this.removeStress(
                block.roll.eliminatedStress
            );

        }


        return {
            rolled: true,

            eligibility,

            roll:
                block
        };
    }

    // ============================================================
    // MELEE ATTACK
    // ============================================================

    async rollMeleeAttack(
        weapon = null,
        {
            target = null,
            bonus = 0,
            penalty = 0,
            extraStressDie = 0,
            preparationContext = null,
            blockable = true
        } = {}
    ) {

        this._assertLivingActor();
        this._assertActionAllowed(
            "melee-attack"
        );

        const targetContext =
        this._createAttackTargetContext(
            target
        );

        // --------------------------------------------------------
        // 1. Attaque armée / à mains nues
        // --------------------------------------------------------

        const armed =
            weapon !== null;


        if (armed) {

            if (
                weapon.actor?.id
                !== this.id
            ) {
                throw new Error(
                    "L'arme de mêlée n'appartient pas à cet Actor."
                );
            }


            if (
                weapon.type !== "weapon"
                || weapon.system?.category !== "melee"
            ) {
                throw new Error(
                    "Cette arme n'est pas une arme de mêlée."
                );
            }


            if (
                weapon.system?.equipped
                !== true
            ) {
                throw new Error(
                    "L'arme de mêlée doit être équipée."
                );
            }


            if (
                weapon.system?.broken === true
            ) {
                throw new Error(
                    "Une arme hors d'usage ne peut pas être utilisée."
                );
            }

        }


        // --------------------------------------------------------
        // 2. Contexte de l'attaque
        // --------------------------------------------------------

        const attackType =
            armed
                ? "weapon"
                : "unarmed";


        const weaponSnapshot =
            armed
                ? {
                    id:
                        weapon.id,

                    uuid:
                        weapon.uuid,

                    name:
                        weapon.name,

                    damage:
                        weapon.system?.damage ?? 0,

                    bonus:
                        weapon.system
                            ?.usableEquipmentBonus
                        ?? 0
                }
                : null;


        const equipmentDice =
            weaponSnapshot?.bonus ?? 0;


        // --------------------------------------------------------
        // 3. Pool
        //
        // Corps à corps est lié à Vigueur.
        // --------------------------------------------------------

        const attribute =
            this.getAttribute(
                "vigor"
            );


        const skill =
            this.getSkill(
                "closeCombat"
            );


        const baseStress =
            this.system.stress?.dice ?? 0;


        const normalizedExtraStressDie =
            Math.max(
                0,
                Number(
                    extraStressDie
                ) || 0
            );


        const stress =
            baseStress
            + normalizedExtraStressDie;


        // --------------------------------------------------------
        // 4. Modificateurs temporaires
        // --------------------------------------------------------

        const stunPenalty =
            StunEffectService.getPenalty({
                actor:
                    this,

                combat:
                    game.combat
            });


        const effectivePenalty =
            penalty
            + stunPenalty;


        // --------------------------------------------------------
        // 5. Pool + jet
        // --------------------------------------------------------

        const pool =
            new DicePool({
                attribute,
                skill,

                equipment:
                    equipmentDice,

                stress,

                bonus,

                penalty:
                    effectivePenalty
            });


        const diceToRoll =
            YZERoll.countInitialDiceToRoll(
                pool
            );


        const {
            roll: physicalRoll,
            values: physicalDiceValues
        } =
            await rollPhysicalDice({

                normal:
                    diceToRoll.normal,

                stress:
                    diceToRoll.stress

            });


        const drawDie =
            physicalDiceValues.length > 0
                ? createDieDrawer(
                    physicalDiceValues
                )
                : null;


        const roll =
            YZERoll.roll(
                pool,
                {
                    action:
                        "melee-attack",

                    actorId:
                        this.id,

                    actorUuid:
                        this.uuid,

                    actorName:
                        this.name,

                    skill:
                        "closeCombat",

                    attributeId:
                        "vigor",

                    target:
                        targetContext,

                    attack: {
                        type:
                            attackType,

                        blockable
                    },

                    weapon:
                        weaponSnapshot,

                    temporaryModifiers: {
                        stunPenalty
                    },
                    preparation:
                        preparationContext
                        ?? undefined
                },
                {
                    drawDie
                }
            );


        if (physicalRoll) {

            roll.physicalRoll =
                physicalRoll;

        }


        // --------------------------------------------------------
        // 6. Dés de Stress éliminés
        // --------------------------------------------------------

        if (
            this.isCharacter
            && roll.eliminatedStress > 0
        ) {

            await this.removeStress(
                roll.eliminatedStress
            );

        }


        // --------------------------------------------------------
        // 7. Dé de Stress « Subir 1 Stress pour +3 »
        //
        // Cf. le commentaire équivalent dans rollAttribute()/
        // rollSkill() : persisté après résolution, quel que
        // soit le résultat du jet.
        // --------------------------------------------------------

        if (
            this.isCharacter
            && normalizedExtraStressDie > 0
        ) {

            await this.addStress(
                normalizedExtraStressDie
            );

        }


        return roll;
    }

}