import { prisma } from "../../lib/prisma.js";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ListProjectsQuery,
} from "./project.schema.js";

interface ActorContext {
  userId: string;
  tenantId: string;
}

export async function createProject(
  input: CreateProjectInput,
  actor: ActorContext,
) {
  return prisma.project.create({
    data: {
      title: input.title,
      description: input.description,
      status: input.status,
      ownerId: actor.userId,
      tenantId: actor.tenantId,
    },
  });
}

export async function listProjects(
  query: ListProjectsQuery,
  actor: ActorContext,
) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;

  const where = {
    tenantId: actor.tenantId,
    ...(query.status && { status: query.status }),
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return {
    data: projects,
    meta: {
      total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProjectById(id: string, actor: ActorContext) {
  return prisma.project.findFirst({
    where: { id, tenantId: actor.tenantId },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
  actor: ActorContext,
) {
  // Only owner can update
  const project = await prisma.project.findFirst({
    where: { id, tenantId: actor.tenantId },
  });

  if (!project) return { error: "NOT_FOUND" as const };
  if (project.ownerId !== actor.userId) return { error: "FORBIDDEN" as const };

  const updated = await prisma.project.update({
    where: { id },
    data: input,
  });

  return { data: updated };
}

export async function deleteProject(id: string, actor: ActorContext) {
  const project = await prisma.project.findFirst({
    where: { id, tenantId: actor.tenantId },
  });

  if (!project) return { error: "NOT_FOUND" as const };
  if (project.ownerId !== actor.userId) return { error: "FORBIDDEN" as const };

  await prisma.project.delete({ where: { id } });

  return { success: true };
}
