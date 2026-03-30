import { NextRequest, NextResponse } from "next/server";
import { createAsset } from "@/lib/asset/service";
import { saveUploadedFile } from "@/lib/asset/upload";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const projectId = formData.get("projectId") as string | null;

  if (!file || !projectId) {
    return NextResponse.json({ error: "file and projectId required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { slug: true } });
  if (!project) {
    return NextResponse.json({ error: "project not found" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { filePath, fileSize } = await saveUploadedFile(project.slug, file.name, buffer);

  const asset = await createAsset({
    projectId,
    fileName: file.name,
    filePath,
    mimeType: file.type || "application/octet-stream",
    fileSize,
  });

  return NextResponse.json(asset, { status: 201 });
}
