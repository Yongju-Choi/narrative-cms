import fs from "fs/promises";
import path from "path";

const PROJECTS_ROOT = process.env.PROJECTS_ROOT || "./projects";

export async function saveUploadedFile(
  projectSlug: string,
  fileName: string,
  buffer: Buffer
): Promise<{ filePath: string; fileSize: number }> {
  const dir = path.join(PROJECTS_ROOT, projectSlug, "02_asset_library");
  await fs.mkdir(dir, { recursive: true });

  // Avoid overwriting: append timestamp if file exists
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  const finalName = `${base}_${Date.now()}${ext}`;
  const filePath = path.join(dir, finalName);

  await fs.writeFile(filePath, buffer);

  return { filePath, fileSize: buffer.byteLength };
}
