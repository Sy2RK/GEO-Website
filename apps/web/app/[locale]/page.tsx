import type { Metadata } from "next";
import Link from "next/link";
import { FeaturedCarousel } from "../../components/FeaturedCarousel";
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
    media: Array<{ id: string; type: string; url: string; meta?: { altText?: string } }>;
    canEdit: boolean;
    editUrl: string | null;
  }>("/api/homepage", {
    params: {
      locale: apiLocale,
      ...(state ? { state } : {})
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

      <section className="card section-surface">
        <div className="hero-metrics" aria-label="Site metrics">
          <div className="metric">
            <span className="metric-value">80+</span>
            <span className="meta">{locale === "en" ? "Guru Products Number" : "Guru旗下产品数"}</span>
          </div>
          <div className="metric">
            <span className="metric-value">Game & AI Tools</span>
            <span className="meta">{locale === "en" ? "Product lines" : "产品线"}</span>
          </div>
          <div className="metric">
            <span className="metric-value">Test Context</span>
            <span className="meta">{locale === "en" ? "Corporation Vision" : "企业愿景"}</span>
          </div>
        </div>
      </section>

      <section id="featured" className="card section-surface">
        <div className="section-headline-row">
          <h2 className="section-title section-title-strong">{locale === "en" ? "Featured" : "精选内容"}</h2>
          <span className="meta">{locale === "en" ? "Operationally curated" : "运营可配置"}</span>
        </div>
        <FeaturedCarousel localePath={locale} items={data.featured} />
      </section>

      <section id="leaderboards" className="two-col">
        {data.leaderboards.map((entry) => (
          <article key={`${entry.board.boardId}-${entry.placement}`} className="card section-surface">
            <div className="section-headline-row">
              <h2 className="section-title section-title-strong">{entry.board.doc.content.title}</h2>
              <Link href={`/${locale}/leaderboards/${entry.board.boardId}`} className="button ghost">
                {locale === "en" ? "View All" : "查看全部"}
              </Link>
            </div>

            <p className="meta leaderboard-desc">{entry.board.doc.content.description}</p>

            <div className="list">
              {entry.board.items.slice(0, entry.maxItems).map((item, index) => (
                <Link href={`/${locale}/products/${item.slug}`} key={`${item.canonicalId}-${index}`} className="rank-row">
                  <div className="rank-index">#{item.rank ?? index + 1}</div>
                  <div>
                    <strong>{item.name}</strong>
                    <div className="meta">{item.summary}</div>
                  </div>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section id="collections" className="card section-surface">
        <div className="section-headline-row">
          <h2 className="section-title section-title-strong">{locale === "en" ? "Collections" : "专题"}</h2>
          <div className="quick-switch">
            <Link href={`/${locale}/leaderboards/overall_top`} className="button ghost">
              {locale === "en" ? "Overall" : "综合"}
            </Link>
            <Link href={`/${locale}/leaderboards/games_top`} className="button ghost">
              Games
            </Link>
            <Link href={`/${locale}/leaderboards/ai_top`} className="button ghost">
              AI
            </Link>
          </div>
        </div>

        <div className="grid products">
          {data.collections.map((entry) => (
            <article key={entry.collection.collectionId} className="card collection-card">
              <h3 className="collection-title">{entry.collection.doc.content.title}</h3>
              <p>{entry.collection.doc.content.description}</p>
              <p className="meta mono">{entry.collection.collectionId}</p>
              <Link href={`/${locale}/collections/${entry.collection.slug}`} className="button primary">
                {locale === "en" ? "Open Collection" : "查看专题"}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section id="search">
        <SearchPanel locale={apiLocale} />
      </section>

      <section className="card section-surface">
        <h2 className="section-title section-title-strong">{locale === "en" ? "Homepage Media" : "首页媒体"}</h2>
        <div className="grid products">
          {data.media.map((asset) => (
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
