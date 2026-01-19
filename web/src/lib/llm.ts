import { GoogleGenerativeAI } from "@google/generative-ai";
import { EnergyProfile } from "./types";

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function generateInsights(profile: EnergyProfile, rawText: string): Promise<string[]> {
    // Debug: Check if key exists
    if (!apiKey) {
        console.error("GOOGLE_API_KEY is missing in process.env");
        return [
            "⚠️ System Error: GOOGLE_API_KEY is missing.",
            "Please add GOOGLE_API_KEY to your .env.local file and restart the server.",
            "Falling back to mock data..."
        ];
    }

    if (!genAI) {
        return ["⚠️ System Error: Gemini Client failed to initialize."];
    }

    try {
        // Switch to flash model for speed/reliability on free tier
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        Analyze the electricity bill data to provide 3 energy-saving insights.
        
        Data:
        - Cost: $${profile.projectedMonthlyCost}
        - Usage: ${profile.averageDailyConsumption} kWh
        - Efficiency: ${profile.efficiencyScore}/100
        
        Text Snippet:
        ${rawText.slice(0, 500)}...

        Constraints:
        - Return ONLY a valid JSON array of strings. e.g. ["Tip 1", "Tip 2"]
        - No markdown formatting.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const insights = JSON.parse(cleanedText);
            if (Array.isArray(insights)) {
                return insights;
            }
            return [text];
        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.log("Raw Text:", text);
            return ["⚠️ AI Response Error: Could not parse JSON.", text];
        }

    } catch (error: any) {
        console.error("Gemini API Error details:", error);
        return [
            `⚠️ Gemini API Error: ${error.message || "Unknown error"}`,
            "Check your API Key and Quota."
        ];
    }
}

function getMockInsights(profile: EnergyProfile): string[] {
    const insights = [
        "Your daily consumption matches the regional average.",
    ];

    if (profile.averageDailyConsumption > 30) {
        insights.push("High usage detected. Consider scheduling appliances to off-peak hours.");
        insights.push("Check your HVAC filters; clogged filters can increase usage by 15%.");
    } else {
        insights.push("Great efficiency! You are using 20% less energy than similar homes.");
    }

    if (profile.efficiencyScore < 50) {
        insights.push("Efficiency score is low. Unplug phantom loads to save ~$10/month.");
    }

    return insights;
}
