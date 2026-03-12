import { Router } from "express";
import { authRouter } from "./modules/auth/auth.router.js";

export const v1Router = Router();

v1Router.use("/auth", authRouter);
