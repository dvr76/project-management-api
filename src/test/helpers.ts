import supertest from "supertest";
import { createApp } from "../app.js";

export const app = createApp();
export const request = supertest(app);

export async function registerAndLogin(overrides?: {
  email?: string;
  name?: string;
  tenantName?: string;
}) {
  const email = overrides?.email ?? `test-${Date.now()}@example.com`;

  const res = await request.post("/v1/auth/register").send({
    email,
    password: "testpassword1",
    name: overrides?.name ?? "Tester",
    tenantName: overrides?.tenantName ?? "Test Corp",
  });

  const cookies = res.headers["set-cookie"] as unknown as string[];

  return { res, cookies, email };
}
