import { NextRequest, NextResponse } from "next/server";
import { compileScriptPlayback } from "@/lib/compile/service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ scriptId: string }> }) {
  const { scriptId } = await params;
  try {
    const compiled = await compileScriptPlayback(scriptId);
    return NextResponse.json(compiled);
  } catch (e) {
    const message = e instanceof Error ? e.message : "script not found";
    console.error("[preview/script] compile error:", message);
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
