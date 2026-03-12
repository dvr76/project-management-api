import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
    name: z.string().min(1, "Name is required").max(255),
    tenantName: z.string().min(1).max(255).optional(),
    inviteToken: z.string().max(255).optional(),
  })
  .refine((data) => data.tenantName || data.inviteToken, {
    message:
      "Either tenantName (new org) or inviteToken (join existing) is required",
  });

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
