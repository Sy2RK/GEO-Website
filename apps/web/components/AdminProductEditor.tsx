"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SchemaForm } from "./SchemaForm";
import { clientApiDelete, clientApiGet, clientApiPost } from "../lib/api-client";
import { t, type UiLocale } from "../lib/ui-locale";
import { localizeSkill } from "../lib/skills-i18n";

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
  const router = useRouter();
  const [content, setContent] = useState<Record<string, unknown>>(initialDraftContent);
  const [published, setPublished] = useState<Record<string, unknown>>(initialPublishedContent);
  const [slugMap, setSlugMap] = useState<Record<string, string>>({
    "zh-CN": slugByLocale["zh-CN"] ?? "",
    en: slugByLocale.en ?? ""
  });
  const [schemaFormVersion, setSchemaFormVersion] = useState(0);
  const [publishedEditorText, setPublishedEditorText] = useState(
    JSON.stringify(initialPublishedContent ?? {}, null, 2)
  );
  const [status, setStatus] = useState<string>("");
  const [jsonError, setJsonError] = useState<string>("");
  const [media, setMedia] = useState<MediaAsset[]>(initialMedia);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [mediaAlt, setMediaAlt] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [runningSkill, setRunningSkill] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  useEffect(() => {
    // When content locale changes (zh-CN <-> en), reset editor state to locale-specific payload.
    setContent(initialDraftContent);
    setPublished(initialPublishedContent);
    setSlugMap({
      "zh-CN": slugByLocale["zh-CN"] ?? "",
      en: slugByLocale.en ?? ""
    });
    setPublishedEditorText(JSON.stringify(initialPublishedContent ?? {}, null, 2));
    setSchemaFormVersion((value) => value + 1);
    setMedia(initialMedia);
    setStatus("");
    setJsonError("");
  }, [canonicalId, locale, initialDraftContent, initialPublishedContent, slugByLocale, initialMedia]);

  const previewUrl = useMemo(() => {
    const localePath = locale === "en" ? "en" : "zh";
    const slug = slugMap[locale] ?? slugMap.en ?? slugMap["zh-CN"] ?? canonicalId;
    return `/${localePath}/products/${encodeURIComponent(slug)}?state=draft`;
  }, [canonicalId, locale, slugMap]);

  async function saveDraft(next: Record<string, unknown>) {
    setContent(next);
    await clientApiPost(`/api/admin/products/${encodeURIComponent(canonicalId)}/docs/${locale}/draft`, {
      content: next
    });
    setStatus(t(uiLocale, { zh: "草稿已保存", en: "Draft saved" }));
  }

  async function publishDraft() {
    try {
      await clientApiPost(`/api/admin/products/${encodeURIComponent(canonicalId)}/docs/${locale}/draft`, {
        content
      });
      await clientApiPost(`/api/admin/products/${encodeURIComponent(canonicalId)}/docs/${locale}/publish`, {});
      setPublished(content);
      setPublishedEditorText(JSON.stringify(content, null, 2));
      setStatus(t(uiLocale, { zh: "已保存并发布", en: "Saved and published" }));
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : t(uiLocale, { zh: "发布失败", en: "Publish failed" })
      );
    }
  }

  function parseEditorJson(): Record<string, unknown> {
    try {
      const parsed = JSON.parse(publishedEditorText) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error(
          t(uiLocale, {
            zh: "JSON 顶层必须是对象",
            en: "JSON root must be an object"
          })
        );
      }
      setJsonError("");
      return parsed as Record<string, unknown>;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t(uiLocale, { zh: "JSON 解析失败", en: "Failed to parse JSON" });
      setJsonError(message);
      throw error;
    }
  }

  async function saveJsonAsDraft() {
    const next = parseEditorJson();
    await clientApiPost(`/api/admin/products/${encodeURIComponent(canonicalId)}/docs/${locale}/draft`, {
      content: next
    });
    setContent(next);
    setSchemaFormVersion((value) => value + 1);
    setStatus(t(uiLocale, { zh: "JSON 已保存到草稿", en: "JSON saved to draft" }));
  }

  async function publishJsonDirectly() {
    const next = parseEditorJson();
    await clientApiPost(`/api/admin/products/${encodeURIComponent(canonicalId)}/docs/${locale}/draft`, {
      content: next
    });
    await clientApiPost(`/api/admin/products/${encodeURIComponent(canonicalId)}/docs/${locale}/publish`, {});
    setContent(next);
    setSchemaFormVersion((value) => value + 1);
    setPublished(next);
    setPublishedEditorText(JSON.stringify(next, null, 2));
    setStatus(t(uiLocale, { zh: "JSON 已直接发布", en: "JSON published directly" }));
  }

  async function runSkill(skillId: string) {
    setRunningSkill(skillId);
    try {
      const sourceLocale = locale === "en" ? "zh-CN" : "en";
      const result = await clientApiPost<{
        output: { suggestions?: string[]; translatedContent?: Record<string, unknown>; sourceLocale?: string };
      }>("/api/skills/run", {
        skillId,
        input: {
          canonicalId,
          locale,
          sourceLocale
        }
      });

      if (result.output.translatedContent && typeof result.output.translatedContent === "object") {
        const next = result.output.translatedContent;
        await clientApiPost(`/api/admin/products/${encodeURIComponent(canonicalId)}/docs/${locale}/draft`, {
          content: next
        });
        setContent(next);
        setSchemaFormVersion((value) => value + 1);
        setStatus(
          t(uiLocale, {
            zh: `已基于 ${result.output.sourceLocale ?? sourceLocale} 生成当前语言草稿`,
            en: `Draft generated from ${result.output.sourceLocale ?? sourceLocale}`
          })
        );
        return;
      }

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
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : t(uiLocale, { zh: "技能执行失败", en: "Skill execution failed" })
      );
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

  async function uploadCoverFile(event: React.FormEvent) {
    event.preventDefault();
    if (!coverFile) {
      setStatus(t(uiLocale, { zh: "请先选择封面文件", en: "Please select a cover file first" }));
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("file_read_failed"));
      reader.readAsDataURL(coverFile);
    });

    await clientApiPost("/api/admin/media", {
      ownerType: "product",
      ownerId: canonicalId,
      locale,
      type: "cover",
      url: dataUrl,
      meta: {
        altText: mediaAlt || coverFile.name
      }
    });

    setCoverFile(null);
    setMediaAlt("");
    await refreshMedia();
    setStatus(t(uiLocale, { zh: "封面上传成功", en: "Cover uploaded" }));
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

  async function saveSlugByLocale() {
    await clientApiPost<{ slugByLocale?: Record<string, string> }>(
      "/api/admin/products",
      {
        canonicalId,
        patch: {
          slugByLocale: {
            "zh-CN": slugMap["zh-CN"]?.trim() ?? "",
            en: slugMap.en?.trim() ?? ""
          }
        }
      },
      { method: "PATCH" }
    );
    setStatus(t(uiLocale, { zh: "路由 slug 已保存", en: "Route slugs saved" }));
  }

  async function deleteCurrentProduct() {
    const confirmed = window.confirm(
      t(uiLocale, {
        zh: "确认删除该产品吗？此操作会将产品状态改为 archived，并从公开列表中移除。",
        en: "Delete this product? This will set status to archived and remove it from public listings."
      })
    );

    if (!confirmed) {
      return;
    }

    setDeletingProduct(true);
    try {
      await clientApiDelete(`/api/admin/products/${encodeURIComponent(canonicalId)}`);
      router.push(`/admin/products?ui=${uiLocale}&status=active`);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t(uiLocale, { zh: "删除失败", en: "Delete failed" }));
      setDeletingProduct(false);
    }
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
            <button
              type="button"
              className="button ghost"
              onClick={deleteCurrentProduct}
              disabled={deletingProduct || role === "viewer"}
            >
              {deletingProduct
                ? t(uiLocale, { zh: "删除中...", en: "Deleting..." })
                : t(uiLocale, { zh: "删除产品", en: "Delete Product" })}
            </button>
            <button className="primary" onClick={publishDraft}>
              {t(uiLocale, { zh: "发布", en: "Publish" })}
            </button>
          </div>
        </div>
        <p className="meta">
          {t(uiLocale, { zh: "内容语言", en: "Content locale" })}: {locale}
        </p>
        <div className="two-col" style={{ marginTop: 8 }}>
          <label>
            {t(uiLocale, { zh: "中文 slug (zh-CN)", en: "zh-CN slug" })}
            <input
              value={slugMap["zh-CN"] ?? ""}
              onChange={(event) => setSlugMap((prev) => ({ ...prev, "zh-CN": event.target.value }))}
              placeholder="ball-sort"
              disabled={role === "viewer"}
            />
          </label>
          <label>
            {t(uiLocale, { zh: "英文 slug (en)", en: "en slug" })}
            <input
              value={slugMap.en ?? ""}
              onChange={(event) => setSlugMap((prev) => ({ ...prev, en: event.target.value }))}
              placeholder="ball-sort"
              disabled={role === "viewer"}
            />
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <button className="button" onClick={saveSlugByLocale} disabled={role === "viewer"}>
            {t(uiLocale, { zh: "保存路由 slug", en: "Save Route Slugs" })}
          </button>
        </div>
        {status ? <p className="meta">{status}</p> : null}
      </section>

      <SchemaForm
        key={`schema-form-${canonicalId}-${locale}-${schemaFormVersion}`}
        schema={schema}
        initial={content}
        role={role}
        uiLocale={uiLocale}
        submitLabel={t(uiLocale, { zh: "保存草稿", en: "Save Draft" })}
        onSubmit={saveDraft}
      />

      <section className="card">
        <h2 className="section-title">{t(uiLocale, { zh: "已发布快照", en: "Published Snapshot" })}</h2>
        <p className="meta">
          {t(uiLocale, {
            zh: "可直接修改下方 JSON 进行快速全量编辑：可保存为草稿，或直接发布。",
            en: "Edit JSON below for fast full updates: save as draft or publish directly."
          })}
        </p>
        <textarea
          value={publishedEditorText}
          onChange={(event) => setPublishedEditorText(event.target.value)}
          style={{ width: "100%", minHeight: 300, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <button
            className="button"
            onClick={() => {
              setPublishedEditorText(JSON.stringify(published ?? {}, null, 2));
              setJsonError("");
            }}
          >
            {t(uiLocale, { zh: "重置为已发布内容", en: "Reset to Published" })}
          </button>
          <button className="button" onClick={saveJsonAsDraft}>
            {t(uiLocale, { zh: "保存 JSON 到草稿", en: "Save JSON to Draft" })}
          </button>
          <button className="button primary" onClick={publishJsonDirectly}>
            {t(uiLocale, { zh: "直接发布该 JSON", en: "Publish This JSON" })}
          </button>
        </div>
        {jsonError ? <p className="warning">{jsonError}</p> : null}
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
          {skills.map((item) => {
            const skill = localizeSkill(item, uiLocale);
            return (
            <div className="card" key={skill.id}>
              <strong>{skill.name}</strong>
              <p className="meta">{skill.description}</p>
              <button disabled={!!runningSkill} onClick={() => runSkill(skill.id)}>
                {runningSkill === skill.id
                  ? t(uiLocale, { zh: "运行中...", en: "Running..." })
                  : t(uiLocale, { zh: "运行技能", en: "Run Skill" })}
              </button>
            </div>
            );
          })}
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

        <form onSubmit={uploadCoverFile} className="list" style={{ marginBottom: 12 }}>
          <div className="two-col">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
            />
            <input
              value={mediaAlt}
              onChange={(event) => setMediaAlt(event.target.value)}
              placeholder={t(uiLocale, { zh: "封面 alt 文本", en: "Cover alt text" })}
            />
          </div>
          <button className="button" type="submit">
            {t(uiLocale, { zh: "上传本地封面", en: "Upload Local Cover" })}
          </button>
          <p className="meta">
            {t(uiLocale, {
              zh: "本期为快速接入：本地图片将以 data URL 方式写入媒体库。生产环境建议使用 CDN/S3 URL。",
              en: "Quick integration: local image is stored as a data URL. For production, use CDN/S3 URLs."
            })}
          </p>
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
