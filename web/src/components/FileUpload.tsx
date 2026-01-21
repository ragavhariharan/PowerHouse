"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { ExtractedBillData, EnergyProfile } from "@/lib/types";

export default function FileUpload({ onUploadComplete }: { onUploadComplete?: (data: { extractedData: ExtractedBillData; profile: EnergyProfile }) => void }) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === "application/pdf" || droppedFile.type.startsWith("image/")) {
                handleFileSelect(droppedFile);
            } else {
                setStatus("error");
                setMessage("Please upload a PDF or Image file.");
            }
        }
    }, []);

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
        setStatus("idle");
        setMessage("");
    };

    // Generate a lightweight mock analysis locally (frontend-only)
    const generateMockAnalysis = async (f: File) => {
        try {
            setStatus("generating");
            // Simple deterministic mock based on file size to give variety
            const sizeKb = Math.max(1, Math.floor((f.size || 1000) / 1024));
            const consumptionKwh = Math.round(200 + (sizeKb % 300));

            const extractedData: ExtractedBillData = {
                periodStart: undefined,
                periodEnd: undefined,
                totalAmount: Number((consumptionKwh * 0.14).toFixed(2)),
                consumptionKwh,
                billingDate: new Date().toLocaleDateString(),
                provider: "Demo Energy Co.",
                tariffType: "residential",
                lineItems: [
                    { description: "Energy Charges", amount: Number((consumptionKwh * 0.12).toFixed(2)), unit: "$" },
                    { description: "Delivery & Fees", amount: Number((consumptionKwh * 0.02).toFixed(2)), unit: "$" }
                ]
            };

            const profile: EnergyProfile = {
                averageDailyConsumption: Number((consumptionKwh / 30).toFixed(2)),
                projectedMonthlyCost: Number((consumptionKwh * 0.14).toFixed(2)),
                carbonFootprintKg: Number((consumptionKwh * 0.45).toFixed(2)),
                efficiencyScore: Math.max(40, 100 - Math.floor(consumptionKwh / 10)),
                insights: [
                    `Detected ${consumptionKwh} kWh for the billing period (mock).`,
                    `Try shifting heavy appliances to off-peak hours to save ~${(consumptionKwh * 0.05).toFixed(2)} kWh.`
                ]
            };

            // Small delay for pleasant UX
            await new Promise((r) => setTimeout(r, 600));

            setStatus("success");
            setMessage("Analysis ready — local preview only.");

            if (onUploadComplete) onUploadComplete({ extractedData, profile });
        } catch (err) {
            console.error(err);
            setStatus("error");
            setMessage("Failed to generate analysis.");
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            <div
                className={`glass-panel p-8 transition-all duration-300 border-2 border-dashed
                    ${isDragging ? "border-accent-primary bg-white/5" : "border-glass-border"}
                    ${status === "generating" ? "opacity-60 pointer-events-none" : ""}
                    flex flex-col items-center justify-center min-h-[320px] text-center`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {status === "success" ? (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-success" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Preview Ready</h3>
                        <p className="text-text-secondary">{message}</p>
                        <button
                            onClick={() => { setFile(null); setStatus("idle"); setMessage(""); }}
                            className="mt-6 text-sm underline hover:text-white text-text-secondary"
                        >
                            Upload another
                        </button>
                    </div>
                ) : (
                    <>
                        <div className={`w-20 h-20 rounded-full bg-accent-primary/10 flex items-center justify-center mb-6 transition-transform duration-300 ${isDragging ? "scale-110" : ""}`}>
                            <Upload className="w-10 h-10 text-accent-primary" />
                        </div>

                        {file ? (
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 mb-6 border border-glass-border w-full justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-6 h-6 text-accent-secondary" />
                                        <div className="text-left">
                                            <div className="text-sm font-medium">{file.name}</div>
                                            <div className="text-xs text-text-secondary">{(file.size / 1024).toFixed(0)} KB • {file.type || 'file'}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setFile(null)}
                                        className="ml-2 text-text-secondary hover:text-error"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-3 w-full">
                                    <button
                                        onClick={() => file && generateMockAnalysis(file)}
                                        className="button-primary w-full min-w-[200px]"
                                    >
                                        {status === "generating" ? "Generating…" : "Generate Preview"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold mb-2">Drop your electricity bill here</h3>
                                <p className="text-text-secondary mb-6 max-w-xs mx-auto">Support for PDF and Image files. This is a frontend-only preview — no uploads.</p>
                                <label className="button-primary cursor-pointer relative overflow-hidden">
                                    <span>Browse Files</span>
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept="application/pdf,image/png,image/jpeg"
                                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                    />
                                </label>
                            </>
                        )}

                        {status === "error" && (
                            <div className="mt-6 flex items-center gap-2 text-error bg-error/10 px-4 py-2 rounded-lg">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">{message}</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
