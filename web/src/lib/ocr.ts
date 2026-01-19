import { createWorker } from 'tesseract.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

export async function performOCR(buffer: Buffer): Promise<string> {
    // Use a temporary directory for cache to ensure write permissions in serverless/Node environment
    const cachePath = path.join(os.tmpdir(), 'tesseract-cache');
    if (!fs.existsSync(cachePath)) {
        fs.mkdirSync(cachePath, { recursive: true });
    }

    // Attempt to use defaults first, but with explicit cache path.
    // We're avoiding specific worker/core paths unless necessary to avoid module resolution issues.
    // If this fails with MODULE_NOT_FOUND, we might need to revisit content handling.
    try {
        const worker = await createWorker('eng', 1, {
            cachePath,
            logger: m => console.log(m),
        });

        const ret = await worker.recognize(buffer);
        const text = ret.data.text;
        await worker.terminate();
        return text;
    } catch (err) {
        console.error("OCR Worker Init Error:", err);
        throw err;
    }
}
