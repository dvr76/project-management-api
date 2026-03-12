import { z } from "zod";

export const createInviteSchema = z.object({
  email: z.email("Invalid email address"),
  role: z.enum(["OWNER", "MEMBER"]).optional().default("MEMBER"),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const inviteParamsSchema = z.object({
  id: z.uuid("Invalid invite ID"),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
