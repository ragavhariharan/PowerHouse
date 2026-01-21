"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleReset = () => {
    setAnalysisResult(null);
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <main style={{ width: '100%', maxWidth: '1200px', padding: '24px 0' }}>

        {!analysisResult && (
          <div className="text-center mb-12">
            <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
              <span className="text-gradient">Power</span>
              <span className="accent-gradient-text">house</span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Turn your electricity bills into actionable intelligence.
              <br />
              This preview runs fully in your browser—no uploads, no OCR.
            </p>
          </div>
        )}

        <div className="w-full transition-all duration-500">
          {analysisResult ? (
            <Dashboard data={analysisResult} onReset={handleReset} />
          ) : (
            <FileUpload onUploadComplete={setAnalysisResult} />
          )}
        </div>
      </main>
    </div>
  );
}
