"use client";

import { useMemo, useState } from "react";
import { t, type UiLocale } from "../lib/ui-locale";

type I18nText = {
  zh: string;
  en: string;
};

type FormSchema = {
  title: string;
  titleI18n?: I18nText;
  descriptionI18n?: I18nText;
  sections: Array<{
    id: string;
    title: string;
    titleI18n?: I18nText;
    descriptionI18n?: I18nText;
    fields: Array<{
      key: string;
      label: string;
      labelI18n?: I18nText;
      helpTextI18n?: I18nText;
      type: "text" | "textarea" | "number" | "string-array" | "json";
      readOnlyFor?: Array<"viewer" | "editor" | "admin">;
    }>;
  }>;
};

function getByPath(source: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let value: unknown = source;

  for (const part of parts) {
    if (typeof value !== "object" || value === null) {
      return undefined;
    }
    value = (value as Record<string, unknown>)[part];
  }

  return value;
}

function setByPath(source: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const parts = path.split(".");
  const cloned = JSON.parse(JSON.stringify(source)) as Record<string, unknown>;
  let cursor: Record<string, unknown> = cloned;

  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    const next = cursor[part];
    if (typeof next !== "object" || next === null || Array.isArray(next)) {
      cursor[part] = {};
    }
    cursor = cursor[part] as Record<string, unknown>;
  }

  cursor[parts[parts.length - 1]] = value;
  return cloned;
}

export function SchemaForm({
  schema,
  initial,
  role,
  onSubmit,
  submitLabel,
  uiLocale
}: {
  schema: FormSchema;
  initial: Record<string, unknown>;
  role: "viewer" | "editor" | "admin";
  onSubmit: (content: Record<string, unknown>) => Promise<void>;
  submitLabel: string;
  uiLocale: UiLocale;
}) {
  const [value, setValue] = useState<Record<string, unknown>>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const schemaTitle = useMemo(() => schema.titleI18n ? t(uiLocale, schema.titleI18n) : schema.title, [schema, uiLocale]);

  async function submit() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await onSubmit(value);
      setSuccess(t(uiLocale, { zh: "已保存", en: "Saved" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "save_failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card">
      <h3 style={{ marginTop: 0 }}>{schemaTitle}</h3>
      {schema.descriptionI18n ? <p className="meta">{t(uiLocale, schema.descriptionI18n)}</p> : null}

      <div className="list">
        {schema.sections.map((section) => (
          <details key={section.id} open>
            <summary style={{ cursor: "pointer", fontWeight: 700 }}>
              {section.titleI18n ? t(uiLocale, section.titleI18n) : section.title}
            </summary>
            {section.descriptionI18n ? <p className="meta" style={{ margin: "8px 0 0" }}>{t(uiLocale, section.descriptionI18n)}</p> : null}
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              {section.fields.map((field) => {
                const current = getByPath(value, field.key);
                const readonly = field.readOnlyFor?.includes(role) ?? false;
                const fieldLabel = field.labelI18n ? t(uiLocale, field.labelI18n) : field.label;

                if (field.type === "text") {
                  return (
                    <label key={field.key} className="kv">
                      <span>
                        {fieldLabel} {readonly ? <span title={t(uiLocale, { zh: "锁定字段", en: "Locked field" })}>🔒</span> : null}
                        {field.helpTextI18n ? <div className="meta">{t(uiLocale, field.helpTextI18n)}</div> : null}
                      </span>
                      <input
                        value={String(current ?? "")}
                        readOnly={readonly}
                        onChange={(event) => setValue(setByPath(value, field.key, event.target.value))}
                      />
                    </label>
                  );
                }

                if (field.type === "number") {
                  return (
                    <label key={field.key} className="kv">
                      <span>
                        {fieldLabel}
                        {field.helpTextI18n ? <div className="meta">{t(uiLocale, field.helpTextI18n)}</div> : null}
                      </span>
                      <input
                        type="number"
                        value={Number(current ?? 0)}
                        readOnly={readonly}
                        onChange={(event) =>
                          setValue(setByPath(value, field.key, Number.parseFloat(event.target.value || "0")))
                        }
                      />
                    </label>
                  );
                }

                if (field.type === "string-array") {
                  return (
                    <label key={field.key} className="kv">
                      <span>
                        {fieldLabel}
                        {field.helpTextI18n ? <div className="meta">{t(uiLocale, field.helpTextI18n)}</div> : null}
                      </span>
                      <textarea
                        value={Array.isArray(current) ? current.join("\n") : ""}
                        readOnly={readonly}
                        onChange={(event) =>
                          setValue(
                            setByPath(
                              value,
                              field.key,
                              event.target.value
                                .split("\n")
                                .map((item) => item.trim())
                                .filter(Boolean)
                            )
                          )
                        }
                      />
                    </label>
                  );
                }

                if (field.type === "json") {
                  return (
                    <label key={field.key} className="kv">
                      <span>
                        {fieldLabel}
                        {field.helpTextI18n ? <div className="meta">{t(uiLocale, field.helpTextI18n)}</div> : null}
                      </span>
                      <textarea
                        value={JSON.stringify(current ?? {}, null, 2)}
                        readOnly={readonly}
                        onChange={(event) => {
                          try {
                            const parsed = JSON.parse(event.target.value || "{}");
                            setValue(setByPath(value, field.key, parsed));
                          } catch {
                            // Ignore parse error until valid JSON entered.
                          }
                        }}
                      />
                    </label>
                  );
                }

                return (
                  <label key={field.key} className="kv">
                    <span>
                      {fieldLabel}
                      {field.helpTextI18n ? <div className="meta">{t(uiLocale, field.helpTextI18n)}</div> : null}
                    </span>
                    <textarea
                      value={String(current ?? "")}
                      readOnly={readonly}
                      onChange={(event) => setValue(setByPath(value, field.key, event.target.value))}
                    />
                  </label>
                );
              })}
            </div>
          </details>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button className="primary" onClick={submit} disabled={saving}>
          {saving ? t(uiLocale, { zh: "保存中...", en: "Saving..." }) : submitLabel}
        </button>
        {error ? <span className="warning">{error}</span> : null}
        {success ? <span>{success}</span> : null}
      </div>
    </section>
  );
}
