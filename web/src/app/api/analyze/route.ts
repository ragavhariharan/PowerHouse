import { NextRequest, NextResponse } from "next/server";
import { extractBillData, calculateEnergyProfile } from "@/lib/extractor";
import { generateInsights } from "@/lib/llm";
import { performOCR } from "@/lib/ocr";

// Polyfill DOMMatrix for pdf-parse
if (typeof global.DOMMatrix === 'undefined') {
    // @ts-ignore
    global.DOMMatrix = class DOMMatrix {
        constructor() { return this; }
        transformPoint(p: any) { return p; }
        translate() { return this; }
        scale() { return this; }
        multiply() { return this; }
        toString() { return ""; }
    } as any;
}

let pdf = require("pdf-parse");
// Handle CJS/ESM interop issues with Next.js/Turbopack
if (typeof pdf !== 'function' && typeof pdf.default === 'function') {
    pdf = pdf.default;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let text = "";

        if (file.type === "application/pdf") {
            // Parse PDF text
            const data = await pdf(buffer);
            text = data.text;
        } else if (file.type.startsWith("image/")) {
            // Parse Image text
            try {
                text = await performOCR(buffer);
            } catch (ocrError: any) {
                console.error("OCR Error:", ocrError);
                return NextResponse.json({
                    error: `OCR Failed: ${ocrError.message || JSON.stringify(ocrError)}`
                }, { status: 500 });
            }
        } else {
            return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
        }

        // Extract structured data using logic
        const extractedData = extractBillData(text);

        // Build energy profile
        const profile = calculateEnergyProfile(extractedData);

        // Generate LLM Insights
        const insights = await generateInsights(profile, text);
        profile.insights = insights;

        return NextResponse.json({
            success: true,
            text,
            extractedData,
            profile
        });

    } catch (error) {
        console.error("Error processing file:", error);
        return NextResponse.json(
            { error: "Failed to process file" },
            { status: 500 }
        );
    }
}
