import { NextRequest, NextResponse } from "next/server";
import { validateScene } from "@/lib/validation/service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sceneId: string }> }) {
  const { sceneId } = await params;
  try {
    const result = await validateScene(sceneId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "scene not found" }, { status: 404 });
  }
}
