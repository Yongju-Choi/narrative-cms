import { NextRequest, NextResponse } from "next/server";
import { createScene, listScenes, getScene, updateScene, deleteScene } from "@/lib/scene/service";

export async function GET(req: NextRequest) {
  const scriptId = req.nextUrl.searchParams.get("scriptId");
  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const scene = await getScene(id);
    if (!scene) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(scene);
  }

  if (!scriptId) return NextResponse.json({ error: "scriptId required" }, { status: 400 });
  const scenes = await listScenes(scriptId);
  return NextResponse.json(scenes);
}

export async function POST(req: NextRequest) {
  const { scriptId, ...data } = await req.json();
  if (!scriptId || !data.title) return NextResponse.json({ error: "scriptId and title required" }, { status: 400 });
  const scene = await createScene(scriptId, { orderIndex: 0, ...data });
  return NextResponse.json(scene, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const scene = await updateScene(id, data);
  return NextResponse.json(scene);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteScene(id);
  return NextResponse.json({ ok: true });
}
