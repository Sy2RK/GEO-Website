export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Guru GEO Wiki API",
    version: "1.0.0"
  },
  servers: [
    {
      url: "http://localhost:8080"
    }
  ],
  paths: {
    "/api/site/config": {
      get: {
        summary: "Get site config"
      }
    },
    "/api/homepage": {
      get: {
        summary: "Get homepage by locale"
      }
    },
    "/api/products": {
      get: {
        summary: "List products"
      }
    },
    "/api/products/{canonicalId}": {
      get: {
        summary: "Get product detail"
      }
    },
    "/api/collections/{collectionId}": {
      get: {
        summary: "Get collection"
      }
    },
    "/api/leaderboards/{boardId}": {
      get: {
        summary: "Get leaderboard"
      }
    },
    "/api/media": {
      get: {
        summary: "Get media assets"
      }
    },
    "/api/sitemap/index.xml": {
      get: {
        summary: "Sitemap index"
      }
    },
    "/api/admin/products": {
      post: {
        summary: "Create product"
      },
      patch: {
        summary: "Patch product"
      }
    },
    "/api/admin/products/{canonicalId}": {
      delete: {
        summary: "Delete product (soft-delete to archived)"
      }
    },
    "/api/admin/products/{canonicalId}/docs/{locale}/draft": {
      post: {
        summary: "Upsert product draft"
      },
      patch: {
        summary: "Patch product draft"
      }
    },
    "/api/admin/products/{canonicalId}/docs/{locale}/publish": {
      post: {
        summary: "Publish product draft"
      }
    },
    "/api/admin/homepage/{locale}/draft": {
      post: {
        summary: "Upsert homepage draft"
      }
    },
    "/api/admin/homepage/{locale}/publish": {
      post: {
        summary: "Publish homepage draft"
      }
    },
    "/api/admin/media": {
      post: {
        summary: "Create media asset"
      }
    },
    "/api/admin/media/{id}": {
      patch: {
        summary: "Update media asset"
      },
      delete: {
        summary: "Delete media asset"
      }
    },
    "/api/admin/batch/validate": {
      post: {
        summary: "Batch dry-run validation"
      }
    },
    "/api/admin/batch/upsert": {
      post: {
        summary: "Batch upsert"
      }
    },
    "/api/skills/list": {
      get: {
        summary: "List skills"
      }
    },
    "/api/skills/run": {
      post: {
        summary: "Run skill"
      }
    }
  }
};
