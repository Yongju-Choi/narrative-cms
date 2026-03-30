import { NextRequest, NextResponse } from "next/server";
import { assignAsset, unassignAsset } from "@/lib/asset-assignment/service";

export async function POST(req: NextRequest) {
  const { assetSlotId, assetId } = await req.json();
  if (!assetSlotId || !assetId) {
    return NextResponse.json({ error: "assetSlotId and assetId required" }, { status: 400 });
  }
  return NextResponse.json(await assignAsset(assetSlotId, assetId), { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const assetSlotId = req.nextUrl.searchParams.get("assetSlotId");
  if (!assetSlotId) return NextResponse.json({ error: "assetSlotId required" }, { status: 400 });
  await unassignAsset(assetSlotId);
  return NextResponse.json({ ok: true });
}
