import type { ScriptGenerationProvider, GenerationRequest, GenerationResponse } from "./base";

export class GeminiProvider implements ScriptGenerationProvider {
  async generate(req: GenerationRequest): Promise<GenerationResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, output: "", error: "GEMINI_API_KEY not configured" };
    }

    try {
      const contents = [];
      if (req.systemPrompt) {
        contents.push({ role: "user", parts: [{ text: `[System] ${req.systemPrompt}` }] });
        contents.push({ role: "model", parts: [{ text: "Understood." }] });
      }
      contents.push({ role: "user", parts: [{ text: req.userPrompt }] });

      const model = req.modelName || "gemini-pro";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: { temperature: req.temperature },
          }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        return { success: false, output: "", error: `Gemini API error: ${res.status} ${err}` };
      }

      const data = await res.json();
      const output = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return { success: true, output };
    } catch (e: unknown) {
      return { success: false, output: "", error: e instanceof Error ? e.message : "unknown error" };
    }
  }
}
