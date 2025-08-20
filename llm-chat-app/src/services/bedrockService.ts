import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { buildPrompt } from './lawDatabase';

interface BedrockResponse {
  text: string;
  references: Array<{
    title: string;
    section: string;
    law: string;
  }>;
}

class BedrockService {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor() {
    this.modelId = import.meta.env.VITE_BEDROCK_MODEL_ID;
    
    this.client = new BedrockRuntimeClient({
      region: import.meta.env.VITE_AWS_REGION,
      credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
      }
    });
  }

  async askQuestion(question: string): Promise<BedrockResponse> {
    try {
      const prompt = buildPrompt(question);
      
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 2000,
          messages: [{
            role: "user",
            content: prompt
          }],
          temperature: 0.1 // 一貫性のある回答のため低めに設定
        }),
        contentType: "application/json",
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      // Claude 3の応答構造
      const responseText = responseBody.content[0].text;
      
      // JSON形式の回答をパース
      try {
        const parsedResponse = JSON.parse(responseText);
        return {
          text: parsedResponse.text,
          references: parsedResponse.references || []
        };
      } catch (parseError) {
        // JSONパースに失敗した場合は、テキストをそのまま返す
        console.warn('Failed to parse JSON response:', parseError);
        return {
          text: responseText,
          references: []
        };
      }
      
    } catch (error) {
      console.error('Bedrock API error:', error);
      throw error;
    }
  }

  // 環境変数の検証
  isConfigured(): boolean {
    return !!(
      import.meta.env.VITE_AWS_REGION &&
      import.meta.env.VITE_AWS_ACCESS_KEY_ID &&
      import.meta.env.VITE_AWS_SECRET_ACCESS_KEY &&
      import.meta.env.VITE_BEDROCK_MODEL_ID
    );
  }
}

export const bedrockService = new BedrockService();
export type { BedrockResponse };