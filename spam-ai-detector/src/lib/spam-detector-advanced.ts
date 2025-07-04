import { PromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';


const contentAnalysisSchema = z.object({
  suspicious_keywords: z.array(z.string()).describe("Suspicious keywords found"),
  grammar_issues: z.number().min(0).max(10).describe("Level of grammar problems (0-10)"),
  urgency_level: z.number().min(0).max(10).describe("Urgency level of the email (0-10)"),
  financial_requests: z.boolean().describe("If there are financial requests"),
  personal_info_requests: z.boolean().describe("If personal data is requested")
});

const threatAssessmentSchema = z.object({
  phishing_probability: z.number().min(0).max(1).describe("Probability of phishing attack (0-1)"),
  scam_probability: z.number().min(0).max(1).describe("Probability of scam (0-1)"),
  malware_probability: z.number().min(0).max(1).describe("Probability of malware (0-1)"),
  spam_category: z.enum(["FINANCIAL", "PHARMACEUTICAL", "ROMANCE", "TECH_SUPPORT", "LOTTERY", "PHISHING", "LEGITIMATE"]).describe("Category of spam detected")
});

const finalDecisionSchema = z.object({
  is_spam: z.boolean().describe("Final decision on whether the email is spam or not"),
  confidence: z.number().min(0).max(1).describe("Confidence level of the spam detection (0-1)"),
  threat_level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).describe("Threat level of the email"),
  reason: z.string().describe("Reasoning behind the spam detection decision"),
  recommended_action: z.string().describe("Recommended user action"),
  risk_factors: z.array(z.string()).describe("Risk factors identified")
});

export interface AdvancedSpamResult {
  isSpam: boolean;
  confidence: number;
  threatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason: string;
  recommendedAction: string;
  riskFactors: string[];
  analysis: {
    suspiciousKeywords: string[];
    grammarIssues: number;
    urgencyLevel: number;
    hasFinancialRequests: boolean;
    hasPersonalInfoRequests: boolean;
    phishingProbability: number;
    scamProbability: number;
    malwareProbability: number;
    spamCategory: string;
  };
}

export class AdvancedSpamDetector {
  private llm: ChatOpenAI;
  private contentAnalysisParser: StructuredOutputParser<typeof contentAnalysisSchema>;
  private threatAssessmentParser: StructuredOutputParser<typeof threatAssessmentSchema>;
  private finalDecisionParser: StructuredOutputParser<typeof finalDecisionSchema>;

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

    this.contentAnalysisParser = StructuredOutputParser.fromZodSchema(contentAnalysisSchema);
    this.threatAssessmentParser = StructuredOutputParser.fromZodSchema(threatAssessmentSchema);
    this.finalDecisionParser = StructuredOutputParser.fromZodSchema(finalDecisionSchema);
  }

  private createContentAnalysisChain() {
    const prompt = PromptTemplate.fromTemplate(
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

      FOQUE EM: 
      - Palavras-chave típicas de spam (URGENTE, GANHE, GRÁTIS, etc.)
      - Qualidade da escrita e gramática
      - Nível de urgência transmitido
      - Solicitações financeiras ou de dados pessoais

      {format_instructions}
      `
    );

    return prompt.pipe(this.llm).pipe(this.contentAnalysisParser);
  }

  private createThreatAssesmentChain() {
    const prompt = PromptTemplate.fromTemplate(
      `Com base na análise de conteúdo, avalie as AMEAÇAS potenciais:

      ANÁLISE DE CONTEÚDO:
      {content_analysis}

      EMAIL ORIGINAL:
      {email_content}

      Avalie probabilidades de:
      - Phishing (roubo de credenciais)
      - Golpes financeiros
      - Malware (vírus, ransomware) e links maliciosos e suspeitos
      - Categoria específica de spam (financeiro, farmacêutico, romance, suporte técnico, loteria, phishing)

      {format_instructions}`
    );

    return prompt.pipe(this.llm).pipe(this.threatAssessmentParser);
  }

  private createFinalDecisionChain() {
    const prompt = PromptTemplate.fromTemplate(
      `Tome a DECISÃO FINAL com base em todas as análises:

      ANÁLISE DE CONTEÚDO:
      {content_analysis}

      AVALIAÇÃO DE AMEAÇAS:
      {threat_assessment}

      EMAIL ORIGINAL:
      {email_content}

      Forneça:
      - Decisão final (spam ou não)
      - Nível de confiança
      - Explicação clara em português
      - Ação recomendada para o usuário
      - Fatores de risco específicos identificados
      
      {format_instructions}`
    );

    return prompt.pipe(this.llm).pipe(this.finalDecisionParser);
  }

  async analyzeSpamAdvanced(email: string): Promise<AdvancedSpamResult | null> {
    try {
      if (!email?.trim()) {
        return {
          isSpam: false,
          confidence: 1.0,
          threatLevel: "LOW",
          reason: "Empty email cannot be classified as spam",
          recommendedAction: "No action needed",
          riskFactors: [],
          analysis: {
            suspiciousKeywords: [],
            grammarIssues: 0,
            urgencyLevel: 0,
            hasFinancialRequests: false,
            hasPersonalInfoRequests: false,
            phishingProbability: 0,
            scamProbability: 0,
            malwareProbability: 0,
            spamCategory: "LEGITIMATE",
          }
        };
      }

      const sanitizedEmail = this.sanitizeEmail(email);

      // 1. Content Analysis
      const contentAnalysisChain = this.createContentAnalysisChain();
      const contentAnalysis = await contentAnalysisChain.invoke({
        email_content: sanitizedEmail,
        format_instructions: this.contentAnalysisParser.getFormatInstructions(),
      });

      // 2. Threat Assessment
      const threatAssessmentChain = this.createThreatAssesmentChain();
      const threatAssessment = await threatAssessmentChain.invoke({
        content_analysis: contentAnalysis,
        email_content: sanitizedEmail,
        format_instructions: this.threatAssessmentParser.getFormatInstructions(),
      });

      // 3. Final Decision
      const finalDecisionChain = this.createFinalDecisionChain();
      const finalDecision = await finalDecisionChain.invoke({
        content_analysis: contentAnalysis,
        threat_assessment: threatAssessment,
        email_content: sanitizedEmail,
        format_instructions: this.finalDecisionParser.getFormatInstructions(),
      });

      return {
        isSpam: finalDecision.is_spam,
        confidence: finalDecision.confidence,
        threatLevel: finalDecision.threat_level,
        reason: finalDecision.reason,
        recommendedAction: finalDecision.recommended_action,
        riskFactors: finalDecision.risk_factors,
        analysis: {
          suspiciousKeywords: contentAnalysis.suspicious_keywords,
          grammarIssues: contentAnalysis.grammar_issues,
          urgencyLevel: contentAnalysis.urgency_level,
          hasFinancialRequests: contentAnalysis.financial_requests,
          hasPersonalInfoRequests: contentAnalysis.personal_info_requests,
          phishingProbability: threatAssessment.phishing_probability,
          scamProbability: threatAssessment.scam_probability,
          malwareProbability: threatAssessment.malware_probability,
          spamCategory: threatAssessment.spam_category,
        }
      };
    } catch (error) {
      console.error("Error analyzing email:", error);
      return null;
    }
  }

  private sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return '';
    }

    const sanitized = email.replace(/(ignore|disregard|forget).*(previous|above|instruction|prompt)/gi,
      '[CONTEÚDO FILTRADO]'
    );
    return sanitized.length > 3000 ? sanitized.substring(0, 3000) + "..." : sanitized;
  }

  async checkSpam(email: string): Promise<{ isSpam: boolean; reason: string; confidence: number } | null> {
    const result = await this.analyzeSpamAdvanced(email);
    if (!result) return null;

    return {
      isSpam: result.isSpam,
      reason: result.reason,
      confidence: result.confidence
    };
  }
}

export default AdvancedSpamDetector;