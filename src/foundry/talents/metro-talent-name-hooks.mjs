/**
 * Libellé du Talent « Spécialiste en armement » : le type d'arme
 * choisi sur la fiche de Talent est ajouté au nom, par exemple
 * « Spécialiste en armement (Arme lourde) ». Le nom suit le choix à
 * chaque mise à jour (changement ou retrait du type).
 *
 * L'identité mécanique du Talent reste `system.key` : renommer
 * n'a aucun effet sur les règles.
 */

import {
    resolveTalentKey
} from "../../domain/rules/talent-identity.mjs";

import {
    composeSpecialistName
} from "../../domain/rules/weapon-talent-type.mjs";


const WEAPON_TYPE_PATH =
    "system.configuration.weaponType";


export function registerTalentNameHooks() {

    Hooks.on(
        "preUpdateItem",
        (item, changes) => {

            if (
                item?.type !== "talent"
                || resolveTalentKey(item) !== "weaponSpecialist"
            ) {
                return;
            }

            const flat =
                foundry.utils.flattenObject(
                    changes
                );

            if (!(WEAPON_TYPE_PATH in flat)) {
                return;
            }

            changes.name =
                composeSpecialistName(
                    changes.name ?? item.name,
                    flat[WEAPON_TYPE_PATH]
                );

        }
    );

}
