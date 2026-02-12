import { Prisma } from "@prisma/client";
import type { UserRole } from "@guru/shared";
import { batchEntitySchema } from "@guru/shared";
import { prisma } from "../lib/prisma";
import { buildDiff } from "../utils/diff";
import { assertLockedFieldsUnchanged } from "../utils/locked-fields";
import { collectionPath, homepagePath, leaderboardPath, productPath } from "../utils/slug";
import { buildSlugRedirects, nextDraftRevision, nextPublishedRevision } from "../utils/workflow";
import { getLocaleValue } from "./core-service";

type AuditInput = {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  locale?: string | null;
  before: unknown;
  after: unknown;
};

export async function writeAuditLog(input: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      locale: input.locale ?? null,
      diff: buildDiff(input.before, input.after)
    }
  });
}

export async function patchProduct(input: {
  canonicalId: string;
  patch: Record<string, unknown>;
  actorId?: string;
}): Promise<unknown> {
  const product = await prisma.product.findUnique({ where: { canonicalId: input.canonicalId } });
  if (!product) {
    throw new Error("product_not_found");
  }

  const before = product;
  const slugBefore = product.slugByLocale as Record<string, string>;

  const data: Prisma.ProductUpdateInput = {
    ...(input.patch.slugByLocale ? { slugByLocale: input.patch.slugByLocale as Prisma.JsonValue } : {}),
    ...(input.patch.typeTaxonomy ? { typeTaxonomy: input.patch.typeTaxonomy as string[] } : {}),
    ...(input.patch.developer ? { developer: String(input.patch.developer) } : {}),
    ...(input.patch.publisher ? { publisher: String(input.patch.publisher) } : {}),
    ...(input.patch.brand ? { brand: String(input.patch.brand) } : {}),
    ...(input.patch.platforms ? { platforms: input.patch.platforms as Array<"ios" | "android" | "web" | "pc" | "mac"> } : {}),
    ...(input.patch.storeLinks ? { storeLinks: input.patch.storeLinks as Prisma.JsonValue } : {}),
    ...(input.patch.status ? { status: input.patch.status as "active" | "archived" } : {})
  };

  const updated = await prisma.product.update({ where: { canonicalId: input.canonicalId }, data });

  const slugAfter = updated.slugByLocale as Record<string, string>;

  for (const redirect of buildSlugRedirects({
    oldSlugByLocale: slugBefore,
    newSlugByLocale: slugAfter,
    pathBuilder: productPath
  })) {
    await prisma.redirectMap.upsert({
      where: {
        locale_fromPath: {
          locale: redirect.locale,
          fromPath: redirect.fromPath
        }
      },
      create: {
        locale: redirect.locale,
        fromPath: redirect.fromPath,
        toPath: redirect.toPath
      },
      update: {
        toPath: redirect.toPath
      }
    });
  }

  await writeAuditLog({
    actorId: input.actorId,
    action: "product.patch",
    entityType: "product",
    entityId: updated.canonicalId,
    before,
    after: updated
  });

  return updated;
}

export async function createProduct(input: {
  payload: Record<string, unknown>;
  actorId?: string;
}): Promise<unknown> {
  const created = await prisma.product.create({
    data: {
      canonicalId: String(input.payload.canonicalId),
      slugByLocale: (input.payload.slugByLocale as Prisma.JsonValue) ?? { "zh-CN": "", en: "" },
      typeTaxonomy: (input.payload.typeTaxonomy as string[]) ?? [],
      developer: input.payload.developer ? String(input.payload.developer) : null,
      publisher: input.payload.publisher ? String(input.payload.publisher) : null,
      brand: input.payload.brand ? String(input.payload.brand) : null,
      platforms: ((input.payload.platforms as string[]) ?? []) as Array<
        "ios" | "android" | "web" | "pc" | "mac"
      >,
      storeLinks: (input.payload.storeLinks as Prisma.JsonValue) ?? {},
      status: (input.payload.status as "active" | "archived") ?? "active"
    }
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "product.create",
    entityType: "product",
    entityId: created.canonicalId,
    before: null,
    after: created
  });

  return created;
}

export async function upsertProductDraft(input: {
  canonicalId: string;
  locale: string;
  content: Record<string, unknown>;
  lockedFields?: Record<string, unknown>;
  role: UserRole;
  actorId?: string;
}): Promise<unknown> {
  const product = await prisma.product.findUnique({ where: { canonicalId: input.canonicalId } });
  if (!product) {
    throw new Error("product_not_found");
  }

  const [draft, published] = await Promise.all([
    prisma.productDoc.findUnique({
      where: {
        productId_locale_state: {
          productId: product.id,
          locale: input.locale,
          state: "draft"
        }
      }
    }),
    prisma.productDoc.findUnique({
      where: {
        productId_locale_state: {
          productId: product.id,
          locale: input.locale,
          state: "published"
        }
      }
    })
  ]);

  const base = (draft?.content ?? published?.content ?? {}) as Record<string, unknown>;
  const currentLockedFields = (draft?.lockedFields ?? published?.lockedFields ?? {}) as Record<string, unknown>;

  assertLockedFieldsUnchanged({
    role: input.role,
    lockedFields: currentLockedFields,
    previousContent: base,
    nextContent: input.content
  });

  if (input.lockedFields && input.role !== "admin") {
    throw new Error("locked_fields_admin_only");
  }

  const before = draft;
  const nextRevision = nextDraftRevision(draft?.revision);
  const updated = await prisma.productDoc.upsert({
    where: {
      productId_locale_state: {
        productId: product.id,
        locale: input.locale,
        state: "draft"
      }
    },
    update: {
      content: input.content,
      updatedBy: input.actorId,
      revision: nextRevision,
      ...(input.lockedFields && input.role === "admin"
        ? { lockedFields: input.lockedFields as Prisma.JsonValue }
        : {})
    },
    create: {
      productId: product.id,
      locale: input.locale,
      state: "draft",
      revision: 1,
      content: input.content,
      lockedFields: (input.lockedFields ?? currentLockedFields) as Prisma.JsonValue,
      createdBy: input.actorId,
      updatedBy: input.actorId
    }
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "productDoc.draft.upsert",
    entityType: "productDoc",
    entityId: input.canonicalId,
    locale: input.locale,
    before,
    after: updated
  });

  return updated;
}

export async function publishProductDraft(input: {
  canonicalId: string;
  locale: string;
  actorId?: string;
}): Promise<unknown> {
  const product = await prisma.product.findUnique({ where: { canonicalId: input.canonicalId } });
  if (!product) {
    throw new Error("product_not_found");
  }

  const draft = await prisma.productDoc.findUnique({
    where: {
      productId_locale_state: {
        productId: product.id,
        locale: input.locale,
        state: "draft"
      }
    }
  });

  if (!draft) {
    throw new Error("draft_not_found");
  }

  const published = await prisma.productDoc.findUnique({
    where: {
      productId_locale_state: {
        productId: product.id,
        locale: input.locale,
        state: "published"
      }
    }
  });

  const before = published;
  const next = await prisma.productDoc.upsert({
    where: {
      productId_locale_state: {
        productId: product.id,
        locale: input.locale,
        state: "published"
      }
    },
    update: {
      content: draft.content,
      lockedFields: draft.lockedFields,
      updatedBy: input.actorId,
      revision: nextPublishedRevision(published?.revision),
      publishedAt: new Date()
    },
    create: {
      productId: product.id,
      locale: input.locale,
      state: "published",
      revision: 1,
      content: draft.content,
      lockedFields: draft.lockedFields,
      publishedAt: new Date(),
      createdBy: input.actorId,
      updatedBy: input.actorId
    }
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "productDoc.publish",
    entityType: "productDoc",
    entityId: input.canonicalId,
    locale: input.locale,
    before,
    after: next
  });

  return next;
}

export async function upsertHomepageDraft(input: {
  locale: string;
  content: Record<string, unknown>;
  actorId?: string;
}): Promise<unknown> {
  const before = await prisma.homepageConfig.findUnique({
    where: {
      locale_state: {
        locale: input.locale,
        state: "draft"
      }
    }
  });

  const updated = await prisma.homepageConfig.upsert({
    where: {
      locale_state: {
        locale: input.locale,
        state: "draft"
      }
    },
    update: {
      content: input.content,
      updatedBy: input.actorId,
      revision: nextDraftRevision(before?.revision)
    },
    create: {
      locale: input.locale,
      state: "draft",
      revision: 1,
      content: input.content,
      createdBy: input.actorId,
      updatedBy: input.actorId
    }
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "homepage.draft.upsert",
    entityType: "homepage",
    entityId: input.locale,
    locale: input.locale,
    before,
    after: updated
  });

  return updated;
}

export async function publishHomepageDraft(input: {
  locale: string;
  actorId?: string;
}): Promise<unknown> {
  const draft = await prisma.homepageConfig.findUnique({
    where: {
      locale_state: {
        locale: input.locale,
        state: "draft"
      }
    }
  });
  if (!draft) {
    throw new Error("draft_not_found");
  }

  const before = await prisma.homepageConfig.findUnique({
    where: {
      locale_state: {
        locale: input.locale,
        state: "published"
      }
    }
  });

  const updated = await prisma.homepageConfig.upsert({
    where: {
      locale_state: {
        locale: input.locale,
        state: "published"
      }
    },
    update: {
      content: draft.content,
      revision: nextPublishedRevision(before?.revision),
      updatedBy: input.actorId,
      publishedAt: new Date()
    },
    create: {
      locale: input.locale,
      state: "published",
      content: draft.content,
      revision: 1,
      createdBy: input.actorId,
      updatedBy: input.actorId,
      publishedAt: new Date()
    }
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "homepage.publish",
    entityType: "homepage",
    entityId: input.locale,
    locale: input.locale,
    before,
    after: updated
  });

  return updated;
}

export async function upsertLeaderboardDraft(input: {
  boardId: string;
  locale: string;
  mode: string;
  content: Record<string, unknown>;
  actorId?: string;
}) {
  const before = await prisma.leaderboardDoc.findUnique({
    where: {
      boardId_locale_state: {
        boardId: input.boardId,
        locale: input.locale,
        state: "draft"
      }
    }
  });

  const updated = await prisma.leaderboardDoc.upsert({
    where: {
      boardId_locale_state: {
        boardId: input.boardId,
        locale: input.locale,
        state: "draft"
      }
    },
    update: {
      content: input.content,
      mode: input.mode,
      updatedBy: input.actorId,
      revision: nextDraftRevision(before?.revision)
    },
    create: {
      boardId: input.boardId,
      locale: input.locale,
      state: "draft",
      mode: input.mode,
      content: input.content,
      revision: 1,
      createdBy: input.actorId,
      updatedBy: input.actorId
    }
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "leaderboard.draft.upsert",
    entityType: "leaderboard",
    entityId: input.boardId,
    locale: input.locale,
    before,
    after: updated
  });

  return updated;
}

export async function publishLeaderboardDraft(input: {
  boardId: string;
  locale: string;
  actorId?: string;
}) {
  const draft = await prisma.leaderboardDoc.findUnique({
    where: {
      boardId_locale_state: {
        boardId: input.boardId,
        locale: input.locale,
        state: "draft"
      }
    }
  });

  if (!draft) {
    throw new Error("draft_not_found");
  }

  const before = await prisma.leaderboardDoc.findUnique({
    where: {
      boardId_locale_state: {
        boardId: input.boardId,
        locale: input.locale,
        state: "published"
      }
    }
  });

  const updated = await prisma.leaderboardDoc.upsert({
    where: {
      boardId_locale_state: {
        boardId: input.boardId,
        locale: input.locale,
        state: "published"
      }
    },
    update: {
      content: draft.content,
      mode: draft.mode,
      revision: nextPublishedRevision(before?.revision),
      updatedBy: input.actorId,
      publishedAt: new Date()
    },
    create: {
      boardId: input.boardId,
      locale: input.locale,
      state: "published",
      mode: draft.mode,
      content: draft.content,
      revision: 1,
      createdBy: input.actorId,
      updatedBy: input.actorId,
      publishedAt: new Date()
    }
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "leaderboard.publish",
    entityType: "leaderboard",
    entityId: input.boardId,
    locale: input.locale,
    before,
    after: updated
  });

  return updated;
}

export async function upsertCollectionDraft(input: {
  collectionId: string;
  locale: string;
  slugByLocale: Record<string, string>;
  content: Record<string, unknown>;
  actorId?: string;
}) {
  const before = await prisma.collectionDoc.findUnique({
    where: {
      collectionId_locale_state: {
        collectionId: input.collectionId,
        locale: input.locale,
        state: "draft"
      }
    }
  });

  const updated = await prisma.collectionDoc.upsert({
    where: {
      collectionId_locale_state: {
        collectionId: input.collectionId,
        locale: input.locale,
        state: "draft"
      }
    },
    update: {
      slugByLocale: input.slugByLocale,
      content: input.content,
      updatedBy: input.actorId,
      revision: nextDraftRevision(before?.revision)
    },
    create: {
      collectionId: input.collectionId,
      locale: input.locale,
      state: "draft",
      slugByLocale: input.slugByLocale,
      content: input.content,
      revision: 1,
      createdBy: input.actorId,
      updatedBy: input.actorId
    }
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "collection.draft.upsert",
    entityType: "collection",
    entityId: input.collectionId,
    locale: input.locale,
    before,
    after: updated
  });

  return updated;
}

export async function publishCollectionDraft(input: {
  collectionId: string;
  locale: string;
  actorId?: string;
}) {
  const draft = await prisma.collectionDoc.findUnique({
    where: {
      collectionId_locale_state: {
        collectionId: input.collectionId,
        locale: input.locale,
        state: "draft"
      }
    }
  });

  if (!draft) {
    throw new Error("draft_not_found");
  }

  const before = await prisma.collectionDoc.findUnique({
    where: {
      collectionId_locale_state: {
        collectionId: input.collectionId,
        locale: input.locale,
        state: "published"
      }
    }
  });

  const updated = await prisma.collectionDoc.upsert({
    where: {
      collectionId_locale_state: {
        collectionId: input.collectionId,
        locale: input.locale,
        state: "published"
      }
    },
    update: {
      slugByLocale: draft.slugByLocale,
      content: draft.content,
      revision: nextPublishedRevision(before?.revision),
      updatedBy: input.actorId,
      publishedAt: new Date()
    },
    create: {
      collectionId: input.collectionId,
      locale: input.locale,
      state: "published",
      slugByLocale: draft.slugByLocale,
      content: draft.content,
      revision: 1,
      createdBy: input.actorId,
      updatedBy: input.actorId,
      publishedAt: new Date()
    }
  });

  const oldSlug = before ? getLocaleValue(before.slugByLocale, input.locale) : null;
  const newSlug = getLocaleValue(updated.slugByLocale, input.locale);
  if (oldSlug && oldSlug !== newSlug) {
    await prisma.redirectMap.upsert({
      where: {
        locale_fromPath: {
          locale: input.locale,
          fromPath: collectionPath(input.locale, oldSlug)
        }
      },
      create: {
        locale: input.locale,
        fromPath: collectionPath(input.locale, oldSlug),
        toPath: collectionPath(input.locale, newSlug)
      },
      update: {
        toPath: collectionPath(input.locale, newSlug)
      }
    });
  }

  await writeAuditLog({
    actorId: input.actorId,
    action: "collection.publish",
    entityType: "collection",
    entityId: input.collectionId,
    locale: input.locale,
    before,
    after: updated
  });

  return updated;
}

export async function upsertMedia(input: {
  ownerType: "product" | "collection" | "leaderboard" | "homepage";
  ownerId: string;
  locale?: string;
  type: "image" | "video" | "presskit" | "icon" | "cover";
  url: string;
  meta?: Record<string, unknown>;
  actorId?: string;
}) {
  const created = await prisma.mediaAsset.create({
    data: {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      locale: input.locale ?? null,
      type: input.type,
      url: input.url,
      meta: input.meta ?? {}
    }
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "media.create",
    entityType: "media",
    entityId: created.id,
    locale: input.locale,
    before: null,
    after: created
  });

  return created;
}

export async function updateMedia(input: {
  id: string;
  patch: {
    locale?: string | null;
    type?: "image" | "video" | "presskit" | "icon" | "cover";
    url?: string;
    meta?: Record<string, unknown>;
  };
  actorId?: string;
}) {
  const before = await prisma.mediaAsset.findUnique({ where: { id: input.id } });
  if (!before) {
    throw new Error("media_not_found");
  }

  const updated = await prisma.mediaAsset.update({
    where: { id: input.id },
    data: {
      ...(input.patch.locale !== undefined ? { locale: input.patch.locale } : {}),
      ...(input.patch.type ? { type: input.patch.type } : {}),
      ...(input.patch.url ? { url: input.patch.url } : {}),
      ...(input.patch.meta ? { meta: input.patch.meta } : {})
    }
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "media.update",
    entityType: "media",
    entityId: updated.id,
    locale: updated.locale ?? undefined,
    before,
    after: updated
  });

  return updated;
}

export async function deleteMedia(input: { id: string; actorId?: string }) {
  const before = await prisma.mediaAsset.findUnique({ where: { id: input.id } });
  if (!before) {
    throw new Error("media_not_found");
  }

  await prisma.mediaAsset.delete({ where: { id: input.id } });

  await writeAuditLog({
    actorId: input.actorId,
    action: "media.delete",
    entityType: "media",
    entityId: input.id,
    locale: before.locale ?? undefined,
    before,
    after: null
  });

  return {
    id: input.id,
    deleted: true
  };
}

export async function validateBatchInput(input: {
  entityType: string;
  locale?: string;
  items: Array<Record<string, unknown>>;
}) {
  const parsed = batchEntitySchema.safeParse(input.entityType);
  if (!parsed.success) {
    return {
      valid: false,
      errors: [
        {
          index: -1,
          message: "invalid_entity_type"
        }
      ],
      stats: {
        total: input.items.length,
        create: 0,
        update: 0
      }
    };
  }

  const errors: Array<{ index: number; message: string }> = [];
  let createCount = 0;
  let updateCount = 0;

  for (const [index, item] of input.items.entries()) {
    try {
      switch (parsed.data) {
        case "product": {
          const canonicalId = String(item.canonicalId ?? "");
          if (!canonicalId) {
            throw new Error("canonicalId_required");
          }
          const exists = await prisma.product.findUnique({ where: { canonicalId } });
          exists ? (updateCount += 1) : (createCount += 1);
          break;
        }
        case "productDoc": {
          const canonicalId = String(item.canonicalId ?? "");
          const locale = String(item.locale ?? input.locale ?? "");
          if (!canonicalId || !locale) {
            throw new Error("canonicalId_and_locale_required");
          }
          const product = await prisma.product.findUnique({ where: { canonicalId } });
          if (!product) {
            throw new Error("product_not_found");
          }
          const exists = await prisma.productDoc.findUnique({
            where: {
              productId_locale_state: {
                productId: product.id,
                locale,
                state: "draft"
              }
            }
          });
          exists ? (updateCount += 1) : (createCount += 1);
          break;
        }
        case "homepage": {
          const locale = String(item.locale ?? input.locale ?? "");
          if (!locale) {
            throw new Error("locale_required");
          }
          const exists = await prisma.homepageConfig.findUnique({
            where: {
              locale_state: {
                locale,
                state: "draft"
              }
            }
          });
          exists ? (updateCount += 1) : (createCount += 1);
          break;
        }
        case "leaderboard": {
          const boardId = String(item.boardId ?? "");
          const locale = String(item.locale ?? input.locale ?? "");
          if (!boardId || !locale) {
            throw new Error("boardId_and_locale_required");
          }
          const exists = await prisma.leaderboardDoc.findUnique({
            where: {
              boardId_locale_state: {
                boardId,
                locale,
                state: "draft"
              }
            }
          });
          exists ? (updateCount += 1) : (createCount += 1);
          break;
        }
        case "collection": {
          const collectionId = String(item.collectionId ?? "");
          const locale = String(item.locale ?? input.locale ?? "");
          if (!collectionId || !locale) {
            throw new Error("collectionId_and_locale_required");
          }
          const exists = await prisma.collectionDoc.findUnique({
            where: {
              collectionId_locale_state: {
                collectionId,
                locale,
                state: "draft"
              }
            }
          });
          exists ? (updateCount += 1) : (createCount += 1);
          break;
        }
        case "media": {
          if (!item.ownerType || !item.ownerId || !item.type || !item.url) {
            throw new Error("ownerType_ownerId_type_url_required");
          }
          createCount += 1;
          break;
        }
        default:
          throw new Error("unsupported_entity_type");
      }
    } catch (error) {
      errors.push({
        index,
        message: error instanceof Error ? error.message : "unknown_validation_error"
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    stats: {
      total: input.items.length,
      create: createCount,
      update: updateCount
    }
  };
}

export async function batchUpsert(input: {
  entityType: string;
  locale?: string;
  items: Array<Record<string, unknown>>;
  role: UserRole;
  actorId?: string;
}) {
  const validation = await validateBatchInput(input);
  if (!validation.valid) {
    return {
      ...validation,
      applied: 0
    };
  }

  let applied = 0;

  for (const item of input.items) {
    switch (input.entityType) {
      case "product": {
        const canonicalId = String(item.canonicalId);
        const exists = await prisma.product.findUnique({ where: { canonicalId } });
        if (exists) {
          await patchProduct({ canonicalId, patch: item, actorId: input.actorId });
        } else {
          await createProduct({ payload: item, actorId: input.actorId });
        }
        applied += 1;
        break;
      }
      case "productDoc": {
        const locale = String(item.locale ?? input.locale);
        await upsertProductDraft({
          canonicalId: String(item.canonicalId),
          locale,
          content: (item.content as Record<string, unknown>) ?? {},
          lockedFields: item.lockedFields as Record<string, unknown> | undefined,
          role: input.role,
          actorId: input.actorId
        });
        applied += 1;
        break;
      }
      case "homepage": {
        const locale = String(item.locale ?? input.locale);
        await upsertHomepageDraft({
          locale,
          content: (item.content as Record<string, unknown>) ?? {},
          actorId: input.actorId
        });
        applied += 1;
        break;
      }
      case "leaderboard": {
        const locale = String(item.locale ?? input.locale);
        await upsertLeaderboardDraft({
          boardId: String(item.boardId),
          locale,
          mode: String(item.mode ?? "manual"),
          content: (item.content as Record<string, unknown>) ?? {},
          actorId: input.actorId
        });
        applied += 1;
        break;
      }
      case "collection": {
        const locale = String(item.locale ?? input.locale);
        await upsertCollectionDraft({
          collectionId: String(item.collectionId),
          locale,
          slugByLocale: (item.slugByLocale as Record<string, string>) ?? {
            "zh-CN": String(item.slug ?? ""),
            en: String(item.slug ?? "")
          },
          content: (item.content as Record<string, unknown>) ?? {},
          actorId: input.actorId
        });
        applied += 1;
        break;
      }
      case "media": {
        await upsertMedia({
          ownerType: item.ownerType as "product" | "collection" | "leaderboard" | "homepage",
          ownerId: String(item.ownerId),
          locale: item.locale ? String(item.locale) : undefined,
          type: item.type as "image" | "video" | "presskit" | "icon" | "cover",
          url: String(item.url),
          meta: (item.meta as Record<string, unknown>) ?? {},
          actorId: input.actorId
        });
        applied += 1;
        break;
      }
      default:
        throw new Error("unsupported_entity_type");
    }
  }

  await writeAuditLog({
    actorId: input.actorId,
    action: "batch.upsert",
    entityType: "batch",
    entityId: input.entityType,
    locale: input.locale,
    before: validation.stats,
    after: {
      ...validation.stats,
      applied
    }
  });

  return {
    ...validation,
    applied
  };
}

export async function ensureCollectionRedirectIfSlugChanged(input: {
  locale: string;
  oldSlugByLocale: Prisma.JsonValue;
  newSlugByLocale: Prisma.JsonValue;
}) {
  const oldSlug = getLocaleValue(input.oldSlugByLocale, input.locale);
  const newSlug = getLocaleValue(input.newSlugByLocale, input.locale);

  if (!oldSlug || !newSlug || oldSlug === newSlug) {
    return;
  }

  await prisma.redirectMap.upsert({
    where: {
      locale_fromPath: {
        locale: input.locale,
        fromPath: collectionPath(input.locale, oldSlug)
      }
    },
    create: {
      locale: input.locale,
      fromPath: collectionPath(input.locale, oldSlug),
      toPath: collectionPath(input.locale, newSlug)
    },
    update: {
      toPath: collectionPath(input.locale, newSlug)
    }
  });
}

export async function ensureHomepageRedirect(locale: string, oldLocalePath?: string, newLocalePath?: string) {
  if (!oldLocalePath || !newLocalePath || oldLocalePath === newLocalePath) {
    return;
  }

  await prisma.redirectMap.upsert({
    where: {
      locale_fromPath: {
        locale,
        fromPath: homepagePath(locale)
      }
    },
    create: {
      locale,
      fromPath: homepagePath(locale),
      toPath: homepagePath(locale)
    },
    update: {
      toPath: homepagePath(locale)
    }
  });
}

export async function ensureLeaderboardRedirect(locale: string, boardId: string) {
  await prisma.redirectMap.upsert({
    where: {
      locale_fromPath: {
        locale,
        fromPath: leaderboardPath(locale, boardId)
      }
    },
    create: {
      locale,
      fromPath: leaderboardPath(locale, boardId),
      toPath: leaderboardPath(locale, boardId)
    },
    update: {
      toPath: leaderboardPath(locale, boardId)
    }
  });
}

export function describeRedirectImpact(input: {
  locale: string;
  oldSlugByLocale: Prisma.JsonValue;
  newSlugByLocale: Prisma.JsonValue;
}) {
  const oldSlug = getLocaleValue(input.oldSlugByLocale, input.locale);
  const newSlug = getLocaleValue(input.newSlugByLocale, input.locale);

  return {
    locale: input.locale,
    fromPath: oldSlug ? collectionPath(input.locale, oldSlug) : null,
    toPath: newSlug ? collectionPath(input.locale, newSlug) : null
  };
}
