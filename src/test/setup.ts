import { beforeAll, afterAll } from "vitest";
import { prisma } from "../lib/prisma.js";

beforeAll(async () => {
  await prisma.tenantInvite.deleteMany();
  await prisma.project.deleteMany();
  await prisma.tenantMember.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
