-- DropIndex
DROP INDEX "Category_name_trgm_idx";

-- DropIndex
DROP INDEX "Category_slug_trgm_idx";

-- DropIndex
DROP INDEX "Resource_description_trgm_idx";

-- DropIndex
DROP INDEX "Resource_slug_trgm_idx";

-- DropIndex
DROP INDEX "Resource_title_trgm_idx";

-- DropIndex
DROP INDEX "Tag_name_trgm_idx";

-- DropIndex
DROP INDEX "Tag_slug_trgm_idx";

-- AlterTable
ALTER TABLE "ResourceAIDraft" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "providerImage" TEXT;
