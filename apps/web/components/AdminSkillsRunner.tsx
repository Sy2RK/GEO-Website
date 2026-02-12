"use client";

import { useState } from "react";
import { clientApiPost } from "../lib/api-client";
import { t, type UiLocale } from "../lib/ui-locale";
import { localizeSkill } from "../lib/skills-i18n";

type Skill = {
  id: string;
  name: string;
  description: string;
};

export function AdminSkillsRunner({ skills, uiLocale }: { skills: Skill[]; uiLocale: UiLocale }) {
  const [skillId, setSkillId] = useState(skills[0]?.id ?? "");
  const [inputText, setInputText] = useState('{"canonicalId":"guru:product:goodstriplematch","locale":"zh-CN"}');
  const [output, setOutput] = useState<string>("");
  const [running, setRunning] = useState(false);
  const tt = (zh: string, en: string): string => t(uiLocale, { zh, en });
  const localizedSkills = skills.map((skill) => localizeSkill(skill, uiLocale));

  async function runSkill(event: React.FormEvent) {
    event.preventDefault();
    setRunning(true);
    try {
      const input = JSON.parse(inputText || "{}");
      const result = await clientApiPost<Record<string, unknown>>("/api/skills/run", {
        skillId,
        input
      });
      setOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput(error instanceof Error ? error.message : tt("运行失败", "run_failed"));
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="card">
      <h1 style={{ marginTop: 0 }}>{tt("技能面板", "Skills Panel")}</h1>
      <form onSubmit={runSkill} className="list">
        <label>
          {tt("技能", "Skill")}
          <select value={skillId} onChange={(event) => setSkillId(event.target.value)}>
            {localizedSkills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {tt("输入 JSON", "Input JSON")}
          <textarea value={inputText} onChange={(event) => setInputText(event.target.value)} />
        </label>
        <button className="primary" disabled={running} type="submit">
          {running ? tt("运行中...", "Running...") : tt("运行", "Run")}
        </button>
      </form>
      <h2 className="section-title">{tt("输出", "Output")}</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>{output}</pre>

      <h2 className="section-title">{tt("可用技能", "Available Skills")}</h2>
      <div className="list">
        {localizedSkills.map((skill) => (
          <div key={skill.id} className="card">
            <strong>{skill.name}</strong>
            <p className="meta">{skill.id}</p>
            <p>{skill.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
