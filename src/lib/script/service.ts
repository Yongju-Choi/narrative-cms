import { prisma } from "@/lib/prisma";

export async function createScript(projectId: string, title: string, rawText: string) {
  return prisma.script.create({
    data: { projectId, title, rawText },
  });
}

export async function getScript(id: string) {
  return prisma.script.findUnique({
    where: { id },
    include: {
      scenes: { orderBy: { orderIndex: "asc" } },
    },
  });
}

export async function updateScript(id: string, data: { title?: string; rawText?: string }) {
  return prisma.script.update({ where: { id }, data });
}

export async function deleteScript(id: string) {
  return prisma.script.delete({ where: { id } });
}
