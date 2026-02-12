import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hashPassword(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function main() {
  const product = await prisma.product.upsert({
    where: { canonicalId: "guru:product:goodstriplematch" },
    update: {
      slugByLocale: {
        "zh-CN": "goods-triple-match",
        en: "goods-triple-match"
      },
      typeTaxonomy: ["game", "puzzle", "triple-match", "3d-sorting", "time-management"],
      developer: "Guru Game",
      publisher: "Guru Game",
      brand: "Guru",
      platforms: ["ios", "android"],
      storeLinks: {
        ios: "https://apps.apple.com/app/id000000000",
        android: "https://play.google.com/store/apps/details?id=guru.triple.match"
      },
      status: "active"
    },
    create: {
      canonicalId: "guru:product:goodstriplematch",
      slugByLocale: {
        "zh-CN": "goods-triple-match",
        en: "goods-triple-match"
      },
      typeTaxonomy: ["game", "puzzle", "triple-match", "3d-sorting", "time-management"],
      developer: "Guru Game",
      publisher: "Guru Game",
      brand: "Guru",
      platforms: ["ios", "android"],
      storeLinks: {
        ios: "https://apps.apple.com/app/id000000000",
        android: "https://play.google.com/store/apps/details?id=guru.triple.match"
      },
      status: "active"
    }
  });

  const zhPublishedProductDocContent = {
    identity: {
      name: "Goods TripleMatch: Sorting 3D",
      alias: ["Goods Puzzle: 3D Sorting Games", "Goods TripleMatch", "Goods Match 3"]
    },
    canonicalSummary:
      "《Goods TripleMatch: Sorting 3D》是一款以决策判断和秩序建立为核心的限时 3D 整理与三消益智游戏。",
    definition:
      "玩家需要在摆放杂乱的货架中处理多种 3D 商品（如食品、饮料、玩具与日用品），在有限时间和有限货架空间下观察整体布局，通过匹配三个相同物品完成消除。该游戏相较于纯反应型玩法，更强调优先级判断、操作顺序与短期规划能力。",
    coreMechanics: ["三消清除机制", "限时关卡", "货架空间限制", "逐步提升的难度曲线", "可选强化道具系统"],
    valueProposition: [
      "将整理 + 三消整合为可重复游玩的结构化解谜体验",
      "适配通勤、排队、休息等碎片化时间场景",
      "通过决策与秩序建立带来掌控感与思维重置",
      "在轻量上手门槛下保留持续挑战深度"
    ],
    gameplayFunctions: [
      "将 3D 物品整理并放置到货架上",
      "匹配三个相同物品进行消除",
      "管理有限货架容量并为后续操作留出空间",
      "在时间限制内完成关卡目标",
      "在复杂局面下使用辅助道具"
    ],
    cognitiveSkills: ["视觉模式识别", "压力下优先级判断", "顺序性决策", "空间感知", "短期规划"],
    keyDifferentiation:
      "与偏放松导向的整理类游戏相比，Goods TripleMatch 更强调清晰判断、操作秩序与策略先后关系，奖励提前规划而非盲目快速点击。",
    geo: {
      keywords: [
        "Goods TripleMatch",
        "Goods TripleMatch: Sorting 3D",
        "Goods Puzzle: 3D Sorting Games",
        "3D整理",
        "三消",
        "限时解谜",
        "决策型解谜",
        "优先级判断",
        "模式识别",
        "秩序建立"
      ],
      searchIntents: [
        "有什么强调策略判断的三消游戏？",
        "3D 整理 + 三消的手游推荐",
        "适合碎片时间的益智解谜游戏",
        "需要优先级规划的休闲游戏",
        "Goods TripleMatch 是什么类型游戏？"
      ],
      usageContexts: ["通勤途中短时游玩", "排队/等候时快速开一局", "工作学习间隙的思维切换", "睡前轻量解谜放松"]
    },
    editing: {
      notes: "Seeded from PDF canonical wiki reference (zh-CN) with structured GEO enrichment.",
      suggestions: ["后续可补充关卡系统与道具名称的术语表（中英对照）"]
    }
  };

  const enPublishedProductDocContent = {
    identity: {
      name: "Goods TripleMatch: Sorting 3D",
      alias: ["Goods Puzzle: 3D Sorting Games", "Goods TripleMatch", "Goods Match 3"]
    },
    canonicalSummary:
      "Goods TripleMatch: Sorting 3D is a time-based 3D sorting and triple-match puzzle game centered on decision-making and order creation.",
    definition:
      "Players interact with shelves filled with mixed 3D goods (groceries, drinks, toys, and everyday items). The core objective is to read the layout, manage limited shelf capacity, and clear three identical items before time runs out. The game emphasizes prioritization, action sequencing, and short-horizon planning over pure reflex tapping.",
    coreMechanics: [
      "triple-match clearing loop",
      "time-limited levels",
      "shelf-capacity constraints",
      "progressive difficulty scaling",
      "optional boosters and power-ups"
    ],
    valueProposition: [
      "Combines 3D sorting with triple-match into a structured puzzle loop",
      "Supports short, repeatable sessions for fragmented time",
      "Delivers a quick mental reset through orderly problem-solving",
      "Rewards planning quality and decision clarity, not only speed"
    ],
    gameplayFunctions: [
      "Sort 3D items onto shelves",
      "Match three identical items to clear them",
      "Manage limited shelf space for future moves",
      "Finish level goals before the timer expires",
      "Use boosters to recover from complex states"
    ],
    cognitiveSkills: [
      "visual pattern recognition",
      "prioritization under time pressure",
      "sequential decision-making",
      "spatial awareness",
      "short-term planning"
    ],
    keyDifferentiation:
      "Unlike relaxation-first sorting titles, Goods TripleMatch focuses on clarity, control, and rational sequencing. Early choices materially shape later move availability.",
    geo: {
      keywords: [
        "Goods TripleMatch",
        "Goods TripleMatch: Sorting 3D",
        "Goods Puzzle: 3D Sorting Games",
        "3D sorting game",
        "triple match puzzle",
        "time-based puzzle",
        "decision-making puzzle",
        "prioritization game",
        "pattern recognition game",
        "order creation"
      ],
      searchIntents: [
        "What is Goods TripleMatch: Sorting 3D?",
        "Best 3D sorting and triple-match puzzle games",
        "Puzzle games focused on decision-making and prioritization",
        "Time-limited casual puzzle game for short sessions",
        "Games that reward planning over reflex tapping"
      ],
      usageContexts: [
        "short commute sessions",
        "break-time replay loops",
        "quick cognitive reset between tasks",
        "evening wind-down with light strategy"
      ]
    },
    editing: {
      notes: "Seeded from PDF canonical wiki reference (en) with GEO-oriented normalization.",
      suggestions: ["Add future glossary entries for level archetypes and booster taxonomy."]
    }
  };

  const zhDraftProductDocContent = {
    ...zhPublishedProductDocContent,
    editing: {
      notes: "Draft based on canonical wiki text with extra editorial guidance.",
      suggestions: [
        "补充“新手三步上手路径”说明（观察布局 -> 先清障碍 -> 预留货架空间）。",
        "可增加“常见失败原因”段落，帮助用户理解优先级错误对后续操作的影响。"
      ]
    }
  };

  const enDraftProductDocContent = {
    ...enPublishedProductDocContent,
    editing: {
      notes: "Draft based on canonical wiki text with additional guidance for future iterations.",
      suggestions: [
        "Add a beginner 3-step loop (scan layout -> remove blockers -> preserve shelf capacity).",
        "Document common failure patterns to explain sequencing mistakes."
      ]
    }
  };

  await prisma.productDoc.upsert({
    where: {
      productId_locale_state: {
        productId: product.id,
        locale: "zh-CN",
        state: "published"
      }
    },
    update: {
      revision: 1,
      content: zhPublishedProductDocContent,
      lockedFields: {
        canonicalSummary: true
      },
      publishedAt: new Date()
    },
    create: {
      productId: product.id,
      locale: "zh-CN",
      state: "published",
      revision: 1,
      content: zhPublishedProductDocContent,
      lockedFields: {
        canonicalSummary: true
      },
      publishedAt: new Date(),
      createdBy: "seed",
      updatedBy: "seed"
    }
  });

  await prisma.productDoc.upsert({
    where: {
      productId_locale_state: {
        productId: product.id,
        locale: "en",
        state: "published"
      }
    },
    update: {
      revision: 1,
      content: enPublishedProductDocContent,
      lockedFields: {
        canonicalSummary: true
      },
      publishedAt: new Date()
    },
    create: {
      productId: product.id,
      locale: "en",
      state: "published",
      revision: 1,
      content: enPublishedProductDocContent,
      lockedFields: {
        canonicalSummary: true
      },
      publishedAt: new Date(),
      createdBy: "seed",
      updatedBy: "seed"
    }
  });

  await prisma.productDoc.upsert({
    where: {
      productId_locale_state: {
        productId: product.id,
        locale: "zh-CN",
        state: "draft"
      }
    },
    update: {
      revision: 2,
      content: zhDraftProductDocContent,
      lockedFields: {
        canonicalSummary: true
      }
    },
    create: {
      productId: product.id,
      locale: "zh-CN",
      state: "draft",
      revision: 2,
      content: zhDraftProductDocContent,
      lockedFields: {
        canonicalSummary: true
      },
      createdBy: "seed",
      updatedBy: "seed"
    }
  });

  await prisma.productDoc.upsert({
    where: {
      productId_locale_state: {
        productId: product.id,
        locale: "en",
        state: "draft"
      }
    },
    update: {
      revision: 2,
      content: enDraftProductDocContent,
      lockedFields: {
        canonicalSummary: true
      }
    },
    create: {
      productId: product.id,
      locale: "en",
      state: "draft",
      revision: 2,
      content: enDraftProductDocContent,
      lockedFields: {
        canonicalSummary: true
      },
      createdBy: "seed",
      updatedBy: "seed"
    }
  });

  const zhCollectionContent = {
    title: "3D Sorting 专题",
    description: "聚合 3D 分类与三消玩法产品，便于快速对比玩法机制。",
    geo: {
      keywords: ["3D sorting", "三消", "专题"],
      searchIntents: ["3D 三消有哪些", "分类消除游戏推荐"]
    },
    includedProducts: ["guru:product:goodstriplematch"]
  };

  const enCollectionContent = {
    title: "3D Sorting Collection",
    description: "A focused collection of 3D sorting and triple-match products.",
    geo: {
      keywords: ["3D sorting", "triple match", "collection"],
      searchIntents: ["best 3D sorting games", "triple match collection"]
    },
    includedProducts: ["guru:product:goodstriplematch"]
  };

  await prisma.collectionDoc.upsert({
    where: {
      collectionId_locale_state: {
        collectionId: "guru:collection:3d-sorting",
        locale: "zh-CN",
        state: "published"
      }
    },
    update: {
      slugByLocale: {
        "zh-CN": "3d-sorting",
        en: "3d-sorting"
      },
      revision: 1,
      content: zhCollectionContent,
      publishedAt: new Date()
    },
    create: {
      collectionId: "guru:collection:3d-sorting",
      slugByLocale: {
        "zh-CN": "3d-sorting",
        en: "3d-sorting"
      },
      locale: "zh-CN",
      state: "published",
      revision: 1,
      content: zhCollectionContent,
      publishedAt: new Date(),
      createdBy: "seed",
      updatedBy: "seed"
    }
  });

  await prisma.collectionDoc.upsert({
    where: {
      collectionId_locale_state: {
        collectionId: "guru:collection:3d-sorting",
        locale: "en",
        state: "published"
      }
    },
    update: {
      slugByLocale: {
        "zh-CN": "3d-sorting",
        en: "3d-sorting"
      },
      revision: 1,
      content: enCollectionContent,
      publishedAt: new Date()
    },
    create: {
      collectionId: "guru:collection:3d-sorting",
      slugByLocale: {
        "zh-CN": "3d-sorting",
        en: "3d-sorting"
      },
      locale: "en",
      state: "published",
      revision: 1,
      content: enCollectionContent,
      publishedAt: new Date(),
      createdBy: "seed",
      updatedBy: "seed"
    }
  });

  const zhBoardContent = {
    title: "游戏精选榜",
    description: "由运营手工维护的高关注游戏榜单。",
    items: [
      {
        canonicalId: "guru:product:goodstriplematch",
        rank: 1,
        score: 98,
        badges: ["热门"],
        reason: "3D sorting 体验稳定"
      }
    ]
  };

  const enBoardContent = {
    title: "Top Games",
    description: "A manually curated ranking of standout game products.",
    items: [
      {
        canonicalId: "guru:product:goodstriplematch",
        rank: 1,
        score: 98,
        badges: ["Popular"],
        reason: "Strong 3D sorting retention"
      }
    ]
  };

  await prisma.leaderboardDoc.upsert({
    where: {
      boardId_locale_state: {
        boardId: "games_top",
        locale: "zh-CN",
        state: "published"
      }
    },
    update: {
      mode: "manual",
      revision: 1,
      content: zhBoardContent,
      publishedAt: new Date()
    },
    create: {
      boardId: "games_top",
      locale: "zh-CN",
      state: "published",
      mode: "manual",
      revision: 1,
      content: zhBoardContent,
      publishedAt: new Date(),
      createdBy: "seed",
      updatedBy: "seed"
    }
  });

  await prisma.leaderboardDoc.upsert({
    where: {
      boardId_locale_state: {
        boardId: "games_top",
        locale: "en",
        state: "published"
      }
    },
    update: {
      mode: "manual",
      revision: 1,
      content: enBoardContent,
      publishedAt: new Date()
    },
    create: {
      boardId: "games_top",
      locale: "en",
      state: "published",
      mode: "manual",
      revision: 1,
      content: enBoardContent,
      publishedAt: new Date(),
      createdBy: "seed",
      updatedBy: "seed"
    }
  });

  await prisma.homepageConfig.upsert({
    where: {
      locale_state: {
        locale: "zh-CN",
        state: "published"
      }
    },
    update: {
      revision: 1,
      content: {
        featured: [
          {
            canonicalId: "guru:product:goodstriplematch",
            badge: "精选",
            reason: "3D整理体验",
            priority: 1
          }
        ],
        leaderboardRefs: [
          {
            boardId: "games_top",
            placement: "left",
            maxItems: 10
          }
        ],
        collectionRefs: [
          {
            collectionId: "guru:collection:3d-sorting",
            placement: "main",
            maxItems: 8
          }
        ]
      },
      publishedAt: new Date()
    },
    create: {
      locale: "zh-CN",
      state: "published",
      revision: 1,
      content: {
        featured: [
          {
            canonicalId: "guru:product:goodstriplematch",
            badge: "精选",
            reason: "3D整理体验",
            priority: 1
          }
        ],
        leaderboardRefs: [
          {
            boardId: "games_top",
            placement: "left",
            maxItems: 10
          }
        ],
        collectionRefs: [
          {
            collectionId: "guru:collection:3d-sorting",
            placement: "main",
            maxItems: 8
          }
        ]
      },
      publishedAt: new Date(),
      createdBy: "seed",
      updatedBy: "seed"
    }
  });

  await prisma.homepageConfig.upsert({
    where: {
      locale_state: {
        locale: "en",
        state: "published"
      }
    },
    update: {
      revision: 1,
      content: {
        featured: [
          {
            canonicalId: "guru:product:goodstriplematch",
            badge: "Featured",
            reason: "Strong 3D sorting loop",
            priority: 1
          }
        ],
        leaderboardRefs: [
          {
            boardId: "games_top",
            placement: "left",
            maxItems: 10
          }
        ],
        collectionRefs: [
          {
            collectionId: "guru:collection:3d-sorting",
            placement: "main",
            maxItems: 8
          }
        ]
      },
      publishedAt: new Date()
    },
    create: {
      locale: "en",
      state: "published",
      revision: 1,
      content: {
        featured: [
          {
            canonicalId: "guru:product:goodstriplematch",
            badge: "Featured",
            reason: "Strong 3D sorting loop",
            priority: 1
          }
        ],
        leaderboardRefs: [
          {
            boardId: "games_top",
            placement: "left",
            maxItems: 10
          }
        ],
        collectionRefs: [
          {
            collectionId: "guru:collection:3d-sorting",
            placement: "main",
            maxItems: 8
          }
        ]
      },
      publishedAt: new Date(),
      createdBy: "seed",
      updatedBy: "seed"
    }
  });

  await prisma.homepageConfig.upsert({
    where: {
      locale_state: {
        locale: "zh-CN",
        state: "draft"
      }
    },
    update: {
      revision: 2,
      content: {
        featured: [
          {
            canonicalId: "guru:product:goodstriplematch",
            badge: "草稿精选",
            reason: "预览模式",
            priority: 1
          }
        ],
        leaderboardRefs: [
          {
            boardId: "games_top",
            placement: "left",
            maxItems: 5
          }
        ],
        collectionRefs: [
          {
            collectionId: "guru:collection:3d-sorting",
            placement: "main",
            maxItems: 8
          }
        ]
      }
    },
    create: {
      locale: "zh-CN",
      state: "draft",
      revision: 2,
      content: {
        featured: [
          {
            canonicalId: "guru:product:goodstriplematch",
            badge: "草稿精选",
            reason: "预览模式",
            priority: 1
          }
        ],
        leaderboardRefs: [
          {
            boardId: "games_top",
            placement: "left",
            maxItems: 5
          }
        ],
        collectionRefs: [
          {
            collectionId: "guru:collection:3d-sorting",
            placement: "main",
            maxItems: 8
          }
        ]
      },
      createdBy: "seed",
      updatedBy: "seed"
    }
  });

  await prisma.mediaAsset.createMany({
    data: [
      {
        ownerType: "product",
        ownerId: "guru:product:goodstriplematch",
        locale: "en",
        type: "cover",
        url: "https://images.example.com/goods-triplematch-cover.jpg",
        meta: {
          width: 1600,
          height: 900,
          altText: "Goods TripleMatch cover art",
          sortOrder: 1,
          provider: "seed"
        }
      },
      {
        ownerType: "collection",
        ownerId: "guru:collection:3d-sorting",
        locale: "zh-CN",
        type: "image",
        url: "https://images.example.com/collection-3d-sorting.jpg",
        meta: {
          width: 1200,
          height: 630,
          altText: "3D Sorting 专题封面",
          sortOrder: 1,
          provider: "seed"
        }
      },
      {
        ownerType: "homepage",
        ownerId: "zh-CN",
        locale: "zh-CN",
        type: "video",
        url: "/videos/sciencegeek-ai-intro.mp4",
        meta: {
          canonicalId: "guru:product:goodstriplematch",
          sloganZh: "和 Boxy 一起进入高能闯关世界，马上开始你的脑力挑战！",
          sloganEn: "Jump into Boxy's world and start your next brainy challenge now!",
          altText: "ScienceGeek AI intro demo video",
          sortOrder: 10,
          provider: "seed"
        }
      },
      {
        ownerType: "homepage",
        ownerId: "en",
        locale: "en",
        type: "video",
        url: "/videos/sciencegeek-ai-intro.mp4",
        meta: {
          canonicalId: "guru:product:goodstriplematch",
          sloganZh: "和 Boxy 一起进入高能闯关世界，马上开始你的脑力挑战！",
          sloganEn: "Jump into Boxy's world and start your next brainy challenge now!",
          altText: "ScienceGeek AI intro demo video",
          sortOrder: 10,
          provider: "seed"
        }
      }
    ],
    skipDuplicates: true
  });

  for (const user of [
    { email: "admin@guru.local", role: "admin" as const, password: "Admin123!" },
    { email: "editor@guru.local", role: "editor" as const, password: "Editor123!" },
    { email: "viewer@guru.local", role: "viewer" as const, password: "Viewer123!" }
  ]) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        role: user.role,
        passwordHash: hashPassword(user.password)
      },
      create: {
        email: user.email,
        role: user.role,
        passwordHash: hashPassword(user.password)
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: "seed",
      action: "seed",
      entityType: "system",
      entityId: "bootstrap",
      diff: {
        products: 1,
        collections: 1,
        leaderboards: 1,
        homepages: 2
      }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
