"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { clientApiPost } from "../lib/api-client";
import { t, type UiLocale } from "../lib/ui-locale";

type FeaturedItem = {
  canonicalId: string;
  badge?: string;
  reason?: string;
  priority?: number;
  startAt?: string;
  endAt?: string;
};

type LeaderboardRef = {
  boardId: string;
  placement: string;
  maxItems: number;
};

type CollectionRef = {
  collectionId: string;
  placement: string;
  maxItems: number;
};

type HomepageContent = {
  featured: FeaturedItem[];
  leaderboardRefs: LeaderboardRef[];
  collectionRefs: CollectionRef[];
};

function move<T>(arr: T[], from: number, to: number): T[] {
  const cloned = [...arr];
  const [item] = cloned.splice(from, 1);
  cloned.splice(to, 0, item);
  return cloned;
}

export function AdminHomepageEditor({
  uiLocale,
  locale,
  initial,
  availableProducts,
  availableCollections,
  initialMedia
}: {
  uiLocale: UiLocale;
  locale: string;
  initial: HomepageContent;
  availableProducts: Array<{ canonicalId: string }>;
  availableCollections: Array<{ collectionId: string }>;
  initialMedia: Array<{ id: string; type: string; url: string; meta?: { altText?: string; sortOrder?: number } }>;
}) {
  const [content, setContent] = useState<HomepageContent>(initial);
  const [media, setMedia] = useState(initialMedia);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [mediaAlt, setMediaAlt] = useState("");
  const [status, setStatus] = useState("");
  const tt = (zh: string, en: string): string => t(uiLocale, { zh, en });

  const previewUrl = useMemo(() => {
    const localePath = locale === "en" ? "en" : "zh";
    return `/${localePath}?state=draft`;
  }, [locale]);

  async function saveDraft() {
    await clientApiPost(`/api/admin/homepage/${locale}/draft`, {
      content
    });
    setStatus(tt("草稿已保存", "Draft saved"));
  }

  async function publish() {
    try {
      await clientApiPost(`/api/admin/homepage/${locale}/draft`, {
        content
      });
      await clientApiPost(`/api/admin/homepage/${locale}/publish`, {});
      setStatus(tt("已保存并发布", "Saved and published"));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : tt("发布失败", "Publish failed"));
    }
  }

  async function refreshMedia() {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"}/api/media?ownerType=homepage&ownerId=${encodeURIComponent(
        locale
      )}&locale=${encodeURIComponent(locale)}`
    );
    if (!response.ok) {
      throw new Error(`media_fetch_failed:${response.status}`);
    }
    const payload = (await response.json()) as {
      items: Array<{ id: string; type: string; url: string; meta?: { altText?: string; sortOrder?: number } }>;
    };
    setMedia(payload.items);
  }

  async function addMedia(event: React.FormEvent) {
    event.preventDefault();
    await clientApiPost("/api/admin/media", {
      ownerType: "homepage",
      ownerId: locale,
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
    setStatus(tt("媒体已添加", "Media added"));
  }

  async function saveMedia(item: { id: string; type: string; url: string; meta?: { altText?: string; sortOrder?: number } }) {
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
    setStatus(tt("媒体已更新", "Media updated"));
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
    setStatus(tt("媒体已删除", "Media deleted"));
  }

  return (
    <div className="admin-main">
      <section className="card">
        <div className="top-bar">
          <h1 style={{ margin: 0 }}>
            {tt("首页编辑器", "Homepage Editor")} ({locale})
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href={previewUrl} target="_blank" className="button">
              {tt("预览草稿", "Preview Draft")}
            </Link>
            <button onClick={saveDraft} className="button primary">
              {tt("保存草稿", "Save Draft")}
            </button>
            <button onClick={publish} className="button">
              {tt("发布", "Publish")}
            </button>
          </div>
        </div>
        <p className="meta">
          {tt(
            "该页面用于运营首页模块（精选/榜单/专题），草稿可通过 Preview Mode 预览。",
            "Use this page to operate homepage modules (featured/leaderboards/collections). Drafts can be previewed via Preview Mode."
          )}
        </p>
        {status ? <p className="meta">{status}</p> : null}
      </section>

      <section className="card">
        <h2 className="section-title">{tt("精选轮播", "Featured Carousel")}</h2>
        <p className="meta">
          {tt(
            "编辑项说明：canonicalId=产品主键，badge=角标，reason=推荐理由，priority=排序权重。",
            "Field guide: canonicalId=product key, badge=label, reason=why featured, priority=sorting weight."
          )}
        </p>
        <div className="list">
          {content.featured.map((item, index) => (
            <article className="card" key={`${item.canonicalId}-${index}`}>
              <div className="two-col">
                <label>
                  {tt("canonicalId（产品唯一标识）", "canonicalId")}
                  <select
                    value={item.canonicalId}
                    onChange={(event) =>
                      setContent({
                        ...content,
                        featured: content.featured.map((entry, i) =>
                          i === index ? { ...entry, canonicalId: event.target.value } : entry
                        )
                      })
                    }
                  >
                    {availableProducts.map((product) => (
                      <option key={product.canonicalId} value={product.canonicalId}>
                        {product.canonicalId}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {tt("badge（角标）", "badge")}
                  <input
                    value={item.badge ?? ""}
                    onChange={(event) =>
                      setContent({
                        ...content,
                        featured: content.featured.map((entry, i) =>
                          i === index ? { ...entry, badge: event.target.value } : entry
                        )
                      })
                    }
                  />
                </label>
              </div>
              <div className="two-col">
                <label>
                  {tt("reason（推荐理由）", "reason")}
                  <input
                    value={item.reason ?? ""}
                    onChange={(event) =>
                      setContent({
                        ...content,
                        featured: content.featured.map((entry, i) =>
                          i === index ? { ...entry, reason: event.target.value } : entry
                        )
                      })
                    }
                  />
                </label>
                <label>
                  {tt("priority（优先级）", "priority")}
                  <input
                    type="number"
                    value={item.priority ?? 0}
                    onChange={(event) =>
                      setContent({
                        ...content,
                        featured: content.featured.map((entry, i) =>
                          i === index ? { ...entry, priority: Number(event.target.value || "0") } : entry
                        )
                      })
                    }
                  />
                </label>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() =>
                    setContent({
                      ...content,
                      featured: content.featured.filter((_, i) => i !== index)
                    })
                  }
                >
                  {tt("删除", "Delete")}
                </button>
                {index > 0 ? (
                  <button
                    onClick={() =>
                      setContent({
                        ...content,
                        featured: move(content.featured, index, index - 1)
                      })
                    }
                  >
                    {tt("上移", "Move Up")}
                  </button>
                ) : null}
                {index < content.featured.length - 1 ? (
                  <button
                    onClick={() =>
                      setContent({
                        ...content,
                        featured: move(content.featured, index, index + 1)
                      })
                    }
                  >
                    {tt("下移", "Move Down")}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <button
          style={{ marginTop: 10 }}
          onClick={() =>
            setContent({
              ...content,
              featured: [
                ...content.featured,
                {
                  canonicalId: availableProducts[0]?.canonicalId ?? "",
                  badge: "",
                  reason: "",
                  priority: content.featured.length + 1
                }
              ]
            })
          }
        >
          {tt("新增精选项", "Add Featured")}
        </button>
      </section>

      <section className="card">
        <h2 className="section-title">{tt("榜单引用", "Leaderboard Refs")}</h2>
        <p className="meta">
          {tt(
            "编辑项说明：boardId=榜单ID，placement=展示位置标记，maxItems=最大展示条数。",
            "Field guide: boardId=leaderboard id, placement=placement key, maxItems=maximum visible items."
          )}
        </p>
        <div className="list">
          {content.leaderboardRefs.map((item, index) => (
            <article className="card" key={`${item.boardId}-${index}`}>
              <div className="two-col">
                <label>
                  {tt("boardId（榜单）", "boardId")}
                  <select
                    value={item.boardId}
                    onChange={(event) =>
                      setContent({
                        ...content,
                        leaderboardRefs: content.leaderboardRefs.map((entry, i) =>
                          i === index ? { ...entry, boardId: event.target.value } : entry
                        )
                      })
                    }
                  >
                    <option value="games_top">games_top</option>
                    <option value="ai_top">ai_top</option>
                    <option value="overall_top">overall_top</option>
                    <option value="new_and_noteworthy">new_and_noteworthy</option>
                  </select>
                </label>
                <label>
                  {tt("placement（位置）", "placement")}
                  <input
                    value={item.placement}
                    onChange={(event) =>
                      setContent({
                        ...content,
                        leaderboardRefs: content.leaderboardRefs.map((entry, i) =>
                          i === index ? { ...entry, placement: event.target.value } : entry
                        )
                      })
                    }
                  />
                </label>
              </div>
              <label>
                {tt("maxItems（最大条目）", "maxItems")}
                <input
                  type="number"
                  value={item.maxItems}
                  onChange={(event) =>
                    setContent({
                      ...content,
                      leaderboardRefs: content.leaderboardRefs.map((entry, i) =>
                        i === index ? { ...entry, maxItems: Number(event.target.value || "0") } : entry
                      )
                    })
                  }
                />
              </label>
              <button
                onClick={() =>
                  setContent({
                    ...content,
                    leaderboardRefs: content.leaderboardRefs.filter((_, i) => i !== index)
                  })
                }
              >
                {tt("删除", "Delete")}
              </button>
            </article>
          ))}
        </div>
        <button
          style={{ marginTop: 10 }}
          onClick={() =>
            setContent({
              ...content,
              leaderboardRefs: [
                ...content.leaderboardRefs,
                {
                  boardId: "games_top",
                  placement: "main",
                  maxItems: 10
                }
              ]
            })
          }
        >
          {tt("新增榜单引用", "Add Leaderboard Ref")}
        </button>
      </section>

      <section className="card">
        <h2 className="section-title">{tt("专题引用", "Collection Refs")}</h2>
        <p className="meta">
          {tt(
            "编辑项说明：collectionId=专题ID，placement=展示位置标记，maxItems=最大展示条数。",
            "Field guide: collectionId=collection id, placement=placement key, maxItems=maximum visible items."
          )}
        </p>
        <div className="list">
          {content.collectionRefs.map((item, index) => (
            <article className="card" key={`${item.collectionId}-${index}`}>
              <div className="two-col">
                <label>
                  {tt("collectionId（专题）", "collectionId")}
                  <select
                    value={item.collectionId}
                    onChange={(event) =>
                      setContent({
                        ...content,
                        collectionRefs: content.collectionRefs.map((entry, i) =>
                          i === index ? { ...entry, collectionId: event.target.value } : entry
                        )
                      })
                    }
                  >
                    {availableCollections.map((collection) => (
                      <option key={collection.collectionId} value={collection.collectionId}>
                        {collection.collectionId}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {tt("placement（位置）", "placement")}
                  <input
                    value={item.placement}
                    onChange={(event) =>
                      setContent({
                        ...content,
                        collectionRefs: content.collectionRefs.map((entry, i) =>
                          i === index ? { ...entry, placement: event.target.value } : entry
                        )
                      })
                    }
                  />
                </label>
              </div>
              <label>
                {tt("maxItems（最大条目）", "maxItems")}
                <input
                  type="number"
                  value={item.maxItems}
                  onChange={(event) =>
                    setContent({
                      ...content,
                      collectionRefs: content.collectionRefs.map((entry, i) =>
                        i === index ? { ...entry, maxItems: Number(event.target.value || "0") } : entry
                      )
                    })
                  }
                />
              </label>
              <button
                onClick={() =>
                  setContent({
                    ...content,
                    collectionRefs: content.collectionRefs.filter((_, i) => i !== index)
                  })
                }
              >
                {tt("删除", "Delete")}
              </button>
            </article>
          ))}
        </div>
        <button
          style={{ marginTop: 10 }}
          onClick={() =>
            setContent({
              ...content,
              collectionRefs: [
                ...content.collectionRefs,
                {
                  collectionId: availableCollections[0]?.collectionId ?? "",
                  placement: "main",
                  maxItems: 8
                }
              ]
            })
          }
        >
          {tt("新增专题引用", "Add Collection Ref")}
        </button>
      </section>

      <section className="card">
        <h2 className="section-title">{tt("原始 JSON", "Raw JSON")}</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(content, null, 2)}</pre>
      </section>

      <section className="card">
        <h2 className="section-title">{tt("首页媒体", "Homepage Media")}</h2>
        <p className="meta">
          {tt(
            "可登记首页图片/视频素材，并维护 altText 与 sortOrder。",
            "Register homepage image/video assets and maintain altText + sortOrder."
          )}
        </p>
        <form onSubmit={addMedia} className="list" style={{ marginBottom: 12 }}>
          <div className="two-col">
            <input
              value={mediaUrl}
              onChange={(event) => setMediaUrl(event.target.value)}
              placeholder={tt("媒体 URL", "Media URL")}
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
          <input value={mediaAlt} onChange={(event) => setMediaAlt(event.target.value)} placeholder={tt("alt 文本", "alt text")} />
          <button type="submit" className="primary">
            {tt("添加媒体", "Add media")}
          </button>
        </form>

        <div className="grid products">
          {media.map((item) => (
            <article className="card" key={item.id}>
              <label>
                {tt("URL 地址", "URL")}
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
                {tt("媒体类型", "Type")}
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
                {tt("替代文本 altText", "altText")}
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
                {tt("排序 sortOrder", "sortOrder")}
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
                <button onClick={() => saveMedia(item)}>{tt("保存", "Save")}</button>
                <button onClick={() => deleteMedia(item.id)}>{tt("删除", "Delete")}</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
