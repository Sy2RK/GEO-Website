"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { clientApiPost } from "../lib/api-client";
import { t, type UiLocale } from "../lib/ui-locale";
import { SchemaForm } from "./SchemaForm";

export function AdminDocEditor({
  title,
  schema,
  uiLocale,
  role,
  initialDraftContent,
  initialPublishedContent,
  savePath,
  publishPath,
  previewUrl
}: {
  title: string;
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
  uiLocale: UiLocale;
  role: "viewer" | "editor" | "admin";
  initialDraftContent: Record<string, unknown>;
  initialPublishedContent: Record<string, unknown>;
  savePath: string;
  publishPath: string;
  previewUrl: string;
}) {
  const [draft, setDraft] = useState(initialDraftContent);
  const [published, setPublished] = useState(initialPublishedContent);
  const [status, setStatus] = useState("");

  const normalizedPreviewUrl = useMemo(() => previewUrl, [previewUrl]);

  async function saveDraft(content: Record<string, unknown>) {
    setDraft(content);
    await clientApiPost(savePath, {
      content
    });
    setStatus(t(uiLocale, { zh: "草稿已保存", en: "Draft saved" }));
  }

  async function publish() {
    await clientApiPost(publishPath, {});
    setPublished(draft);
    setStatus(t(uiLocale, { zh: "已发布", en: "Published" }));
  }

  return (
    <div className="admin-main">
      <section className="card">
        <div className="top-bar">
          <h1 style={{ margin: 0 }}>{title}</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href={normalizedPreviewUrl} className="button" target="_blank">
              {t(uiLocale, { zh: "预览草稿", en: "Preview Draft" })}
            </Link>
            <button className="button primary" onClick={publish}>
              {t(uiLocale, { zh: "发布", en: "Publish" })}
            </button>
          </div>
        </div>
        {status ? <p className="meta">{status}</p> : null}
      </section>

      <SchemaForm
        schema={schema}
        initial={draft}
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
