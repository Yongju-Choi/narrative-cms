import { prisma } from "@/lib/prisma";

export interface PremiumChoiceInput {
  sceneId: string;
  triggerBlockId: string;
  label: string;
  orderIndex: number;
  isPremium?: boolean;
  isLocked?: boolean;
  price?: number;
  nextSceneId?: string | null;
  fallbackSceneId?: string | null;
  unlockLabel?: string | null;
}

async function validateSceneRef(sceneId: string | null | undefined, contextSceneId: string): Promise<void> {
  if (!sceneId) return;
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: { scriptId: true },
  });
  if (!scene) throw new Error(`Scene ${sceneId} not found`);

  // Verify same script
  const contextScene = await prisma.scene.findUniqueOrThrow({
    where: { id: contextSceneId },
    select: { scriptId: true },
  });
  if (scene.scriptId !== contextScene.scriptId) {
    throw new Error("nextSceneId/fallbackSceneId must be in the same script");
  }
}

export async function createPremiumChoice(data: PremiumChoiceInput) {
  const block = await prisma.eventBlock.findUnique({
    where: { id: data.triggerBlockId },
    select: { sceneId: true },
  });
  if (!block || block.sceneId !== data.sceneId) {
    throw new Error("triggerBlockId must belong to the same scene");
  }

  await validateSceneRef(data.nextSceneId, data.sceneId);
  await validateSceneRef(data.fallbackSceneId, data.sceneId);

  return prisma.premiumChoice.create({ data });
}

export async function listPremiumChoices(sceneId: string) {
  return prisma.premiumChoice.findMany({
    where: { sceneId },
    orderBy: { orderIndex: "asc" },
    include: {
      triggerBlock: { select: { id: true, orderIndex: true, speaker: true, content: true } },
      nextScene: { select: { id: true, title: true, orderIndex: true } },
      fallbackScene: { select: { id: true, title: true, orderIndex: true } },
    },
  });
}

export async function updatePremiumChoice(
  id: string,
  data: {
    label?: string;
    orderIndex?: number;
    isPremium?: boolean;
    isLocked?: boolean;
    price?: number;
    triggerBlockId?: string;
    nextSceneId?: string | null;
    fallbackSceneId?: string | null;
    unlockLabel?: string | null;
  }
) {
  const choice = await prisma.premiumChoice.findUniqueOrThrow({ where: { id }, select: { sceneId: true } });

  if (data.triggerBlockId) {
    const block = await prisma.eventBlock.findUnique({
      where: { id: data.triggerBlockId },
      select: { sceneId: true },
    });
    if (!block || block.sceneId !== choice.sceneId) {
      throw new Error("triggerBlockId must belong to the same scene");
    }
  }

  await validateSceneRef(data.nextSceneId, choice.sceneId);
  await validateSceneRef(data.fallbackSceneId, choice.sceneId);

  return prisma.premiumChoice.update({ where: { id }, data });
}

export async function deletePremiumChoice(id: string) {
  return prisma.premiumChoice.delete({ where: { id } });
}
