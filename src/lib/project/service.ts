import { prisma } from "@/lib/prisma";
import { createProjectFolders } from "./folder";
import { toSlug } from "@/lib/utils/slug";

export async function createProject(name: string) {
  const slug = toSlug(name);
  const project = await prisma.project.create({
    data: { name, slug },
  });
  await createProjectFolders(slug);
  return project;
}

export async function listProjects() {
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { scripts: true } } },
  });
}

export async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      scripts: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function deleteProject(id: string) {
  return prisma.project.delete({ where: { id } });
}
