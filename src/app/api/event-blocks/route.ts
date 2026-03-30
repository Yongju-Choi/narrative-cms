import { NextRequest, NextResponse } from "next/server";
import {
  createEventBlock,
  listEventBlocks,
  getEventBlock,
  updateEventBlock,
  deleteEventBlock,
} from "@/lib/event-block/service";

export async function GET(req: NextRequest) {
  const sceneId = req.nextUrl.searchParams.get("sceneId");
  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const eb = await getEventBlock(id);
    if (!eb) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(eb);
  }

  if (!sceneId) return NextResponse.json({ error: "sceneId required" }, { status: 400 });
  return NextResponse.json(await listEventBlocks(sceneId));
}

export async function POST(req: NextRequest) {
  const { sceneId, ...data } = await req.json();
  if (!sceneId || !data.content) return NextResponse.json({ error: "sceneId and content required" }, { status: 400 });
  const eb = await createEventBlock(sceneId, { orderIndex: 0, type: "dialogue", ...data });
  return NextResponse.json(eb, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  return NextResponse.json(await updateEventBlock(id, data));
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteEventBlock(id);
  return NextResponse.json({ ok: true });
}
