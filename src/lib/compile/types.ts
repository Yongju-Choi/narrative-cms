export type CueType =
  | "dialogue"
  | "narration"
  | "action"
  | "system"
  | "choice"
  | "transition"
  | "jump_scene";

export interface ChoiceCue {
  id: string;
  label: string;
  isPremium: boolean;
  isLocked: boolean;
  price: number | null;
  nextSceneId: string | null;
  fallbackSceneId: string | null;
  unlockLabel: string | null;
}

export interface CompiledCue {
  id: string;
  orderIndex: number;
  type: CueType;
  speaker: string | null;
  content: string;
  emotionTag: string | null;
  choices: ChoiceCue[];
}

export interface CompiledAssetRef {
  slotId: string;
  slotName: string;
  slotType: string;
  assetId: string | null;
  filePath: string | null;
  displayName: string;
  isApproved: boolean;
  required: boolean;
  exists: boolean;
}

export interface SceneAssetState {
  assetsByType: {
    background?: CompiledAssetRef;
    characters?: CompiledAssetRef[];
    bgm?: CompiledAssetRef;
    messageImages?: CompiledAssetRef[];
    shortVideos?: CompiledAssetRef[];
  };
}

export interface CompiledScene {
  sceneId: string;
  sceneTitle: string;
  sequenceId: string | null;
  sequenceTitle: string | null;
  summary: string | null;
  mood: string | null;
  location: string | null;
  timeOfDay: string | null;
  orderIndex: number;
  cues: CompiledCue[];
  assets: CompiledAssetRef[];
  initialAssetState: SceneAssetState;
}

export interface CompiledSequence {
  sequenceId: string;
  sequenceTitle: string;
  orderIndex: number;
  scenes: CompiledScene[];
}

export interface CompiledScript {
  scriptId: string;
  scriptTitle: string;
  sequences: CompiledSequence[];
  scenes: CompiledScene[];
}

export interface CompiledProject {
  projectId: string;
  projectName: string;
  projectSlug: string;
  compiledAt: string;
  scripts: CompiledScript[];
}
