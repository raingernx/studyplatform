-- Migration: add fileKey column to Resource table
-- Run with: npx prisma migrate dev  (on your local machine)

ALTER TABLE "Resource" ADD COLUMN "fileKey" TEXT;
