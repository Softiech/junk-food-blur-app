let cameraStream = null;

async function initCamera() {
    try {
        const constraints = {
            video: { facingMode: { exact: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        };
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        document.getElementById('webcam').srcObject = cameraStream;
        document.getElementById('overlay').innerText = "Camera active. Ready to scan products...";
        startScanningLoop();
    } catch (error) {
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            document.getElementById('webcam').srcObject = cameraStream;
            document.getElementById('overlay').innerText = "Desktop mode active. Scanning...";
            startScanningLoop();
        } catch (fallbackError) {
            document.getElementById('overlay').innerText = "Error: Camera access denied.";
        }
    }
}

function startScanningLoop() {
    setTimeout(async () => {
        const testBarcode = "0028400040112"; // Sample barcode for a bag of Lay's Chips
        document.getElementById('overlay').innerText = "Analyzing product...";
        await checkProductWithBackend(testBarcode);
    }, 3000);
}

async function checkProductWithBackend(barcodeNumber) {
    try {
        const overlayElement = document.getElementById('overlay');
        const videoElement = document.getElementById('webcam');
        const response = await fetch(`/api/CheckProduct?barcode=${barcodeNumber}`);
        const data = await response.json();

        if (data.action === "blur") {
            videoElement.style.filter = "blur(25px) brightness(0.5)";
            overlayElement.innerHTML = `
                <div style="background: rgba(220, 53, 69, 0.95); padding: 20px; border-radius: 12px; font-family: sans-serif;">
                    <h3 style="margin: 0 0 10px 0; font-size: 22px;">⚠️ Unhealthy Item Found</h3>
                    <p style="margin: 0 0 5px 0; font-size: 16px;">Detected: <strong>${data.itemFound}</strong></p>
                    <p style="margin: 0; font-size: 18px; color: #d4edda;">👉 Swap with: <strong>${data.replaceWith}</strong></p>
                </div>
            `;
        } else {
            videoElement.style.filter = "none";
            overlayElement.innerHTML = `Clean Choice: ${data.itemFound || "Approved"}`;
        }
    } catch (error) {
        document.getElementById('overlay').innerText = "Database connection error.";
    }
}

window.addEventListener('DOMContentLoaded', initCamera);
