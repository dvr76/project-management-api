import type { ErrorRequestHandler } from "express";
import { logger } from "../config/logger.js";
import { problemTypes } from "../lib/problem-details.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error({ err }, "Unhandler Error");

  const status = err.status ?? err.statusCode ?? 500;

  res.status(status).json({
    type: problemTypes("internal-server-error"),
    title: "Internal Server Error",
    status,
    detail:
      process.env.NODE_ENV === "production"
        ? "An Unexpected error occured"
        : err.message,
  });
};
