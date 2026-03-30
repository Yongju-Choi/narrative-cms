import { NextRequest, NextResponse } from "next/server";
import { validateProject } from "@/lib/validation/service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  try {
    const result = await validateProject(projectId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "project not found" }, { status: 404 });
  }
}
