module.exports = async function (context, req) {
    // 1. Capture whatever barcode your phone camera just scanned
    const barcode = req.query.barcode || (req.body && req.body.barcode);

    // 2. UNIVERSAL TEST LOGIC: Force every single item to trigger the blur filter
    context.res = {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
            action: "blur",
            itemFound: "Test Product (Barcode: " + (barcode || "Unknown") + ")",
            score: "JUNK",
            replaceWith: "Organic Fresh Fruit or Raw Mixed Nuts"
        }
    };
};
