import { prisma } from "@/lib/prisma";

export interface EventBlockInput {
  orderIndex: number;
  type: string;
  speaker?: string;
  content: string;
  emotionTag?: string;
  metadata?: string;
}

export async function createEventBlock(sceneId: string, data: EventBlockInput) {
  return prisma.eventBlock.create({
    data: { sceneId, ...data },
  });
}

export async function listEventBlocks(sceneId: string) {
  return prisma.eventBlock.findMany({
    where: { sceneId },
    orderBy: { orderIndex: "asc" },
  });
}

export async function getEventBlock(id: string) {
  return prisma.eventBlock.findUnique({
    where: { id },
    include: {
      premiumChoices: { orderBy: { orderIndex: "asc" } },
    },
  });
}

export async function updateEventBlock(id: string, data: Partial<EventBlockInput>) {
  return prisma.eventBlock.update({ where: { id }, data });
}

export async function deleteEventBlock(id: string) {
  return prisma.eventBlock.delete({ where: { id } });
}
