import express from "express";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { requireJsonContentType } from "./middleware/content-type-guard.js";
import { v1Router } from "./version-router.js";

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

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
