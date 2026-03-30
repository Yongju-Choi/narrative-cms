import { NextRequest, NextResponse } from "next/server";
import {
  createSequence,
  listSequences,
  updateSequence,
  deleteSequence,
  ensureDefaultSequence,
} from "@/lib/sequence/service";

export async function GET(req: NextRequest) {
  const scriptId = req.nextUrl.searchParams.get("scriptId");
  if (!scriptId) return NextResponse.json({ error: "scriptId required" }, { status: 400 });

  // Ensure default sequence exists and orphan scenes are assigned
  await ensureDefaultSequence(scriptId);

  return NextResponse.json(await listSequences(scriptId));
}

export async function POST(req: NextRequest) {
  const { scriptId, ...data } = await req.json();
  if (!scriptId || !data.title) return NextResponse.json({ error: "scriptId and title required" }, { status: 400 });
  const seq = await createSequence(scriptId, { orderIndex: 0, ...data });
  return NextResponse.json(seq, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  return NextResponse.json(await updateSequence(id, data));
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await deleteSequence(id);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
