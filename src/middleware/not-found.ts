import type { RequestHandler } from "express";
import { problemTypes } from "../lib/problem-details.js";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    type: problemTypes("not-found"),
    title: "Not Found",
    status: 404,
    detail: `No route matched ${req.method} ${req.originalUrl}`,
  });
};
