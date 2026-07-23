const axios = require('axios');

module.exports = async function (context, req) {
    const barcode = req.query.barcode || (req.body && req.body.barcode);

    if (!barcode) {
        context.res = { status: 400, body: { error: "Please provide a barcode number." } };
        return;
    }

    try {
        const url = `https://openfoodfacts.org{barcode}.json`;
        const response = await axios.get(url);

        if (response.data.status === 0) {
            context.res = { status: 200, body: { action: "keep", message: "Product not found. Safe to keep." } };
            return;
        }

        const product = response.data.product;
        const productName = product.product_name || "Unknown Product";
        const nutriScore = product.nutriscore_grade || "c";

        if (nutriScore === 'd' || nutriScore === 'e') {
            let alternative = "Organic Apple Slices or Raw Almonds";
            if (productName.toLowerCase().includes("chip") || productName.toLowerCase().includes("dorito")) {
                alternative = "Baked Kale Chips or Air-Popped Popcorn";
            } else if (productName.toLowerCase().includes("cookie") || productName.toLowerCase().includes("oreo")) {
                alternative = "Simple Mills Almond Flour Cookies";
            } else if (productName.toLowerCase().includes("soda") || productName.toLowerCase().includes("cola")) {
                alternative = "Flavored Sparkling Water (Zevia or Spindrift)";
            }

            context.res = {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: {
                    action: "blur",
                    itemFound: productName,
                    score: nutriScore.toUpperCase(),
                    replaceWith: alternative
                }
            };
        } else {
            context.res = {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: { action: "keep", itemFound: productName, score: nutriScore.toUpperCase() }
            };
        }

    } catch (error) {
        context.res = { status: 500, body: { error: "Failed to fetch food details." } };
    }
};

