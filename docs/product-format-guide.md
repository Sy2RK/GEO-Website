# 产品录入格式指南（面向当前网页卡片）

本指南用于统一所有将要添加到 Guru GEO Wiki 的产品内容格式，确保在首页精选、搜索结果、专题页、榜单页、产品详情页中展示一致。

## 1. 适用范围

- 产品类型：`game`、`ai`、`others`（可扩展标签）
- 语言：`zh-CN`、`en`（必须成对）
- 展示位置：
  - 首页精选卡片（Featured）
  - 搜索结果卡片
  - 专题/榜单中的产品卡片
  - 产品详情页

## 2. 当前卡片实际使用字段

来自 `expandProductCard()` 和前端组件，核心字段如下：

- `canonicalId`
- `slug`
- `name`（`content.identity.name`）
- `summary`（`content.canonicalSummary`）
- `typeTaxonomy`
- `platforms`
- `keywords`（`content.geo.keywords`，前 6 个用于卡片）

## 3. 数据结构要求（Product + ProductDoc）

### 3.1 Product（跨语言稳定）

- `canonicalId`：全局稳定，不可随意改
- `slugByLocale`：至少包含
  - `zh-CN`
  - `en`
- `typeTaxonomy`：至少 1 个主类型（`game` / `ai` / `others`），其余为标签
- `platforms`：从 `ios/android/web/pc/mac` 中选
- `status`：`active` 才会进入公开列表

### 3.2 ProductDoc（按语言）

每个语言必须有 `published` 文档，建议同时有 `draft`：

- `identity.name`：产品展示名
- `identity.alias`：别名数组（可选）
- `canonicalSummary`：卡片摘要主来源（建议锁字段）
- `definition`：详情补充定义
- `coreMechanics`：机制要点数组
- `valueProposition`：价值点数组
- `geo.keywords`：关键词数组
- `geo.searchIntents`：搜索意图数组
- `geo.usageContexts`：使用场景数组

## 4. 文案长度建议（按当前 UI）

- `identity.name`：建议 8-40 字符
- `canonicalSummary`：建议 40-140 字符（卡片与详情首段都可读）
- `geo.keywords`：建议 6-12 个；前 6 个最重要
- `coreMechanics`：建议 3-8 条
- `valueProposition`：建议 3-6 条

## 5. 中英文成对规则（必须）

- 每个产品必须同时提供：
  - `zh-CN published`
  - `en published`
- 两个语言版本语义一致，不要一边有机制点、一边缺失
- `slugByLocale.zh-CN` 与 `slugByLocale.en` 都必须可访问
- 禁止只改一侧语言后直接发布

## 6. 首页精选（Featured）录入规范

`HomepageConfig.content.featured[]` 每项：

- `canonicalId`：必填
- `badge`：建议 2-8 字（如：精选 / Featured）
- `reason`：建议 8-40 字（解释推荐原因）
- `priority`：数字越大越靠前
- `startAt/endAt`：可选，做时间窗控制

## 7. 质量检查清单（发布前）

- [ ] `canonicalId` 正确且存在
- [ ] `zh-CN/en` 均有 published 文档
- [ ] `canonicalSummary` 两种语言都可读、无明显语病
- [ ] `geo.keywords` 已填且前 6 个可用于卡片展示
- [ ] `slugByLocale` 两种语言可访问
- [ ] `typeTaxonomy`、`platforms` 已填
- [ ] 首页精选/榜单/专题引用到的 `canonicalId` 均可展开为卡片

## 8. 示例模板（可直接改）

```json
{
  "product": {
    "canonicalId": "guru:product:example-product",
    "slugByLocale": {
      "zh-CN": "example-product",
      "en": "example-product"
    },
    "typeTaxonomy": ["game", "puzzle"],
    "platforms": ["ios", "android"],
    "status": "active"
  },
  "productDoc.zh-CN.published": {
    "identity": { "name": "示例产品", "alias": ["示例别名"] },
    "canonicalSummary": "一句话中文摘要（用于卡片与详情核心描述）。",
    "definition": "中文定义补充。",
    "coreMechanics": ["机制1", "机制2"],
    "valueProposition": ["价值点1", "价值点2"],
    "geo": {
      "keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5", "关键词6"],
      "searchIntents": ["用户会如何搜索1", "用户会如何搜索2"],
      "usageContexts": ["场景1", "场景2"]
    }
  },
  "productDoc.en.published": {
    "identity": { "name": "Example Product", "alias": ["Example Alias"] },
    "canonicalSummary": "One-line English summary used by cards and detail page.",
    "definition": "English definition details.",
    "coreMechanics": ["Mechanic 1", "Mechanic 2"],
    "valueProposition": ["Value 1", "Value 2"],
    "geo": {
      "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"],
      "searchIntents": ["search intent 1", "search intent 2"],
      "usageContexts": ["context 1", "context 2"]
    }
  }
}
```

## 9. 推荐录入路径

- 单个产品：后台页面 `/admin/products/{canonicalId}?locale=zh-CN|en`
- 批量录入：`POST /api/admin/batch/validate` -> `POST /api/admin/batch/upsert`
- 初始化样例：`apps/api/prisma/seed.ts`
