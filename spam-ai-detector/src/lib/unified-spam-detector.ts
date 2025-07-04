import { de } from "zod/v4/locales";
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
}