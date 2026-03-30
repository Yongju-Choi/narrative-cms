import { prisma } from "@/lib/prisma";

export interface PromptSpecInput {
  projectId: string;
  scriptId?: string | null;
  sequenceId?: string | null;
  sceneId?: string | null;
  premiumChoiceId?: string | null;
  assetSlotId?: string | null;
  promptType: string;
  title: string;
  intentSummary?: string | null;
  promptText: string;
  negativePrompt?: string | null;
  modelTarget?: string | null;
  aspectRatio?: string | null;
  durationSec?: number | null;
  status?: string;
  version?: number;
}

export async function createPromptSpec(data: PromptSpecInput) {
  return prisma.promptSpec.create({ data });
}

export async function listPromptSpecs(filter: {
  projectId?: string;
  sceneId?: string;
  assetSlotId?: string;
  premiumChoiceId?: string;
}) {
  return prisma.promptSpec.findMany({
    where: filter,
    orderBy: { createdAt: "desc" },
    include: {
      assetSlot: { select: { id: true, name: true, assetType: true } },
      scene: { select: { id: true, title: true } },
      sequence: { select: { id: true, title: true } },
    },
  });
}

export async function getPromptSpec(id: string) {
  return prisma.promptSpec.findUnique({
    where: { id },
    include: {
      assetSlot: { select: { id: true, name: true, assetType: true } },
      scene: { select: { id: true, title: true } },
      sequence: { select: { id: true, title: true } },
    },
  });
}

export async function updatePromptSpec(
  id: string,
  data: Partial<Omit<PromptSpecInput, "projectId">>
) {
  return prisma.promptSpec.update({ where: { id }, data });
}

export async function deletePromptSpec(id: string) {
  return prisma.promptSpec.delete({ where: { id } });
}
