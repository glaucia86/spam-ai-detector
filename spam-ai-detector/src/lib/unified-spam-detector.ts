import { ca } from "zod/v4/locales";
import AdvancedSpamDetector from "./spam-detector-advanced";
import LangChainSpamDetector from "./spam-detector-langchain";
import MemorySpamDetector from "./spam-detector-memory";
import { cache } from "react";


export type DetectorType = 'basic' | 'advanced' | 'memory';

export interface UnifiedSpamResult {
  isSpam: boolean;
  reason: string;
  confidence: number;
  threatLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  detectorUsed: DetectorType;
  analysisTime: number;
  additionalInfo?: {
    categories?: string[];
    recommendedAction?: string;
    riskFactors?: string[];
    analysis?: {
      linguistic?: string;
      behavioral?: string;
      technical?: string;
    };
    patternSimilarity?: number;
    learningFeedback?: string;
    fromCache?: boolean;
    [key: string]: unknown;
  };
}

export class UnifiedSpamDetector {
  private basicDetector: LangChainSpamDetector;
  private advancedDetector: AdvancedSpamDetector;
  private memoryDetector: MemorySpamDetector;

  constructor() {
    this.basicDetector = new LangChainSpamDetector();
    this.advancedDetector = new AdvancedSpamDetector();
    this.memoryDetector = new MemorySpamDetector();
  }

  private validateConfidence(confidence: any): number {
    if (typeof confidence === 'number' && confidence && !isNaN(confidence) && isFinite(confidence)) {
      return Math.min(Math.max(confidence, 0), 1); // Asegura que esté entre 0 y 1
    }

    console.warn(`Invalid confidence value: ${confidence}. Defaulting to 0.5.`);
    return 0.5; 
  }

  validateThreatLevel(threatLevel: any): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    const validaLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    if (typeof threatLevel === 'string' && validaLevels.includes(threatLevel)) {
      return threatLevel as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    }

    return "LOW"; 
  }

async analyzeSpam(
    email: string,
    detectorType: DetectorType = 'basic'
  ): Promise<UnifiedSpamResult | null> {
    const startTime = Date.now();

    try {
      switch (detectorType) {
        case 'basic': {
          const result = await this.basicDetector.checkSpam(email);
          if (!result) return null;

          return {
            isSpam: Boolean(result.isSpam),
            reason: String(result.reason || "Análise realizada"),
            confidence: this.validateConfidence(result.confidence),
            threatLevel: this.validateThreatLevel(result.threatLevel),
            detectorUsed: 'basic',
            analysisTime: Date.now() - startTime,
            additionalInfo: {
              categories: result.categories || []
            }
          };
        }

        case 'advanced': {
          const result = await this.advancedDetector.analyzeSpamAdvanced(email);
          if (!result) return null;

          return {
            isSpam: Boolean(result.isSpam),
            reason: String(result.reason || "Análise realizada"),
            confidence: this.validateConfidence(result.confidence),
            threatLevel: this.validateThreatLevel(result.threatLevel),
            detectorUsed: 'advanced',
            analysisTime: Date.now() - startTime,
            additionalInfo: {
              recommendedAction: result.recommendedAction || "Nenhuma ação específica recomendada",
              riskFactors: result.riskFactors || [],
              analysis: {
                linguistic: `Suspicious keywords: ${result.analysis?.suspiciousKeywords?.join(', ') || 'none'}, Grammar issues: ${result.analysis?.grammarIssues || 0}`,
                behavioral: `Urgency level: ${result.analysis?.urgencyLevel || 0}, Financial requests: ${result.analysis?.hasFinancialRequests || false}, Personal info requests: ${result.analysis?.hasPersonalInfoRequests || false}`,
                technical: `Phishing probability: ${(result.analysis?.phishingProbability || 0) * 100}%, Scam probability: ${(result.analysis?.scamProbability || 0) * 100}%, Malware probability: ${(result.analysis?.malwareProbability || 0) * 100}%, Category: ${result.analysis?.spamCategory || 'UNKNOWN'}`
              }
            }
          };
        }

        case 'memory': {
          const result = await this.memoryDetector.analyzeWithMemory(email);
          if (!result) return null;

          return {
            isSpam: Boolean(result.isSpam),
            reason: String(result.reason || "Análise realizada"),
            confidence: this.validateConfidence(result.confidence),
            threatLevel: this.validateThreatLevel(result.threatLevel),
            detectorUsed: 'memory',
            analysisTime: result.analysisTime || (Date.now() - startTime),
            additionalInfo: {
              patternSimilarity: this.validateConfidence(result.patternSimilarity),
              learningFeedback: String(result.learningFeedback || "Análise concluída"),
              fromCache: Boolean(result.fromCache)
            }
          };
        }

        default:
          throw new Error(`Detector type not supported: ${detectorType}`);
      }
    } catch (error) {
      console.error(`Error analyzing spam with ${detectorType}:`, error);
      
      return {
        isSpam: false,
        reason: "Erro na análise - email considerado seguro por precaução",
        confidence: 0.5,
        threatLevel: "LOW",
        detectorUsed: detectorType,
        analysisTime: Date.now() - startTime,
        additionalInfo: {
          error: "Analysis failed, defaulting to safe classification"
        }
      };
    }
  }

  async compareDetectors(email: string): Promise<{
    basic: UnifiedSpamResult | null;
    advanced: UnifiedSpamResult | null;
    memory: UnifiedSpamResult | null;
    consensus: {
      isSpam: boolean;
      confidence: number;
      agreement: number;
    };
  }> {
    const [basicResult, advancedResult, memoryResult] = await Promise.all([
      this.analyzeSpam(email, 'basic'),
      this.analyzeSpam(email, 'advanced'),
      this.analyzeSpam(email, 'memory')
    ]);

    // Calcular consenso com validação
    const results = [basicResult, advancedResult, memoryResult].filter(r => r !== null);
    const spamCount = results.filter(r => r!.isSpam).length;
    
    // Calcular média de confidence com validação
    const confidences = results.map(r => this.validateConfidence(r!.confidence));
    const avgConfidence = confidences.length > 0 ? 
      confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length : 0.5;
    
    const agreement = results.length > 0 ? 
      Math.max(spamCount, results.length - spamCount) / results.length : 0;

    return {
      basic: basicResult,
      advanced: advancedResult,
      memory: memoryResult,
      consensus: {
        isSpam: spamCount > results.length / 2,
        confidence: this.validateConfidence(avgConfidence),
        agreement: this.validateConfidence(agreement)
      }
    };
  }

  getMemoryStats() {
    try {
      return this.memoryDetector.getCacheStats();
    } catch (error) {
      console.error("Error getting memory stats:", error);
      return {
        totalEntries: 0,
        totalHits: 0,
        hitRate: 0,
        cacheSize: 0,
        maxSize: 100,
        oldestEntry: Date.now(),
        newestEntry: Date.now()
      };
    }
  }

  async clearAll() {
    try {
      this.memoryDetector.clearCache();
      await this.memoryDetector.clearMemory();
    } catch (error) {
      console.error("Error clearing memory:", error);
    }
  }
}

export default UnifiedSpamDetector;