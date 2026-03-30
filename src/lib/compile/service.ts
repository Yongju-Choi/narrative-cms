import fs from "fs/promises";
import { prisma } from "@/lib/prisma";
import type {
  ChoiceCue,
  CompiledAssetRef,
  CompiledCue,
  CompiledProject,
  CompiledScene,
  CompiledScript,
  CompiledSequence,
  SceneAssetState,
} from "./types";

interface EventBlockData {
  id: string;
  orderIndex: number;
  type: string;
  speaker: string | null;
  content: string;
  emotionTag: string | null;
}

interface PremiumChoiceData {
  id: string;
  triggerBlockId: string;
  label: string;
  isPremium: boolean;
  isLocked: boolean;
  price: number | null;
  nextSceneId: string | null;
  fallbackSceneId: string | null;
  unlockLabel: string | null;
}

interface AssetSlotData {
  id: string;
  name: string;
  assetType: string;
  required: boolean;
  assignment?: { asset: { id: string; filePath: string; fileName: string; status: string } } | null;
}

function buildCueArray(
  eventBlocks: EventBlockData[],
  premiumChoices: PremiumChoiceData[]
): CompiledCue[] {
  const choicesByBlock = new Map<string, ChoiceCue[]>();
  for (const pc of premiumChoices) {
    const arr = choicesByBlock.get(pc.triggerBlockId) || [];
    arr.push({
      id: pc.id,
      label: pc.label,
      isPremium: pc.isPremium,
      isLocked: pc.isLocked,
      price: pc.price,
      nextSceneId: pc.nextSceneId,
      fallbackSceneId: pc.fallbackSceneId,
      unlockLabel: pc.unlockLabel,
    });
    choicesByBlock.set(pc.triggerBlockId, arr);
  }

  const sorted = [...eventBlocks].sort((a, b) => a.orderIndex - b.orderIndex);
  const cues: CompiledCue[] = [];

  for (const eb of sorted) {
    cues.push({
      id: eb.id,
      orderIndex: eb.orderIndex,
      type: eb.type === "choice_trigger" ? "choice" : (eb.type as CompiledCue["type"]),
      speaker: eb.speaker,
      content: eb.content,
      emotionTag: eb.emotionTag,
      choices: [],
    });

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

  return cues;
}

async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function buildAssetRefs(slots: AssetSlotData[]): Promise<CompiledAssetRef[]> {
  return Promise.all(
    slots.map(async (s) => {
      const filePath = s.assignment?.asset.filePath ?? null;
      return {
        slotId: s.id,
        slotName: s.name,
        slotType: s.assetType,
        assetId: s.assignment?.asset.id ?? null,
        filePath,
        displayName: s.assignment?.asset.fileName ?? s.name,
        isApproved: s.assignment?.asset.status === "approved",
        required: s.required,
        exists: filePath ? await checkFileExists(filePath) : false,
      };
    })
  );
}

function buildInitialAssetState(assets: CompiledAssetRef[]): SceneAssetState {
  const assigned = assets.filter((a) => a.assetId);
  const bg = assigned.find((a) => a.slotType === "background");
  const chars = assigned.filter((a) => a.slotType === "character");
  const bgm = assigned.find((a) => a.slotType === "bgm");
  const imgs = assigned.filter((a) => a.slotType === "message_image");
  const vids = assigned.filter((a) => a.slotType === "short_video");

  return {
    assetsByType: {
      ...(bg ? { background: bg } : {}),
      ...(chars.length > 0 ? { characters: chars } : {}),
      ...(bgm ? { bgm } : {}),
      ...(imgs.length > 0 ? { messageImages: imgs } : {}),
      ...(vids.length > 0 ? { shortVideos: vids } : {}),
    },
  };
}

interface SceneWithRelations {
  id: string;
  title: string;
  sequenceId: string | null;
  summary: string | null;
  mood: string | null;
  location: string | null;
  timeOfDay: string | null;
  orderIndex: number;
  sequence?: { id: string; title: string } | null;
  eventBlocks: EventBlockData[];
  premiumChoices: PremiumChoiceData[];
  assetSlots: AssetSlotData[];
}

async function compileSceneFromData(scene: SceneWithRelations): Promise<CompiledScene> {
  const cues = buildCueArray(scene.eventBlocks, scene.premiumChoices);
  const assets = await buildAssetRefs(scene.assetSlots);
  return {
    sceneId: scene.id,
    sceneTitle: scene.title,
    sequenceId: scene.sequenceId,
    sequenceTitle: scene.sequence?.title ?? null,
    summary: scene.summary,
    mood: scene.mood,
    location: scene.location,
    timeOfDay: scene.timeOfDay,
    orderIndex: scene.orderIndex,
    cues,
    assets,
    initialAssetState: buildInitialAssetState(assets),
  };
}

export async function compileScenePlayback(sceneId: string): Promise<CompiledScene> {
  const scene = await prisma.scene.findUniqueOrThrow({
    where: { id: sceneId },
    include: {
      sequence: { select: { id: true, title: true } },
      eventBlocks: { orderBy: { orderIndex: "asc" } },
      premiumChoices: { orderBy: { orderIndex: "asc" } },
      assetSlots: {
        orderBy: { orderIndex: "asc" },
        include: { assignment: { include: { asset: true } } },
      },
    },
  });
  return compileSceneFromData(scene);
}

export async function compileScriptPlayback(scriptId: string): Promise<CompiledScript> {
  const script = await prisma.script.findUniqueOrThrow({
    where: { id: scriptId },
    include: {
      sequences: { orderBy: { orderIndex: "asc" } },
      scenes: {
        orderBy: { orderIndex: "asc" },
        include: {
          sequence: { select: { id: true, title: true } },
          eventBlocks: { orderBy: { orderIndex: "asc" } },
          premiumChoices: { orderBy: { orderIndex: "asc" } },
          assetSlots: {
            orderBy: { orderIndex: "asc" },
            include: { assignment: { include: { asset: true } } },
          },
        },
      },
    },
  });

  const scenes = await Promise.all(script.scenes.map(compileSceneFromData));

  const sequences: CompiledSequence[] = script.sequences.map((seq: { id: string; title: string; orderIndex: number }) => ({
    sequenceId: seq.id,
    sequenceTitle: seq.title,
    orderIndex: seq.orderIndex,
    scenes: scenes.filter((s) => s.sequenceId === seq.id),
  }));

  return {
    scriptId: script.id,
    scriptTitle: script.title,
    sequences,
    scenes,
  };
}

export async function compileProjectRuntime(projectId: string): Promise<CompiledProject> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      scripts: {
        orderBy: { createdAt: "asc" },
        include: {
          sequences: { orderBy: { orderIndex: "asc" } },
          scenes: {
            orderBy: { orderIndex: "asc" },
            include: {
              sequence: { select: { id: true, title: true } },
              eventBlocks: { orderBy: { orderIndex: "asc" } },
              premiumChoices: { orderBy: { orderIndex: "asc" } },
              assetSlots: {
                orderBy: { orderIndex: "asc" },
                include: { assignment: { include: { asset: true } } },
              },
            },
          },
        },
      },
    },
  });

  const scripts: CompiledScript[] = await Promise.all(
    project.scripts.map(async (script: { id: string; title: string; sequences: { id: string; title: string; orderIndex: number }[]; scenes: SceneWithRelations[] }) => {
      const scenes = await Promise.all(script.scenes.map(compileSceneFromData));
      const sequences: CompiledSequence[] = script.sequences.map((seq: { id: string; title: string; orderIndex: number }) => ({
        sequenceId: seq.id,
        sequenceTitle: seq.title,
        orderIndex: seq.orderIndex,
        scenes: scenes.filter((s) => s.sequenceId === seq.id),
      }));
      return { scriptId: script.id, scriptTitle: script.title, sequences, scenes };
    })
  );

  return {
    projectId: project.id,
    projectName: project.name,
    projectSlug: project.slug,
    compiledAt: new Date().toISOString(),
    scripts,
  };
}
