import crypto from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import type { CreateInviteInput } from "./invite.schema.js";

interface ActorContext {
  userId: string;
  tenantId: string;
}

interface ActorContextWithEmail extends ActorContext {
  email: string;
}

const INVITE_EXPIRY_DAYS = 7;

type CreateInviteError = "FORBIDDEN" | "ALREADY_MEMBER" | "INVITE_PENDING";

type AcceptInviteError =
  | "INVITE_NOT_FOUND"
  | "INVITE_REVOKED"
  | "INVITE_ALREADY_USED"
  | "INVITE_EXPIRED"
  | "INVITE_EMAIL_MISMATCH"
  | "ALREADY_MEMBER";

type RevokeInviteError =
  | "NOT_FOUND"
  | "ALREADY_ACCEPTED"
  | "ALREADY_REVOKED"
  | "FORBIDDEN";

type ListInviteError = "FORBIDDEN";

type InviteData = {
  id: string;
  email: string;
  token: string;
  role: string;
  expiresAt: Date;
  createdAt: Date;
};

type CreateInviteResult = { error: CreateInviteError } | { data: InviteData };

type AcceptInviteResult =
  | { error: AcceptInviteError }
  | { data: { tenantId: string; role: string } };

type RevokeInviteResult = { error: RevokeInviteError } | { success: true };

type ListInviteResult =
  | { error: ListInviteError }
  | { data: Array<Record<string, unknown>> };

export async function createInvite(
  input: CreateInviteInput,
  actor: ActorContext,
): Promise<CreateInviteResult> {
  const membership = await prisma.tenantMember.findUnique({
    where: {
      userId_tenantId: { userId: actor.userId, tenantId: actor.tenantId },
    },
  });

  if (!membership || membership.role !== "OWNER") {
    return { error: "FORBIDDEN" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      memberships: {
        where: { tenantId: actor.tenantId },
        select: { id: true },
      },
    },
  });

  if (existingUser && existingUser.memberships.length > 0) {
    return { error: "ALREADY_MEMBER" };
  }

  const existingInvite = await prisma.tenantInvite.findUnique({
    where: {
      email_tenantId: { email: input.email, tenantId: actor.tenantId },
    },
  });

  if (
    existingInvite &&
    !existingInvite.acceptedAt &&
    !existingInvite.revokedAt &&
    existingInvite.expiresAt > new Date()
  ) {
    return { error: "INVITE_PENDING" };
  }

  if (existingInvite) {
    await prisma.tenantInvite.delete({ where: { id: existingInvite.id } });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  const invite = await prisma.tenantInvite.create({
    data: {
      email: input.email,
      token,
      tenantId: actor.tenantId,
      invitedBy: actor.userId,
      role: input.role,
      expiresAt,
    },
    select: {
      id: true,
      email: true,
      token: true,
      role: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return { data: invite };
}

export async function acceptInvite(
  token: string,
  actor: ActorContextWithEmail,
): Promise<AcceptInviteResult> {
  const invite = await prisma.tenantInvite.findUnique({
    where: { token },
  });

  if (!invite) return { error: "INVITE_NOT_FOUND" };
  if (invite.revokedAt) return { error: "INVITE_REVOKED" };
  if (invite.acceptedAt) return { error: "INVITE_ALREADY_USED" };
  if (invite.expiresAt < new Date()) return { error: "INVITE_EXPIRED" };
  if (invite.email !== actor.email) return { error: "INVITE_EMAIL_MISMATCH" };

  const existing = await prisma.tenantMember.findUnique({
    where: {
      userId_tenantId: { userId: actor.userId, tenantId: invite.tenantId },
    },
  });

  if (existing) return { error: "ALREADY_MEMBER" };

  await prisma.$transaction([
    prisma.tenantMember.create({
      data: {
        userId: actor.userId,
        tenantId: invite.tenantId,
        role: invite.role,
      },
    }),
    prisma.tenantInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  return { data: { tenantId: invite.tenantId, role: invite.role } };
}

export async function revokeInvite(
  inviteId: string,
  actor: ActorContext,
): Promise<RevokeInviteResult> {
  const invite = await prisma.tenantInvite.findFirst({
    where: { id: inviteId, tenantId: actor.tenantId },
  });

  if (!invite) return { error: "NOT_FOUND" };
  if (invite.acceptedAt) return { error: "ALREADY_ACCEPTED" };
  if (invite.revokedAt) return { error: "ALREADY_REVOKED" };

  const membership = await prisma.tenantMember.findUnique({
    where: {
      userId_tenantId: { userId: actor.userId, tenantId: actor.tenantId },
    },
  });

  if (!membership || membership.role !== "OWNER") {
    return { error: "FORBIDDEN" };
  }

  await prisma.tenantInvite.update({
    where: { id: invite.id },
    data: { revokedAt: new Date() },
  });

  return { success: true };
}

export async function listTenantInvites(
  actor: ActorContext,
): Promise<ListInviteResult> {
  const membership = await prisma.tenantMember.findUnique({
    where: {
      userId_tenantId: { userId: actor.userId, tenantId: actor.tenantId },
    },
  });

  if (!membership || membership.role !== "OWNER") {
    return { error: "FORBIDDEN" };
  }

  const invites = await prisma.tenantInvite.findMany({
    where: { tenantId: actor.tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,
      createdAt: true,
      inviter: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return { data: invites };
}
