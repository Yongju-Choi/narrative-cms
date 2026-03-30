import { NextRequest, NextResponse } from "next/server";
import { createScript, getScript, updateScript, deleteScript } from "@/lib/script/service";

export async function POST(req: NextRequest) {
  const { projectId, title, rawText } = await req.json();
  if (!projectId || !title) return NextResponse.json({ error: "projectId and title required" }, { status: 400 });
  const script = await createScript(projectId, title, rawText || "");
  return NextResponse.json(script, { status: 201 });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const script = await getScript(id);
  if (!script) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(script);
}

export async function PATCH(req: NextRequest) {
  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const script = await updateScript(id, data);
  return NextResponse.json(script);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteScript(id);
  return NextResponse.json({ ok: true });
}
