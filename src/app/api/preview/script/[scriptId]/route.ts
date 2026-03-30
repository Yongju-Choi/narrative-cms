import { NextRequest, NextResponse } from "next/server";
import { compileScriptPlayback } from "@/lib/compile/service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ scriptId: string }> }) {
  const { scriptId } = await params;
  try {
    const compiled = await compileScriptPlayback(scriptId);
    return NextResponse.json(compiled);
  } catch {
    return NextResponse.json({ error: "script not found" }, { status: 404 });
  }
}
