-- CreateEnum
CREATE TYPE "ResourceLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ResourceLicense" AS ENUM ('PERSONAL_USE', 'COMMERCIAL_USE', 'EXTENDED_LICENSE');

-- CreateEnum
CREATE TYPE "ResourceVisibility" AS ENUM ('PUBLIC', 'UNLISTED');

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "level" "ResourceLevel",
ADD COLUMN     "license" "ResourceLicense",
ADD COLUMN     "visibility" "ResourceVisibility";
