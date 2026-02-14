"use client";

import { KeyboardEvent, useState } from "react";
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
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localePath = locale === "en" ? "en" : "zh";
  const isEn = locale === "en";

  async function runSearch() {
    setLoading(true);
    setHasSearched(true);
    setError(null);
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
    } catch {
      setItems([]);
      setError(
        isEn
          ? "Search is temporarily unavailable. Please try again in a moment."
          : "搜索暂时不可用，请稍后重试。"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearchInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || loading) {
      return;
    }
    event.preventDefault();
    void runSearch();
  }

  const statusText = loading
    ? isEn
      ? "Searching products."
      : "正在搜索产品。"
    : hasSearched
      ? error
        ? error
        : items.length > 0
          ? isEn
            ? `${items.length} products found.`
            : `已找到 ${items.length} 个产品。`
          : isEn
            ? "No products found."
            : "未找到相关产品。"
      : isEn
        ? "Search panel ready."
        : "搜索面板已就绪。";

  return (
    <section className="card search-panel" aria-labelledby="search-panel-title">
      <h2 id="search-panel-title" className="section-title">
        {isEn ? "Search" : "搜索"}
      </h2>
      <p className="sr-only" role="status" aria-live="polite">
        {statusText}
      </p>
      <div className="two-col search-layout">
        <div>
          <label className="sr-only" htmlFor="product-search-input">
            {isEn ? "Search products by keyword" : "按关键词搜索产品"}
          </label>
          <input
            id="product-search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={handleSearchInputKeyDown}
            placeholder={isEn ? "Search by name or summary..." : "输入名称或摘要关键词..."}
          />
        </div>
        <div className="search-controls">
          <label className="sr-only" htmlFor="product-search-type">
            {isEn ? "Filter by type" : "按类型筛选"}
          </label>
          <select id="product-search-type" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">{isEn ? "All Types" : "全部类型"}</option>
            <option value="game">{isEn ? "Game" : "游戏"}</option>
            <option value="ai">AI</option>
            <option value="others">{isEn ? "Others" : "其他"}</option>
          </select>
          <label className="sr-only" htmlFor="product-search-platform">
            {isEn ? "Filter by platform" : "按平台筛选"}
          </label>
          <select id="product-search-platform" value={platform} onChange={(event) => setPlatform(event.target.value)}>
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
      {error ? (
        <p className="search-error" role="alert">
          {error}
        </p>
      ) : null}
      {items.length > 0 ? (
        <div className="list search-results">
          {items.map((item) => (
            <Link key={item.canonicalId} href={`/${localePath}/products/${item.slug}`} className="card search-result-card">
              <strong>{item.name}</strong>
              <div className="meta">{item.summary}</div>
            </Link>
          ))}
        </div>
      ) : null}
      {!loading && hasSearched && !error && items.length === 0 ? (
        <p className="meta search-empty">{isEn ? "No matching products found." : "没有匹配的产品。"}</p>
      ) : null}
    </section>
  );
}
