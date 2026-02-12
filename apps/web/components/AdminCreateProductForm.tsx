"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clientApiPost } from "../lib/api-client";
import { t, type UiLocale } from "../lib/ui-locale";

const platformOptions = ["ios", "android", "web", "pc", "mac"] as const;

type Platform = (typeof platformOptions)[number];

export function AdminCreateProductForm({ uiLocale }: { uiLocale: UiLocale }) {
  const router = useRouter();
  const [canonicalId, setCanonicalId] = useState("guru:product:");
  const [slugZh, setSlugZh] = useState("");
  const [slugEn, setSlugEn] = useState("");
  const [kind, setKind] = useState<"game" | "ai">("game");
  const [tags, setTags] = useState("");
  const [developer, setDeveloper] = useState("Guru Studio");
  const [publisher, setPublisher] = useState("Guru Studio");
  const [brand, setBrand] = useState("Guru");
  const [platforms, setPlatforms] = useState<Platform[]>(["ios", "android", "web"]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tt = (zh: string, en: string): string => t(uiLocale, { zh, en });

  const normalizedTags = useMemo(
    () =>
      tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    [tags]
  );

  function togglePlatform(value: Platform) {
    if (platforms.includes(value)) {
      const next = platforms.filter((item) => item !== value);
      setPlatforms(next.length > 0 ? next : ["web"]);
      return;
    }
    setPlatforms([...platforms, value]);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const cid = canonicalId.trim();
      const zh = slugZh.trim();
      const en = slugEn.trim();

      if (!cid || !zh || !en) {
        throw new Error(tt("canonicalId / zh slug / en slug 不能为空", "canonicalId / zh slug / en slug is required"));
      }

      await clientApiPost("/api/admin/products", {
        canonicalId: cid,
        slugByLocale: {
          "zh-CN": zh,
          en
        },
        typeTaxonomy: [kind, ...normalizedTags],
        developer: developer.trim(),
        publisher: publisher.trim(),
        brand: brand.trim(),
        platforms,
        storeLinks: {},
        status: "active"
      });

      router.push(`/admin/products/${encodeURIComponent(cid)}?locale=zh-CN&ui=${uiLocale}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "create_failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <h1 style={{ marginTop: 0 }}>{tt("新建产品", "Create New Product")}</h1>
      <p className="meta">
        {tt(
          "创建后会自动跳转到产品编辑页（zh-CN）。请确保 canonicalId 永久稳定。",
          "After creation you will be redirected to the zh-CN editor. Keep canonicalId permanently stable."
        )}
      </p>

      <form onSubmit={submit} className="list">
        <label>
          canonicalId
          <input
            value={canonicalId}
            onChange={(event) => setCanonicalId(event.target.value)}
            placeholder="guru:product:my-new-game"
          />
        </label>

        <div className="two-col">
          <label>
            {tt("slug zh-CN（中文路由）", "slug zh-CN")}
            <input value={slugZh} onChange={(event) => setSlugZh(event.target.value)} placeholder="my-new-game" />
          </label>
          <label>
            {tt("slug en（英文路由）", "slug en")}
            <input value={slugEn} onChange={(event) => setSlugEn(event.target.value)} placeholder="my-new-game" />
          </label>
        </div>

        <div className="two-col">
          <label>
            {tt("产品类型", "Product Type")}
            <select value={kind} onChange={(event) => setKind(event.target.value as "game" | "ai") }>
              <option value="game">game</option>
              <option value="ai">ai</option>
            </select>
          </label>
          <label>
            {tt("扩展标签（逗号分隔）", "Extra tags (comma separated)")}
            <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="casual,puzzle,3d" />
          </label>
        </div>

        <div className="two-col">
          <label>
            {tt("开发者", "Developer")}
            <input value={developer} onChange={(event) => setDeveloper(event.target.value)} />
          </label>
          <label>
            {tt("发行方", "Publisher")}
            <input value={publisher} onChange={(event) => setPublisher(event.target.value)} />
          </label>
        </div>

        <label>
          {tt("品牌", "Brand")}
          <input value={brand} onChange={(event) => setBrand(event.target.value)} />
        </label>

        <fieldset style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 12 }}>
          <legend style={{ padding: "0 6px", color: "var(--ink-muted)" }}>{tt("平台", "Platforms")}</legend>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {platformOptions.map((value) => (
              <label key={value} style={{ display: "inline-flex", gap: 6, alignItems: "center", minHeight: 44 }}>
                <input
                  type="checkbox"
                  checked={platforms.includes(value)}
                  onChange={() => togglePlatform(value)}
                  style={{ width: 16, height: 16 }}
                />
                <span>{value}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button className="primary" type="submit" disabled={submitting}>
          {submitting ? tt("创建中...", "Creating...") : tt("创建并打开编辑器", "Create and Open Editor")}
        </button>
      </form>

      {error ? <p className="warning">{error}</p> : null}
    </section>
  );
}
