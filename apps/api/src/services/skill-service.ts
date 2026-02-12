import type { SkillDefinition } from "@guru/shared";

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
  }
];

export function listSkills(): SkillDefinition[] {
  return skills;
}

export async function runSkill(input: {
  skillId: string;
  payload: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const now = new Date().toISOString();

  if (input.skillId === "skill.short_description") {
    return {
      skillId: input.skillId,
      generatedAt: now,
      output: {
        suggestions: [
          "A fast 3D sorting puzzle experience with clear level goals.",
          "Designed for short sessions with steadily rising challenge."
        ],
        targetPath: "editing.suggestions"
      }
    };
  }

  if (input.skillId === "skill.keyword_suggest") {
    return {
      skillId: input.skillId,
      generatedAt: now,
      output: {
        suggestions: ["3D sorting", "triple match", "casual puzzle", "mobile relax game"],
        targetPath: "editing.suggestions"
      }
    };
  }

  if (input.skillId === "skill.trend_summary") {
    return {
      skillId: input.skillId,
      generatedAt: now,
      output: {
        suggestions: [
          "User interest around 3D sorting + stress-relief keywords is rising in short-session segments."
        ],
        targetPath: "editing.suggestions"
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
