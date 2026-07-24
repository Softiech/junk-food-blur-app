module.exports = async function (context, req) {
    // 1. Grab whatever barcode your phone camera scans
    const barcode = req.query.barcode || (req.body && req.body.barcode);

    if (!barcode) {
        context.res = { status: 400, body: { error: "Please scan a barcode." } };
        return;
    }

    // 2. THE LOCAL DATABASE: A bulletproof list of exact test items
    const foodDatabase = {
        // JUNK FOOD ENTRIES (Will trigger the Diminished Reality blur)
        "0028400040112": { name: "Lay's Classic Potato Chips", action: "blur", swap: "Baked Kale Chips or Air-Popped Popcorn" },
        "044000032029":  { name: "Oreo Chocolate Sandwich Cookies", action: "blur", swap: "Simple Mills Almond Flour Cookies" },
        "049000028904":  { name: "Coca-Cola Classic Soda (12oz)", action: "blur", swap: "Flavored Sparkling Water (Zevia or Spindrift)" },
        "012000000133":  { name: "Pepsi Cola", action: "blur", swap: "Spindrift Lemon Sparkling Water" },
        "028400040112":  { name: "Doritos Nacho Cheese", action: "blur", swap: "Siete Grain Free Tortilla Chips" },

        // HEALTHY WHOLE FOOD ENTRIES (Will keep the camera stream clear)
        "0000000040111": { name: "Fresh Organic Bananas", action: "keep" },
        "0000000040128": { name: "Fresh Gala Apples", action: "keep" },
        "021130070529":  { name: "Organic Raw Whole Almonds", action: "keep" }
    };

    // 3. LOOKUP LOGIC: Check our local database list for the barcode
    const matchedProduct = foodDatabase[barcode.trim()];

    if (matchedProduct) {
        if (matchedProduct.action === "blur") {
            // Trigger the Diminished Reality blur filter for matched junk foods
            context.res = {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: { 
                    action: "blur", 
                    itemFound: matchedProduct.name, 
                    replaceWith: matchedProduct.swap 
                }
            };
        } else {
            // Keep the phone camera completely clear for matched healthy whole foods
            context.res = {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: { action: "keep", itemFound: matchedProduct.name }
            };
        }
    } else {
        // FALLBACK RULE: If you scan something else, keep it clear so you can navigate the store
        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { action: "keep", itemFound: "Unknown Item (Safe Mode)" }
        };
    }
};
