import { NextRequest, NextResponse } from "next/server";
import { createAsset, listAssets, deleteAsset } from "@/lib/asset/service";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
  return NextResponse.json(await listAssets(projectId));
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  if (!data.projectId || !data.fileName || !data.filePath || !data.mimeType) {
    return NextResponse.json({ error: "projectId, fileName, filePath, mimeType required" }, { status: 400 });
  }
  return NextResponse.json(await createAsset({ ...data, fileSize: data.fileSize ?? 0 }), { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteAsset(id);
  return NextResponse.json({ ok: true });
}
