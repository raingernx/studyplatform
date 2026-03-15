-- Add a dedicated creator activation flag without changing roles.
ALTER TABLE "User"
ADD COLUMN "creatorEnabled" BOOLEAN NOT NULL DEFAULT false;
