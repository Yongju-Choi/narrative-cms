import { prisma } from "@/lib/prisma";

export interface AssetSlotInput {
  name: string;
  assetType: string;
  description?: string;
  required?: boolean;
  status?: string;
  orderIndex?: number;
  sceneId?: string;
  premiumChoiceId?: string;
}

export async function createAssetSlot(data: AssetSlotInput) {
  // Validate: must connect to exactly one of sceneId or premiumChoiceId
  if (data.sceneId && data.premiumChoiceId) {
    throw new Error("AssetSlot must connect to either sceneId or premiumChoiceId, not both");
  }
  if (!data.sceneId && !data.premiumChoiceId) {
    throw new Error("AssetSlot must connect to sceneId or premiumChoiceId");
  }
  return prisma.assetSlot.create({ data });
}

export async function listAssetSlots(filter: {
  sceneId?: string;
  premiumChoiceId?: string;
}) {
  return prisma.assetSlot.findMany({
    where: filter,
    orderBy: { orderIndex: "asc" },
    include: { assignment: { include: { asset: true } } },
  });
}

export async function updateAssetSlot(id: string, data: Partial<AssetSlotInput>) {
  return prisma.assetSlot.update({ where: { id }, data });
}

export async function deleteAssetSlot(id: string) {
  return prisma.assetSlot.delete({ where: { id } });
}
