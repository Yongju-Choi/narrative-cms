import { prisma } from "@/lib/prisma";

/**
 * Assigns an asset to a slot. 1:1 policy enforced:
 * - New slot: creates assignment, sets slot status to "assigned"
 * - Existing assignment: replaces the asset (upsert)
 * The @unique constraint on assetSlotId in the schema enforces this at DB level.
 */
export async function assignAsset(assetSlotId: string, assetId: string) {
  const [assignment] = await prisma.$transaction([
    prisma.assetAssignment.upsert({
      where: { assetSlotId },
      create: { assetSlotId, assetId },
      update: { assetId },
    }),
    prisma.assetSlot.update({
      where: { id: assetSlotId },
      data: { status: "assigned" },
    }),
  ]);
  return assignment;
}

export async function unassignAsset(assetSlotId: string) {
  const [assignment] = await prisma.$transaction([
    prisma.assetAssignment.delete({ where: { assetSlotId } }),
    prisma.assetSlot.update({
      where: { id: assetSlotId },
      data: { status: "empty" },
    }),
  ]);
  return assignment;
}
