/*
  Warnings:

  - You are about to drop the column `tenant_id` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'MEMBER');

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_tenant_id_fkey";

-- DropIndex
DROP INDEX "users_tenant_id_idx";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "tenant_id";

-- CreateTable
CREATE TABLE "tenant_members" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_invites" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "tenant_id" UUID NOT NULL,
    "invited_by" UUID NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_members_user_id_idx" ON "tenant_members"("user_id");

-- CreateIndex
CREATE INDEX "tenant_members_tenant_id_idx" ON "tenant_members"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_members_user_id_tenant_id_key" ON "tenant_members"("user_id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_invites_token_key" ON "tenant_invites"("token");

-- CreateIndex
CREATE INDEX "tenant_invites_token_idx" ON "tenant_invites"("token");

-- CreateIndex
CREATE INDEX "tenant_invites_tenant_id_idx" ON "tenant_invites"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_invites_email_tenant_id_key" ON "tenant_invites"("email", "tenant_id");

-- AddForeignKey
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_invites" ADD CONSTRAINT "tenant_invites_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_invites" ADD CONSTRAINT "tenant_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
