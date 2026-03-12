import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import {
  signAccessToken,
  signRefreshToken,
  type JwtPayload,
} from "../../lib/jwt.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

const SALT_ROUNDS = 12;

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    return { error: "EMAIL_TAKEN" as const };
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      name: input.name,
      tenant: {
        create: {
          name: input.tenantName,
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      tenantId: true,
      createdAt: true,
    },
  });

  const tokens = generateTokens(user);

  return { user, tokens };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      tenantId: true,
    },
  });

  if (!user) {
    return { error: "INVALID_CREDENTIALS" as const };
  }

  const valid = await bcrypt.compare(input.password, user.password);

  if (!valid) {
    return { error: "INVALID_CREDENTIALS" as const };
  }

  const { password: _, ...safeUser } = user;
  const tokens = generateTokens(safeUser);

  return { user: safeUser, tokens };
}

function generateTokens(user: { id: string; email: string; tenantId: string }) {
  const payload: JwtPayload = {
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
  };

  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}
