import { NextRequest, NextResponse } from "next/server";
import { compileScenePlayback } from "@/lib/compile/service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sceneId: string }> }) {
  const { sceneId } = await params;

  try {
    const compiled = await compileScenePlayback(sceneId);

    // Map to legacy ScenePreviewData shape for PreviewPanel compatibility
    const previewData = {
      sceneId: compiled.sceneId,
      sceneTitle: compiled.sceneTitle,
      cues: compiled.cues,
      assets: compiled.assets.map((a) => ({
        slotId: a.slotId,
        slotName: a.slotName,
        slotType: a.slotType,
        assetId: a.assetId,
        filePath: a.filePath,
      })),
    };

    return NextResponse.json(previewData);
  } catch {
    return NextResponse.json({ error: "scene not found" }, { status: 404 });
  }
}
