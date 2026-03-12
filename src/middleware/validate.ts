import type { RequestHandler } from "express";
import { z, ZodError } from "zod";
import { problemTypes } from "../lib/problem-details.js";

interface ValidateSchemas {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

export function validate(schemas: ValidateSchemas): RequestHandler {
  return (req, res, next) => {
    const errors: Record<string, string[]> = {};

    for (const [source, schema] of Object.entries(schemas)) {
      if (!schema) continue;

      const key = source as keyof typeof req;
      const result = schema.safeParse(req[key]);

      if (!result.success) {
        const formatted = formatZodError(result.error);
        for (const [field, messages] of Object.entries(formatted)) {
          errors[`${source}.${field}`] = messages;
        }
      } else {
        // Replace with parsed coerced values
        (req as any)[key] = result.data;
      }
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        type: problemTypes("validation-error"),
        title: "Bad Request",
        status: 400,
        detail: "One or more fields failed validation",
        errors,
      });
      return;
    }

    next();
  };
}

function formatZodError(error: ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!result[path]) result[path] = [];
    result[path].push(issue.message);
  }
  return result;
}
