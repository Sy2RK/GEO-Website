import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLdScript } from "../../../../components/JsonLdScript";
import { apiGet, getApiBaseUrl, getServerToken } from "../../../../lib/api";
import { toApiLocale } from "../../../../lib/locales";

type ProductResponse = {
  product: {
    canonicalId: string;
    typeTaxonomy: string[];
    platforms: string[];
    developer?: string;
    publisher?: string;
    brand?: string;
  };
  doc: {
    content: {
      identity?: {
        name?: string;
        alias?: string[];
      };
      canonicalSummary?: string;
      definition?: string;
      coreMechanics?: string[];
      valueProposition?: string[];
      geo?: {
        keywords?: string[];
        searchIntents?: string[];
        usageContexts?: string[];
      };
      editing?: {
        notes?: string;
        suggestions?: string[];
      };
    };
  };
  jsonld: Record<string, unknown>;
  canonicalUrl: string;
  alternateUrls: Record<string, string>;
  breadcrumbs: Array<{ title: string; url: string }>;
  canEdit: boolean;
  editUrl: string | null;
  media: Array<{ id: string; type: string; url: string; meta: { altText?: string } }>;
};

async function getProductBySlug(
  slug: string,
  locale: string,
  state?: string
): Promise<ProductResponse | null> {
  const apiLocale = toApiLocale(locale);
  const token = await getServerToken();
  const query = new URLSearchParams({ locale: apiLocale });
  if (state) {
    query.set("state", state);
  }

  const response = await fetch(
    `${getApiBaseUrl()}/api/products/slug/${encodeURIComponent(slug)}?${query.toString()}`,
    {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    next: { revalidate: 0 }
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`product_fetch_failed:${response.status}`);
  }

  return (await response.json()) as ProductResponse;
}

export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ locale: "zh" | "en"; slug: string }>;
  searchParams: Promise<{ state?: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const { state } = await searchParams;
  const data = await getProductBySlug(slug, locale, state);

  if (!data) {
    return {
      title: "Not Found"
    };
  }

  const content = data.doc.content;
  const title = content.identity?.name ?? data.product.canonicalId;
  const description = content.canonicalSummary ?? content.definition ?? "";

  return {
    title,
    description,
    alternates: {
      canonical: data.canonicalUrl,
      languages: {
        "zh-CN": data.alternateUrls["zh-CN"],
        en: data.alternateUrls.en
      }
    },
    openGraph: {
      title,
      description,
      url: data.canonicalUrl,
      type: "article"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}

export default async function ProductPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: "zh" | "en"; slug: string }>;
  searchParams: Promise<{ state?: string }>;
}) {
  const { locale, slug } = await params;
  const { state } = await searchParams;

  const data = await getProductBySlug(slug, locale, state);
  if (!data) {
    notFound();
  }

  const content = data.doc.content;

  return (
    <article className="grid">
      <JsonLdScript jsonld={data.jsonld} />

      <section className="card">
        <div className="top-bar" style={{ marginBottom: 10 }}>
          <div>
            <p className="meta" style={{ margin: 0 }}>
              {data.product.canonicalId}
            </p>
            <h1 style={{ margin: "8px 0 0" }}>{content.identity?.name ?? data.product.canonicalId}</h1>
          </div>
          {data.canEdit && data.editUrl ? (
            <Link href={data.editUrl} className="button">
              {locale === "en" ? "Edit" : "编辑"}
            </Link>
          ) : null}
        </div>

        <p>{content.canonicalSummary}</p>
        <p className="meta">{content.definition}</p>

        <div className="two-col">
          <div className="card">
            <h3 className="section-title">{locale === "en" ? "Core Mechanics" : "核心机制"}</h3>
            <div className="list">
              {(content.coreMechanics ?? []).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="section-title">{locale === "en" ? "Value" : "价值主张"}</h3>
            <div className="list">
              {(content.valueProposition ?? []).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="two-col">
          <div className="card">
            <h3 className="section-title">{locale === "en" ? "GEO Keywords" : "GEO 关键词"}</h3>
            <p>{(content.geo?.keywords ?? []).join(" · ")}</p>
            <p className="meta">{(content.geo?.searchIntents ?? []).join(" / ")}</p>
          </div>
          <div className="card">
            <h3 className="section-title">{locale === "en" ? "Usage Context" : "使用场景"}</h3>
            <p>{(content.geo?.usageContexts ?? []).join(" · ")}</p>
            <p className="meta">{data.product.typeTaxonomy.join(", ")} | {data.product.platforms.join(", ")}</p>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">{locale === "en" ? "Media" : "媒体资源"}</h2>
        {data.media.length === 0 ? <p className="meta">{locale === "en" ? "No media" : "暂无媒体"}</p> : null}
        <div className="grid products">
          {data.media.map((asset) => (
            <figure key={asset.id} className="card">
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

      {state === "draft" ? (
        <section className="card">
          <h2 className="section-title">{locale === "en" ? "Draft Suggestions" : "草稿建议"}</h2>
          <p className="meta">{content.editing?.notes}</p>
          <div className="list">
            {(content.editing?.suggestions ?? []).map((item, index) => (
              <span key={`${index}-${item}`}>{item}</span>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
