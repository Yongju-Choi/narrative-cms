import type { ScriptGenerationProvider, GenerationRequest, GenerationResponse } from "./base";

export class MockProvider implements ScriptGenerationProvider {
  async generate(req: GenerationRequest): Promise<GenerationResponse> {
    // Simulate delay
    await new Promise((r) => setTimeout(r, 500));

    const output = [
      `[Generated Script — ${req.modelName}]`,
      ``,
      `System: ${req.systemPrompt || "(none)"}`,
      `User: ${req.userPrompt}`,
      `Temperature: ${req.temperature}`,
      ``,
      `--- GENERATED CONTENT ---`,
      ``,
      `[Scene 1: 첫 만남]`,
      `장소: 대학교 도서관`,
      `시간: 오후 3시`,
      ``,
      `(내레이션) 조용한 도서관, 창가 자리에서 책을 읽고 있는 주인공.`,
      ``,
      `유진: (작은 목소리로) 저기... 혹시 이 자리 비어있나요?`,
      `주인공: 네, 앉으세요.`,
      `유진: 감사합니다. (미소)`,
      ``,
      `(내레이션) 유진이 자리에 앉으며 살짝 미소 짓는다.`,
      ``,
      `[선택지]`,
      `A. "이름이 뭐예요?" → Scene 2`,
      `B. (조용히 책을 계속 읽는다) → Scene 3`,
      ``,
      `[Scene 2: 대화의 시작]`,
      `유진: 저는 유진이에요. 같은 과인 것 같은데...`,
      `주인공: 아, 그래요? 저는 ${req.userPrompt.slice(0, 10)}...`,
      ``,
      `--- END ---`,
    ].join("\n");

    return { success: true, output };
  }
}
