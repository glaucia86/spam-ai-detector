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
  };

  const setExampleEmail = (exampleText: string) => {
    setEmail(exampleText);
    setResult(null);
    setError(null);
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
          Spam Detector with AI
        </h1>

        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Advanced spam detection using machine learning algorithms to analyze text patterns and identify potential threats.
        </p>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
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
                placeholder="Paste the content of your email here..."
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
              {loading ? 'Analyzing...' : 'Analyze Email'}
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
              <span className="text-red-800 font-medium">Error:</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Result Card */}
            <div className="lg:col-span-2">
              <div className={`p-6 rounded-2xl border-2 ${result.isSpam
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

                  <div>
                    <h3 className={`text-xl font-bold ${result.isSpam ? 'text-red-800' : 'text-green-800'
                      }`}>
                      {result.isSpam ? 'Spam Detected' : 'Seems Safe'}
                    </h3>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${result.isSpam
                        ? 'bg-red-200 text-red-800'
                        : 'bg-green-200 text-green-800'
                      }`}>
                      {result.isSpam ? 'HIGH RISK' : 'LOW RISK'}
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{result.reason}</p>

                <div className="text-sm text-gray-600">
                  Analyzed in: {new Date(result.timestamp).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>

            {/* Confidence Score */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-lg border">
                <h4 className="font-semibold text-gray-900 mb-4">Confidence Score</h4>

                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-gray-900">
                    {(result.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${result.isSpam ? 'bg-red-500' : 'bg-green-500'
                      }`}
                    style={{ width: `${result.confidence * 100}%` }}
                  ></div>
                </div>

                {result.isSpam && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-900 mb-3">Issues Detected</h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Spam Keywords</span>
                        <span className="text-sm font-medium text-red-600">90%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Excessive Scoring</span>
                        <span className="text-sm font-medium text-orange-600">60%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Urgency Language</span>
                        <span className="text-sm font-medium text-yellow-600">40%</span>
                      </div>
                    </div>
                  </div>
                )}

                {!result.isSpam && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-green-800">
                        No spam indicators detected. This text appears to be legitimate.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Examples Section */}
      <div className="py-16 bg-gray-50 mt-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Try these examples:</h2>
            <p className="text-gray-600">Click on one of the examples below to test the detector</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Email Legítimo */}
            <div
              className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setExampleEmail("Olá João, espero que esteja bem. Gostaria de dar seguimento à nossa reunião de ontem sobre o cronograma do projeto. Podemos agendar uma ligação para a próxima semana para discutir os próximos passos? Atenciosamente, Sarah")}
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
                Hello João, I hope you&apos;re well. I&apos;d like to follow up on our meeting...
              </p>
            </div>

            {/* Exemplo de Spam */}
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
                CONGRATULATIONS!!! You WON R$ 1,000,000 in our AMAZING lottery...
              </p>
            </div>

            {/* Email de Marketing */}
            <div
              className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setExampleEmail("Desconto especial só para você! Ganhe 20% de desconto na sua próxima compra. Frete grátis em pedidos acima de R$ 100. Clique aqui para comprar agora e economizar nos seus itens favoritos. Oferta por tempo limitado!")}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2a1 1 0 01-1-1V4M7 4H5a1 1 0 00-1 1v4a1 1 0 001 1h2a1 1 0 001-1V5a1 1 0 00-1-1z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Marketing Email</h3>
              </div>
              <p className="text-sm text-gray-600">
                Special discount just for you! Get 20% off your next purchase...
              </p>
            </div>
            {/* Strange Email */}
            <div
              className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setExampleEmail("hi how r u bro i have million dollar deal just sign here!")}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2a1 1 0 01-1-1V4M7 4H5a1 1 0 00-1 1v4a1 1 0 001 1h2a1 1 0 001-1V5a1 1 0 00-1-1z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Strange Email</h3>
              </div>
              <p className="text-sm text-gray-600">
                hi how r u bro i have million dollar deal just sign here...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};