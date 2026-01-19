import { ExtractedBillData, LineItem, EnergyProfile } from "./types";

export function extractBillData(text: string): ExtractedBillData {
    const data: ExtractedBillData = {
        lineItems: [],
    };

    // Basic normalization
    const cleanText = text.replace(/\s+/g, " ");

    // --- Extraction Patterns (Heuristics) ---

    // 1. Total Amount
    // Matches: "Total Amount: $123.45", "Total Due $123.45", "Amount Payable: 123.45"
    const amountRegex = /(?:Total Amount|Total Due|Amount Payable|Payable Amount).*?[\$£€]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i;
    const amountMatch = text.match(amountRegex);
    if (amountMatch && amountMatch[1]) {
        data.totalAmount = parseFloat(amountMatch[1].replace(/,/g, ""));
    }

    // 2. Consumption (kWh)
    // Matches: "123 kWh", "Usage: 123 kWh", "Total Consumption: 123"
    const kwhRegex = /(?:Consumption|Usage|Total Units).*?(\d+(?:\.\d+)?)\s*kwh/i;
    // Fallback: look for just number followed by kWh
    const kwhSimpleRegex = /(\d+(?:\.\d+)?)\s*kWh/;

    const kwhMatch = text.match(kwhRegex) || text.match(kwhSimpleRegex);
    if (kwhMatch && kwhMatch[1]) {
        data.consumptionKwh = parseFloat(kwhMatch[1]);
    }

    // 3. Dates (Period)
    // Matches dates in format DD/MM/YYYY or YYYY-MM-DD
    const dateRegex = /(\d{2}[-\/]\d{2}[-\/]\d{4})|(\d{4}[-\/]\d{2}[-\/]\d{2})/;
    const dates = text.match(new RegExp(dateRegex, 'g'));
    if (dates && dates.length >= 1) {
        // Naively assume first date is billing or start
        data.billingDate = dates[0];
        if (dates.length >= 2) {
            data.periodStart = dates[dates.length - 2]; // guess
            data.periodEnd = dates[dates.length - 1]; // guess
        }
    }

    // 4. Provider Detection (Simple keywords)
    if (text.toLowerCase().includes("pg&e")) data.provider = "PG&E";
    else if (text.toLowerCase().includes("edison")) data.provider = "Con Ed";
    else if (text.toLowerCase().includes("bescom")) data.provider = "BESCOM";

    return data;
}

export function calculateEnergyProfile(data: ExtractedBillData): EnergyProfile {
    // Deterministic profile calculation
    const consumption = data.consumptionKwh || 0;
    const amount = data.totalAmount || 0;

    // Approx carbon (0.92 lbs per kWh -> ~0.417 kg)
    const carbonFootprintKg = consumption * 0.417;

    // Efficiency Score (Mock logic: lower consumption per $ is better? No, simpler)
    // Assuming 30 days
    const daily = consumption / 30;

    // Benchmark: 10-30 kWh/day is normal for residential
    let score = 50;
    if (daily < 10) score = 90;
    else if (daily < 20) score = 75;
    else if (daily > 30) score = 40;
    else if (daily > 50) score = 20;

    return {
        averageDailyConsumption: parseFloat(daily.toFixed(2)),
        projectedMonthlyCost: amount, // Just use current for now
        carbonFootprintKg: parseFloat(carbonFootprintKg.toFixed(2)),
        efficiencyScore: score,
        insights: [] // populated by LLM later
    };
}
