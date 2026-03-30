import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { compileProjectRuntime } from "@/lib/compile/service";
import { validateProject } from "@/lib/validation/service";
import type { ExportResult } from "./types";

const PROJECTS_ROOT = process.env.PROJECTS_ROOT || "./projects";

export async function getNextBuildVersion(projectSlug: string): Promise<number> {
  const exportsDir = path.join(PROJECTS_ROOT, projectSlug, "03_exports");
  try {
    const entries = await fs.readdir(exportsDir);
    let max = 0;
    for (const entry of entries) {
      const match = entry.match(/^build_v(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    }
    return max + 1;
  } catch {
    return 1;
  }
}

export async function exportProject(projectId: string): Promise<ExportResult> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { slug: true, name: true },
  });

  // Compile and validate
  const compiled = await compileProjectRuntime(projectId);
  const validation = await validateProject(projectId);

  // Determine build version and create directory
  const buildVersion = await getNextBuildVersion(project.slug);
  const versionStr = String(buildVersion).padStart(3, "0");
  const buildDir = path.join(PROJECTS_ROOT, project.slug, "03_exports", `build_v${versionStr}`);
  await fs.mkdir(buildDir, { recursive: true });

  // Build game_data.json
  const gameData = {
    version: 1,
    projectName: compiled.projectName,
    projectSlug: compiled.projectSlug,
    compiledAt: compiled.compiledAt,
    scripts: compiled.scripts.map((script) => ({
      id: script.scriptId,
      title: script.scriptTitle,
      sequences: script.sequences.map((seq) => ({
        id: seq.sequenceId,
        title: seq.sequenceTitle,
        orderIndex: seq.orderIndex,
        sceneIds: seq.scenes.map((s) => s.sceneId),
      })),
      scenes: script.scenes.map((scene) => ({
        id: scene.sceneId,
        title: scene.sceneTitle,
        sequenceId: scene.sequenceId,
        orderIndex: scene.orderIndex,
        metadata: {
          summary: scene.summary,
          mood: scene.mood,
          location: scene.location,
          timeOfDay: scene.timeOfDay,
        },
        cues: scene.cues,
        assets: scene.assets,
      })),
    })),
  };

  const gameDataFile = path.join(buildDir, "game_data.json");
  await fs.writeFile(gameDataFile, JSON.stringify(gameData, null, 2), "utf-8");

  // Build asset_manifest.json
  // Collect all assets across all scenes with slot linkage
  const assetMap = new Map<
    string,
    {
      assetId: string;
      fileName: string;
      filePath: string;
      mimeType: string;
      fileSize: number;
      exists: boolean;
      usedInSlots: { slotId: string; slotName: string; sceneId: string; sceneTitle: string }[];
    }
  >();

  // Query all assets for the project
  const allAssets = await prisma.asset.findMany({
    where: { projectId },
    include: {
      assignments: {
        include: {
          assetSlot: { select: { id: true, name: true, sceneId: true, premiumChoiceId: true } },
        },
      },
    },
  });

  for (const asset of allAssets) {
    let exists = false;
    try {
      await fs.access(asset.filePath);
      exists = true;
    } catch {}

    const slots = asset.assignments.map((a) => ({
      slotId: a.assetSlot.id,
      slotName: a.assetSlot.name,
      sceneId: a.assetSlot.sceneId || "",
      sceneTitle: "",
    }));

    assetMap.set(asset.id, {
      assetId: asset.id,
      fileName: asset.fileName,
      filePath: asset.filePath,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
      exists,
      usedInSlots: slots,
    });
  }

  const assetManifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    assets: Array.from(assetMap.values()),
  };

  const assetManifestFile = path.join(buildDir, "asset_manifest.json");
  await fs.writeFile(assetManifestFile, JSON.stringify(assetManifest, null, 2), "utf-8");

  // Build prompt_manifest.json
  const allPromptSpecs = await prisma.promptSpec.findMany({
    where: { projectId },
    include: {
      assetSlot: { select: { id: true, name: true } },
      scene: { select: { id: true, title: true } },
      sequence: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const promptManifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    specs: allPromptSpecs.map((ps) => ({
      id: ps.id,
      promptType: ps.promptType,
      title: ps.title,
      intentSummary: ps.intentSummary,
      promptText: ps.promptText,
      negativePrompt: ps.negativePrompt,
      modelTarget: ps.modelTarget,
      aspectRatio: ps.aspectRatio,
      durationSec: ps.durationSec,
      status: ps.status,
      version: ps.version,
      assetSlot: ps.assetSlot ? { id: ps.assetSlot.id, name: ps.assetSlot.name } : null,
      scene: ps.scene ? { id: ps.scene.id, title: ps.scene.title } : null,
      sequence: ps.sequence ? { id: ps.sequence.id, title: ps.sequence.title } : null,
    })),
  };

  const promptManifestFile = path.join(buildDir, "prompt_manifest.json");
  await fs.writeFile(promptManifestFile, JSON.stringify(promptManifest, null, 2), "utf-8");

  const exportedAt = new Date().toISOString();

  return {
    success: true,
    buildVersion,
    exportPath: buildDir,
    exportedAt,
    gameDataFile,
    assetManifestFile,
    validationSummary: {
      errors: validation.issues.filter((i) => i.severity === "error").length,
      warnings: validation.issues.filter((i) => i.severity === "warning").length,
    },
  };
}
