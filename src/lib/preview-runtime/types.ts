export type CueType = "dialogue" | "narration" | "action" | "system" | "choice";

export interface AssetRef {
  slotId: string;
  slotName: string;
  slotType: string;
  assetId: string | null;
  filePath: string | null;
}

export interface ChoiceCue {
  id: string;
  label: string;
  isPremium: boolean;
  price: number | null;
}

export interface PreviewCue {
  id: string;
  orderIndex: number;
  type: CueType;
  speaker: string | null;
  content: string;
  emotionTag: string | null;
  choices: ChoiceCue[];
}

export interface ScenePreviewData {
  sceneId: string;
  sceneTitle: string;
  cues: PreviewCue[];
  assets: AssetRef[];
}
