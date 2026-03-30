import { prisma } from "@/lib/prisma";
import { getProvider } from "./providers";

export interface ScriptGenerationInput {
  projectId: string;
  provider: string;
  modelName: string;
  userPrompt: string;
  systemPrompt?: string | null;
  temperature?: number;
}

export async function createGeneration(data: ScriptGenerationInput) {
  return prisma.scriptGeneration.create({
    data: {
      projectId: data.projectId,
      provider: data.provider,
      modelName: data.modelName,
      userPrompt: data.userPrompt,
      systemPrompt: data.systemPrompt || null,
      temperature: data.temperature ?? 0.7,
      status: "draft",
    },
  });
}

export async function executeGeneration(id: string) {
  const gen = await prisma.scriptGeneration.findUniqueOrThrow({ where: { id } });

  if (!gen.provider || !gen.modelName) {
    throw new Error("provider and modelName are required");
  }

  const provider = getProvider(gen.provider);
  const result = await provider.generate({
    provider: gen.provider,
    modelName: gen.modelName,
    systemPrompt: gen.systemPrompt,
    userPrompt: gen.userPrompt,
    temperature: gen.temperature,
  });

  if (result.success) {
    return prisma.scriptGeneration.update({
      where: { id },
      data: { rawOutput: result.output, status: "generated" },
    });
  } else {
    return prisma.scriptGeneration.update({
      where: { id },
      data: { status: "failed", errorMessage: result.error || "Unknown error" },
    });
  }
}

export async function listGenerations(projectId: string) {
  return prisma.scriptGeneration.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      importedScripts: { select: { id: true, title: true } },
    },
  });
}

export async function getGeneration(id: string) {
  return prisma.scriptGeneration.findUnique({
    where: { id },
    include: {
      importedScripts: { select: { id: true, title: true } },
    },
  });
}

export async function importGenerationAsScript(generationId: string, title: string) {
  const gen = await prisma.scriptGeneration.findUniqueOrThrow({ where: { id: generationId } });

  if (!gen.rawOutput) {
    throw new Error("No rawOutput to import");
  }

  const script = await prisma.script.create({
    data: {
      projectId: gen.projectId,
      title,
      rawText: gen.rawOutput,
      sourceGenerationId: gen.id,
    },
  });

  await prisma.scriptGeneration.update({
    where: { id: generationId },
    data: { status: "imported" },
  });

  return script;
}

export async function deleteGeneration(id: string) {
  return prisma.scriptGeneration.delete({ where: { id } });
}
