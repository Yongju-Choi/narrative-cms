export interface GenerationRequest {
  provider: string;
  modelName: string;
  systemPrompt: string | null;
  userPrompt: string;
  temperature: number;
}

export interface GenerationResponse {
  success: boolean;
  output: string;
  error?: string;
}

export interface ScriptGenerationProvider {
  generate(req: GenerationRequest): Promise<GenerationResponse>;
}
