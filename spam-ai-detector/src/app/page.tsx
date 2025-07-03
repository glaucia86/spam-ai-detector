'use client';

import { useState } from "react";

interface AnalysisResult {
  isSpam: boolean;
  reason: string;
  confidence: number;
  timestamp: string;
}

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeEmail = async () => {
    if (!email.trim()) {
      setError('Please enter an email content.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze email');
      }

      setResult(data.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Spam Email Detector</h1>
      
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email Content
        </label>
        <textarea
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border rounded-lg min-h-[200px]"
          placeholder="Paste your email content here..."
        />
      </div>

      <button
        onClick={analyzeEmail}
        disabled={loading}
        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Analyze Email'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <div className={`mt-4 p-4 rounded-lg ${result.isSpam ? 'bg-red-100' : 'bg-green-100'}`}>
          <h2 className="text-xl font-semibold mb-2">
            {result.isSpam ? '⚠️ Spam Detected' : '✅ Not Spam'}
          </h2>
          <p className="mb-1"><strong>Reason:</strong> {result.reason}</p>
          <p className="mb-1"><strong>Confidence:</strong> {(result.confidence * 100).toFixed(1)}%</p>
          <p className="text-sm text-gray-600">Analyzed at: {new Date(result.timestamp).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};