import { RequestHandler } from "express";
import { problemTypes } from "../lib/problem-details.js";

export const requireJsonContentType: RequestHandler = (req, res, next) => {
  if (
    ["POST", "PUT", "PATCH"].includes(req.method) &&
    !req.is("application/json")
  ) {
    res.status(415).json({
      type: problemTypes("unsupported-media-type"),
      title: "Unsupported Media Type",
      status: 415,
      detail: "Content-Type must be application/json",
    });
    return;
  }
  next();
};
