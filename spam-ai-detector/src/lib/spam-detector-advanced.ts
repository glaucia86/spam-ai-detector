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
      `You are an expert in cyber security and spam detection with years of experience.
      
      Analyze the following email and determine if it is spam, considering:
      - Suspicious links or dangerous attachments
      - Suspicious or urgent language
      - Unrealistic or too good to be true offers 
      - Requests for personal or financial information
      - Excessive grammatical or spelling errors
      - Unreliable senders
      - Any other warning signs

      EMAIL FOR ANALYSIS:
      ---
      {email_content}
      ---

      IMPORTANT INSTRUCTIONS:
      - Be precise and detailed in your analysis
      - Clearly explain the reasons for your decision
      - Consider the Brazilian cultural context
      - Identify specific spam categories if applicable

      FOCUS ON: 
      - Typical spam keywords (URGENT, WIN, FREE, etc.)
      - Quality of writing and grammar
      - Level of urgency conveyed
      - Financial or personal data requests

      {format_instructions}
      `
    );

    return prompt.pipe(this.llm).pipe(this.contentAnalysisParser);
  }

  private createThreatAssesmentChain() {
    const prompt = PromptTemplate.fromTemplate(
      `Based on the content analysis, evaluate the potential THREATS:

      CONTENT ANALYSIS:
      {content_analysis}

      ORIGINAL EMAIL:
      {email_content}

      Assess probabilities of:
      - Phishing (theft of credentials)
      - Financial scams
      - Malware (viruses, ransomware) and malicious and suspicious links
      - Specific spam category (financial, pharmaceutical, romance, tech support, lottery, phishing)

      {format_instructions}`
    );

    return prompt.pipe(this.llm).pipe(this.threatAssessmentParser);
  }

  private createFinalDecisionChain() {
    const prompt = PromptTemplate.fromTemplate(
      `Make the FINAL DECISION based on all the analyses:

      CONTENT ANALYSIS:
      {content_analysis}

      THREAT ASSESSMENT:
      {threat_assessment}

      ORIGINAL EMAIL:
      {email_content}

      Provide:
      - Final decision (spam or not)
      - Confidence level
      - Clear explanation in English
      - Recommended action for the user
      - Specific risk factors identified
      
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