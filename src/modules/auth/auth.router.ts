import { Router } from "express";
import * as authController from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { authenticate } from "../../middleware/authenticate.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  validate({ body: registerSchema }),
  authController.register,
);
authRouter.post(
  "/login",
  validate({ body: loginSchema }),
  authController.login,
);
authRouter.post("/logout", authController.logout);
authRouter.post("/refresh", authController.refresh);
authRouter.get("/me", authenticate, authController.me);
