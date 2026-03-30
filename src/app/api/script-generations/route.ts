import { NextRequest, NextResponse } from "next/server";
import {
  createGeneration,
  executeGeneration,
  listGenerations,
  getGeneration,
  importGenerationAsScript,
  deleteGeneration,
} from "@/lib/script-generation/service";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const gen = await getGeneration(id);
    if (!gen) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(gen);
  }

  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
  return NextResponse.json(await listGenerations(projectId));
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const action = data.action;

  if (action === "generate") {
    // Execute generation on existing record
    if (!data.id) return NextResponse.json({ error: "id required for generate" }, { status: 400 });
    try {
      const result = await executeGeneration(data.id);
      return NextResponse.json(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "generation failed";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  if (action === "import") {
    // Import generation as script
    if (!data.id || !data.title) return NextResponse.json({ error: "id and title required for import" }, { status: 400 });
    try {
      const script = await importGenerationAsScript(data.id, data.title);
      return NextResponse.json(script, { status: 201 });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "import failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  // Create new generation record
  if (!data.projectId || !data.provider || !data.modelName || !data.userPrompt) {
    return NextResponse.json({ error: "projectId, provider, modelName, userPrompt required" }, { status: 400 });
  }
  const gen = await createGeneration(data);
  return NextResponse.json(gen, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteGeneration(id);
  return NextResponse.json({ ok: true });
}
