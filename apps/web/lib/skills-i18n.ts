import { t, type UiLocale } from "./ui-locale";

type SkillLike = {
  id: string;
  name: string;
  description: string;
};

const skillTextMap: Record<string, { name: { zh: string; en: string }; description: { zh: string; en: string } }> = {
  "skill.short_description": {
    name: { zh: "短描述生成", en: "Short Description" },
    description: {
      zh: "为当前草稿生成简短描述候选，写入编辑建议区。",
      en: "Generate short summary candidates and write them into editing suggestions."
    }
  },
  "skill.keyword_suggest": {
    name: { zh: "关键词建议", en: "Keyword Suggest" },
    description: {
      zh: "基于当前内容与分类生成 GEO 关键词建议。",
      en: "Suggest GEO keywords based on current content and taxonomy."
    }
  },
  "skill.trend_summary": {
    name: { zh: "趋势摘要", en: "Trend Summary" },
    description: {
      zh: "生成趋势摘要文本，写入编辑建议区。",
      en: "Generate trend summary text and write it into editing suggestions."
    }
  },
  "skill.translate_from_other_locale": {
    name: { zh: "跨语言自动生成", en: "Translate From Other Locale" },
    description: {
      zh: "基于另一语言版本自动生成当前语言草稿（qwen-plus）。",
      en: "Generate current locale draft from another locale version (qwen-plus)."
    }
  }
};

export function localizeSkill(skill: SkillLike, uiLocale: UiLocale): SkillLike {
  const mapped = skillTextMap[skill.id];
  if (!mapped) {
    return skill;
  }
  return {
    ...skill,
    name: t(uiLocale, mapped.name),
    description: t(uiLocale, mapped.description)
  };
}

