import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "langchain/output_parsers";
import * as dotenv from "dotenv";

dotenv.config();

import { z } from "zod";

const spamAnalysisSchema = z.object({
  is_spam: z.boolean().describe("Whether the email is spam or not"),
  reason: z.string().describe("Detailed explanation in Portuguese of why it is or isn't spam"),
  confidence: z.number().min(0).max(1).describe("Confidence level between 0.0 and 1.0"),
  threat_level: z.enum(["LOW", "MEDIUM", "HIGH"]).describe("Threat level of the spam email"),
  categories: z.array(z.string()).describe("Categories of spam detected in the email").optional(),
});

export interface SpamResult {
  isSpam: boolean;
  reason: string;
  confidence: number;
  threatLevel: "LOW" | "MEDIUM" | "HIGH";
  categories?: string[];
}

export class LangChainSpamDetector {
  private llm: ChatOpenAI;
  private outputParser: StructuredOutputParser<typeof spamAnalysisSchema>;
  private promptTemplate: PromptTemplate;

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

    this.outputParser = StructuredOutputParser.fromZodSchema(spamAnalysisSchema);

    this.promptTemplate = PromptTemplate.fromTemplate(
      `Você é um especialista em segurança cibernética e detecção de spam com anos de experiência.
      
      Analise o seguinte email e determine se é spam, considerando:
      - Links suspeitos ou attachments perigosos
      - Linguagem suspeita ou urgente
      - Ofertas irreais ou muito boas para ser verdade 
      - Solicitações de informações pessoais ou financeiras
      - Erros gramaticais ou ortográficos excessivos
      - Remetentes não confiáveis
      - Qualquer outro sinal de alerta

      EMAIL PARA ANÁLISE:
      ---
      {email_content}
      ---

      INSTRUÇÕES IMPORTANTES:
      - Seja preciso e detalhado na sua análise
      - Explique claramente os motivos da sua decisão
      - Considere o contexto cultural brasileiro
      - Identifique categorias específicas de spam se aplicável

      {format_instructions}
      `
    );
  }

  private sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return '';
    }
    const sanitized = email.replace(
      /(ignore|disregard|forget).*(previous|above|instruction|prompt)/gi,
      '[CONTEÚDO FILTRADO]'
    );

    return sanitized.length > 3000 ? sanitized.substring(0, 3000) + "..." : sanitized;
  }

  async analyzeEmail(email: string): Promise<SpamResult | null> {
    try {
      if (!email?.trim()) {
        return {
          isSpam: false,
          reason: "Empty email cannot be classified as spam",
          confidence: 1.0,
          threatLevel: "LOW",
        };
      }

      const sanitizedEmail = this.sanitizeEmail(email);

      const chain = this.promptTemplate.pipe(this.llm).pipe(this.outputParser);

      const result = await chain.invoke({
        email_content: sanitizedEmail,
        format_instructions: this.outputParser.getFormatInstructions(),
      });

      return {
        isSpam: result.is_spam,
        reason: result.reason,
        confidence: result.confidence,
        threatLevel: result.threat_level,
        categories: result.categories || [],
      };
    } catch (error) {
      console.error("Error analyzing email:", error);
      return null;
    }
  }

  async checkSpam(email: string): Promise<SpamResult | null> {
    const result = await this.analyzeEmail(email);
    return result;
  }
}

export default LangChainSpamDetector;