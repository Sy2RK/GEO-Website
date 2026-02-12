-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('active', 'archived');
CREATE TYPE "DocState" AS ENUM ('draft', 'published');
CREATE TYPE "Platform" AS ENUM ('ios', 'android', 'web', 'pc', 'mac');
CREATE TYPE "UserRole" AS ENUM ('viewer', 'editor', 'admin');
CREATE TYPE "MediaOwnerType" AS ENUM ('product', 'collection', 'leaderboard', 'homepage');
CREATE TYPE "MediaType" AS ENUM ('image', 'video', 'presskit', 'icon', 'cover');

-- CreateTable
CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "canonicalId" TEXT NOT NULL,
  "slugByLocale" JSONB NOT NULL,
  "typeTaxonomy" TEXT[] NOT NULL,
  "developer" TEXT,
  "publisher" TEXT,
  "brand" TEXT,
  "platforms" "Platform"[] NOT NULL,
  "storeLinks" JSONB,
  "status" "ProductStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductDoc" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "state" "DocState" NOT NULL DEFAULT 'draft',
  "revision" INTEGER NOT NULL DEFAULT 1,
  "content" JSONB NOT NULL,
  "lockedFields" JSONB NOT NULL DEFAULT '{}',
  "publishedAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductDoc_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CollectionDoc" (
  "id" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "slugByLocale" JSONB NOT NULL,
  "locale" TEXT NOT NULL,
  "state" "DocState" NOT NULL DEFAULT 'draft',
  "revision" INTEGER NOT NULL DEFAULT 1,
  "content" JSONB NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CollectionDoc_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeaderboardDoc" (
  "id" TEXT NOT NULL,
  "boardId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "state" "DocState" NOT NULL DEFAULT 'draft',
  "mode" TEXT NOT NULL DEFAULT 'manual',
  "autoRule" JSONB,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "content" JSONB NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeaderboardDoc_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HomepageConfig" (
  "id" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "state" "DocState" NOT NULL DEFAULT 'draft',
  "revision" INTEGER NOT NULL DEFAULT 1,
  "content" JSONB NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HomepageConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RedirectMap" (
  "id" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "fromPath" TEXT NOT NULL,
  "toPath" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RedirectMap_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'viewer',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "locale" TEXT,
  "diff" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL,
  "ownerType" "MediaOwnerType" NOT NULL,
  "ownerId" TEXT NOT NULL,
  "locale" TEXT,
  "type" "MediaType" NOT NULL,
  "url" TEXT NOT NULL,
  "meta" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "Product_canonicalId_key" ON "Product"("canonicalId");
CREATE INDEX "Product_status_idx" ON "Product"("status");
CREATE INDEX "Product_typeTaxonomy_idx" ON "Product" USING GIN("typeTaxonomy");
CREATE INDEX "Product_platforms_idx" ON "Product" USING GIN("platforms");
CREATE UNIQUE INDEX "Product_slug_zh_unique_idx"
  ON "Product" (("slugByLocale"->>'zh-CN'))
  WHERE ("slugByLocale"->>'zh-CN') IS NOT NULL AND ("slugByLocale"->>'zh-CN') <> '';
CREATE UNIQUE INDEX "Product_slug_en_unique_idx"
  ON "Product" (("slugByLocale"->>'en'))
  WHERE ("slugByLocale"->>'en') IS NOT NULL AND ("slugByLocale"->>'en') <> '';

CREATE UNIQUE INDEX "ProductDoc_productId_locale_state_key" ON "ProductDoc"("productId", "locale", "state");
CREATE INDEX "ProductDoc_locale_state_idx" ON "ProductDoc"("locale", "state");

CREATE UNIQUE INDEX "CollectionDoc_collectionId_locale_state_key" ON "CollectionDoc"("collectionId", "locale", "state");
CREATE INDEX "CollectionDoc_locale_state_idx" ON "CollectionDoc"("locale", "state");
CREATE UNIQUE INDEX "CollectionDoc_slug_zh_unique_idx"
  ON "CollectionDoc" (("slugByLocale"->>'zh-CN'), "locale", "state")
  WHERE ("slugByLocale"->>'zh-CN') IS NOT NULL AND ("slugByLocale"->>'zh-CN') <> '';
CREATE UNIQUE INDEX "CollectionDoc_slug_en_unique_idx"
  ON "CollectionDoc" (("slugByLocale"->>'en'), "locale", "state")
  WHERE ("slugByLocale"->>'en') IS NOT NULL AND ("slugByLocale"->>'en') <> '';

CREATE UNIQUE INDEX "LeaderboardDoc_boardId_locale_state_key" ON "LeaderboardDoc"("boardId", "locale", "state");
CREATE INDEX "LeaderboardDoc_locale_state_idx" ON "LeaderboardDoc"("locale", "state");

CREATE UNIQUE INDEX "HomepageConfig_locale_state_key" ON "HomepageConfig"("locale", "state");
CREATE INDEX "HomepageConfig_locale_state_idx" ON "HomepageConfig"("locale", "state");

CREATE UNIQUE INDEX "RedirectMap_locale_fromPath_key" ON "RedirectMap"("locale", "fromPath");
CREATE INDEX "RedirectMap_locale_idx" ON "RedirectMap"("locale");

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

CREATE INDEX "MediaAsset_ownerType_ownerId_idx" ON "MediaAsset"("ownerType", "ownerId");
CREATE INDEX "MediaAsset_locale_idx" ON "MediaAsset"("locale");

-- FK
ALTER TABLE "ProductDoc"
  ADD CONSTRAINT "ProductDoc_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
