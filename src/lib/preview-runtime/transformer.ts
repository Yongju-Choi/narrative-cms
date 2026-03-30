import type { AssetRef, ChoiceCue, PreviewCue, ScenePreviewData } from "./types";

/**
 * Scene 에디터 데이터를 프리뷰용 cue 배열로 변환한다.
 * EventBlock을 orderIndex 순으로 정렬하고,
 * triggerBlockId가 일치하는 PremiumChoice를 해당 cue의 choices에 삽입한다.
 */
export function transformSceneToPreview(scene: {
  id: string;
  title: string;
  eventBlocks: {
    id: string;
    orderIndex: number;
    type: string;
    speaker: string | null;
    content: string;
    emotionTag: string | null;
  }[];
  premiumChoices: {
    id: string;
    triggerBlockId: string;
    label: string;
    isPremium: boolean;
    price: number | null;
    orderIndex: number;
  }[];
  assetSlots: {
    id: string;
    name: string;
    assetType: string;
    assignment?: { asset: { id: string; filePath: string } } | null;
  }[];
}): ScenePreviewData {
  // Group premium choices by triggerBlockId
  const choicesByBlock = new Map<string, ChoiceCue[]>();
  for (const pc of scene.premiumChoices) {
    const arr = choicesByBlock.get(pc.triggerBlockId) || [];
    arr.push({
      id: pc.id,
      label: pc.label,
      isPremium: pc.isPremium,
      price: pc.price,
    });
    choicesByBlock.set(pc.triggerBlockId, arr);
  }

  // Sort event blocks and build cues
  const sorted = [...scene.eventBlocks].sort((a, b) => a.orderIndex - b.orderIndex);

  const cues: PreviewCue[] = [];
  for (const eb of sorted) {
    // Add the event block as a cue
    cues.push({
      id: eb.id,
      orderIndex: eb.orderIndex,
      type: eb.type === "choice_trigger" ? "choice" : (eb.type as PreviewCue["type"]),
      speaker: eb.speaker,
      content: eb.content,
      emotionTag: eb.emotionTag,
      choices: [],
    });

    // If there are choices triggered by this block, add a choice cue
    const choices = choicesByBlock.get(eb.id);
    if (choices && choices.length > 0) {
      cues.push({
        id: `choice_${eb.id}`,
        orderIndex: eb.orderIndex + 0.5,
        type: "choice",
        speaker: null,
        content: "",
        emotionTag: null,
        choices,
      });
    }
  }

  const assets: AssetRef[] = scene.assetSlots.map((s) => ({
    slotId: s.id,
    slotName: s.name,
    slotType: s.assetType,
    assetId: s.assignment?.asset.id ?? null,
    filePath: s.assignment?.asset.filePath ?? null,
  }));

  return {
    sceneId: scene.id,
    sceneTitle: scene.title,
    cues,
    assets,
  };
}
