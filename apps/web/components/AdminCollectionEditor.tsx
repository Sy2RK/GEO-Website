"use client";

import Link from "next/link";
import { useState } from "react";
import { clientApiPost } from "../lib/api-client";
import { t, type UiLocale } from "../lib/ui-locale";
import { SchemaForm } from "./SchemaForm";

export function AdminCollectionEditor({
  collectionId,
  locale,
  uiLocale,
  role,
  schema,
  initialDraftContent,
  initialPublishedContent,
  initialSlugByLocale
}: {
  collectionId: string;
  locale: string;
  uiLocale: UiLocale;
  role: "viewer" | "editor" | "admin";
  schema: {
    title: string;
    titleI18n?: { zh: string; en: string };
    descriptionI18n?: { zh: string; en: string };
    sections: Array<{
      id: string;
      title: string;
      titleI18n?: { zh: string; en: string };
      descriptionI18n?: { zh: string; en: string };
      fields: Array<{
        key: string;
        label: string;
        labelI18n?: { zh: string; en: string };
        helpTextI18n?: { zh: string; en: string };
        type: "text" | "textarea" | "number" | "string-array" | "json";
        readOnlyFor?: Array<"viewer" | "editor" | "admin">;
      }>;
    }>;
  };
  initialDraftContent: Record<string, unknown>;
  initialPublishedContent: Record<string, unknown>;
  initialSlugByLocale: Record<string, string>;
}) {
  const [content, setContent] = useState(initialDraftContent);
  const [published, setPublished] = useState(initialPublishedContent);
  const [slugByLocale, setSlugByLocale] = useState(initialSlugByLocale);
  const [status, setStatus] = useState("");

  const localePath = locale === "en" ? "en" : "zh";

  async function saveDraft(next: Record<string, unknown>) {
    setContent(next);
    await clientApiPost(`/api/admin/collections/${encodeURIComponent(collectionId)}/${locale}/draft`, {
      slugByLocale,
      content: next
    });
    setStatus(t(uiLocale, { zh: "草稿已保存", en: "Draft saved" }));
  }

  async function publish() {
    await clientApiPost(`/api/admin/collections/${encodeURIComponent(collectionId)}/${locale}/publish`, {});
    setPublished(content);
    setStatus(t(uiLocale, { zh: "已发布", en: "Published" }));
  }

  return (
    <div className="admin-main">
      <section className="card">
        <div className="top-bar">
          <h1 style={{ margin: 0 }}>{collectionId}</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href={`/${localePath}/collections/${slugByLocale[locale] ?? ""}?state=draft`} className="button" target="_blank">
              {t(uiLocale, { zh: "预览草稿", en: "Preview Draft" })}
            </Link>
            <button className="primary" onClick={publish}>
              {t(uiLocale, { zh: "发布", en: "Publish" })}
            </button>
          </div>
        </div>
        {status ? <p className="meta">{status}</p> : null}
      </section>

      <section className="card">
        <h2 className="section-title">slugByLocale</h2>
        <p className="meta">
          {t(uiLocale, {
            zh: "维护中英文 slug。变更会触发 RedirectMap 用于 301。",
            en: "Maintain localized slugs. Changes should generate RedirectMap 301 entries."
          })}
        </p>
        <div className="two-col">
          <label>
            zh-CN
            <input
              value={slugByLocale["zh-CN"] ?? ""}
              onChange={(event) => setSlugByLocale({ ...slugByLocale, "zh-CN": event.target.value })}
            />
          </label>
          <label>
            en
            <input
              value={slugByLocale.en ?? ""}
              onChange={(event) => setSlugByLocale({ ...slugByLocale, en: event.target.value })}
            />
          </label>
        </div>
      </section>

      <SchemaForm
        schema={schema}
        initial={content}
        role={role}
        uiLocale={uiLocale}
        onSubmit={saveDraft}
        submitLabel={t(uiLocale, { zh: "保存草稿", en: "Save Draft" })}
      />

      <section className="card">
        <h2 className="section-title">{t(uiLocale, { zh: "已发布快照", en: "Published Snapshot" })}</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(published, null, 2)}</pre>
      </section>
    </div>
  );
}
