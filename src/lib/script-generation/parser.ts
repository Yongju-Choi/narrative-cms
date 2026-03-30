/**
 * Script generation output parser.
 *
 * Converts raw LLM output text into a structured intermediate format.
 * Currently a placeholder — actual parsing logic depends on the prompt
 * template used during generation and the expected output format.
 *
 * parsedOutput is stored as JSON text in ScriptGeneration.parsedOutput.
 */

export interface ParsedScene {
  title: string;
  location: string | null;
  timeOfDay: string | null;
  dialogues: ParsedDialogue[];
  choices: ParsedChoice[];
}

export interface ParsedDialogue {
  speaker: string | null;
  content: string;
  type: "dialogue" | "narration" | "action" | "system";
  emotionTag: string | null;
}

export interface ParsedChoice {
  label: string;
  nextSceneTitle: string | null;
}

export interface ParsedScript {
  scenes: ParsedScene[];
  warnings: string[];
}

/**
 * Parse raw LLM output into structured format.
 * Currently returns empty structure — implement when prompt templates are finalized.
 *
 * Potential approaches:
 *   1. Regex-based extraction for [Scene], [선택지] markers
 *   2. JSON mode output (if provider supports structured output)
 *   3. Markdown section parsing
 */
export function parseRawOutput(rawOutput: string): ParsedScript {
  return {
    scenes: [],
    warnings: [`Parser not yet implemented. Raw output length: ${rawOutput.length} chars.`],
  };
}

/**
 * Serialize parsed output to JSON string for storage in parsedOutput field.
 */
export function serializeParsedOutput(parsed: ParsedScript): string {
  return JSON.stringify(parsed);
}
