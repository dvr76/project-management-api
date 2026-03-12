import { beforeAll, afterAll } from "vitest";
import { prisma } from "../lib/prisma.js";

beforeAll(async () => {
  await prisma.project.deleteMany();
  await prisma.project.deleteMany();
  await prisma.tenant.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
