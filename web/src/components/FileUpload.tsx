"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function FileUpload({ onUploadComplete }: { onUploadComplete?: (data: any) => void }) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
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

    const uploadFile = async () => {
        if (!file) return;

        setStatus("uploading");
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/analyze", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "Upload failed");
            }

            const data = await response.json();
            setStatus("success");
            setMessage("Analysis complete!");
            if (onUploadComplete) onUploadComplete(data);
        } catch (error) {
            console.error(error);
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "Failed to process the bill.");
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            <div
                className={`glass-panel p-8 transition-all duration-300 border-2 border-dashed
          ${isDragging ? "border-accent-primary bg-white/5" : "border-glass-border"}
          ${status === "uploading" ? "opacity-50 pointer-events-none" : ""}
          flex flex-col items-center justify-center min-h-[300px] text-center`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {status === "success" ? (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-success" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Success!</h3>
                        <p className="text-text-secondary">{message}</p>
                        <button
                            onClick={() => { setFile(null); setStatus("idle"); }}
                            className="mt-6 text-sm underline hover:text-white text-text-secondary"
                        >
                            Upload another
                        </button>
                    </div>
                ) : (
                    <>
                        <div className={`w-20 h-20 rounded-full bg-accent-primary/10 flex items-center justify-center mb-6 transition-transform duration-300 ${isDragging ? "scale-110" : ""}`}>
                            {status === "uploading" ? (
                                <Loader2 className="w-10 h-10 text-accent-primary animate-spin" />
                            ) : (
                                <Upload className="w-10 h-10 text-accent-primary" />
                            )}
                        </div>

                        {file ? (
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 mb-6 border border-glass-border">
                                    <FileText className="w-6 h-6 text-accent-secondary" />
                                    <span className="text-sm font-medium">{file.name}</span>
                                    <button
                                        onClick={() => setFile(null)}
                                        className="ml-2 text-text-secondary hover:text-error"
                                    >
                                        ×
                                    </button>
                                </div>

                                <button
                                    onClick={uploadFile}
                                    className="button-primary w-full min-w-[200px]"
                                >
                                    {status === "uploading" ? "Analyzing..." : "Analyze Bill"}
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold mb-2">
                                    Drop your electricity bill here
                                </h3>
                                <p className="text-text-secondary mb-6 max-w-xs mx-auto">
                                    Support for PDF and Image files. We'll extract usage data automatically.
                                </p>
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
