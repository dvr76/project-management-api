import type { RequestHandler } from "express";
import * as projectService from "./project.service.js";
import { problemTypes } from "../../lib/problem-details.js";

function getActor(req: Express.Request) {
  return {
    userId: req.user!.userId,
    tenantId: req.user!.tenantId,
  };
}

export const create: RequestHandler = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.body, getActor(req));
    res.status(201).json({ data: project });
  } catch (err) {
    next(err);
  }
};

export const list: RequestHandler = async (req, res, next) => {
  try {
    const result = await projectService.listProjects(
      req.query as any,
      getActor(req),
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getById: RequestHandler = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(
      req.params.id as string,
      getActor(req),
    );

    if (!project) {
      res.status(404).json({
        type: problemTypes("not-found"),
        title: "Not Found",
        status: 404,
        detail: `Project ${req.params.id as string} not found`,
      });
      return;
    }

    res.json({ data: project });
  } catch (err) {
    next(err);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const result = await projectService.updateProject(
      req.params.id as string,
      req.body,
      getActor(req),
    );

    if ("error" in result) {
      if (result.error === "NOT_FOUND") {
        res.status(404).json({
          type: problemTypes("not-found"),
          title: "Not Found",
          status: 404,
          detail: `Project ${req.params.id as string} not found`,
        });
        return;
      }
      res.status(403).json({
        type: problemTypes("forbidden"),
        title: "Forbidden",
        status: 403,
        detail: "You can only modify your own projects",
      });
      return;
    }

    res.json({ data: result.data });
  } catch (err) {
    next(err);
  }
};

export const remove: RequestHandler = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(
      req.params.id as string,
      getActor(req),
    );

    if ("error" in result) {
      if (result.error === "NOT_FOUND") {
        res.status(404).json({
          type: problemTypes("not-found"),
          title: "Not Found",
          status: 404,
          detail: `Project ${req.params.id as string} not found`,
        });
        return;
      }
      res.status(403).json({
        type: problemTypes("forbidden"),
        title: "Forbidden",
        status: 403,
        detail: "You can only delete your own projects",
      });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
