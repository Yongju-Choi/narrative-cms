import fs from "fs/promises";
import path from "path";

const PROJECTS_ROOT = process.env.PROJECTS_ROOT || "./projects";

const SUBFOLDERS = [
  "00_script",
  "01_scenes",
  "02_asset_library",
  "03_exports",
];

export async function createProjectFolders(slug: string): Promise<string> {
  const projectDir = path.join(PROJECTS_ROOT, slug);
  await fs.mkdir(projectDir, { recursive: true });

  for (const sub of SUBFOLDERS) {
    await fs.mkdir(path.join(projectDir, sub), { recursive: true });
  }

  return projectDir;
}

export async function getProjectPath(slug: string): Promise<string> {
  return path.join(PROJECTS_ROOT, slug);
}
