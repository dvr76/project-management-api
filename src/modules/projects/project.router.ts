import { Router } from "express";
import * as projectController from "./project.controller.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/authenticate.js";
import {
  createProjectSchema,
  updateProjectSchema,
  projectParamsSchema,
  listProjectsQuerySchema,
} from "./project.schema.js";

export const projectRouter = Router();

// All project routes require authentication
projectRouter.use(authenticate);

projectRouter.post(
  "/",
  validate({ body: createProjectSchema }),
  projectController.create,
);

projectRouter.get(
  "/",
  validate({ query: listProjectsQuerySchema }),
  projectController.list,
);

projectRouter.get(
  "/:id",
  validate({ params: projectParamsSchema }),
  projectController.getById,
);

projectRouter.patch(
  "/:id",
  validate({ params: projectParamsSchema, body: updateProjectSchema }),
  projectController.update,
);

projectRouter.delete(
  "/:id",
  validate({ params: projectParamsSchema }),
  projectController.remove,
);
