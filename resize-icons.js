import { Jimp } from "jimp";

async function resizeIcons() {
    const sourcePath = "C:/Users/LENOVO/.gemini/antigravity/brain/bb895d4b-814e-46a4-b7c9-05ae30e7f166/uploaded_media_1770104206540.png";

    try {
        const image = await Jimp.read(sourcePath);

        // Resize to 192x192
        await image.resize({ w: 192, h: 192 })
            .write("public/icon-192.png");

        // Resize to 512x512
        const image512 = await Jimp.read(sourcePath); // Read fresh copy
        await image512.resize({ w: 512, h: 512 })
            .write("public/icon-512.png");

        console.log("Icons resized successfully!");
    } catch (err) {
        console.error("Error resizing icons:", err);
    }
}

resizeIcons();
