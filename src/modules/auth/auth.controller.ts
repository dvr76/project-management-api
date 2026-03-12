import type { RequestHandler } from "express";
import * as authService from "./auth.service.js";
import { setAuthCookies, clearAuthCookies } from "../../lib/cookies.js";
import {
  verifyToken,
  signAccessToken,
  signRefreshToken,
} from "../../lib/jwt.js";
import { problemTypes } from "../../lib/problem-details.js";

const INVITE_ERRORS: Record<string, { status: number; detail: string }> = {
  INVITE_NOT_FOUND: { status: 404, detail: "Invite token not found" },
  INVITE_REVOKED: { status: 410, detail: "This invite has been revoked" },
  INVITE_ALREADY_USED: {
    status: 410,
    detail: "This invite has already been used",
  },
  INVITE_EXPIRED: { status: 410, detail: "This invite has expired" },
  INVITE_EMAIL_MISMATCH: {
    status: 403,
    detail: "This invite was sent to a different email",
  },
};

export const register: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);

    if ("error" in result) {
      if (result.error === "EMAIL_TAKEN") {
        res.status(409).json({
          type: problemTypes("email-taken"),
          title: "Conflict",
          status: 409,
          detail: "A user with this email already exists",
        });
        return;
      }

      const mapped = INVITE_ERRORS[result.error];
      res.status(mapped.status).json({
        type: problemTypes("invite-error"),
        title: "Invite Error",
        status: mapped.status,
        detail: mapped.detail,
      });
      return;
    }

    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    res.status(201).json({ data: result.user });
  } catch (err) {
    next(err);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);

    if ("error" in result) {
      res.status(401).json({
        type: problemTypes("invalid-credentials"),
        title: "Unauthorized",
        status: 401,
        detail: "Invalid email or password",
      });
      return;
    }

    // TS narrows to { user; tokens } cleanly
    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    res.json({ data: result.user });
  } catch (err) {
    next(err);
  }
};

export const logout: RequestHandler = (_req, res) => {
  clearAuthCookies(res);
  res.status(204).send();
};

export const refresh: RequestHandler = (req, res) => {
  const token = req.cookies?.refresh_token as string | undefined;

  if (!token) {
    res.status(401).json({
      type: problemTypes("unauthorized"),
      title: "Unauthorized",
      status: 401,
      detail: "No refresh token provided",
    });
    return;
  }

  try {
    const payload = verifyToken(token);
    const newAccess = signAccessToken({
      userId: payload.userId,
      tenantId: payload.tenantId,
      email: payload.email,
    });
    const newRefresh = signRefreshToken({
      userId: payload.userId,
      tenantId: payload.tenantId,
      email: payload.email,
    });

    setAuthCookies(res, newAccess, newRefresh);
    res.json({ data: { message: "Tokens refreshed" } });
  } catch {
    clearAuthCookies(res);
    res.status(401).json({
      type: problemTypes("unauthorized"),
      title: "Unauthorized",
      status: 401,
      detail: "Invalid or expired refresh token",
    });
  }
};

export const me: RequestHandler = (req, res) => {
  res.json({ data: req.user });
};
