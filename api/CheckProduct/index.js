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

        // Fallback: If the item isn't in the global database, keep the screen clear
        if (response.data.status === 0) {
            context.res = { status: 200, body: { action: "keep", itemFound: "Unknown Product" } };
            return;
        }

        const product = response.data.product;
        const productName = (product.product_name || "Unknown Product").toLowerCase();
        
        // 1. SAFE LIST: Catch raw produce and healthy single-ingredient foods immediately
        const healthyKeywords = ["banana", "apple", "orange", "broccoli", "carrot", "fruit", "vegetable", "egg", "water", "milk"];
        const isHealthyWhitelisted = healthyKeywords.some(keyword => productName.includes(keyword));

        // 2. JUNK WORD FILTER: Catch junk foods right away, even if they lack an official letter grade
        const junkKeywords = ["chip", "dorito", "cookie", "oreo", "soda", "cola", "candy", "sweet", "cheetos", "crisps"];
        const isJunkBlacklisted = junkKeywords.some(keyword => productName.includes(keyword));

        // 3. SECURE GRADE CHECK: Check multiple deep paths inside the API for the real grade
        let nutriScore = "c"; // Default to a neutral middle grade if entirely unrated
        if (product.nutriscore_grade) {
            nutriScore = product.nutriscore_grade.toLowerCase();
        } else if (product.nutriscore && typeof product.nutriscore === 'string') {
            nutriScore = product.nutriscore.toLowerCase();
        }

        // 4. THE CORE RULE: Blur if it has a bad score OR is a known junk food (unless whitelisted)
        if (((nutriScore === 'd' || nutriScore === 'e') || isJunkBlacklisted) && !isHealthyWhitelisted) {
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
            // Keep the feed clear for everything else
            context.res = {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: { action: "keep", itemFound: product.product_name || "Approved Food" }
            };
        }
    } catch (error) {
        // Safe fallback: don't freeze the screen if the network drops
        context.res = { status: 200, body: { action: "keep", message: "Safe fallback layout." } };
    }
};

       
