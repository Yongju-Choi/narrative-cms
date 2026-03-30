import { NextRequest, NextResponse } from "next/server";
import {
  createPremiumChoice,
  listPremiumChoices,
  updatePremiumChoice,
  deletePremiumChoice,
} from "@/lib/premium-choice/service";

export async function GET(req: NextRequest) {
  const sceneId = req.nextUrl.searchParams.get("sceneId");
  if (!sceneId) return NextResponse.json({ error: "sceneId required" }, { status: 400 });
  return NextResponse.json(await listPremiumChoices(sceneId));
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  if (!data.sceneId || !data.triggerBlockId || !data.label) {
    return NextResponse.json({ error: "sceneId, triggerBlockId, label required" }, { status: 400 });
  }
  try {
    return NextResponse.json(await createPremiumChoice({ orderIndex: 0, ...data }), { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    return NextResponse.json(await updatePremiumChoice(id, data));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deletePremiumChoice(id);
  return NextResponse.json({ ok: true });
}
