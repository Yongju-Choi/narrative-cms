import fs from "fs/promises";
import path from "path";
import { toSlug } from "@/lib/utils/slug";

const PROJECTS_ROOT = process.env.PROJECTS_ROOT || "./projects";

const SUBFOLDERS = [
  "background",
  "characters",
  "message_images",
  "clip_videos",
  "audio/bgm",
  "audio/sfx",
];

export function computeSceneFolderName(orderIndex: number, title: string): string {
  const num = String(orderIndex + 1).padStart(3, "0");
  const slug = toSlug(title);
  return `scene_${num}_${slug}`;
}

export function computeSceneFolderPath(projectSlug: string, orderIndex: number, title: string): string {
  const folderName = computeSceneFolderName(orderIndex, title);
  return path.join(PROJECTS_ROOT, projectSlug, "01_scenes", folderName);
}

export async function createSceneFolders(
  projectSlug: string,
  orderIndex: number,
  title: string,
  sceneId: string
): Promise<string> {
  const scenePath = computeSceneFolderPath(projectSlug, orderIndex, title);

  for (const sub of SUBFOLDERS) {
    await fs.mkdir(path.join(scenePath, sub), { recursive: true });
  }

  const manifest = {
    sceneId,
    title,
    folderCreatedAt: new Date().toISOString(),
    originalOrderIndex: orderIndex,
  };

  await fs.writeFile(
    path.join(scenePath, "scene_manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8"
  );

  return scenePath;
}
