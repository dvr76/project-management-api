import type { Response } from "express";

// RFC 9457 problem details for HTTP apis
export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

const BASE_URI = "urn:project-management-api:errors";

export function problemTypes(slug: string): string {
  return `${BASE_URI}:${slug}`;
}

export function sendProblem(res: Response, problem: ProblemDetail): void {
  res.status(problem.status).json(problem);
}
