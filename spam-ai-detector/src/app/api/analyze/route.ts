import { NextRequest, NextResponse } from "next/server";
import UnifiedSpamDetector, { DetectorType } from "../../../lib/unified-spam-detector";

// Cache global do detector (singleton)
let detectorInstance: UnifiedSpamDetector | null = null;

function getDetectorInstance(): UnifiedSpamDetector {
  if (!detectorInstance) {
    detectorInstance = new UnifiedSpamDetector();
  }
  return detectorInstance;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, detectorType = 'basic', compare = false } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: 'Email content required' },
        { status: 400 }
      );
    }

    if (email.length > 10000) {
      return NextResponse.json(
        { error: 'Email content too long (maximum 10,000 characters)' },
        { status: 400 }
      );
    }

    const detector = getDetectorInstance();

    // Se solicitado comparação entre detectores
    if (compare) {
      const comparison = await detector.compareDetectors(email);
      
      return NextResponse.json({
        success: true,
        data: {
          // Retornar resultado do consenso para compatibilidade
          isSpam: comparison.consensus.isSpam,
          reason: `Consensus among detectors: ${comparison.consensus.agreement * 100}% agreement`,
          confidence: comparison.consensus.confidence,
          timestamp: new Date().toISOString(),
          // Dados adicionais
          comparison: comparison,
          detectorUsed: 'comparison'
        }
      });
    }

    // Análise com detector específico
    const result = await detector.analyzeSpam(email, detectorType as DetectorType);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to analyze email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        // Campos principais para compatibilidade com frontend
        isSpam: result.isSpam,
        reason: result.reason,
        confidence: result.confidence,
        timestamp: new Date().toISOString(),
        
        // Dados adicionais do LangChain
        threatLevel: result.threatLevel,
        detectorUsed: result.detectorUsed,
        analysisTime: result.analysisTime,
        additionalInfo: result.additionalInfo
      }
    });

  } catch (error: unknown) {
    console.error('Error in LangChain API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const detector = getDetectorInstance();

    switch (action) {
      case 'stats':
        return NextResponse.json({
          status: 'ok',
          service: 'LangChain.js Spam AI Detector',
          version: '3.0.0',
          detectors: ['basic', 'advanced', 'memory'],
          memoryStats: detector.getMemoryStats(),
          timestamp: new Date().toISOString()
        });

      case 'clear-cache':
        await detector.clearAll();
        return NextResponse.json({
          status: 'ok',
          message: 'Cache and memory cleared successfully'
        });

      default:
        return NextResponse.json({
          status: 'ok',
          service: 'LangChain.js Spam AI Detector',
          version: '3.0.0',
          description: 'Advanced spam detector using LangChain.js with multiple analysis algorithms',
          features: [
            'Basic analysis with LangChain',
            'Advanced multi-step analysis',
            'Detector with memory and cache',
            'Comparison among detectors',
            'Structured output parsing',
            'Dynamic prompt templates'
          ],
          endpoints: {
            'POST /api/analyze': 'Analyze an email',
            'GET /api/analyze?action=stats': 'System statistics',
            'GET /api/analyze?action=clear-cache': 'Clear cache and memory'
          },
          timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error in GET LangChain API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}