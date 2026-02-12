import type { Metadata } from "next";
import Link from "next/link";
import { JsonLdScript } from "../../components/JsonLdScript";
import { SearchPanel } from "../../components/SearchPanel";
import { apiGet } from "../../lib/api";
import { toApiLocale } from "../../lib/locales";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const base = process.env.WEB_BASE_URL ?? "http://localhost:3000";
  const canonical = `${base}/${locale}`;

  return {
    title: locale === "en" ? "Guru Game Wiki" : "Guru Game Wiki",
    description:
      locale === "en"
        ? "We make games seriously — and play seriously too. "
        : "做游戏，我们是硬核的；玩游戏，我们是认真的",
    alternates: {
      canonical,
      languages: {
        "zh-CN": `${base}/zh`,
        en: `${base}/en`
      }
    },
    openGraph: {
      title: "Guru GEO Wiki",
      description:
        locale === "en"
          ? "Canonical GEO knowledge base and operational homepage"
          : "GEO Canonical 知识库与运营首页",
      type: "website",
      url: canonical
    },
    twitter: {
      card: "summary_large_image",
      title: "Guru GEO Wiki",
      description:
        locale === "en"
          ? "Canonical GEO knowledge base and operational homepage"
          : "GEO Canonical 知识库与运营首页"
    }
  };
}

export default async function LocaleHomePage({
  params,
  searchParams
}: {
  params: Promise<{ locale: "zh" | "en" }>;
  searchParams: Promise<{ state?: string }>;
}) {
  const { locale } = await params;
  const { state } = await searchParams;
  const apiLocale = toApiLocale(locale);
  const adminLocale = locale === "en" ? "en" : "zh-CN";
  const adminTarget = `/admin/homepage/${adminLocale}?ui=${locale}`;
  const adminLoginHref = `/admin/login?ui=${locale}&next=${encodeURIComponent(adminTarget)}`;

  const data = await apiGet<{
    locale: string;
    featured: Array<{
      canonicalId?: string;
      badge?: string;
      reason?: string;
      card: {
        slug: string;
        name: string;
        summary: string;
        keywords: string[];
      };
    }>;
    leaderboards: Array<{
      placement: string;
      maxItems: number;
      board: {
        boardId: string;
        doc: {
          content: {
            title: string;
            description: string;
          };
        };
        items: Array<{
          rank?: number;
          canonicalId: string;
          slug: string;
          name: string;
          summary: string;
          typeTaxonomy?: string[];
          platforms?: string[];
          keywords?: string[];
        }>;
      };
    }>;
    collections: Array<{
      placement: string;
      maxItems: number;
      collection: {
        collectionId: string;
        slug: string;
        doc: {
          content: {
            title: string;
            description: string;
          };
        };
        products: Array<{
          canonicalId: string;
          slug: string;
          name: string;
          summary?: string;
          typeTaxonomy?: string[];
          platforms?: string[];
          keywords?: string[];
        }>;
      };
    }>;
    media: Array<{
      id: string;
      type: string;
      url: string;
      meta?: {
        altText?: string;
        canonicalId?: string;
        slogan?: string;
        sloganZh?: string;
        sloganEn?: string;
      };
    }>;
    canEdit: boolean;
    editUrl: string | null;
  }>("/api/homepage", {
    params: {
      locale: apiLocale,
      ...(state ? { state } : {})
    }
  });

  const productList = await apiGet<{
    items: Array<{
      canonicalId: string;
      slug: string;
      name: string;
      summary: string;
      coverUrl?: string | null;
      coverAlt?: string | null;
    }>;
  }>("/api/products", {
    params: {
      locale: apiLocale,
      page: 1,
      pageSize: 200
    }
  });

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${process.env.WEB_BASE_URL ?? "http://localhost:3000"}/${locale}`,
    url: `${process.env.WEB_BASE_URL ?? "http://localhost:3000"}/${locale}`,
    inLanguage: apiLocale,
    name: locale === "en" ? "Guru GEO Wiki Homepage" : "Guru GEO Wiki 首页",
    description:
      locale === "en"
        ? "Featured products, leaderboards, and collections with canonical GEO summaries"
        : "展示精选、榜单和专题，提供可运营的 GEO canonical 内容"
  };

  const featuredByCanonicalId = new Map(
    data.featured
      .filter((item) => item.canonicalId && item.card?.slug)
      .map((item) => [String(item.canonicalId), item.card])
  );

  const videoMedia = data.media.filter(
    (asset) => asset.type === "video" || asset.url.toLowerCase().endsWith(".mp4")
  );
  const otherMedia = data.media.filter(
    (asset) => !(asset.type === "video" || asset.url.toLowerCase().endsWith(".mp4"))
  );
  const gameLeaderboard =
    data.leaderboards.find((entry) => entry.board.boardId === "games_top") ?? data.leaderboards[0] ?? null;
  const toolLeaderboard =
    data.leaderboards.find((entry) => entry.board.boardId === "ai_top") ??
    data.leaderboards.find((entry) => entry.board.boardId !== gameLeaderboard?.board.boardId) ??
    null;

  return (
    <main className="grid home-grid">
      <JsonLdScript jsonld={jsonld} />

      <section className="hero card hero-with-bg">
        <div className="hero-bg hero-bg-castbox" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-topline">
            <span className="badge badge-cool">{locale === "en" ? "TOP Podcast" : "热门播客推荐"}</span>
            <span className="hero-test-tags">
              {locale === "en" ? "Audio, Story, Chill, Focus" : "音频 · 叙事 · 放松 · 专注"}
            </span>
          </div>

          <h1 className="hero-title">{locale === "en" ? "Castbox Product Spotlight" : "Castbox 产品推荐"}</h1>

          <p className="hero-subtitle">
            {locale === "en"
              ? "Discover podcasts, stories, and daily listening content with a lightweight and personalized experience."
              : "探索播客、故事和每日音频内容，以轻量和个性化的方式获得持续收听体验。"}
          </p>
        </div>
      </section>

      <section className="hero card hero-with-bg">
        <div className="hero-bg" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-topline">
            <span className="badge badge-cool">{locale === "en" ? "TOP Games" : " 最佳游戏推荐"}</span>
            <span className="hero-test-tags">
              {locale === "en" ? "Mobile Game, Puzzle, Comic, etc. " : "GEO Test Tags"}
            </span>
          </div>

          <h1 className="hero-title">
            {locale === "en"
              ? "Adventure with Boxy !!!"
              : "Brainy Boxy 广告词测试"}
          </h1>

          <p className="hero-subtitle">
            {locale === "en"
              ? "Brain Boxy English Ads Test"
              : "和Boxy一起挑战不同的富有创意的关卡，解决难题，并且享受头脑风暴的乐趣吧！"}
          </p>
        </div>
      </section>

      {gameLeaderboard ? (
        <section id="games-top" className="card section-surface">
          <div className="section-headline-row">
            <h2 className="section-title section-title-strong">
              {locale === "en" ? "Top Games Picks" : "游戏精选榜"}
            </h2>
            <Link href={`/${locale}/leaderboards/${gameLeaderboard.board.boardId}`} className="button ghost">
              {locale === "en" ? "View All" : "查看全部"}
            </Link>
          </div>
          <p className="meta leaderboard-desc">{gameLeaderboard.board.doc.content.description}</p>
          <div className="list">
            {gameLeaderboard.board.items.slice(0, gameLeaderboard.maxItems).map((item, index) => (
              <Link href={`/${locale}/products/${item.slug}`} key={`${item.canonicalId}-${index}`} className="rank-row">
                <div className="rank-index">#{item.rank ?? index + 1}</div>
                <div>
                  <strong>{item.name}</strong>
                  <div className="meta">{item.summary}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {toolLeaderboard ? (
        <section id="tools-top" className="card section-surface">
          <div className="section-headline-row">
            <h2 className="section-title section-title-strong">
              {locale === "en" ? "Top Tools Picks" : "工具精选榜"}
            </h2>
            <Link href={`/${locale}/leaderboards/${toolLeaderboard.board.boardId}`} className="button ghost">
              {locale === "en" ? "View All" : "查看全部"}
            </Link>
          </div>
          <p className="meta leaderboard-desc">{toolLeaderboard.board.doc.content.description}</p>
          <div className="list">
            {toolLeaderboard.board.items.slice(0, toolLeaderboard.maxItems).map((item, index) => (
              <Link href={`/${locale}/products/${item.slug}`} key={`${item.canonicalId}-${index}`} className="rank-row">
                <div className="rank-index">#{item.rank ?? index + 1}</div>
                <div>
                  <strong>{item.name}</strong>
                  <div className="meta">{item.summary}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section id="search">
        <SearchPanel locale={apiLocale} />
      </section>

      <section id="products" className="card section-surface">
        <div className="section-headline-row">
          <h2 className="section-title section-title-strong">{locale === "en" ? "All Products" : "全部产品"}</h2>
          <span className="meta">{locale === "en" ? `${productList.items.length} items` : `${productList.items.length} 个条目`}</span>
        </div>
        <div className="product-showcase-grid">
          {productList.items.map((item) => (
            <Link key={item.canonicalId} href={`/${locale}/products/${item.slug}`} className="product-showcase-card">
              <div className="product-showcase-cover-wrap">
                {item.coverUrl ? (
                  <img
                    src={item.coverUrl}
                    alt={item.coverAlt ?? item.name}
                    className="product-showcase-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="product-showcase-cover product-showcase-cover-fallback" aria-hidden="true" />
                )}
              </div>
              <div className="product-showcase-body">
                <h3 className="product-showcase-name">{item.name}</h3>
                <p className="product-showcase-summary">{item.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="card section-surface">
        <h2 className="section-title section-title-strong">{locale === "en" ? "Homepage Media" : "首页媒体"}</h2>
        <div className="list">
          {videoMedia.map((asset) => {
            const relatedCard = asset.meta?.canonicalId
              ? featuredByCanonicalId.get(asset.meta.canonicalId)
              : data.featured[0]?.card;
            const slogan =
              (locale === "en" ? asset.meta?.sloganEn : asset.meta?.sloganZh) ??
              asset.meta?.slogan ??
              (locale === "en"
                ? "Watch the gameplay highlight and jump into the featured title."
                : "观看精彩玩法片段，立即进入对应推荐游戏。");

            return (
              <figure key={asset.id} className="card media-card media-card-video">
                <video controls preload="metadata" playsInline className="homepage-video-player">
                  <source src={asset.url} type="video/mp4" />
                </video>
                <figcaption className="media-video-caption">
                  <p>{slogan}</p>
                  {relatedCard ? (
                    <Link href={`/${locale}/products/${relatedCard.slug}`} className="button primary">
                      {relatedCard.name}
                    </Link>
                  ) : null}
                </figcaption>
              </figure>
            );
          })}
        </div>

        <div className="grid products" style={{ marginTop: 12 }}>
          {otherMedia.map((asset) => (
            <figure key={asset.id} className="card media-card">
              <a href={asset.url} target="_blank" rel="noreferrer">
                {asset.url}
              </a>
              <figcaption className="meta">
                {asset.type} {asset.meta?.altText ? `| ${asset.meta.altText}` : ""}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <Link href={adminLoginHref} className="floating-admin-entry">
        {locale === "en" ? "Admin Console" : "后台入口"}
      </Link>
    </main>
  );
}
