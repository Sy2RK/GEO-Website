import type { SkillDefinition } from "@guru/shared";
import { prisma } from "../lib/prisma";

const skills: SkillDefinition[] = [
  {
    id: "skill.short_description",
    name: "Short Description",
    description: "Generate short product summary candidates for draft editing notes.",
    inputSchema: {
      type: "object",
      properties: {
        canonicalId: { type: "string" },
        locale: { type: "string" }
      },
      required: ["canonicalId", "locale"]
    }
  },
  {
    id: "skill.keyword_suggest",
    name: "Keyword Suggest",
    description: "Suggest GEO keywords based on current draft and taxonomy.",
    inputSchema: {
      type: "object",
      properties: {
        canonicalId: { type: "string" },
        locale: { type: "string" }
      },
      required: ["canonicalId", "locale"]
    }
  },
  {
    id: "skill.trend_summary",
    name: "Trend Summary",
    description: "Generate trend summary text to append into editing.suggestions[].",
    inputSchema: {
      type: "object",
      properties: {
        canonicalId: { type: "string" },
        locale: { type: "string" },
        note: { type: "string" }
      },
      required: ["canonicalId", "locale"]
    }
  },
  {
    id: "skill.translate_from_other_locale",
    name: "Translate From Other Locale",
    description: "Use qwen-plus to generate the current locale draft from another locale version.",
    inputSchema: {
      type: "object",
      properties: {
        canonicalId: { type: "string" },
        locale: { type: "string" },
        sourceLocale: { type: "string" }
      },
      required: ["canonicalId", "locale"]
    }
  }
];

export function listSkills(): SkillDefinition[] {
  return skills;
}

const QWEN_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const QWEN_MODEL = "qwen-plus";

const SKILL_PROMPTS = {
  shortDescription: [
    "You are a GEO/SEO product copy assistant.",
    "Task: produce concise product short-description suggestions based on the product doc.",
    "Requirements:",
    "- Return ONLY JSON: {\"suggestions\": [\"...\", \"...\"]}",
    "- suggestions length: 2-4",
    "- Each suggestion should be clear and user-facing.",
    "- Keep language aligned with target locale."
  ].join("\n"),
  keywordSuggest: [
    "You are a GEO keyword strategist.",
    "Task: generate high-quality GEO keyword suggestions from the product doc.",
    "Requirements:",
    "- Return ONLY JSON: {\"suggestions\": [\"...\"]}",
    "- suggestions length: 6-12",
    "- Include a mix of head terms and long-tail terms.",
    "- Keep language aligned with target locale."
  ].join("\n"),
  trendSummary: [
    "You are a market insight assistant for product operations.",
    "Task: write trend-summary suggestions for editorial notes.",
    "Requirements:",
    "- Return ONLY JSON: {\"suggestions\": [\"...\"]}",
    "- suggestions length: 1-3",
    "- Each suggestion should be concise and actionable.",
    "- Keep language aligned with target locale."
  ].join("\n"),
  translateFromOtherLocale: [
    "You are a localization expert for game/AI product docs.",
    "Task: translate product doc JSON from source locale to target locale.",
    "Requirements:",
    "- Return ONLY a valid JSON object. No markdown.",
    "- Keep original key structure and field coverage.",
    "- Do not remove fields. Keep arrays as arrays.",
    "- Preserve proper nouns/brand names when appropriate.",
    "- Localize user-facing text naturally for target locale."
  ].join("\n")
};

export async function runSkill(input: {
  skillId: string;
  payload: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const now = new Date().toISOString();
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error("dashscope_api_key_missing");
  }

  if (input.skillId === "skill.short_description") {
    const canonicalId = String(input.payload.canonicalId ?? "");
    const locale = String(input.payload.locale ?? "");
    if (!canonicalId || !locale) {
      throw new Error("canonicalId_and_locale_required");
    }
    const { sourceContent } = await getLocaleDocContent({ canonicalId, locale });
    const generated = await generateSuggestionsWithQwen({
      apiKey,
      prompt: [
        SKILL_PROMPTS.shortDescription,
        `CanonicalId: ${canonicalId}`,
        `Target locale: ${locale}`,
        "Source JSON:",
        JSON.stringify(sourceContent)
      ].join("\n")
    });
    return {
      skillId: input.skillId,
      generatedAt: now,
      output: {
        suggestions: generated,
        targetPath: "editing.suggestions"
      }
    };
  }

  if (input.skillId === "skill.keyword_suggest") {
    const canonicalId = String(input.payload.canonicalId ?? "");
    const locale = String(input.payload.locale ?? "");
    if (!canonicalId || !locale) {
      throw new Error("canonicalId_and_locale_required");
    }
    const { sourceContent } = await getLocaleDocContent({ canonicalId, locale });
    const generated = await generateSuggestionsWithQwen({
      apiKey,
      prompt: [
        SKILL_PROMPTS.keywordSuggest,
        `CanonicalId: ${canonicalId}`,
        `Target locale: ${locale}`,
        "Source JSON:",
        JSON.stringify(sourceContent)
      ].join("\n")
    });
    return {
      skillId: input.skillId,
      generatedAt: now,
      output: {
        suggestions: generated,
        targetPath: "editing.suggestions"
      }
    };
  }

  if (input.skillId === "skill.trend_summary") {
    const canonicalId = String(input.payload.canonicalId ?? "");
    const locale = String(input.payload.locale ?? "");
    const note = String(input.payload.note ?? "");
    if (!canonicalId || !locale) {
      throw new Error("canonicalId_and_locale_required");
    }
    const { sourceContent } = await getLocaleDocContent({ canonicalId, locale });
    const generated = await generateSuggestionsWithQwen({
      apiKey,
      prompt: [
        SKILL_PROMPTS.trendSummary,
        `CanonicalId: ${canonicalId}`,
        `Target locale: ${locale}`,
        note ? `Operator note: ${note}` : "Operator note: (none)",
        "Source JSON:",
        JSON.stringify(sourceContent)
      ].join("\n")
    });
    return {
      skillId: input.skillId,
      generatedAt: now,
      output: {
        suggestions: generated,
        targetPath: "editing.suggestions"
      }
    };
  }

  if (input.skillId === "skill.translate_from_other_locale") {
    const canonicalId = String(input.payload.canonicalId ?? "");
    const targetLocale = String(input.payload.locale ?? "");
    const sourceLocale = String(
      input.payload.sourceLocale ?? (targetLocale === "en" ? "zh-CN" : "en")
    );
    if (!canonicalId || !targetLocale) {
      throw new Error("canonicalId_and_locale_required");
    }
    if (targetLocale === sourceLocale) {
      throw new Error("source_locale_must_differ_from_target_locale");
    }

    const product = await prisma.product.findUnique({ where: { canonicalId } });
    if (!product) {
      throw new Error("product_not_found");
    }

    const [sourceDraft, sourcePublished] = await Promise.all([
      prisma.productDoc.findUnique({
        where: {
          productId_locale_state: {
            productId: product.id,
            locale: sourceLocale,
            state: "draft"
          }
        }
      }),
      prisma.productDoc.findUnique({
        where: {
          productId_locale_state: {
            productId: product.id,
            locale: sourceLocale,
            state: "published"
          }
        }
      })
    ]);

    const sourceDoc = sourceDraft ?? sourcePublished;
    if (!sourceDoc) {
      throw new Error("source_locale_doc_not_found");
    }

    const sourceContent = sourceDoc.content as Record<string, unknown>;
    const translatedContent = await translateProductDocWithQwen({
      apiKey,
      canonicalId,
      sourceLocale,
      targetLocale,
      sourceContent
    });

    return {
      skillId: input.skillId,
      generatedAt: now,
      output: {
        sourceLocale,
        targetLocale,
        translatedContent,
        suggestions: ["translation_ready"],
        targetPath: "content"
      }
    };
  }

  return {
    skillId: input.skillId,
    generatedAt: now,
    output: {
      suggestions: ["No-op skill response."],
      targetPath: "editing.suggestions"
    }
  };
}

function extractJsonObject(text: string): Record<string, unknown> {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) ?? text.match(/```\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? text.trim();

  try {
    return JSON.parse(candidate) as Record<string, unknown>;
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const sliced = candidate.slice(start, end + 1);
      return JSON.parse(sliced) as Record<string, unknown>;
    }
    throw new Error("qwen_json_parse_failed");
  }
}

async function getLocaleDocContent(input: {
  canonicalId: string;
  locale: string;
}): Promise<{ sourceContent: Record<string, unknown> }> {
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
  const doc = draft ?? published;
  if (!doc) {
    throw new Error("product_doc_not_found");
  }
  return { sourceContent: doc.content as Record<string, unknown> };
}

async function generateSuggestionsWithQwen(input: {
  apiKey: string;
  prompt: string;
}): Promise<string[]> {
  const response = await fetch(QWEN_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${input.apiKey}`
    },
    body: JSON.stringify({
      model: QWEN_MODEL,
      messages: [{ role: "user", content: input.prompt }],
      extra_body: { enable_thinking: true },
      stream: false
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`qwen_request_failed:${response.status}:${detail}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("qwen_empty_response");
  }

  const parsed = extractJsonObject(content);
  const suggestions = Array.isArray(parsed.suggestions)
    ? parsed.suggestions.map((item) => String(item).trim()).filter(Boolean)
    : [];
  if (suggestions.length === 0) {
    throw new Error("qwen_suggestions_empty");
  }
  return suggestions;
}

async function translateProductDocWithQwen(input: {
  apiKey: string;
  canonicalId: string;
  sourceLocale: string;
  targetLocale: string;
  sourceContent: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const prompt = [
    SKILL_PROMPTS.translateFromOtherLocale,
    `CanonicalId: ${input.canonicalId}`,
    `Translate from ${input.sourceLocale} to ${input.targetLocale}.`,
    "Source JSON:",
    JSON.stringify(input.sourceContent)
  ].join("\n");

  const response = await fetch(QWEN_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${input.apiKey}`
    },
    body: JSON.stringify({
      model: QWEN_MODEL,
      messages: [{ role: "user", content: prompt }],
      extra_body: { enable_thinking: true },
      stream: false
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`qwen_request_failed:${response.status}:${detail}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("qwen_empty_response");
  }

  const translated = extractJsonObject(content);
  if (typeof translated !== "object" || translated === null || Array.isArray(translated)) {
    throw new Error("translation_result_invalid");
  }
  return translated;
}
