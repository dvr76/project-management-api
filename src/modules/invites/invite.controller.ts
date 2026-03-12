import type { RequestHandler } from "express";
import * as inviteService from "./invite.service.js";
import { problemTypes } from "../../lib/problem-details.js";

function getActor(req: Express.Request) {
  return {
    userId: req.user!.userId,
    tenantId: req.user!.tenantId,
    email: req.user!.email,
  };
}

const ERROR_MAP: Record<string, { status: number; detail: string }> = {
  FORBIDDEN: {
    status: 403,
    detail: "Only tenant owners can perform this action",
  },
  ALREADY_MEMBER: {
    status: 409,
    detail: "This user is already a member of the tenant",
  },
  INVITE_PENDING: {
    status: 409,
    detail: "A pending invite already exists for this email",
  },
  INVITE_NOT_FOUND: { status: 404, detail: "Invite not found" },
  INVITE_REVOKED: { status: 410, detail: "This invite has been revoked" },
  INVITE_ALREADY_USED: {
    status: 410,
    detail: "This invite has already been accepted",
  },
  INVITE_EXPIRED: { status: 410, detail: "This invite has expired" },
  INVITE_EMAIL_MISMATCH: {
    status: 403,
    detail: "This invite was sent to a different email",
  },
  NOT_FOUND: { status: 404, detail: "Invite not found" },
  ALREADY_ACCEPTED: { status: 409, detail: "This invite was already accepted" },
  ALREADY_REVOKED: { status: 409, detail: "This invite was already revoked" },
};

function sendError(res: import("express").Response, error: string): void {
  const mapped = ERROR_MAP[error] ?? { status: 500, detail: "Unknown error" };
  res.status(mapped.status).json({
    type: problemTypes("invite-error"),
    title: mapped.detail,
    status: mapped.status,
    detail: mapped.detail,
  });
}

export const create: RequestHandler = async (req, res, next) => {
  try {
    const result = await inviteService.createInvite(req.body, getActor(req));

    if ("error" in result) {
      sendError(res, result.error);
      return;
    }

    res.status(201).json({ data: result.data });
  } catch (err) {
    next(err);
  }
};

export const accept: RequestHandler = async (req, res, next) => {
  try {
    const result = await inviteService.acceptInvite(
      req.body.token,
      getActor(req),
    );

    if ("error" in result) {
      sendError(res, result.error);
      return;
    }

    res.json({ data: result.data });
  } catch (err) {
    next(err);
  }
};

export const revoke: RequestHandler = async (req, res, next) => {
  try {
    const result = await inviteService.revokeInvite(
      req.params.id as string,
      getActor(req),
    );

    if ("error" in result) {
      sendError(res, result.error);
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const list: RequestHandler = async (req, res, next) => {
  try {
    const result = await inviteService.listTenantInvites(getActor(req));

    if ("error" in result) {
      sendError(res, result.error);
      return;
    }

    res.json({ data: result.data });
  } catch (err) {
    next(err);
  }
};
