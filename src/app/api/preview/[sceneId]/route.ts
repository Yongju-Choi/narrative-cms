import { NextRequest, NextResponse } from "next/server";
import { compileScenePlayback } from "@/lib/compile/service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sceneId: string }> }) {
  const { sceneId } = await params;

  try {
    const compiled = await compileScenePlayback(sceneId);

    return NextResponse.json(compiled);
  } catch (e) {
    const message = e instanceof Error ? e.message : "scene not found";
    console.error("[preview/scene] compile error:", message);
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
