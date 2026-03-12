import { describe, it, expect, beforeAll } from "vitest";
import { request, registerAndLogin } from "../../test/helpers.js";

describe("Projects Module", () => {
  let cookies: string[];
  let otherCookies: string[];
  let projectId: string;

  beforeAll(async () => {
    const user1 = await registerAndLogin({ email: "proj-user1@example.com" });
    cookies = user1.cookies;

    const user2 = await registerAndLogin({ email: "proj-user2@example.com" });
    otherCookies = user2.cookies;
  });

  describe("POST /v1/projects", () => {
    it("should create a project", async () => {
      const res = await request
        .post("/v1/projects")
        .set("Cookie", cookies)
        .send({ title: "My Project", description: "Testing" });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("My Project");
      expect(res.body.data.status).toBe("PLANNING");
      projectId = res.body.data.id;
    });

    it("should return 401 without auth", async () => {
      const res = await request.post("/v1/projects").send({ title: "Fail" });

      expect(res.status).toBe(401);
    });

    it("should return 400 for missing title", async () => {
      const res = await request
        .post("/v1/projects")
        .set("Cookie", cookies)
        .send({ description: "No title" });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe("GET /v1/projects", () => {
    it("should list projects for the tenant", async () => {
      const res = await request.get("/v1/projects").set("Cookie", cookies);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toHaveProperty("total");
    });

    it("should NOT see another tenant's projects", async () => {
      const res = await request.get("/v1/projects").set("Cookie", otherCookies);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe("GET /v1/projects/:id", () => {
    it("should get a project by id", async () => {
      const res = await request
        .get(`/v1/projects/${projectId}`)
        .set("Cookie", cookies);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(projectId);
    });

    it("should return 404 for non-existent project", async () => {
      const res = await request
        .get("/v1/projects/00000000-0000-0000-0000-000000000000")
        .set("Cookie", cookies);

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /v1/projects/:id", () => {
    it("should update own project", async () => {
      const res = await request
        .patch(`/v1/projects/${projectId}`)
        .set("Cookie", cookies)
        .send({ status: "ACTIVE" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("ACTIVE");
    });

    it("should return 403 when updating another user's project", async () => {
      const res = await request
        .patch(`/v1/projects/${projectId}`)
        .set("Cookie", otherCookies)
        .send({ title: "Hacked" });

      // other user is different tenant, so project not found = 404
      expect([403, 404]).toContain(res.status);
    });
  });

  describe("DELETE /v1/projects/:id", () => {
    it("should delete own project", async () => {
      // Create one to delete
      const created = await request
        .post("/v1/projects")
        .set("Cookie", cookies)
        .send({ title: "To Delete" });

      const res = await request
        .delete(`/v1/projects/${created.body.data.id}`)
        .set("Cookie", cookies);

      expect(res.status).toBe(204);
    });
  });
});
