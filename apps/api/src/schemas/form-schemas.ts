export type FormField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "string-array" | "json";
  readOnlyFor?: Array<"viewer" | "editor" | "admin">;
  placeholder?: string;
  labelI18n?: {
    zh: string;
    en: string;
  };
  helpTextI18n?: {
    zh: string;
    en: string;
  };
};

export type FormSection = {
  id: string;
  title: string;
  fields: FormField[];
  titleI18n?: {
    zh: string;
    en: string;
  };
  descriptionI18n?: {
    zh: string;
    en: string;
  };
};

export const formSchemas: Record<
  string,
  {
    title: string;
    sections: FormSection[];
    titleI18n?: {
      zh: string;
      en: string;
    };
    descriptionI18n?: {
      zh: string;
      en: string;
    };
  }
> = {
  productDoc: {
    title: "ProductDoc Schema v1",
    titleI18n: {
      zh: "产品文档 Schema v1",
      en: "ProductDoc Schema v1"
    },
    descriptionI18n: {
      zh: "按模块编辑产品 GEO 内容。锁字段仅 admin 可改。",
      en: "Edit product GEO content by sections. Locked fields are admin-only."
    },
    sections: [
      {
        id: "identity",
        title: "Identity",
        titleI18n: {
          zh: "身份信息",
          en: "Identity"
        },
        descriptionI18n: {
          zh: "定义产品名称、别名和一句话标签。",
          en: "Define product naming, aliases, and tagline."
        },
        fields: [
          {
            key: "identity.name",
            label: "Name",
            type: "text",
            labelI18n: { zh: "名称", en: "Name" },
            helpTextI18n: {
              zh: "前台主标题，建议稳定且可识别。",
              en: "Primary title shown on public pages. Keep stable and recognizable."
            }
          },
          {
            key: "identity.alias",
            label: "Alias",
            type: "string-array",
            labelI18n: { zh: "别名", en: "Alias" },
            helpTextI18n: {
              zh: "每行一个别名，支持常见拼写或历史名。",
              en: "One alias per line, including common spellings or historical names."
            }
          },
          {
            key: "identity.tagline",
            label: "Tagline",
            type: "text",
            labelI18n: { zh: "短标语", en: "Tagline" },
            helpTextI18n: {
              zh: "用于列表卡片的简短卖点。",
              en: "Short value line for list cards."
            }
          }
        ]
      },
      {
        id: "canonical",
        title: "Canonical",
        titleI18n: {
          zh: "Canonical 核心",
          en: "Canonical"
        },
        descriptionI18n: {
          zh: "决定 SEO/GEO 的核心定义内容。",
          en: "Core definition fields used by SEO/GEO outputs."
        },
        fields: [
          {
            key: "canonicalSummary",
            label: "Canonical Summary",
            type: "textarea",
            readOnlyFor: ["viewer", "editor"],
            labelI18n: { zh: "Canonical 摘要（锁定）", en: "Canonical Summary (Locked)" },
            helpTextI18n: {
              zh: "作为结构化数据 description 的主来源，默认锁定。",
              en: "Primary description source for structured data. Locked by default."
            }
          },
          {
            key: "definition",
            label: "Definition",
            type: "textarea",
            labelI18n: { zh: "定义", en: "Definition" },
            helpTextI18n: {
              zh: "解释产品是什么、如何使用。",
              en: "Explain what the product is and how it is used."
            }
          }
        ]
      },
      {
        id: "gameplay",
        title: "Gameplay",
        titleI18n: {
          zh: "玩法/机制",
          en: "Gameplay"
        },
        descriptionI18n: {
          zh: "列出关键玩法机制，每行一个。",
          en: "List core mechanics, one per line."
        },
        fields: [
          {
            key: "coreMechanics",
            label: "Core Mechanics",
            type: "string-array",
            labelI18n: { zh: "核心机制", en: "Core Mechanics" },
            helpTextI18n: {
              zh: "用于用户理解与模型抽取。",
              en: "Used for user comprehension and model extraction."
            }
          }
        ]
      },
      {
        id: "value",
        title: "Value",
        titleI18n: {
          zh: "价值主张",
          en: "Value"
        },
        descriptionI18n: {
          zh: "描述用户可感知的价值结果。",
          en: "Describe user-visible value outcomes."
        },
        fields: [
          {
            key: "valueProposition",
            label: "Value Proposition",
            type: "string-array",
            labelI18n: { zh: "价值点", en: "Value Proposition" },
            helpTextI18n: {
              zh: "每行一个价值点，建议具体可验证。",
              en: "One value point per line, ideally concrete and verifiable."
            }
          }
        ]
      },
      {
        id: "geo",
        title: "GEO",
        titleI18n: {
          zh: "GEO 语义",
          en: "GEO"
        },
        descriptionI18n: {
          zh: "用于检索意图与场景对齐。",
          en: "Align content with retrieval intents and contexts."
        },
        fields: [
          {
            key: "geo.keywords",
            label: "Keywords",
            type: "string-array",
            labelI18n: { zh: "关键词", en: "Keywords" },
            helpTextI18n: {
              zh: "建议包含品牌词、玩法词、品类词。",
              en: "Include brand, mechanic, and category terms."
            }
          },
          {
            key: "geo.searchIntents",
            label: "Search Intents",
            type: "string-array",
            labelI18n: { zh: "搜索意图", en: "Search Intents" },
            helpTextI18n: {
              zh: "描述用户会如何提问。",
              en: "Capture how users might ask/search."
            }
          },
          {
            key: "geo.usageContexts",
            label: "Usage Contexts",
            type: "string-array",
            labelI18n: { zh: "使用场景", en: "Usage Contexts" },
            helpTextI18n: {
              zh: "例如通勤、学习、办公等场景。",
              en: "Examples: commute, study, office, etc."
            }
          }
        ]
      },
      {
        id: "assets",
        title: "Assets",
        titleI18n: {
          zh: "资源信息",
          en: "Assets"
        },
        descriptionI18n: {
          zh: "结构化保存图片、视频等扩展字段。",
          en: "Store structured extension fields for assets."
        },
        fields: [
          {
            key: "assets",
            label: "Assets JSON",
            type: "json",
            labelI18n: { zh: "资源 JSON", en: "Assets JSON" },
            helpTextI18n: {
              zh: "需保持合法 JSON。",
              en: "Must be valid JSON."
            }
          }
        ]
      },
      {
        id: "editing",
        title: "Editing",
        titleI18n: {
          zh: "编辑备注",
          en: "Editing"
        },
        descriptionI18n: {
          zh: "记录编辑说明与 skill 建议。",
          en: "Store editor notes and skill suggestions."
        },
        fields: [
          {
            key: "editing.notes",
            label: "Notes",
            type: "textarea",
            labelI18n: { zh: "备注", en: "Notes" },
            helpTextI18n: {
              zh: "记录本次编辑背景与注意事项。",
              en: "Document editing context and caveats."
            }
          },
          {
            key: "editing.suggestions",
            label: "Suggestions",
            type: "string-array",
            labelI18n: { zh: "建议", en: "Suggestions" },
            helpTextI18n: {
              zh: "Skill 结果建议写入这里，不直接覆盖锁字段。",
              en: "Skill outputs should go here, not overwrite locked fields directly."
            }
          }
        ]
      }
    ]
  },
  homepage: {
    title: "HomepageConfig Schema v1",
    titleI18n: {
      zh: "首页配置 Schema v1",
      en: "HomepageConfig Schema v1"
    },
    descriptionI18n: {
      zh: "运营位配置：精选、榜单引用、专题引用。",
      en: "Operational slots: featured, leaderboard refs, collection refs."
    },
    sections: [
      {
        id: "featured",
        title: "Featured Carousel",
        titleI18n: { zh: "精选轮播", en: "Featured Carousel" },
        descriptionI18n: {
          zh: "控制首页精选顺序、标记和时间窗。",
          en: "Control featured ordering, badges, and schedule windows."
        },
        fields: [
          {
            key: "featured",
            label: "Featured JSON",
            type: "json",
            labelI18n: { zh: "精选配置 JSON", en: "Featured JSON" },
            helpTextI18n: {
              zh: "格式：[{canonicalId,badge,reason,priority,startAt,endAt}]",
              en: "Format: [{canonicalId,badge,reason,priority,startAt,endAt}]"
            }
          }
        ]
      },
      {
        id: "leaderboards",
        title: "Leaderboard Refs",
        titleI18n: { zh: "榜单引用", en: "Leaderboard Refs" },
        descriptionI18n: {
          zh: "选择首页展示哪些榜单。",
          en: "Choose which leaderboards appear on homepage."
        },
        fields: [
          {
            key: "leaderboardRefs",
            label: "Leaderboard Refs JSON",
            type: "json",
            labelI18n: { zh: "榜单引用 JSON", en: "Leaderboard Refs JSON" },
            helpTextI18n: {
              zh: "格式：[{boardId,placement,maxItems}]",
              en: "Format: [{boardId,placement,maxItems}]"
            }
          }
        ]
      },
      {
        id: "collections",
        title: "Collection Refs",
        titleI18n: { zh: "专题引用", en: "Collection Refs" },
        descriptionI18n: {
          zh: "选择首页展示哪些专题集合。",
          en: "Choose which collections appear on homepage."
        },
        fields: [
          {
            key: "collectionRefs",
            label: "Collection Refs JSON",
            type: "json",
            labelI18n: { zh: "专题引用 JSON", en: "Collection Refs JSON" },
            helpTextI18n: {
              zh: "格式：[{collectionId,placement,maxItems}]",
              en: "Format: [{collectionId,placement,maxItems}]"
            }
          }
        ]
      }
    ]
  },
  leaderboard: {
    title: "Leaderboard Schema v1",
    titleI18n: {
      zh: "榜单 Schema v1",
      en: "Leaderboard Schema v1"
    },
    descriptionI18n: {
      zh: "维护榜单标题、描述和条目。",
      en: "Maintain leaderboard title, description, and items."
    },
    sections: [
      {
        id: "content",
        title: "Leaderboard",
        titleI18n: { zh: "榜单内容", en: "Leaderboard" },
        descriptionI18n: {
          zh: "items 建议按 rank 升序。",
          en: "Keep items ordered by rank ascending."
        },
        fields: [
          {
            key: "title",
            label: "Title",
            type: "text",
            labelI18n: { zh: "标题", en: "Title" },
            helpTextI18n: {
              zh: "榜单在前台展示的标题。",
              en: "Display title for public leaderboard page."
            }
          },
          {
            key: "description",
            label: "Description",
            type: "textarea",
            labelI18n: { zh: "描述", en: "Description" },
            helpTextI18n: {
              zh: "解释口径和排序逻辑。",
              en: "Explain methodology and ranking logic."
            }
          },
          {
            key: "items",
            label: "Items JSON",
            type: "json",
            labelI18n: { zh: "条目 JSON", en: "Items JSON" },
            helpTextI18n: {
              zh: "格式：[{canonicalId,rank,score?,badges?,reason?}]",
              en: "Format: [{canonicalId,rank,score?,badges?,reason?}]"
            }
          }
        ]
      }
    ]
  },
  collection: {
    title: "Collection Schema v1",
    titleI18n: {
      zh: "专题 Schema v1",
      en: "Collection Schema v1"
    },
    descriptionI18n: {
      zh: "维护专题定义与包含产品集合。",
      en: "Maintain collection definition and included products."
    },
    sections: [
      {
        id: "content",
        title: "Collection",
        titleI18n: { zh: "专题内容", en: "Collection" },
        descriptionI18n: {
          zh: "includedProducts 中填 canonicalId。",
          en: "Use canonicalId values in includedProducts."
        },
        fields: [
          {
            key: "title",
            label: "Title",
            type: "text",
            labelI18n: { zh: "标题", en: "Title" },
            helpTextI18n: {
              zh: "专题对外标题。",
              en: "Public-facing collection title."
            }
          },
          {
            key: "description",
            label: "Description",
            type: "textarea",
            labelI18n: { zh: "描述", en: "Description" },
            helpTextI18n: {
              zh: "简要说明专题目标和边界。",
              en: "Briefly describe collection objective and scope."
            }
          },
          {
            key: "geo.keywords",
            label: "Keywords",
            type: "string-array",
            labelI18n: { zh: "关键词", en: "Keywords" },
            helpTextI18n: {
              zh: "用于专题检索召回。",
              en: "Used for collection retrieval coverage."
            }
          },
          {
            key: "geo.searchIntents",
            label: "Search Intents",
            type: "string-array",
            labelI18n: { zh: "搜索意图", en: "Search Intents" },
            helpTextI18n: {
              zh: "写出用户会搜的自然语言问题。",
              en: "Capture natural-language user search questions."
            }
          },
          {
            key: "includedProducts",
            label: "Included Product canonicalIds",
            type: "string-array",
            labelI18n: { zh: "包含产品 canonicalId", en: "Included Product canonicalIds" },
            helpTextI18n: {
              zh: "每行一个 canonicalId。",
              en: "One canonicalId per line."
            }
          }
        ]
      }
    ]
  },
  media: {
    title: "MediaAsset Schema v1",
    titleI18n: {
      zh: "媒体资源 Schema v1",
      en: "MediaAsset Schema v1"
    },
    sections: [
      {
        id: "content",
        title: "Media",
        titleI18n: { zh: "媒体信息", en: "Media" },
        fields: [
          { key: "ownerType", label: "Owner Type", type: "text", labelI18n: { zh: "归属类型", en: "Owner Type" } },
          { key: "ownerId", label: "Owner Id", type: "text", labelI18n: { zh: "归属 ID", en: "Owner Id" } },
          { key: "locale", label: "Locale", type: "text", labelI18n: { zh: "语言", en: "Locale" } },
          { key: "type", label: "Media Type", type: "text", labelI18n: { zh: "媒体类型", en: "Media Type" } },
          { key: "url", label: "URL", type: "text", labelI18n: { zh: "地址", en: "URL" } },
          { key: "meta", label: "Meta JSON", type: "json", labelI18n: { zh: "元数据 JSON", en: "Meta JSON" } }
        ]
      }
    ]
  }
};
