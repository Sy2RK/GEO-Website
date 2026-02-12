"use client";

import { useState } from "react";
import { clientApiGet } from "../lib/api-client";
import Link from "next/link";

type ResultItem = {
  canonicalId: string;
  slug: string;
  name: string;
  summary: string;
  typeTaxonomy: string[];
  platforms: string[];
};

export function SearchPanel({ locale }: { locale: "zh-CN" | "en" }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [platform, setPlatform] = useState("");
  const [items, setItems] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  const localePath = locale === "en" ? "en" : "zh";
  const isEn = locale === "en";

  async function runSearch() {
    setLoading(true);
    try {
      const response = await clientApiGet<{ items: ResultItem[] }>("/api/products", {
        locale,
        search,
        type,
        platform,
        page: 1,
        pageSize: 8
      });
      setItems(response.items);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2 className="section-title">{isEn ? "Search" : "搜索"}</h2>
      <div className="two-col">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isEn ? "Search..." : "输入关键词..."} />
        <div style={{ display: "flex", gap: 8 }}>
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">{isEn ? "All Types" : "全部类型"}</option>
            <option value="game">{isEn ? "Game" : "游戏"}</option>
            <option value="ai">AI</option>
          </select>
          <select value={platform} onChange={(event) => setPlatform(event.target.value)}>
            <option value="">{isEn ? "All Platforms" : "全部平台"}</option>
            <option value="ios">iOS</option>
            <option value="android">{isEn ? "Android" : "安卓"}</option>
            <option value="web">{isEn ? "Web" : "网页"}</option>
            <option value="pc">PC</option>
            <option value="mac">Mac</option>
          </select>
          <button onClick={runSearch} className="primary" disabled={loading}>
            {loading ? "..." : isEn ? "Search" : "搜索"}
          </button>
        </div>
      </div>
      {items.length > 0 ? (
        <div className="list" style={{ marginTop: 10 }}>
          {items.map((item) => (
            <Link key={item.canonicalId} href={`/${localePath}/products/${item.slug}`} className="card">
              <strong>{item.name}</strong>
              <div className="meta">{item.summary}</div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
