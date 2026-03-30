import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/utils/slug";
import { createSceneFolders } from "./folder";

export interface SceneInput {
  title: string;
  summary?: string;
  mood?: string;
  location?: string;
  timeOfDay?: string;
  orderIndex: number;
  sequenceId?: string;
}

export async function createScene(scriptId: string, data: SceneInput) {
  const scene = await prisma.scene.create({
    data: { scriptId, ...data },
  });

  // Create scene folders
  const script = await prisma.script.findUniqueOrThrow({
    where: { id: scriptId },
    select: { project: { select: { slug: true } } },
  });

  await createSceneFolders(
    script.project.slug,
    data.orderIndex,
    data.title,
    scene.id
  );

  return scene;
}

export async function listScenes(scriptId: string) {
  return prisma.scene.findMany({
    where: { scriptId },
    orderBy: { orderIndex: "asc" },
    include: {
      sequence: { select: { id: true, title: true, orderIndex: true } },
      _count: { select: { eventBlocks: true, premiumChoices: true, assetSlots: true } },
    },
  });
}

export async function getScene(id: string) {
  return prisma.scene.findUnique({
    where: { id },
    include: {
      eventBlocks: { orderBy: { orderIndex: "asc" } },
      premiumChoices: {
        orderBy: { orderIndex: "asc" },
        include: {
          triggerBlock: { select: { id: true, orderIndex: true, speaker: true, content: true } },
          nextScene: { select: { id: true, title: true, orderIndex: true } },
          fallbackScene: { select: { id: true, title: true, orderIndex: true } },
        },
      },
      assetSlots: {
        orderBy: { orderIndex: "asc" },
        include: { assignment: { include: { asset: true } } },
      },
    },
  });
}

export async function updateScene(id: string, data: Partial<SceneInput>) {
  return prisma.scene.update({ where: { id }, data });
}

export async function deleteScene(id: string) {
  return prisma.scene.delete({ where: { id } });
}
