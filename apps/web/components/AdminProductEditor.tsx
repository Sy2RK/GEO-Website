"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SchemaForm } from "./SchemaForm";
import { clientApiGet, clientApiPost } from "../lib/api-client";
import { t, type UiLocale } from "../lib/ui-locale";

type Skill = {
  id: string;
  name: string;
  description: string;
};

type MediaAsset = {
  id: string;
  type: string;
  url: string;
  meta?: {
    altText?: string;
    sortOrder?: number;
  };
};

export function AdminProductEditor({
  canonicalId,
  locale,
  uiLocale,
  slugByLocale,
  role,
  schema,
  initialDraftContent,
  initialPublishedContent,
  skills,
  initialMedia
}: {
  canonicalId: string;
  locale: string;
  uiLocale: UiLocale;
  slugByLocale: Record<string, string>;
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
  skills: Skill[];
  initialMedia: MediaAsset[];
}) {
  const [content, setContent] = useState<Record<string, unknown>>(initialDraftContent);
  const [published, setPublished] = useState<Record<string, unknown>>(initialPublishedContent);
  const [status, setStatus] = useState<string>("");
  const [media, setMedia] = useState<MediaAsset[]>(initialMedia);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [mediaAlt, setMediaAlt] = useState("");
  const [runningSkill, setRunningSkill] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    const localePath = locale === "en" ? "en" : "zh";
    const slug = slugByLocale[locale] ?? slugByLocale.en ?? slugByLocale["zh-CN"] ?? canonicalId;
    return `/${localePath}/products/${encodeURIComponent(slug)}?state=draft`;
  }, [canonicalId, locale, slugByLocale]);

  async function saveDraft(next: Record<string, unknown>) {
    setContent(next);
    await clientApiPost(`/api/admin/products/${encodeURIComponent(canonicalId)}/docs/${locale}/draft`, {
      content: next
    });
    setStatus(t(uiLocale, { zh: "草稿已保存", en: "Draft saved" }));
  }

  async function publishDraft() {
    await clientApiPost(`/api/admin/products/${encodeURIComponent(canonicalId)}/docs/${locale}/publish`, {});
    setPublished(content);
    setStatus(t(uiLocale, { zh: "已发布", en: "Published" }));
  }

  async function runSkill(skillId: string) {
    setRunningSkill(skillId);
    try {
      const result = await clientApiPost<{ output: { suggestions?: string[] } }>("/api/skills/run", {
        skillId,
        input: {
          canonicalId,
          locale
        }
      });

      const suggestions = result.output.suggestions ?? [];
      const editing = (content.editing as Record<string, unknown> | undefined) ?? {};
      const oldSuggestions = (editing.suggestions as string[] | undefined) ?? [];

      const next = {
        ...content,
        editing: {
          ...editing,
          suggestions: [...oldSuggestions, ...suggestions]
        }
      };

      setContent(next);
      await clientApiPost(`/api/admin/products/${encodeURIComponent(canonicalId)}/docs/${locale}/draft`, {
        content: next
      });
      setStatus(t(uiLocale, { zh: `技能 ${skillId} 已完成`, en: `Skill ${skillId} finished` }));
    } finally {
      setRunningSkill(null);
    }
  }

  async function refreshMedia() {
    const result = await clientApiGet<{ items: MediaAsset[] }>("/api/media", {
      ownerType: "product",
      ownerId: canonicalId,
      locale
    });
    setMedia(result.items);
  }

  async function addMedia(event: React.FormEvent) {
    event.preventDefault();
    await clientApiPost("/api/admin/media", {
      ownerType: "product",
      ownerId: canonicalId,
      locale,
      type: mediaType,
      url: mediaUrl,
      meta: {
        altText: mediaAlt
      }
    });

    setMediaUrl("");
    setMediaAlt("");
    await refreshMedia();
    setStatus(t(uiLocale, { zh: "媒体已添加", en: "Media added" }));
  }

  async function saveMedia(item: MediaAsset) {
    await clientApiPost(
      `/api/admin/media/${item.id}`,
      {
        type: item.type,
        url: item.url,
        meta: item.meta ?? {}
      },
      { method: "PATCH" }
    );
    await refreshMedia();
    setStatus(t(uiLocale, { zh: "媒体已更新", en: "Media updated" }));
  }

  async function deleteMedia(id: string) {
    const token = document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("guru_token="))
      ?.split("=")[1];
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"}/api/admin/media/${id}`,
      {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
      }
    );
    if (!response.ok) {
      throw new Error(`media_delete_failed:${response.status}`);
    }
    await refreshMedia();
    setStatus(t(uiLocale, { zh: "媒体已删除", en: "Media deleted" }));
  }

  return (
    <div className="admin-main">
      <section className="card">
        <div className="top-bar">
          <h1 style={{ margin: 0 }}>{canonicalId}</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href={previewUrl} className="button" target="_blank">
              {t(uiLocale, { zh: "预览草稿", en: "Preview Draft" })}
            </Link>
            <button className="primary" onClick={publishDraft}>
              {t(uiLocale, { zh: "发布", en: "Publish" })}
            </button>
          </div>
        </div>
        <p className="meta">
          {t(uiLocale, { zh: "内容语言", en: "Content locale" })}: {locale}
        </p>
        {status ? <p className="meta">{status}</p> : null}
      </section>

      <SchemaForm
        schema={schema}
        initial={content}
        role={role}
        uiLocale={uiLocale}
        submitLabel={t(uiLocale, { zh: "保存草稿", en: "Save Draft" })}
        onSubmit={saveDraft}
      />

      <section className="card">
        <h2 className="section-title">{t(uiLocale, { zh: "已发布快照", en: "Published Snapshot" })}</h2>
        <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(published, null, 2)}</pre>
      </section>

      <section className="card">
        <h2 className="section-title">{t(uiLocale, { zh: "运行技能", en: "Run Skill" })}</h2>
        <p className="meta">
          {t(uiLocale, {
            zh: "技能结果会写入 editing.suggestions，不会直接覆盖锁定的 canonical 字段。",
            en: "Skill outputs are written to editing.suggestions and do not overwrite locked canonical fields."
          })}
        </p>
        <div className="list">
          {skills.map((skill) => (
            <div className="card" key={skill.id}>
              <strong>{skill.name}</strong>
              <p className="meta">{skill.description}</p>
              <button disabled={!!runningSkill} onClick={() => runSkill(skill.id)}>
                {runningSkill === skill.id
                  ? t(uiLocale, { zh: "运行中...", en: "Running..." })
                  : t(uiLocale, { zh: "运行技能", en: "Run Skill" })}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">{t(uiLocale, { zh: "媒体资源", en: "Media" })}</h2>
        <p className="meta">
          {t(uiLocale, {
            zh: "添加或维护产品图片/视频/封面。建议为关键图片填写 alt 文本。",
            en: "Add and maintain product images/videos/covers. Provide alt text for key images."
          })}
        </p>
        <form onSubmit={addMedia} className="list" style={{ marginBottom: 12 }}>
          <div className="two-col">
            <input
              value={mediaUrl}
              onChange={(event) => setMediaUrl(event.target.value)}
              placeholder={t(uiLocale, { zh: "媒体 URL", en: "Media URL" })}
              required
            />
            <select value={mediaType} onChange={(event) => setMediaType(event.target.value)}>
              <option value="image">image</option>
              <option value="video">video</option>
              <option value="presskit">presskit</option>
              <option value="icon">icon</option>
              <option value="cover">cover</option>
            </select>
          </div>
          <input
            value={mediaAlt}
            onChange={(event) => setMediaAlt(event.target.value)}
            placeholder={t(uiLocale, { zh: "alt 文本", en: "alt text" })}
          />
          <button className="primary" type="submit">
            {t(uiLocale, { zh: "添加媒体", en: "Add media" })}
          </button>
        </form>

        <div className="grid products">
          {media.map((item) => (
            <article className="card" key={item.id}>
              <label>
                {t(uiLocale, { zh: "URL 地址", en: "URL" })}
                <input
                  value={item.url}
                  onChange={(event) =>
                    setMedia(
                      media.map((entry) =>
                        entry.id === item.id
                          ? {
                              ...entry,
                              url: event.target.value
                            }
                          : entry
                      )
                    )
                  }
                />
              </label>
              <label>
                {t(uiLocale, { zh: "媒体类型", en: "Type" })}
                <select
                  value={item.type}
                  onChange={(event) =>
                    setMedia(
                      media.map((entry) =>
                        entry.id === item.id
                          ? {
                              ...entry,
                              type: event.target.value
                            }
                          : entry
                      )
                    )
                  }
                >
                  <option value="image">image</option>
                  <option value="video">video</option>
                  <option value="presskit">presskit</option>
                  <option value="icon">icon</option>
                  <option value="cover">cover</option>
                </select>
              </label>
              <label>
                {t(uiLocale, { zh: "替代文本 altText", en: "altText" })}
                <input
                  value={item.meta?.altText ?? ""}
                  onChange={(event) =>
                    setMedia(
                      media.map((entry) =>
                        entry.id === item.id
                          ? {
                              ...entry,
                              meta: {
                                ...(entry.meta ?? {}),
                                altText: event.target.value
                              }
                            }
                          : entry
                      )
                    )
                  }
                />
              </label>
              <label>
                {t(uiLocale, { zh: "排序 sortOrder", en: "sortOrder" })}
                <input
                  type="number"
                  value={Number(item.meta?.sortOrder ?? 0)}
                  onChange={(event) =>
                    setMedia(
                      media.map((entry) =>
                        entry.id === item.id
                          ? {
                              ...entry,
                              meta: {
                                ...(entry.meta ?? {}),
                                sortOrder: Number(event.target.value || "0")
                              }
                            }
                          : entry
                      )
                    )
                  }
                />
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => saveMedia(item)}>{t(uiLocale, { zh: "保存", en: "Save" })}</button>
                <button onClick={() => deleteMedia(item.id)}>{t(uiLocale, { zh: "删除", en: "Delete" })}</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
