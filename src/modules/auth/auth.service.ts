import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import {
  signAccessToken,
  signRefreshToken,
  type JwtPayload,
} from "../../lib/jwt.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

const SALT_ROUNDS = 12;

type AuthUser = {
  id: string;
  email: string;
  name: string;
  tenantId: string;
};

type Tokens = {
  accessToken: string;
  refreshToken: string;
};

type RegisterError =
  | "EMAIL_TAKEN"
  | "INVITE_NOT_FOUND"
  | "INVITE_REVOKED"
  | "INVITE_ALREADY_USED"
  | "INVITE_EXPIRED"
  | "INVITE_EMAIL_MISMATCH";

type LoginError = "INVALID_CREDENTIALS";

type RegisterResult =
  | { error: RegisterError }
  | { user: AuthUser; tokens: Tokens };

type LoginResult = { error: LoginError } | { user: AuthUser; tokens: Tokens };

export async function registerUser(
  input: RegisterInput,
): Promise<RegisterResult> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) return { error: "EMAIL_TAKEN" };

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  // ── Path A: Register with invite token ───────
  if (input.inviteToken) {
    const invite = await prisma.tenantInvite.findUnique({
      where: { token: input.inviteToken },
    });

    if (!invite) return { error: "INVITE_NOT_FOUND" };
    if (invite.revokedAt) return { error: "INVITE_REVOKED" };
    if (invite.acceptedAt) return { error: "INVITE_ALREADY_USED" };
    if (invite.expiresAt < new Date()) return { error: "INVITE_EXPIRED" };
    if (invite.email !== input.email) return { error: "INVITE_EMAIL_MISMATCH" };

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          name: input.name,
        },
        select: { id: true, email: true, name: true },
      });

      await tx.tenantMember.create({
        data: {
          userId: newUser.id,
          tenantId: invite.tenantId,
          role: invite.role,
        },
      });

      await tx.tenantInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      return { ...newUser, tenantId: invite.tenantId };
    });

    return { user, tokens: generateTokens(user) };
  }

  // Path B - Fresh registration — create new tenant
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
      },
      select: { id: true, email: true, name: true },
    });

    const tenant = await tx.tenant.create({
      data: { name: input.tenantName! },
    });

    await tx.tenantMember.create({
      data: {
        userId: newUser.id,
        tenantId: tenant.id,
        role: "OWNER",
      },
    });

    return { ...newUser, tenantId: tenant.id };
  });

  return { user, tokens: generateTokens(user) };
}

export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      memberships: {
        select: { tenantId: true, role: true },
        orderBy: { joinedAt: "asc" },
        take: 1,
      },
    },
  });

  if (!user || user.memberships.length === 0) {
    return { error: "INVALID_CREDENTIALS" };
  }

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) return { error: "INVALID_CREDENTIALS" };

  const { password: _, memberships, ...safeUser } = user;
  const payload = { ...safeUser, tenantId: memberships[0].tenantId };

  return { user: payload, tokens: generateTokens(payload) };
}

// ── Helpers ──────────────────────────────────────

function generateTokens(user: {
  id: string;
  email: string;
  tenantId: string;
}): Tokens {
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
