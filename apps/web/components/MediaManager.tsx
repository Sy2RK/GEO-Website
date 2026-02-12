"use client";

import { useState } from "react";
import { clientApiPost } from "../lib/api-client";
import { t, type UiLocale } from "../lib/ui-locale";

type MediaAsset = {
  id: string;
  type: string;
  url: string;
  meta?: {
    altText?: string;
    sortOrder?: number;
  };
};

export function MediaManager({
  ownerType,
  ownerId,
  locale,
  uiLocale,
  initialMedia,
  title
}: {
  ownerType: "product" | "collection" | "leaderboard" | "homepage";
  ownerId: string;
  locale: string;
  uiLocale: UiLocale;
  initialMedia: MediaAsset[];
  title: string;
}) {
  const [media, setMedia] = useState(initialMedia);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [mediaAlt, setMediaAlt] = useState("");
  const [status, setStatus] = useState("");

  async function refreshMedia() {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"}/api/media?ownerType=${ownerType}&ownerId=${encodeURIComponent(
        ownerId
      )}&locale=${encodeURIComponent(locale)}`
    );
    if (!response.ok) {
      throw new Error(`media_fetch_failed:${response.status}`);
    }
    const payload = (await response.json()) as { items: MediaAsset[] };
    setMedia(payload.items);
  }

  async function addMedia(event: React.FormEvent) {
    event.preventDefault();
    await clientApiPost("/api/admin/media", {
      ownerType,
      ownerId,
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
    <section className="card">
      <h2 className="section-title">{title}</h2>
      <p className="meta">
        {t(uiLocale, {
          zh: "可登记图片/视频/presskit 等资源，并维护 altText 与排序（用于可访问性与 GEO 抽取）。",
          en: "Register image/video/presskit assets and maintain altText + ordering (for accessibility and GEO extraction)."
        })}
      </p>
      {status ? <p className="meta">{status}</p> : null}
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
        <button type="submit" className="primary">
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
  );
}
