import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { BufferMemory } from "langchain/memory";
import { LLMChain } from "langchain/chains";
import { z } from "zod";
import { createHash } from "crypto";

// Schema para resultados com contexto
const contextualSpamAnalysisSchema = z.object({
  is_spam: z.boolean().describe("If the email is spam"),
  reason: z.string().describe("Detailed explanation"),
  confidence: z.number().min(0).max(1).describe("Confidence in the decision"),
  threat_level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).describe("Threat level"),
  pattern_similarity: z.number().min(0).max(1).describe("Similarity to known patterns"),
  learning_feedback: z.string().describe("What was learned from this analysis")
});

export interface CachedResult {
  hash: string;
  result: any;
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

    // Configurar memory para manter contexto de análises anteriores
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

    // Verificar se o cache ainda é válido
    if (Date.now() - cached.timestamp > this.CACHE_EXPIRY) {
      this.cache.delete(emailHash);
      return null;
    }

    // Incrementar contador de hits
    cached.hitCount++;
    return cached;
  }

  private setCachedResult(emailHash: string, result: any): void {
    // Limpar cache se estiver muito grande
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Remover entrada mais antiga
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
    const memoryContext = await this.memory.loadMemoryVariables({});

    return PromptTemplate.fromTemplate(
      `Você é um detector de spam avançado com memória de análises anteriores.

      CONTEXTO DE ANÁLISES ANTERIORES:
      {spam_analysis_history}

      NOVA ANÁLISE:
      Analise o seguinte email considerando:
      1. Padrões similares que você já viu antes
      2. Evolução de táticas de spam
      3. Contexto cultural brasileiro
      4. Aprendizado de casos anteriores

      EMAIL PARA ANÁLISE:
      ---
      {email_content}
      ---

      Considere se este email:
      - É similar a padrões de spam que você já identificou
      - Usa táticas novas ou evoluídas
      - Pode estar tentando contornar detecção
      - Representa uma ameaça real aos usuários

      IMPORTANTE: Use seu conhecimento acumulado para fazer uma análise mais precisa.

      {format_instructions}`
    );
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

      // Verificar cache primeiro
      const cachedResult = this.getCachedResult(emailHash);
      if (cachedResult) {
        return {
          ...cachedResult.result,
          fromCache: true,
          analysisTime: Date.now() - startTime
        };
      }

      // Criar prompt com contexto
      const promptTemplate = await this.createContextualPrompt();

      // Criar chain com output parser estruturado
      const chain = new LLMChain({
        llm: this.llm,
        prompt: promptTemplate,
        outputParser: this.outputParser
      });

      // Obter contexto da memória
      const memoryVariables = await this.memory.loadMemoryVariables({});

      // Executar análise
      const result = await chain.call({
        email_content: sanitizedEmail,
        format_instructions: this.outputParser.getFormatInstructions(),
        spam_analysis_history: memoryVariables.spam_analysis_history || ""
      });

      const analysisResult: MemorySpamResult = {
        isSpam: result.is_spam,
        reason: result.reason,
        confidence: result.confidence,
        threatLevel: result.threat_level,
        patternSimilarity: result.pattern_similarity,
        learningFeedback: result.learning_feedback,
        fromCache: false,
        analysisTime: Date.now() - startTime
      };

      // Adicionar à memory para futuras análises
      await this.memory.saveContext(
        { input: `Email analyzed: ${sanitizedEmail.substring(0, 200)}...` },
        { output: `Result: ${result.is_spam ? 'SPAM' : 'LEGITIMATE'} - ${result.reason}` }
      );

      // Salvar no cache
      this.setCachedResult(emailHash, analysisResult);

      return analysisResult;

    } catch (error) {
      console.error('Erro na análise com memory:', error);
      return null;
    }
  }

  // Métodos para gerenciar cache e memory
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

  // Método de compatibilidade
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