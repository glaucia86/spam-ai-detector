import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { BufferMemory } from "langchain/memory";
import { z } from "zod";
import { createHash } from "crypto";

// Schema para resultados com contexto
const contextualSpamAnalysisSchema = z.object({
  is_spam: z.boolean().describe("If the email is spam"),
  reason: z.string().describe("Detailed explanation"),
  confidence: z.number().min(0).max(1).describe("Confidence in the decision").default(0.5),
  threat_level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).describe("Threat level"),
  pattern_similarity: z.number().min(0).max(1).describe("Similarity to known patterns").default(0.0),
  learning_feedback: z.string().describe("What was learned from this analysis")
});

export interface CachedResult {
  hash: string;
  result: MemorySpamResult;
  timestamp: number;
  hitCount: number;
}

export interface MemorySpamResult {
  isSpam: boolean;
  reason: string;
  confidence: number;
  threatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  patternSimilarity: number;
  learningFeedback: string;
  fromCache: boolean;
  analysisTime: number;
}

export class MemorySpamDetector {
  private llm: ChatOpenAI;
  private memory: BufferMemory;
  private outputParser: StructuredOutputParser<typeof contextualSpamAnalysisSchema>;
  private cache: Map<string, CachedResult> = new Map();
  private readonly CACHE_EXPIRY = 1000 * 60 * 60; // 1 hora
  private readonly MAX_CACHE_SIZE = 100;

  constructor() {
    this.llm = new ChatOpenAI({
      model: "openai/gpt-4o",
      temperature: 0.1,
      maxTokens: 500,
      openAIApiKey: process.env.NEXT_PUBLIC_OPEN_API_GITHUB_MODEL_TOKEN,
      configuration: {
        baseURL: process.env.NEXT_PUBLIC_OPEN_API_GITHUB_MODEL_ENDPOINT
      },
    });

    this.memory = new BufferMemory({
      memoryKey: "spam_analysis_history",
      humanPrefix: "Email for analysis",
      aiPrefix: "Spam analysis"
    });

    this.outputParser = StructuredOutputParser.fromZodSchema(contextualSpamAnalysisSchema);
  }

  private generateEmailHash(email: string): string {
    return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
  }

  private getCachedResult(emailHash: string): CachedResult | null {
    const cached = this.cache.get(emailHash);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_EXPIRY) {
      this.cache.delete(emailHash);
      return null;
    }

    cached.hitCount++;
    return cached;
  }

  private setCachedResult(emailHash: string, result: MemorySpamResult): void {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(emailHash, {
      hash: emailHash,
      result,
      timestamp: Date.now(),
      hitCount: 1
    });
  }

  private async createContextualPrompt(): Promise<PromptTemplate> {

    return PromptTemplate.fromTemplate(
      `You are an advanced spam detector with a memory of previous analyses.

      CONTEXT OF PREVIOUS ANALYSES:
      {spam_analysis_history}

      NEW ANALYSIS:
      Analyze the following email considering:
      1. Similar patterns you've seen before
      2. Evolution of spam tactics
      3. Brazilian cultural context
      4. Learning from previous cases

      EMAIL FOR ANALYSIS:
      ---
      {email_content}
      ---

      Consider whether this email:
      - Is similar to spam patterns you've already identified
      - Uses new or evolved tactics
      - May be trying to circumvent detection
      - Poses a real threat to users

      IMPORTANT: 
      - Use your accumulated knowledge to make a more accurate analysis
      - ALWAYS provide a confidence value between 0.0 and 1.0
      - ALWAYS provide a pattern_similarity value between 0.0 and 1.0

      {format_instructions}`
    );
  }

  private validateNumericValue(value: unknown, defaultValue: number): number {
    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
      return Math.max(0, Math.min(1, value)); // Garante que o valor esteja entre 0 e 1
    }

    return defaultValue;
  }

  async analyzeWithMemory(email: string): Promise<MemorySpamResult | null> {
    const startTime = Date.now();

    try {
      if (!email?.trim()) {
        return {
          isSpam: false,
          reason: 'Empty email cannot be classified as spam',
          confidence: 1.0,
          threatLevel: "LOW",
          patternSimilarity: 0,
          learningFeedback: "Nothing to learn from empty email",
          fromCache: false,
          analysisTime: Date.now() - startTime
        };
      }

      const sanitizedEmail = this.sanitizeEmail(email);
      const emailHash = this.generateEmailHash(sanitizedEmail);

      const cachedResult = this.getCachedResult(emailHash);
      if (cachedResult) {
        return {
          ...cachedResult.result,
          fromCache: true,
          analysisTime: Date.now() - startTime
        };
      }

      const promptTemplate = await this.createContextualPrompt();

      const chain = promptTemplate.pipe(this.llm).pipe(this.outputParser);

      const memoryVariables = await this.memory.loadMemoryVariables({});

      const result = await chain.invoke({
        email_content: sanitizedEmail,
        format_instructions: this.outputParser.getFormatInstructions(),
        spam_analysis_history: memoryVariables.spam_analysis_history || ""
      });

      const confidence = this.validateNumericValue(result.confidence, 0.5);
      const patternSimilarity = this.validateNumericValue(result.pattern_similarity, 0.0);

      const analysisResult: MemorySpamResult = {
        isSpam: Boolean(result.is_spam),
        reason: String(result.reason || 'Analysis performed'),
        confidence: confidence,
        threatLevel: result.threat_level || "LOW",
        patternSimilarity: patternSimilarity,
        learningFeedback: String(result.learning_feedback || 'Analysis completed'),
        fromCache: false,
        analysisTime: Date.now() - startTime
      };

      await this.memory.saveContext(
        { input: `Email analyzed: ${sanitizedEmail.substring(0, 200)}...` },
        { output: `Result: ${result.is_spam ? 'SPAM' : 'LEGITIMATE'} - ${result.reason}` }
      );

      this.setCachedResult(emailHash, analysisResult);

      return analysisResult;

    } catch (error) {
      console.error('Error in analysis with memory:', error);
      
      return {
        isSpam: false,
        reason: 'An error occurred during analysis',
        confidence: 0.5,
        threatLevel: "LOW",
        patternSimilarity: 0.0,
        learningFeedback: 'Error during analysis',
        fromCache: false,
        analysisTime: Date.now() - startTime
      };
    }
  }

  getCacheStats() {
    const stats = Array.from(this.cache.values()).reduce(
      (acc, item) => ({
        totalEntries: acc.totalEntries + 1,
        totalHits: acc.totalHits + item.hitCount,
        oldestEntry: Math.min(acc.oldestEntry, item.timestamp),
        newestEntry: Math.max(acc.newestEntry, item.timestamp)
      }),
      { totalEntries: 0, totalHits: 0, oldestEntry: Date.now(), newestEntry: 0 }
    );

    return {
      ...stats,
      hitRate: stats.totalEntries > 0 ? stats.totalHits / stats.totalEntries : 0,
      cacheSize: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE
    };
  }

  clearCache() {
    this.cache.clear();
  }

  async clearMemory() {
    await this.memory.clear();
  }

  private sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return '';
    }

    const sanitized = email.replace(
      /(ignore|disregard|forget).*(previous|above|instruction|prompt)/gi,
      '[FILTRADO]'
    );

    return sanitized.length > 3000 ? sanitized.substring(0, 3000) + "..." : sanitized;
  }

  async checkSpam(email: string): Promise<{ isSpam: boolean; reason: string; confidence: number } | null> {
    const result = await this.analyzeWithMemory(email);
    if (!result) return null;

    return {
      isSpam: result.isSpam,
      reason: result.reason,
      confidence: result.confidence
    };
  }
}

export default MemorySpamDetector;