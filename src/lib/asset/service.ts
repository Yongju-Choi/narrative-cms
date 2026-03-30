import { prisma } from "@/lib/prisma";

export async function createAsset(data: {
  projectId: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
}) {
  return prisma.asset.create({ data });
}

export async function listAssets(projectId: string) {
  return prisma.asset.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAsset(id: string) {
  return prisma.asset.findUnique({ where: { id } });
}

export async function updateAssetStatus(id: string, status: string) {
  return prisma.asset.update({ where: { id }, data: { status } });
}

export async function deleteAsset(id: string) {
  return prisma.asset.delete({ where: { id } });
}
