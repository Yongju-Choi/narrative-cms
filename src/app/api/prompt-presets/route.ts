import { NextRequest, NextResponse } from "next/server";
import {
  createPromptPreset,
  listPromptPresets,
  updatePromptPreset,
  deletePromptPreset,
} from "@/lib/prompt-preset/service";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId") || undefined;
  return NextResponse.json(await listPromptPresets(projectId));
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  if (!data.name || !data.presetType || !data.content) {
    return NextResponse.json({ error: "name, presetType, content required" }, { status: 400 });
  }
  return NextResponse.json(await createPromptPreset(data), { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  return NextResponse.json(await updatePromptPreset(id, data));
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deletePromptPreset(id);
  return NextResponse.json({ ok: true });
}
