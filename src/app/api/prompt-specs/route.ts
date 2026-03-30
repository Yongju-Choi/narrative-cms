import { NextRequest, NextResponse } from "next/server";
import {
  createPromptSpec,
  listPromptSpecs,
  getPromptSpec,
  updatePromptSpec,
  deletePromptSpec,
} from "@/lib/prompt-spec/service";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const spec = await getPromptSpec(id);
    if (!spec) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(spec);
  }

  const filter: Record<string, string> = {};
  const projectId = req.nextUrl.searchParams.get("projectId");
  const sceneId = req.nextUrl.searchParams.get("sceneId");
  const assetSlotId = req.nextUrl.searchParams.get("assetSlotId");
  if (projectId) filter.projectId = projectId;
  if (sceneId) filter.sceneId = sceneId;
  if (assetSlotId) filter.assetSlotId = assetSlotId;

  return NextResponse.json(await listPromptSpecs(filter));
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  if (!data.projectId || !data.title || !data.promptType) {
    return NextResponse.json({ error: "projectId, title, promptType required" }, { status: 400 });
  }
  return NextResponse.json(await createPromptSpec({ promptText: "", ...data }), { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  return NextResponse.json(await updatePromptSpec(id, data));
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deletePromptSpec(id);
  return NextResponse.json({ ok: true });
}
