import { prisma } from "@/lib/prisma";

export interface PromptPresetInput {
  projectId?: string | null;
  name: string;
  presetType: string;
  content: string;
  description?: string | null;
}

export async function createPromptPreset(data: PromptPresetInput) {
  return prisma.promptPreset.create({ data });
}

export async function listPromptPresets(projectId?: string) {
  return prisma.promptPreset.findMany({
    where: projectId ? {
      OR: [{ projectId }, { projectId: null }],
    } : {},
    orderBy: [{ presetType: "asc" }, { name: "asc" }],
  });
}

export async function updatePromptPreset(id: string, data: Partial<PromptPresetInput>) {
  return prisma.promptPreset.update({ where: { id }, data });
}

export async function deletePromptPreset(id: string) {
  return prisma.promptPreset.delete({ where: { id } });
}
