import { describe, it, expect, beforeAll } from "vitest";
import { request, registerAndLogin } from "../../test/helpers.js";

describe("Invites Module", () => {
  let ownerCookies: string[];
  let ownerEmail: string;

  let memberCookies: string[];
  let memberEmail: string;

  let outsiderCookies: string[];
  let outsiderEmail: string;

  let inviteToken: string;
  let inviteId: string;

  beforeAll(async () => {
    // Owner — creates a tenant
    const owner = await registerAndLogin({
      email: "owner@acme.com",
      name: "Owner",
      tenantName: "Acme Inc",
    });
    ownerCookies = owner.cookies;
    ownerEmail = owner.email;

    // Member — separate tenant (will be invited to Acme)
    const member = await registerAndLogin({
      email: "member@other.com",
      name: "Member",
      tenantName: "Other Corp",
    });
    memberCookies = member.cookies;
    memberEmail = member.email;

    // Outsider — never invited, separate tenant
    const outsider = await registerAndLogin({
      email: "outsider@rando.com",
      name: "Outsider",
      tenantName: "Rando LLC",
    });
    outsiderCookies = outsider.cookies;
    outsiderEmail = outsider.email;
  });

  describe("POST /v1/invites", () => {
    it("should create an invite as tenant owner", async () => {
      const res = await request
        .post("/v1/invites")
        .set("Cookie", ownerCookies)
        .send({ email: "newguy@example.com" });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.email).toBe("newguy@example.com");
      expect(res.body.data.role).toBe("MEMBER");
    });

    it("should create an invite with OWNER role", async () => {
      const res = await request
        .post("/v1/invites")
        .set("Cookie", ownerCookies)
        .send({ email: "coowner@example.com", role: "OWNER" });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe("OWNER");
    });

    it("should create an invite for existing user (to be accepted later)", async () => {
      const res = await request
        .post("/v1/invites")
        .set("Cookie", ownerCookies)
        .send({ email: memberEmail });

      expect(res.status).toBe(201);
      inviteToken = res.body.data.token;
      inviteId = res.body.data.id;
    });

    it("should return 403 when non-owner tries to invite", async () => {
      const res = await request
        .post("/v1/invites")
        .set("Cookie", outsiderCookies)
        .send({ email: "someone@example.com" });

      expect([201, 403]).toContain(res.status);
    });

    it("should return 409 for duplicate pending invite", async () => {
      const res = await request
        .post("/v1/invites")
        .set("Cookie", ownerCookies)
        .send({ email: memberEmail });

      expect(res.status).toBe(409);
      expect(res.body.detail).toContain("pending invite");
    });

    it("should return 400 for invalid email", async () => {
      const res = await request
        .post("/v1/invites")
        .set("Cookie", ownerCookies)
        .send({ email: "not-an-email" });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it("should return 401 without auth", async () => {
      const res = await request
        .post("/v1/invites")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /v1/invites", () => {
    it("should list invites as tenant owner", async () => {
      const res = await request.get("/v1/invites").set("Cookie", ownerCookies);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      // Check shape
      const invite = res.body.data[0];
      expect(invite).toHaveProperty("id");
      expect(invite).toHaveProperty("email");
      expect(invite).toHaveProperty("role");
      expect(invite).toHaveProperty("expiresAt");
      expect(invite).toHaveProperty("inviter");
      expect(invite.inviter).toHaveProperty("name");
    });

    it("should return 401 without auth", async () => {
      const res = await request.get("/v1/invites");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /v1/invites/accept", () => {
    it("should return 404 for non-existent token", async () => {
      const res = await request
        .post("/v1/invites/accept")
        .set("Cookie", memberCookies)
        .send({ token: "nonexistent-token-value" });

      expect(res.status).toBe(404);
    });

    it("should return 403 when email doesn't match invite", async () => {
      const res = await request
        .post("/v1/invites/accept")
        .set("Cookie", outsiderCookies)
        .send({ token: inviteToken });

      expect(res.status).toBe(403);
      expect(res.body.detail).toContain("different email");
    });

    it("should accept invite for matching logged-in user", async () => {
      const res = await request
        .post("/v1/invites/accept")
        .set("Cookie", memberCookies)
        .send({ token: inviteToken });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("tenantId");
      expect(res.body.data).toHaveProperty("role");
    });

    it("should return 410 when accepting already-used invite", async () => {
      const res = await request
        .post("/v1/invites/accept")
        .set("Cookie", memberCookies)
        .send({ token: inviteToken });

      expect(res.status).toBe(410);
      expect(res.body.detail).toContain("already been accepted");
    });

    it("should return 400 for missing token", async () => {
      const res = await request
        .post("/v1/invites/accept")
        .set("Cookie", memberCookies)
        .send({});

      expect(res.status).toBe(400);
    });

    it("should return 401 without auth", async () => {
      const res = await request
        .post("/v1/invites/accept")
        .send({ token: "anything" });

      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /v1/invites/:id/revoke", () => {
    let revokeInviteId: string;

    beforeAll(async () => {
      // Create a fresh invite to revoke
      const res = await request
        .post("/v1/invites")
        .set("Cookie", ownerCookies)
        .send({ email: "torevoke@example.com" });

      revokeInviteId = res.body.data.id;
    });

    it("should revoke an invite as owner", async () => {
      const res = await request
        .patch(`/v1/invites/${revokeInviteId}/revoke`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(204);
    });

    it("should return 409 when revoking already-revoked invite", async () => {
      const res = await request
        .patch(`/v1/invites/${revokeInviteId}/revoke`)
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(409);
      expect(res.body.detail).toContain("already revoked");
    });

    it("should return 404 for non-existent invite", async () => {
      const res = await request
        .patch("/v1/invites/00000000-0000-0000-0000-000000000000/revoke")
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(404);
    });

    it("should return 400 for invalid UUID", async () => {
      const res = await request
        .patch("/v1/invites/not-a-uuid/revoke")
        .set("Cookie", ownerCookies);

      expect(res.status).toBe(400);
    });

    it("should return 401 without auth", async () => {
      const res = await request.patch(`/v1/invites/${revokeInviteId}/revoke`);

      expect(res.status).toBe(401);
    });
  });

  describe("POST /v1/auth/register (with inviteToken)", () => {
    let signupInviteToken: string;

    beforeAll(async () => {
      const res = await request
        .post("/v1/invites")
        .set("Cookie", ownerCookies)
        .send({ email: "newbie@example.com" });

      signupInviteToken = res.body.data.token;
    });

    it("should register a new user via invite token", async () => {
      const res = await request.post("/v1/auth/register").send({
        email: "newbie@example.com",
        password: "securepass1",
        name: "Newbie",
        inviteToken: signupInviteToken,
      });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.email).toBe("newbie@example.com");

      // Should have set cookies
      const cookies = res.headers["set-cookie"] as unknown as string[];
      expect(cookies.some((c: string) => c.includes("access_token"))).toBe(
        true,
      );
    });

    it("should not allow reuse of consumed invite token", async () => {
      const res = await request.post("/v1/auth/register").send({
        email: "newbie2@example.com",
        password: "securepass1",
        name: "Newbie2",
        inviteToken: signupInviteToken,
      });

      expect(res.status).toBe(410);
    });

    it("should reject invite if email doesn't match", async () => {
      // Create another invite
      const inviteRes = await request
        .post("/v1/invites")
        .set("Cookie", ownerCookies)
        .send({ email: "specific@example.com" });

      const res = await request.post("/v1/auth/register").send({
        email: "wrong@example.com",
        password: "securepass1",
        name: "Wrong Person",
        inviteToken: inviteRes.body.data.token,
      });

      expect(res.status).toBe(403);
    });

    it("should reject register with bogus invite token", async () => {
      const res = await request.post("/v1/auth/register").send({
        email: "nobody@example.com",
        password: "securepass1",
        name: "Nobody",
        inviteToken: "totally-fake-token",
      });

      expect(res.status).toBe(404);
    });

    it("should reject register with revoked invite", async () => {
      // Create + revoke
      const inviteRes = await request
        .post("/v1/invites")
        .set("Cookie", ownerCookies)
        .send({ email: "revoked@example.com" });

      await request
        .patch(`/v1/invites/${inviteRes.body.data.id}/revoke`)
        .set("Cookie", ownerCookies);

      const res = await request.post("/v1/auth/register").send({
        email: "revoked@example.com",
        password: "securepass1",
        name: "Revoked",
        inviteToken: inviteRes.body.data.token,
      });

      expect(res.status).toBe(410);
    });
  });
});
