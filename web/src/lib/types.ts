export interface BillData {
    fileName: string;
    uploadDate: string;
    rawText: string;
    extractedData: ExtractedBillData;
}

export interface ExtractedBillData {
    periodStart?: string;
    periodEnd?: string;
    totalAmount?: number;
    consumptionKwh?: number;
    billingDate?: string;
    provider?: string;
    tariffType?: string; // e.g., 'residential', 'commercial'
    lineItems: LineItem[];
}

export interface LineItem {
    description: string;
    amount: number;
    unit?: string; // e.g., 'kWh', '$'
    quantity?: number;
}

export interface EnergyProfile {
    averageDailyConsumption: number; // kWh/day
    projectedMonthlyCost: number;
    carbonFootprintKg: number; // Estimated
    efficiencyScore: number; // 0-100
    insights: string[];
}
