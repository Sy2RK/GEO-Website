import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLdScript } from "../../../../components/JsonLdScript";
import { MediaPreview } from "../../../../components/MediaPreview";
import { apiGet } from "../../../../lib/api";
import { toApiLocale } from "../../../../lib/locales";

type CollectionResponse = {
  collectionId: string;
  slug: string;
  doc: {
    content: {
      title: string;
      description: string;
      geo?: {
        keywords?: string[];
      };
    };
  };
  products: Array<{
    canonicalId: string;
    slug: string;
    name: string;
    summary: string;
    typeTaxonomy: string[];
    platforms: string[];
    keywords: string[];
  }>;
  jsonld: Record<string, unknown>;
  canonicalUrl: string;
  alternateUrls: Record<string, string>;
  canEdit: boolean;
  editUrl: string | null;
  media: Array<{ id: string; type: string; url: string; meta: { altText?: string } }>;
};

async function getCollection(locale: "zh" | "en", slug: string, state?: string) {
  try {
    return await apiGet<CollectionResponse>(`/api/collections/slug/${encodeURIComponent(slug)}`, {
      params: {
        locale: toApiLocale(locale),
        ...(state ? { state } : {})
      }
    });
  } catch {
    return null;
  }
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
  const data = await getCollection(locale, slug, state);

  if (!data) {
    return { title: "Not Found" };
  }

  return {
    title: data.doc.content.title,
    description: data.doc.content.description,
    alternates: {
      canonical: data.canonicalUrl,
      languages: {
        "zh-CN": data.alternateUrls["zh-CN"],
        en: data.alternateUrls.en
      }
    }
  };
}

export default async function CollectionPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: "zh" | "en"; slug: string }>;
  searchParams: Promise<{ type?: string; platform?: string; tag?: string; state?: string }>;
}) {
  const { locale, slug } = await params;
  const { type, platform, tag, state } = await searchParams;

  const data = await getCollection(locale, slug, state);
  if (!data) {
    notFound();
  }

  const filtered = data.products.filter((product) => {
    if (type && !product.typeTaxonomy.includes(type)) {
      return false;
    }
    if (platform && !product.platforms.includes(platform)) {
      return false;
    }
    if (tag && !product.typeTaxonomy.includes(tag) && !product.keywords.includes(tag)) {
      return false;
    }
    return true;
  });

  return (
    <article className="grid">
      <JsonLdScript jsonld={data.jsonld} />

      <section className="card">
        <div className="top-bar" style={{ marginBottom: 8 }}>
          <div>
            <p className="meta" style={{ margin: 0 }}>
              {data.collectionId}
            </p>
            <h1 style={{ margin: "8px 0 0" }}>{data.doc.content.title}</h1>
          </div>
          {data.canEdit && data.editUrl ? (
            <Link href={data.editUrl} className="button">
              {locale === "en" ? "Edit" : "编辑"}
            </Link>
          ) : null}
        </div>
        <p>{data.doc.content.description}</p>
        <p className="meta">{(data.doc.content.geo?.keywords ?? []).join(" · ")}</p>
      </section>

      <section className="card">
        <h2 className="section-title">{locale === "en" ? "Filters" : "筛选"}</h2>
        <form style={{ display: "grid", gap: 10 }}>
          <div className="two-col">
            <input
              name="type"
              defaultValue={type ?? ""}
              placeholder={locale === "en" ? "type (game/ai/others)" : "类型（game/ai/others）"}
            />
            <input
              name="platform"
              defaultValue={platform ?? ""}
              placeholder={locale === "en" ? "platform (ios/android/web...)" : "平台（ios/android/web...）"}
            />
          </div>
          <div className="two-col">
            <input name="tag" defaultValue={tag ?? ""} placeholder={locale === "en" ? "tag/keyword" : "标签/关键词"} />
            <button className="primary" type="submit">
              {locale === "en" ? "Apply" : "应用筛选"}
            </button>
          </div>
        </form>
      </section>

      <section className="grid products">
        {filtered.map((product) => (
          <article className="card" key={product.canonicalId}>
            <h3 style={{ marginTop: 0 }}>{product.name}</h3>
            <p>{product.summary}</p>
            <p className="meta">
              {product.typeTaxonomy.join(", ")} | {product.platforms.join(", ")}
            </p>
            <Link href={`/${locale}/products/${product.slug}`} className="button">
              {locale === "en" ? "Open" : "查看"}
            </Link>
          </article>
        ))}
      </section>

      <section className="card">
        <h2 className="section-title">{locale === "en" ? "Media" : "媒体资源"}</h2>
        <div className="grid products">
          {data.media.map((asset) => (
            <MediaPreview key={asset.id} asset={asset} locale={locale} fallbackAlt={data.doc.content.title} />
          ))}
        </div>
      </section>
    </article>
  );
}
