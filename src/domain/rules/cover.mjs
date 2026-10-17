export function resolveCover({
    value = 0,
    range = "short",
    totalCover = false,
    contactAllowed = true,
    protectionReduction = 0
} = {}) {

    if (!Number.isInteger(value) || value < 0) {
        throw new RangeError(
            "La Protection d'un abri doit être un entier positif ou nul."
        );
    }

    if (!["contact", "short", "medium"].includes(range)) {
        throw new Error(
            `Portée invalide pour un abri : ${range}.`
        );
    }

    if (
        !Number.isInteger(protectionReduction)
        || protectionReduction < 0
    ) {
        throw new RangeError(
            "La réduction de Protection doit être un entier positif ou nul."
        );
    }


    /*
     * Au contact, une grenade ignore normalement
     * l'abri.
     *
     * totalCover/contactAllowed permettent au MJ
     * de représenter l'exception prévue par la règle.
     */
    const ignoredAtContact =
        range === "contact"
        && !totalCover
        && contactAllowed;


    if (ignoredAtContact) {

        return {
            applies: false,
            reason: "contact-bypasses-cover",

            baseProtection: value,
            protectionReduction: 0,
            effectiveProtection: 0,

            totalCover,
            contactAllowed
        };
    }


    const effectiveProtection =
        Math.max(
            0,
            value - protectionReduction
        );


    return {
        applies:
            effectiveProtection > 0,

        reason:
            effectiveProtection > 0
                ? "cover-applies"
                : "no-effective-cover",

        baseProtection:
            value,

        protectionReduction:
            Math.min(
                value,
                protectionReduction
            ),

        effectiveProtection,

        totalCover,

        contactAllowed
    };
}