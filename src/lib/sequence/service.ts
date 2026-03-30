import { prisma } from "@/lib/prisma";

export interface SequenceInput {
  title: string;
  summary?: string;
  orderIndex: number;
  directionSummary?: string | null;
  moodKeywords?: string | null;
  visualNotes?: string | null;
}

export async function createSequence(scriptId: string, data: SequenceInput) {
  return prisma.sequence.create({
    data: { scriptId, ...data },
  });
}

export async function listSequences(scriptId: string) {
  return prisma.sequence.findMany({
    where: { scriptId },
    orderBy: { orderIndex: "asc" },
    include: {
      _count: { select: { scenes: true } },
    },
  });
}

export async function getSequence(id: string) {
  return prisma.sequence.findUnique({
    where: { id },
    include: {
      scenes: { orderBy: { orderIndex: "asc" } },
    },
  });
}

export async function updateSequence(id: string, data: Partial<SequenceInput>) {
  return prisma.sequence.update({ where: { id }, data });
}

export async function deleteSequence(id: string) {
  // Block deletion if sequence has scenes
  const count = await prisma.scene.count({ where: { sequenceId: id } });
  if (count > 0) {
    throw new Error(`시퀀스에 ${count}개의 씬이 있어 삭제할 수 없습니다. 씬을 먼저 이동하거나 삭제하세요.`);
  }
  return prisma.sequence.delete({ where: { id } });
}

/**
 * Ensures every script has at least one default sequence.
 * Assigns orphan scenes (sequenceId is null) to the default sequence.
 */
export async function ensureDefaultSequence(scriptId: string) {
  let defaultSeq = await prisma.sequence.findFirst({
    where: { scriptId },
    orderBy: { orderIndex: "asc" },
  });

  if (!defaultSeq) {
    defaultSeq = await prisma.sequence.create({
      data: { scriptId, title: "기본 시퀀스", orderIndex: 0 },
    });
  }

  // Assign orphan scenes
  await prisma.scene.updateMany({
    where: { scriptId, sequenceId: null },
    data: { sequenceId: defaultSeq.id },
  });

  return defaultSeq;
}
