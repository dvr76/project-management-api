import { describe, it, expect } from "vitest";
import { request, registerAndLogin } from "../../test/helpers.js";

describe("Auth Module", () => {
  describe("POST /v1/auth/register", () => {
    it("should register a new user and set cookies", async () => {
      const { res, cookies } = await registerAndLogin({
        email: "new@example.com",
      });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.email).toBe("new@example.com");
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes("access_token"))).toBe(
        true,
      );
    });

    it("should return 409 for duplicate email", async () => {
      const email = "dupe@example.com";
      await registerAndLogin({ email });

      const res = await request.post("/v1/auth/register").send({
        email,
        password: "testpassword1",
        name: "dupe",
        tenantName: "Corp",
      });

      expect(res.status).toBe(409);
      expect(res.body.type).toContain("email-taken");
    });

    it("should return 400 for invalid input", async () => {
      const res = await request.post("/v1/auth/register").send({
        email: "not-an-email",
        password: "short",
        name: "",
        tenantName: "",
      });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    describe("POST /v1/auth/login", () => {
      it("should login and set cookies", async () => {
        const email = "login-test@example.com";
        await registerAndLogin({ email });

        const res = await request.post("/v1/auth/login").send({
          email,
          password: "testpassword1",
        });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty("id");
      });

      it("should return 401 for wrong password", async () => {
        const email = "wrong-pw@example.com";
        await registerAndLogin({ email });

        const res = await request.post("/v1/auth/login").send({
          email,
          password: "wrongpassword",
        });

        expect(res.status).toBe(401);
      });
    });

    describe("GET /v1/auth/me", () => {
      it("should return 401 without auth", async () => {
        const res = await request.get("/v1/auth/me");
        expect(res.status).toBe(401);
      });

      it("should return user with valid cookies", async () => {
        const { cookies } = await registerAndLogin({ email: "me@example.com" });

        const res = await request.get("/v1/auth/me").set("Cookie", cookies);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty("userId");
      });
    });
  });
});
