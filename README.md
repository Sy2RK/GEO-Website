# Guru Game

生产级 GEO/SEO 导向 Web 应用（Monorepo）：
- `apps/api`: Fastify + Prisma + PostgreSQL（REST + OpenAPI + JWT/RBAC）
- `apps/web`: Next.js App Router（Public + Admin + Preview）
- `packages/shared`: 前后端共享类型/schema

## 技术栈选择理由（简短）
- **Next.js App Router**：天然支持 SSR/首屏渲染、按路径语言路由（`/zh`、`/en`）、SEO metadata/canonical/hreflang。
- **Fastify + Prisma + PostgreSQL(JSONB)**：接口性能稳定，JSONB 适合可扩展内容模型（无需频繁迁移）。
- **Monorepo**：共享类型与校验规则，降低前后端字段漂移。

## 目录结构
```text
.
├─ apps
│  ├─ api
│  │  ├─ prisma
│  │  │  ├─ schema.prisma
│  │  │  ├─ migrations/202602100001_init/migration.sql
│  │  │  └─ seed.ts
│  │  ├─ scripts/batch-upsert.ts
│  │  ├─ src
│  │  │  ├─ routes/{auth,public,admin}.ts
│  │  │  ├─ services/{core,admin,skill,sitemap-service}.ts
│  │  │  ├─ utils/{jsonld,sitemap,locked-fields,workflow,slug,diff}.ts
│  │  │  ├─ schemas/form-schemas.ts
│  │  │  ├─ openapi.ts
│  │  │  ├─ app.ts
│  │  │  └─ server.ts
│  │  └─ tests/*.test.ts
│  └─ web
│     ├─ app
│     │  ├─ [locale]/... (home/products/collections/leaderboards)
│     │  └─ admin/... (login/products/homepage/leaderboards/collections/skills)
│     ├─ components/*
│     ├─ lib/*
│     └─ middleware.ts
├─ packages
│  └─ shared/src/index.ts
├─ docker-compose.yml
├─ Dockerfile.api
├─ Dockerfile.web
└─ README.md
```

## 数据库表设计与关键索引
见 `apps/api/prisma/schema.prisma` 与 `apps/api/prisma/migrations/202602100001_init/migration.sql`。

### 主要表
- `Product`：稳定 `canonicalId` + `slugByLocale(JSONB)` + taxonomy/platforms
- `ProductDoc`：`locale + state(draft/published) + revision + content(JSONB) + lockedFields(JSONB)`
- `CollectionDoc`：`collectionId + locale + state + content(JSONB) + slugByLocale`
- `LeaderboardDoc`：`boardId + locale + state + mode + content(JSONB)`
- `HomepageConfig`：`locale + state + content(JSONB)`
- `RedirectMap`：slug 变更后的 301 映射
- `MediaAsset`：owner 维度媒体扩展（image/video/presskit/icon/cover）
- `User`：JWT 登录 + RBAC
- `AuditLog`：所有写操作 diff 审计

### 关键索引
- `Product.canonicalId` unique
- `ProductDoc(productId, locale, state)` unique
- `CollectionDoc(collectionId, locale, state)` unique
- `LeaderboardDoc(boardId, locale, state)` unique
- `HomepageConfig(locale, state)` unique
- `RedirectMap(locale, fromPath)` unique
- `Product.typeTaxonomy` / `Product.platforms` GIN
- `MediaAsset(ownerType, ownerId)`

## API 路由与示例响应

### 公开读
- `GET /api/site/config`
- `GET /api/homepage?locale=zh-CN[&state=draft]`
- `GET /api/products?locale=zh-CN&type=game&platform=ios&search=xxx&collectionId=...`
- `GET /api/products/{canonicalId}?locale=zh-CN`
- `GET /api/products/slug/{slug}?locale=zh-CN`
- `GET /api/collections/{collectionId}?locale=zh-CN`
- `GET /api/collections/slug/{slug}?locale=zh-CN`
- `GET /api/leaderboards/{boardId}?locale=zh-CN`
- `GET /api/media?ownerType=product&ownerId=...`
- `GET /api/redirects/resolve?path=/zh/products/old-slug`
- `GET /api/sitemap/index.xml` + `GET /api/sitemap/{zh|en}-{products|collections|leaderboards|homepage}.xml`
- `GET /api/skills/list`
- `POST /api/skills/run`

#### 首页响应（节选）
```json
{
  "locale": "zh-CN",
  "state": "published",
  "content": { "featured": [], "leaderboardRefs": [], "collectionRefs": [] },
  "featured": [{ "canonicalId": "guru:product:goodstriplematch", "card": { "name": "Goods TripleMatch" } }],
  "leaderboards": [],
  "collections": [],
  "canEdit": true,
  "editUrl": "/admin/homepage/zh-CN"
}
```

### 管理端（editor+）
- `POST/PATCH /api/admin/products`
- `GET /api/admin/products`
- `GET /api/admin/products/{canonicalId}/docs/{locale}/draft`
- `POST/PATCH /api/admin/products/{canonicalId}/docs/{locale}/draft`
- `POST /api/admin/products/{canonicalId}/docs/{locale}/publish`
- `GET /api/admin/homepage/{locale}`
- `POST /api/admin/homepage/{locale}/draft`
- `POST /api/admin/homepage/{locale}/publish`
- `GET /api/admin/leaderboards/{boardId}/{locale}`
- `POST /api/admin/leaderboards/{boardId}/{locale}/draft`
- `POST /api/admin/leaderboards/{boardId}/{locale}/publish`
- `GET /api/admin/collections/{collectionId}/{locale}`
- `POST /api/admin/collections/{collectionId}/{locale}/draft`
- `POST /api/admin/collections/{collectionId}/{locale}/publish`
- `POST /api/admin/media`
- `PATCH /api/admin/media/{id}`
- `DELETE /api/admin/media/{id}`
- `GET /api/admin/audit-logs`
- `POST /api/admin/batch/validate`
- `POST /api/admin/batch/upsert`
- `GET /api/admin/schema/{entityType}`

### 鉴权
- `POST /api/auth/login`
- `GET /api/auth/me`

### OpenAPI
- `GET /openapi.json`

## 前端路由与页面结构（组件树）

### Public Site（SSR）
- `/zh`, `/en`
- `/{locale}/products/{slug}`
- `/{locale}/collections/{slug}`
- `/{locale}/leaderboards/{boardId}`

#### 首页组件树
- `LocaleLayout`
- `LanguageSwitch`
- `FeaturedCarousel`
- `Leaderboard cards`
- `Collection cards`
- `SearchPanel`
- `JsonLdScript`

#### 产品详情组件树
- `JsonLdScript`
- `canonical summary / definition / mechanics / value / keywords`
- `media list`
- `edit button (canEdit=true)`

### Admin Console
- `/admin/login`
- `/admin/products`
- `/admin/products/{canonicalId}?locale=zh-CN|en`
- `/admin/homepage/{locale}`
- `/admin/leaderboards/{boardId}/{locale}`
- `/admin/collections/{collectionId}/{locale}`
- `/admin/skills`
- 各编辑页内置 Media 管理（新增/排序 sortOrder/删除/altText）

## Admin 表单如何映射 JSONB content（schema 驱动）
- 后端：`GET /api/admin/schema/{entityType}` 返回 section + field 定义（key/path/type/readOnlyFor）
- 前端：`SchemaForm` 按 field `key`（如 `geo.keywords`）做路径读写
- 锁字段：`canonicalSummary` 在 schema 中标记 `readOnlyFor: [viewer, editor]`，服务端再次强校验 `lockedFields`
- 扩展字段：新增 JSONB 字段时只需更新 schema，无需大改前端组件

## JSON-LD 示例（Goods TripleMatch）
产品页（game -> `VideoGame`）：
```json
{
  "@context": "https://schema.org",
  "@type": "VideoGame",
  "@id": "https://example.com/en/products/goods-triple-match",
  "url": "https://example.com/en/products/goods-triple-match",
  "inLanguage": "en",
  "name": "Goods TripleMatch",
  "description": "Goods TripleMatch is a casual puzzle game built on 3D sorting and triple-match loops with accessible progression."
}
```

## 关键边界条件与测试用例
已覆盖（`apps/api/tests`）：
- `rbac.test.ts`：viewer/editor/admin 权限判定
- `locked-fields.test.ts`：非 admin 修改锁字段被拒
- `draft-publish.test.ts`：draft/publish revision 递增逻辑
- `redirect.test.ts`：slug 变更生成 redirect
- `jsonld.test.ts`：game 类型输出 `VideoGame`
- `sitemap.test.ts`：sitemap 与 index XML 生成

## 批量改库

### API
- `POST /api/admin/batch/validate`
- `POST /api/admin/batch/upsert`

请求体：
```json
{
  "entityType": "product|productDoc|homepage|leaderboard|collection|media",
  "locale": "zh-CN",
  "items": [{ "...": "..." }]
}
```

### CLI
脚本：`apps/api/scripts/batch-upsert.ts`

示例：
```bash
npm run batch -w @guru/api -- --file ./data/products.json --entityType productDoc --locale zh-CN --mode dry-run --role editor --actor cli
npm run batch -w @guru/api -- --file ./data/products.yaml --entityType productDoc --locale zh-CN --mode apply --role admin --actor cli
```

支持：CSV/JSON/YAML、dry-run/apply、变更统计 diff 输出。

## 本地启动

### 1) 环境变量
复制 `.env.example` 到 `.env` 并按需调整。
如需在后台使用“跨语言自动生成”技能（qwen-plus），请额外配置：
```bash
DASHSCOPE_API_KEY=your_dashscope_key
```

### 2) 安装依赖
```bash
npm install
```

### 3) 数据库迁移与种子
```bash
npm run db:migrate
npm run db:seed
```

### 4) 启动
```bash
npm run dev
```
- Web: `http://localhost:3000`
- API: `http://localhost:8080`
- OpenAPI: `http://localhost:8080/openapi.json`

### 种子账号
- admin: `admin@guru.local / Admin123!`
- editor: `editor@guru.local / Editor123!`
- viewer: `viewer@guru.local / Viewer123!`

## Docker Compose
```bash
docker compose up --build
```
服务：`db + api + web`

## 部署建议
- API 与 Web 分容器部署，统一由反向代理做 TLS + gzip/brotli。
- API 使用连接池（PgBouncer）并开启慢查询日志。
- Web 使用 CDN 缓存公开页面；admin 路径不缓存。
- 对 `/api/sitemap/*` 与 `openapi.json` 做定时健康检查。
