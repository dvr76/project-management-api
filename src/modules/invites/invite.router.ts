import { Router } from "express";
import * as inviteController from "./invite.controller.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/authenticate.js";
import {
  createInviteSchema,
  acceptInviteSchema,
  inviteParamsSchema,
} from "./invite.schema.js";

export const inviteRouter = Router();

// All invite routes require auth
inviteRouter.use(authenticate);

inviteRouter.post(
  "/",
  validate({ body: createInviteSchema }),
  inviteController.create,
);

inviteRouter.post(
  "/accept",
  validate({ body: acceptInviteSchema }),
  inviteController.accept,
);

inviteRouter.get("/", inviteController.list);

inviteRouter.patch(
  "/:id/revoke",
  validate({ params: inviteParamsSchema }),
  inviteController.revoke,
);
