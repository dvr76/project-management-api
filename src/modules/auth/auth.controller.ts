import type { RequestHandler } from "express";
import * as authService from "./auth.service.js";
import { setAuthCookies, clearAuthCookies } from "../../lib/cookies.js";
import {
  verifyToken,
  signAccessToken,
  signRefreshToken,
} from "../../lib/jwt.js";
import { problemTypes } from "../../lib/problem-details.js";

export const register: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);

    if ("error" in result) {
      res.status(409).json({
        type: problemTypes("email-taken"),
        title: "Conflict",
        status: 409,
        detail: "A user with this email already exists",
      });
      return;
    }

    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

    res.status(201).json({
      data: result.user,
    });
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

    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

    res.json({
      data: result.user,
    });
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

    res.json({ data: { message: "Tokens Refreshed" } });
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
