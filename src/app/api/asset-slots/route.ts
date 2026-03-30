import { NextRequest, NextResponse } from "next/server";
import {
  createAssetSlot,
  listAssetSlots,
  updateAssetSlot,
  deleteAssetSlot,
} from "@/lib/asset-slot/service";

export async function GET(req: NextRequest) {
  const sceneId = req.nextUrl.searchParams.get("sceneId");
  const premiumChoiceId = req.nextUrl.searchParams.get("premiumChoiceId");

  const filter: Record<string, string> = {};
  if (sceneId) filter.sceneId = sceneId;
  if (premiumChoiceId) filter.premiumChoiceId = premiumChoiceId;

  return NextResponse.json(await listAssetSlots(filter));
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  if (!data.name || !data.assetType) {
    return NextResponse.json({ error: "name and assetType required" }, { status: 400 });
  }
  try {
    return NextResponse.json(await createAssetSlot(data), { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  return NextResponse.json(await updateAssetSlot(id, data));
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteAssetSlot(id);
  return NextResponse.json({ ok: true });
}
