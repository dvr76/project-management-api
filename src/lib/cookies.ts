import type { Response } from "express";
import { env } from "../config/env.js";

const IS_PROD = env.NODE_ENV === "production";

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15m
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict",
    path: "/v1/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token", { path: "/v1/auth/refresh" });
}
