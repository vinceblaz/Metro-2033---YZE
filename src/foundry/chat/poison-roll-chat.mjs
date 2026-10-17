/**
 * Message de Chat du jet de Poison (p.204-205).
 *
 * Architecture légère, à l'image du jet de Terreur
 * (terror-roll-chat.mjs) : un ChatMessage « en attente » par
 * Acteur ciblé, résolu au clic par le joueur concerné ou le MJ.
 *
 * À la différence de la Terreur et de l'Asphyxie, c'est un jet en
 * OPPOSITION : la victime lance ENDURANCE (Attribut VIGUEUR +
 * Compétence Endurance), le poison lance un nombre de dés égal à
 * sa Toxicité (aucun Attribut/Compétence, cf.
 * `domain/rules/poison.mjs`). Les deux jets sont effectués l'un
 * après l'autre lors du même clic et présentés ensemble sur la
 * carte.
 *
 * Push (ajouté le 03/10/2026, à la demande du porteur du projet —
 * décisions actées par deux questions directes, le livre étant
 * silencieux sur le Push d'un jet en opposition à deux pools) :
 *
 * - seule la victime peut forcer son jet d'ENDURANCE, exactement
 *   comme n'importe quel autre jet de Compétence (1er Push gratuit,
 *   2e payé 1 point de Stress, jamais de 3e — cf.
 *   `actor.pushRoll()`, qui délègue à `pushMetroRoll()`) ;
 * - le jet du poison (le « jet du MJ », sans Attribut/Compétence,
 *   représentant la menace elle-même) n'est JAMAIS relancé.
 *
 * Le clic sur « Subir le jet » effectue donc les deux jets et les
 * affiche immédiatement, mais l'application du dégât (et la
 * création de l'Item Poison en cas d'effets complets) est différée
 * jusqu'à ce que le joueur clique sur « Pousser » (ne relance que
 * son propre jet) ou « Accepter le résultat » (verrouille l'issue
 * et l'applique) — à l'image du cycle Push/Accepter du gabarit
 * générique `YZERollChat`.
 *
 * Effets complets (poison vainqueur, cf. `resolvePoisonOpposition`)
 * : 1 point de dégâts immédiat, PUIS création d'un Item Poison
 * embarqué (effets récurrents par round, jusqu'à ce que le MJ le
 * retire manuellement — cf. `combat/poison-round-service.mjs`).
 * Effets réduits (égalité ou victime vainqueur) : 1 point de
 * dégâts immédiat, sans suite ni Item créé.
 *
 *
 * MODE « POISON DE LAME » (p.204, `bladePoison: true`)
 *
 * Même gabarit de ChatMessage et même moteur de jets (DicePool/
 * YZERoll/push/accept), mais une résolution et une application
 * différentes (cf. `resolveBladePoisonOpposition`, dans
 * `domain/rules/poison.mjs`) :
 *
 * - jamais d'effets complets, jamais d'Item Poison créé ;
 * - si la victime l'emporte (ou fait jeu égal), aucun effet, ni
 *   dégât ni Item : `resolution.noEffect` ;
 * - sinon (le poison l'emporte strictement), effets réduits
 *   uniquement : 1 point de dégâts, sans Item créé.
 *
 * Ce mode est déclenché automatiquement par
 * `combat/melee-damage-application-service.mjs` (jamais par un
 * bouton MJ), via `createPendingMessage({ bladePoison: true })`.
 * Le reste du cycle (jets, Push, affichage) est strictement
 * partagé avec le poison ingéré.
 */

import {
    DicePool
} from "../../domain/rolls/dice-pool.mjs";

import {
    YZERoll
} from "../../domain/rolls/yze-roll.mjs";

import {
    getPoisonEffectType,
    computePoisonOpposedPools,
    resolvePoisonOpposition,
    resolveBladePoisonOpposition
} from "../../domain/rules/poison.mjs";

import {
    serializeRollResult,
    deserializeRollResult
} from "./yze-roll-chat.mjs";

import {
    assertChatMessageUpdatable,
    registerRelayContentRenderer,
    updateChatMessageAsGM
} from "./gm-message-relay.mjs";

import {
    rollPhysicalDice,
    createDieDrawer
} from "../rolls/physical-dice-roller.mjs";


const SYSTEM_ID =
    "metro-2033-yze";

const MESSAGE_FLAG =
    "poisonRoll";


function escapeHTML(
    value
) {

    return foundry.utils.escapeHTML(
        String(
            value ?? ""
        )
    );

}


/**
 * Extrait, à plat, toutes les valeurs de dés d'un YZEResult
 * (Attribut, Compétence, Équipement, Bonus, Stress) dans l'ordre
 * où elles ont été lancées — y compris le(s) dé(s) de Stress
 * qu'un second Push peut avoir ajoutés.
 */
function flattenDiceValues(
    result
) {

    return [
        ...(result?.dice?.attribute ?? []),
        ...(result?.dice?.skill ?? []),
        ...(result?.dice?.equipment ?? []),
        ...(result?.dice?.bonus ?? []),
        ...(result?.dice?.stress ?? [])
    ];

}


export class PoisonRollChat {


    /**
     * Crée, pour UN Acteur ciblé, le ChatMessage « en attente »
     * du jet de Poison (aucun jet effectué).
     */
    static async createPendingMessage({
        actor,
        effectTypeKey,
        toxicity,
        sourceLabel = null,
        bladePoison = false
    } = {}) {

        if (!actor) {

            throw new TypeError(
                "Un Acteur cible est requis."
            );

        }


        /*
         * Valide la clé tôt (lève un message clair) plutôt que de
         * laisser une carte invalide être créée silencieusement.
         */
        getPoisonEffectType(
            effectTypeKey
        );


        const flagData = {

            actorUuid:
                actor.uuid,

            effectTypeKey,

            toxicity,

            sourceLabel,

            bladePoison:
                bladePoison === true,

            rolled:
                false,

            applied:
                false

        };


        return ChatMessage.create({

            speaker:
                ChatMessage.getSpeaker({
                    actor
                }),

            content:
                this.renderContent(
                    flagData
                ),

            flags: {

                [SYSTEM_ID]: {

                    [MESSAGE_FLAG]:
                        flagData

                }

            }

        });

    }


    static getFlagData(
        message
    ) {

        return message?.getFlag(
            SYSTEM_ID,
            MESSAGE_FLAG
        )
        ?? null;

    }


    /**
     * Génère le contenu HTML de la carte de Chat, dans l'un de ses
     * trois états : en attente, jets effectués (Push/Accepter en
     * attente), ou appliquée (verrouillée).
     */
    static renderContent(
        flagData
    ) {

        const effectType =
            getPoisonEffectType(
                flagData?.effectTypeKey
            );

        const sourceLabel =
            flagData?.sourceLabel
                ? ` — ${escapeHTML(flagData.sourceLabel)}`
                : "";


        if (!flagData?.rolled) {

            return `
                <div class="metro-chat-survival-card metro-chat-poison-roll-card">
                    <header class="metro-chat-survival-card-header">
                        <strong>${escapeHTML(effectType.label)}${sourceLabel}</strong>
                    </header>
                    <div class="metro-chat-survival-card-summary">
                        Toxicité ${escapeHTML(flagData?.toxicity ?? 0)}.
                        Jet en opposition d'ENDURANCE contre le poison.
                    </div>
                    <div class="metro-chat-actions">
                        <button
                            type="button"
                            class="metro-chat-button"
                            data-action="roll-poison"
                        >
                            Subir le jet
                        </button>
                    </div>
                </div>
            `;

        }


        const victimDiceList =
            (flagData.victimDiceValues ?? []).length
                ? escapeHTML(flagData.victimDiceValues.join(", "))
                : "—";

        const poisonDiceList =
            (flagData.poisonDiceValues ?? []).length
                ? escapeHTML(flagData.poisonDiceValues.join(", "))
                : "—";


        if (!flagData.applied) {

            const pushCount =
                flagData.victimResult?.pushCount
                ?? 0;

            const canPush =
                pushCount < 2;

            const pushUsesStress =
                pushCount === 1;

            const pushLabel =
                pushUsesStress
                    ? "Pousser (coûte 1 point de Stress)"
                    : "Pousser";

            return `
                <div class="metro-chat-survival-card metro-chat-poison-roll-card">
                    <header class="metro-chat-survival-card-header">
                        <strong>${escapeHTML(effectType.label)}${sourceLabel}</strong>
                    </header>
                    <div class="metro-chat-survival-card-dice">
                        Vos dés : ${victimDiceList}
                        (${escapeHTML(flagData.victimSuccesses)} réussite(s))
                    </div>
                    <div class="metro-chat-survival-card-dice">
                        Dés du poison : ${poisonDiceList}
                        (${escapeHTML(flagData.poisonSuccesses)} réussite(s))
                    </div>
                    <div class="metro-chat-actions">
                        ${
                            canPush
                                ? `<button
                                    type="button"
                                    class="metro-chat-button"
                                    data-action="push-poison"
                                    data-use-stress="${pushUsesStress}"
                                >
                                    ${pushLabel}
                                </button>`
                                : ""
                        }
                        <button
                            type="button"
                            class="metro-chat-button"
                            data-action="accept-poison"
                        >
                            Accepter le résultat
                        </button>
                    </div>
                </div>
            `;

        }


        if (flagData.bladePoison) {

            const bladeSummary =
                flagData.bladeNoEffect
                    ? "Aucun effet (jet d'ENDURANCE réussi)."
                    : `Effets réduits : ${escapeHTML(effectType.reducedEffect)}`;

            return `
                <div class="metro-chat-survival-card metro-chat-poison-roll-card">
                    <header class="metro-chat-survival-card-header">
                        <strong>${escapeHTML(effectType.label)}${sourceLabel}</strong>
                    </header>
                    <div class="metro-chat-survival-card-dice">
                        Vos dés : ${victimDiceList}
                        (${escapeHTML(flagData.victimSuccesses)} réussite(s))
                    </div>
                    <div class="metro-chat-survival-card-dice">
                        Dés du poison : ${poisonDiceList}
                        (${escapeHTML(flagData.poisonSuccesses)} réussite(s))
                    </div>
                    <div class="metro-chat-survival-card-summary">
                        ${bladeSummary}
                    </div>
                </div>
            `;

        }


        const summary =
            flagData.fullEffect
                ? escapeHTML(effectType.fullEffect)
                : escapeHTML(effectType.reducedEffect);

        return `
            <div class="metro-chat-survival-card metro-chat-poison-roll-card">
                <header class="metro-chat-survival-card-header">
                    <strong>${escapeHTML(effectType.label)}${sourceLabel}</strong>
                </header>
                <div class="metro-chat-survival-card-dice">
                    Vos dés : ${victimDiceList}
                    (${escapeHTML(flagData.victimSuccesses)} réussite(s))
                </div>
                <div class="metro-chat-survival-card-dice">
                    Dés du poison : ${poisonDiceList}
                    (${escapeHTML(flagData.poisonSuccesses)} réussite(s))
                </div>
                <div class="metro-chat-survival-card-summary">
                    ${
                        flagData.fullEffect
                            ? "Le poison l'emporte — effets complets : "
                            : "Effets réduits : "
                    }
                    ${summary}
                </div>
            </div>
        `;

    }


    /**
     * Applique l'issue du jet en opposition : dégât immédiat
     * dans tous les cas, puis création d'un Item Poison embarqué
     * UNIQUEMENT en cas d'effets complets (l'Item portant les
     * dégâts récurrents par round, cf.
     * `combat/poison-round-service.mjs`).
     */
    static async _applyOutcome(
        actor,
        {
            effectTypeKey,
            toxicity,
            sourceLabel,
            bladePoison = false,
            resolution
        } = {}
    ) {

        const effectType =
            getPoisonEffectType(
                effectTypeKey
            );


        /*
         * Poison de lame : plafonné structurellement aux effets
         * réduits (jamais d'effets complets, jamais d'Item Poison
         * créé, cf. en-tête). Si la victime l'emporte (ou fait jeu
         * égal), aucun dégât n'est infligé du tout.
         */
        if (bladePoison) {

            if (resolution.noEffect) {
                return;
            }


            await actor.takeAttributeDamage(
                effectType.attribute,
                1
            );


            return;

        }


        /*
         * Poison ingéré : effets complets ou réduits, dans les
         * deux cas le livre inflige 1 point de dégâts immédiat
         * (cf. `domain/rules/poison.mjs`, en-tête).
         */
        await actor.takeAttributeDamage(
            effectType.attribute,
            1
        );


        if (resolution.fullEffect) {

            await actor.createEmbeddedDocuments(
                "Item",
                [
                    {
                        name:
                            effectType.label,

                        type:
                            "poison",

                        system: {

                            effectType:
                                effectTypeKey,

                            toxicity,

                            sourceLabel:
                                sourceLabel
                                ?? ""

                        }
                    }
                ]
            );

        }

    }


    /**
     * Résout une seule fois les DEUX pools (victime et poison) du
     * jet en opposition subi par l'Acteur ciblé par ce message, et
     * les affiche sur la carte — SANS appliquer l'issue : le
     * joueur doit ensuite cliquer sur « Pousser » (son propre jet
     * uniquement) ou « Accepter le résultat » (cf. `push()` et
     * `accept()`) pour que le dégât soit effectivement appliqué.
     *
     * Rejette si le message est déjà résolu, ou si le compte
     * appelant n'est ni propriétaire de l'Acteur ni MJ.
     */
    static async resolve(
        message
    ) {

        const flagData =
            this.getFlagData(
                message
            );


        if (!flagData) {

            throw new Error(
                "Ce message n'est pas un jet de Poison."
            );

        }


        if (flagData.rolled) {

            throw new Error(
                "Ce jet a déjà été effectué."
            );

        }


        const actor =
            await fromUuid(
                flagData.actorUuid
            );


        if (!actor) {

            throw new Error(
                "L'Acteur ciblé par ce jet de Poison est introuvable."
            );

        }


        if (!actor.isOwner) {

            throw new Error(
                "Vous ne pouvez pas subir ce jet pour cet Acteur."
            );

        }


        // Carte créée par le MJ : un joueur la met à jour via le
        // relais MJ. Échec rapide AVANT tout jet / coût / effet.
        assertChatMessageUpdatable(
            message
        );


        const vigorAttribute =
            actor.system?.attributes?.vigor?.value
            ?? 0;

        const enduranceSkill =
            actor.system?.skills?.endurance
            ?? 0;


        const pools =
            computePoisonOpposedPools({

                toxicity:
                    flagData.toxicity,

                vigorAttribute,

                enduranceSkill

            });


        const victimPool =
            new DicePool(
                pools.victim
            );

        const victimDiceToRoll =
            YZERoll.countInitialDiceToRoll(
                victimPool
            );

        const {
            roll: victimPhysicalRoll,
            values: victimPhysicalDiceValues
        } =
            await rollPhysicalDice({

                normal:
                    victimDiceToRoll.normal,

                stress:
                    victimDiceToRoll.stress

            });

        const victimDrawDie =
            victimPhysicalDiceValues.length > 0
                ? createDieDrawer(
                    victimPhysicalDiceValues
                )
                : null;


        const victimRoll =
            YZERoll.roll(
                victimPool,
                {
                    type:
                        "poison-roll-victim",

                    actorId:
                        actor.id,

                    actorUuid:
                        actor.uuid
                },
                {
                    drawDie:
                        victimDrawDie
                }
            );


        if (victimPhysicalRoll) {

            victimRoll.physicalRoll =
                victimPhysicalRoll;

        }


        const poisonPool =
            new DicePool(
                pools.poison
            );

        const poisonDiceToRoll =
            YZERoll.countInitialDiceToRoll(
                poisonPool
            );

        const {
            roll: poisonPhysicalRoll,
            values: poisonPhysicalDiceValues
        } =
            await rollPhysicalDice({

                normal:
                    poisonDiceToRoll.normal,

                stress:
                    poisonDiceToRoll.stress

            });

        const poisonDrawDie =
            poisonPhysicalDiceValues.length > 0
                ? createDieDrawer(
                    poisonPhysicalDiceValues
                )
                : null;


        const poisonRoll =
            YZERoll.roll(
                poisonPool,
                {
                    type:
                        "poison-roll-poison"
                },
                {
                    drawDie:
                        poisonDrawDie
                }
            );


        if (poisonPhysicalRoll) {

            poisonRoll.physicalRoll =
                poisonPhysicalRoll;

        }


        const updatedFlagData = {

            ...flagData,

            rolled:
                true,

            applied:
                false,

            victimResult:
                serializeRollResult(
                    victimRoll
                ),

            victimDiceValues:
                flattenDiceValues(
                    victimRoll
                ),

            victimSuccesses:
                victimRoll.successes,

            poisonDiceValues:
                flattenDiceValues(
                    poisonRoll
                ),

            poisonSuccesses:
                poisonRoll.successes

        };


        const rolls =
            [
                victimRoll.physicalRoll,
                poisonRoll.physicalRoll
            ].filter(Boolean);


        await updateChatMessageAsGM(message, {

            content:
                this.renderContent(
                    updatedFlagData
                ),

            ...(
                rolls.length > 0
                    ? {
                        rolls,
                        sound:
                            CONFIG.sounds.dice
                    }
                    : {}
            ),

            [`flags.${SYSTEM_ID}.${MESSAGE_FLAG}`]:
                updatedFlagData

        });


        return {
            actor,
            victimRoll,
            poisonRoll
        };

    }


    /**
     * Force (Push) le jet d'ENDURANCE de la victime. Le jet du
     * poison n'est jamais concerné : seule la victime peut Push
     * (décision actée le 03/10/2026).
     *
     * Toutes les règles de Push (1er gratuit, 2e payé en Stress,
     * jamais de 3e) restent entièrement déléguées à
     * `actor.pushRoll()`, exactement comme n'importe quel autre
     * jet de Compétence.
     */
    static async push(
        message,
        {
            useStress = false
        } = {}
    ) {

        const flagData =
            this.getFlagData(
                message
            );


        if (!flagData?.rolled) {

            throw new Error(
                "Ce jet n'a pas encore été effectué."
            );

        }


        if (flagData.applied) {

            throw new Error(
                "Ce jet a déjà été accepté et ne peut plus être forcé."
            );

        }


        const actor =
            await fromUuid(
                flagData.actorUuid
            );


        if (!actor) {

            throw new Error(
                "L'Acteur ciblé par ce jet de Poison est introuvable."
            );

        }


        if (!actor.isOwner) {

            throw new Error(
                "Vous ne pouvez pas forcer ce jet pour cet Acteur."
            );

        }


        // Carte créée par le MJ : un joueur la met à jour via le
        // relais MJ. Échec rapide AVANT tout jet / coût / effet.
        assertChatMessageUpdatable(
            message
        );


        const victimResult =
            deserializeRollResult(
                flagData.victimResult
            );


        const pushedVictimResult =
            useStress
                ? await actor.pushRoll(
                    victimResult,
                    { useStress: true }
                )
                : await actor.pushRoll(
                    victimResult
                );


        const updatedFlagData = {

            ...flagData,

            victimResult:
                serializeRollResult(
                    pushedVictimResult
                ),

            victimDiceValues:
                flattenDiceValues(
                    pushedVictimResult
                ),

            victimSuccesses:
                pushedVictimResult.successes

        };


        await updateChatMessageAsGM(message, {

            content:
                this.renderContent(
                    updatedFlagData
                ),

            [`flags.${SYSTEM_ID}.${MESSAGE_FLAG}`]:
                updatedFlagData

        });


        return {
            actor,
            victimResult:
                pushedVictimResult
        };

    }


    /**
     * Accepte le résultat courant (après un éventuel Push) :
     * compare les réussites finales, applique le dégât (et crée
     * l'Item Poison si effets complets), puis verrouille la carte.
     */
    static async accept(
        message
    ) {

        const flagData =
            this.getFlagData(
                message
            );


        if (!flagData?.rolled) {

            throw new Error(
                "Ce jet n'a pas encore été effectué."
            );

        }


        if (flagData.applied) {

            throw new Error(
                "Ce jet a déjà été accepté."
            );

        }


        const actor =
            await fromUuid(
                flagData.actorUuid
            );


        if (!actor) {

            throw new Error(
                "L'Acteur ciblé par ce jet de Poison est introuvable."
            );

        }


        if (!actor.isOwner) {

            throw new Error(
                "Vous ne pouvez pas accepter ce jet pour cet Acteur."
            );

        }


        // Carte créée par le MJ : un joueur la met à jour via le
        // relais MJ. Échec rapide AVANT tout jet / coût / effet.
        assertChatMessageUpdatable(
            message
        );


        const isBladePoison =
            flagData.bladePoison === true;

        const resolution =
            isBladePoison
                ? resolveBladePoisonOpposition({

                    victimSuccesses:
                        flagData.victimSuccesses,

                    poisonSuccesses:
                        flagData.poisonSuccesses

                })
                : resolvePoisonOpposition({

                    victimSuccesses:
                        flagData.victimSuccesses,

                    poisonSuccesses:
                        flagData.poisonSuccesses

                });


        const updatedFlagData = {

            ...flagData,

            applied:
                true,

            ...(
                isBladePoison
                    ? {
                        bladeNoEffect:
                            resolution.noEffect
                    }
                    : {
                        fullEffect:
                            resolution.fullEffect
                    }
            )

        };


        await updateChatMessageAsGM(message, {

            content:
                this.renderContent(
                    updatedFlagData
                ),

            [`flags.${SYSTEM_ID}.${MESSAGE_FLAG}`]:
                updatedFlagData

        });


        /*
         * Effets sur l'Acteur APRÈS la mise à jour de la carte
         * (cf. Coup de grâce) : si le relais MJ échoue, aucun
         * dégât ni Item Poison n'est appliqué et la carte reste
         * acceptable.
         */
        await this._applyOutcome(
            actor,
            {
                effectTypeKey:
                    flagData.effectTypeKey,

                toxicity:
                    flagData.toxicity,

                sourceLabel:
                    flagData.sourceLabel,

                bladePoison:
                    isBladePoison,

                resolution
            }
        );


        return {
            actor,
            resolution
        };

    }

}


registerRelayContentRenderer(
    MESSAGE_FLAG,
    flagData =>
        PoisonRollChat.renderContent(
            flagData
        )
);
