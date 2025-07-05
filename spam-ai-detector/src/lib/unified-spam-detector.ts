import AdvancedSpamDetector from "./spam-detector-advanced";
import LangChainSpamDetector from "./spam-detector-langchain";
import MemorySpamDetector from "./spam-detector-memory";


export type DetectorType = 'basic' | 'advanced' | 'memory';

export interface UnifiedSpamResult {
  isSpam: boolean;
  reason: string;
  confidence: number;
  threatLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  detectorUsed: DetectorType;
  analysisTime: number;
  additionalInfo?: any;
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

  async analyzeSpam(
    email: string,
    detectorType: DetectorType = 'basic'
  ): Promise<UnifiedSpamResult | null> {
    const startTime = Date.now();

    try {
      switch (detectorType) {
        case 'basic':
          const result = await this.basicDetector.checkSpam(email);
          if (!result) return null;

          return {
            isSpam: result.isSpam,
            reason: result.reason,
            confidence: result.confidence,
            threatLevel: result.threatLevel,
            detectorUsed: 'basic',
            analysisTime: Date.now() - startTime,
            additionalInfo: {
              categories: result.categories
            }
          };
        case 'advanced': {
          const result = await this.advancedDetector.analyzeSpamAdvanced(email);
          if (!result) return null;

          return {
            isSpam: result.isSpam,
            reason: result.reason,
            confidence: result.confidence,
            threatLevel: result.threatLevel,
            detectorUsed: 'advanced',
            analysisTime: Date.now() - startTime,
            additionalInfo: {
              recommendedAction: result.recommendedAction,
              riskFactors: result.riskFactors,
              analysis: result.analysis
            }
          };
        }

        case 'memory': {
          const result = await this.memoryDetector.analyzeWithMemory(email);
          if (!result) return null;

          return {
            isSpam: result.isSpam,
            reason: result.reason,
            confidence: result.confidence,
            threatLevel: result.threatLevel,
            detectorUsed: 'memory',
            analysisTime: result.analysisTime,
            additionalInfo: {
              patternSimilarity: result.patternSimilarity,
              learningFeedback: result.learningFeedback,
              fromCache: result.fromCache
            }
          };
        }

        default:
          throw new Error(`Detector type not supported: ${detectorType}`);
      }
    } catch (error) {
      console.error(`Error analyzing spam..: ${detectorType}`, error);
      return null;
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

    // Calcular consenso
    const results = [basicResult, advancedResult, memoryResult].filter(r => r !== null);
    const spamCount = results.filter(r => r!.isSpam).length;
    const avgConfidence = results.reduce((sum, r) => sum + r!.confidence, 0) / results.length;
    const agreement = results.length > 0 ? Math.max(spamCount, results.length - spamCount) / results.length : 0;

    return {
      basic: basicResult,
      advanced: advancedResult,
      memory: memoryResult,
      consensus: {
        isSpam: spamCount > results.length / 2,
        confidence: avgConfidence,
        agreement
      }
    };
  }

  getMemoryStats() {
    return this.memoryDetector.getCacheStats();
  }

  async clearAll() {
    this.memoryDetector.clearCache();
    await this.memoryDetector.clearMemory();
  }
}

export default UnifiedSpamDetector;