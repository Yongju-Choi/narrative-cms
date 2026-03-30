import type { ScriptGenerationProvider, GenerationRequest, GenerationResponse } from "./base";

export class GrokProvider implements ScriptGenerationProvider {
  async generate(req: GenerationRequest): Promise<GenerationResponse> {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) {
      return { success: false, output: "", error: "GROK_API_KEY not configured" };
    }

    try {
      const messages = [];
      if (req.systemPrompt) {
        messages.push({ role: "system", content: req.systemPrompt });
      }
      messages.push({ role: "user", content: req.userPrompt });

      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: req.modelName || "grok-3",
          messages,
          temperature: req.temperature,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { success: false, output: "", error: `Grok API error: ${res.status} ${err}` };
      }

      const data = await res.json();
      const output = data.choices?.[0]?.message?.content || "";
      return { success: true, output };
    } catch (e: unknown) {
      return { success: false, output: "", error: e instanceof Error ? e.message : "unknown error" };
    }
  }
}
