import type { RequestHandler } from "express";
import { verifyToken, type JwtPayload } from "../lib/jwt.js";
import { problemTypes } from "../lib/problem-details.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate: RequestHandler = (req, res, next) => {
  const token = req.cookies?.access_token as string | undefined;

  if (!token) {
    res.status(401).json({
      type: problemTypes("unauthorized"),
      title: "Unauthorized",
      status: 401,
      detail: "Authentication required.",
    });
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({
      type: problemTypes("unauthorized"),
      title: "Unauthorized",
      status: 401,
      detail: "Invalid or expired token",
    });
  }
};
