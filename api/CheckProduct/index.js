const axios = require('axios');

module.exports = async function (context, req) {
    const barcode = req.query.barcode || (req.body && req.body.barcode);

    if (!barcode) {
        context.res = { status: 400, body: { error: "Please provide a barcode." } };
        return;
    }

    try {
        const url = `https://openfoodfacts.org{barcode}.json`;
        const response = await axios.get(url);

        // If the database has never seen the item, keep the screen clear instead of blurring
        if (response.data.status === 0) {
            context.res = { status: 200, body: { action: "keep", itemFound: "Unknown Product" } };
            return;
        }

        const product = response.data.product;
        const productName = (product.product_name || "Unknown Product").toLowerCase();
        
        // 1. SAFE LIST: Catch raw, single-ingredient healthy foods instantly
        const healthyKeywords = ["banana", "apple", "orange", "broccoli", "carrot", "fruit", "vegetable", "egg", "water"];
        const isWhitelisted = healthyKeywords.some(keyword => productName.includes(keyword));

        // 2. Look for the official rating, but default to 'clean' ("a") if missing to prevent false blurs
        const nutriScore = (product.nutriscore_grade || "a").toLowerCase();

        // 3. COMBINED RULE: Only blur if it is graded poorly AND not on our healthy whitelist
        if ((nutriScore === 'd' || nutriScore === 'e') && !isWhitelisted) {
            let alternative = "Organic Apple Slices or Raw Almonds";
            if (productName.includes("chip") || productName.includes("dorito")) {
                alternative = "Baked Kale Chips or Air-Popped Popcorn";
            } else if (productName.includes("cookie") || productName.includes("oreo")) {
                alternative = "Simple Mills Almond Flour Cookies";
            } else if (productName.includes("soda") || productName.includes("cola")) {
                alternative = "Flavored Sparkling Water (Zevia or Spindrift)";
            }

            context.res = {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: { action: "blur", itemFound: product.product_name, replaceWith: alternative }
            };
        } else {
            // Keep the feed completely clear for bananas, water, and healthy choices
            context.res = {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: { action: "keep", itemFound: product.product_name || "Healthy Choice" }
            };
        }
    } catch (error) {
        context.res = { status: 200, body: { action: "keep", message: "Error reading database, safe fallback." } };
    }
};

