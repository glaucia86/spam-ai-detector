import ModelClient, { isUnexpected } from '@azure-rest/ai-inference'; 
import { AzureKeyCredential } from '@azure/core-auth';
import * as dotenv from 'dotenv';

dotenv.config();

export interface SpamResult {
  isSpam: boolean;
  reason: string;
  confidence?: number;
}

interface SpamAnalysisResponse {
  is_spam: boolean;
  reason: string;
  confidence?: number;
}

export class SpamDetector {
  private client: any;
  private modelName: string;
  private logger: Console;

  constructor(
    token?: string, 
    endpoint?: string, 
    modelName: string = 'xai/grok-3'
  ) {
    const authToken = token || process.env.GROK_GITHUB_MODEL_TOKEN;
    const modelEndpoint = endpoint || process.env.GROK_GITHUB_MODEL_ENDPOINT || '';

    if (!authToken) {
      throw new Error('Authentication token not found. Check the GROK_GITHUB_MODEL_TOKEN environment variable.');
    }

    if (!modelEndpoint) {
      throw new Error('Endpoint not found. Check the GROK_GITHUB_MODEL_ENDPOINT environment variable.');
    }

    this.client = ModelClient(
      modelEndpoint,
      new AzureKeyCredential(authToken)
    );
    this.modelName = modelName;
    this.logger = console;
  }

  private sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return '';
    }

    const sanitized = email.replace(
      /(ignore|disregard).*(previous|above|instruction)/gi,
      '[FILTERED]'
    );

    return sanitized.length > 2000 ? sanitized.substring(0, 2000) : sanitized;
  }

  private createSystemPrompt(): string {
    return `You are an expert in spam detection. Analyze emails and determine whether they are spam or not.

    IMPORTANT: ONLY reply with a valid JSON object. Do not include any other text.

    Required JSON format:
    {
      "is_spam": boolean,
      "reason": "detailed explanation in Portuguese",
      "confidence": float between 0.0 and 1.0
    }`;
  }

  private createUserPrompt(email: string): string {
    const sanitizedEmail = this.sanitizeEmail(email);

    return `Analyze the content of the following email to determine if it is spam:

    ---
    ${sanitizedEmail}
    ---

    Respond only with the JSON in the specified format:`;
  }

  private isValidResponse(data: any): data is SpamAnalysisResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.is_spam === 'boolean' &&
      typeof data.reason === 'string'
    );
  }

  private extractJsonFromResponse(content: string): SpamAnalysisResponse | null {
    try {
      const parsed = JSON.parse(content.trim());
      if (this.isValidResponse(parsed)) {
        return parsed;
      }
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (this.isValidResponse(parsed)) {
            return parsed;
          }
        } catch {
          throw new Error('Failed to extract JSON from response');
        }
      }
    }
    return null;
  }

  async checkSpam(
    email: string, 
    maxRetries: number = 2
  ): Promise<SpamResult | null> {
    if (!email || typeof email !== 'string') {
      this.logger.warn('Invalid email input provided');
      return null;
    }

    if (!email.trim()) {
      return {
        isSpam: false,
        reason: 'Empty email content',
        confidence: 1.0
      };
    }

    const systemPrompt = this.createSystemPrompt();
    const userPrompt = this.createUserPrompt(email);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.path("/chat/completions").post({
          body: {
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.1,
            top_p: 0.9,
            max_tokens: 300,  
            model: this.modelName,
          }
        });

        if (isUnexpected(response)) {
          throw new Error(`Erro from API GitHub Models: ${JSON.stringify(response.body.error)}`);
        }

        const responseContent = response.body.choices[0]?.message?.content;
        if (!responseContent) {
          this.logger.error('Empty API response');
          continue;
        }

        const parsedResponse = this.extractJsonFromResponse(responseContent);
        if (!parsedResponse) {
          this.logger.error('Failed to parse JSON response');
          this.logger.debug('Raw response:', responseContent);

          if (attempt < maxRetries) {
            continue;
          }
          break;
        }

        return {
          isSpam: parsedResponse.is_spam,
          reason: parsedResponse.reason,
          confidence: parsedResponse.confidence ?? 0.5
        };

      } catch (error) {
        this.logger.error('Error calling API:', error);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
      }
    }

    this.logger.error('Failed to obtain valid response after all attempts');
    return null;
  }

  async checkMultipleEmails(emails: string[]): Promise<(SpamResult | null)[]> {
    const results = await Promise.allSettled(
      emails.map(email => this.checkSpam(email))
    );

    return results.map(result => 
      result.status === 'fulfilled' ? result.value : null
    );
  }
}

export class SpamStats {
  private results: SpamResult[] = [];

  addResult(result: SpamResult): void {
    this.results.push(result);
  }

  getStats() {
    const total = this.results.length;
    const spamCount = this.results.filter(r => r.isSpam).length;
    const avgConfidence = this.results.reduce((sum, r) => sum + (r.confidence ?? 0), 0) / total;

    return {
      total,
      spamCount,
      hamCount: total - spamCount,
      spamRate: total > 0 ? (spamCount / total) * 100 : 0,
      averageConfidence: avgConfidence
    };
  }
}

async function main() {
  const detector = new SpamDetector();
  
  const email = "hi how r u bro i have million dollar deal just sign here";
  const res = await detector.checkSpam(email);
  
  if (res) {
    console.log(JSON.stringify(res, null, 2));
  }
}

main()
  .then(() => console.log("Test completed"))
  .catch(error => console.error("Erro:", error));

export default SpamDetector;