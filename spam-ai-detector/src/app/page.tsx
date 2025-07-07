'use client';

import { useState } from "react";

interface AnalysisResult {
  isSpam: boolean;
  reason: string;
  confidence: number;
  timestamp: string;
  threatLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  detectorUsed?: string;
  analysisTime?: number;
  additionalInfo?: {
    fromCache?: boolean;
    patternSimilarity?: number;
    riskFactors?: string[];
    [key: string]: unknown;
  };
  comparison?: {
    consensus: {
      agreement: number;
    };
    [key: string]: unknown;
  };
}

type DetectorType = 'basic' | 'advanced' | 'memory' | 'compare';

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectorType, setDetectorType] = useState<DetectorType>('basic');

  const analyzeEmail = async () => {
    if (!email.trim()) {
      setError('Please insert the content of the email.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          detectorType: detectorType === 'compare' ? 'basic' : detectorType,
          compare: detectorType === 'compare'
        }),
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
  };

  const setExampleEmail = (exampleText: string) => {
    setEmail(exampleText);
    setResult(null);
    setError(null);
  };

  const getDetectorDescription = (type: DetectorType) => {
    switch (type) {
      case 'basic':
        return 'A quick analysis using LangChain with structured output parsing';
      case 'advanced':
        return 'Multi-step analysis with threat assessment and categorization';
      case 'memory':
        return 'Memory-enabled detector that learns from previous analyses and uses caching';
      case 'compare':
        return 'Compares all detectors and provides consensus';
      default:
        return '';
    }
  };

  const getThreatLevelColor = (level?: string) => {
    switch (level) {
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Spam A.I Detector with LangChain.js
        </h1>
        
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Advanced spam A.I e-mail analysis using LangChain.js with multiple algorithms,
          memory, caching, and structured output parsing
        </p>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Detector Selection */}
          <div className="p-6 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose the Detector:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(['basic', 'advanced', 'memory', 'compare'] as DetectorType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setDetectorType(type)}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    detectorType === type
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium capitalize">{type}</div>
                  <div className="text-xs mt-1 opacity-80">
                    {getDetectorDescription(type)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Analysis Section */}
          <div className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900">Text Analysis</h2>
            </div>
            
            <div className="mb-6">
              <textarea
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl min-h-[150px] focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Cole o conteúdo do seu email aqui..."
              />
              <div className="mt-2 text-sm text-gray-500">
                {email.length} characters
              </div>
            </div>

            <button
              onClick={analyzeEmail}
              disabled={loading || !email.trim()}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing with {detectorType}...
                </span>
              ) : (
                `Analyze with ${detectorType}`
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 font-medium">Erro:</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="mt-8 space-y-6">
            {/* Main Result */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className={`p-6 rounded-2xl border-2 ${
                  result.isSpam 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    {result.isSpam ? (
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-xl font-bold ${
                          result.isSpam ? 'text-red-800' : 'text-green-800'
                        }`}>
                          {result.isSpam ? 'Spam Detectado' : 'Parece Seguro'}
                        </h3>
                        {result.threatLevel && (
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getThreatLevelColor(result.threatLevel)}`}>
                            {result.threatLevel}
                          </span>
                        )}
                      </div>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        result.isSpam 
                          ? 'bg-red-200 text-red-800' 
                          : 'bg-green-200 text-green-800'
                      }`}>
                        {result.detectorUsed?.toUpperCase()} - {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{result.reason}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Analyzed on: {new Date(result.timestamp).toLocaleString('pt-BR')}</span>
                    {result.analysisTime && (
                      <span>Time: {result.analysisTime}ms</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Info Sidebar */}
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-md border">
                  <h4 className="font-semibold text-gray-900 mb-3">Informações Adicionais</h4>
                  
                  {result.additionalInfo?.fromCache && (
                    <div className="mb-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                      📦 Cached result
                    </div>
                  )}
                  
                  {result.additionalInfo?.patternSimilarity !== undefined && (
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">Pattern similarity:</span>
                      <div className="text-sm font-medium">{(result.additionalInfo.patternSimilarity * 100).toFixed(1)}%</div>
                    </div>
                  )}

                  {result.additionalInfo?.riskFactors && (
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">Risk factors:</span>
                      <ul className="text-sm mt-1">
                        {result.additionalInfo.riskFactors.slice(0, 3).map((factor: string, index: number) => (
                          <li key={index} className="text-red-600">• {factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.comparison && (
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                      <div className="text-sm font-medium text-gray-900 mb-2">Detector Consensus:</div>
                      <div className="text-sm text-gray-600">
                        Agreement: {(result.comparison.consensus.agreement * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Examples Section */}
        <div className="py-16 bg-gray-50 mt-16 rounded-2xl">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Try these examples:</h2>
              <p className="text-gray-600">Click on one of the examples below to test the detector</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setExampleEmail("Hello João, I hope you're well. I'd like to continue our meeting about the project schedule. Can we schedule a call next week to discuss the next steps? Sincerely, Sarah")}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Legitimate Email</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Hello João, I hope you&apos;re well. I&apos;d like to follow up on our meeting about the project timeline. Can we schedule a call for next week to discuss the next steps? Best regards, Sarah
                </p>
              </div>

              <div 
                className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setExampleEmail("CONGRATULATIONS!!! You WON R$ 1,000,000 in our AMAZING lottery! CLICK HERE NOW to claim your prize before it expires! Act fast - limited time offer! Call 0800-123-4567 immediately! This offer expires in 24 hours!")}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Spam Example</h3>
                </div>
                <p className="text-sm text-gray-600">
                  CONGRATULATIONS!!! You WON R$ 1,000,000 in our AMAZING lottery! CLICK HERE NOW to claim your prize before it expires! Act fast - limited time offer! Call 0800-123-4567 immediately! This offer expires in 24 hours!
                </p>
              </div>

              <div 
                className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setExampleEmail("Hello, I detected suspicious activity in your bank account. To protect your data, click this link immediately and confirm your information: https://fake-bank.com/confirm. Otherwise, your account will be blocked in 24 hours.")}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Phishing</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Hello, I detected suspicious activity in your bank account. To protect your data, click this link immediately and confirm your information: https://fake-bank.com/confirm. Otherwise, your account will be blocked in 24 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};