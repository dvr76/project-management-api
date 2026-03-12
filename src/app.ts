import express from "express";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { requireJsonContentType } from "./middleware/content-type-guard.js";
import { v1Router } from "./version-router.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { problemTypes } from "./lib/problem-details.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, "../public");

export function createApp() {
  const app = express();

  // Midddleware
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    pinoHttp({
      logger,
      quietReqLogger: true,
    }),
  );

  // Content-Type guard
  app.use(requireJsonContentType);

  // Routes
  app.use("/v1", v1Router);

  // Demo Ui
  app.all("/v1/{*splat}", (req, res) => {
    res.status(404).json({
      type: problemTypes("not-found"),
      title: "Not Found",
      status: 404,
      detail: `No route matched ${req.method} ${req.originalUrl}`,
    });
  });

  // Static files (JS, CSS, images)
  app.use(express.static(PUBLIC_DIR));

  // SPA fallback (everything else → index.html)
  app.get("{*splat}", (_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
