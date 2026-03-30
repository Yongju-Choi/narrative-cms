import type { ScriptGenerationProvider } from "./base";
import { MockProvider } from "./mock";
import { OpenAIProvider } from "./openai";
import { GeminiProvider } from "./gemini";
import { GrokProvider } from "./grok";

export function getProvider(name: string): ScriptGenerationProvider {
  switch (name) {
    case "openai":
      return new OpenAIProvider();
    case "gemini":
      return new GeminiProvider();
    case "grok":
      return new GrokProvider();
    case "mock":
      return new MockProvider();
    default:
      return new MockProvider();
  }
}
