import { Router } from "express";
import { authRouter } from "./modules/auth/auth.router.js";
import { healthRouter } from "./modules/health/health.router.js";
import { projectRouter } from "./modules/projects/project.router.js";

export const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/health", healthRouter);
v1Router.use("/projects", projectRouter);
