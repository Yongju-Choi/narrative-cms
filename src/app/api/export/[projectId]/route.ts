import { NextRequest, NextResponse } from "next/server";
import { exportProject } from "@/lib/export/service";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  try {
    const result = await exportProject(projectId);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "export failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
