import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLdScript } from "../../../../components/JsonLdScript";
import { apiGet } from "../../../../lib/api";
import { toApiLocale } from "../../../../lib/locales";

type LeaderboardResponse = {
  boardId: string;
  doc: {
    mode: string;
    content: {
      title: string;
      description: string;
    };
  };
  items: Array<{
    rank?: number;
    score?: number;
    badges?: string[];
    reason?: string;
    canonicalId: string;
    slug: string;
    name: string;
    summary: string;
  }>;
  canonicalUrl: string;
  alternateUrls: Record<string, string>;
  jsonld: Record<string, unknown>;
  canEdit: boolean;
  editUrl: string | null;
  media: Array<{ id: string; type: string; url: string; meta: { altText?: string } }>;
};

async function getBoard(locale: "zh" | "en", boardId: string, state?: string) {
  try {
    return await apiGet<LeaderboardResponse>(`/api/leaderboards/${encodeURIComponent(boardId)}`, {
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
  params: Promise<{ locale: "zh" | "en"; boardId: string }>;
  searchParams: Promise<{ state?: string }>;
}): Promise<Metadata> {
  const { locale, boardId } = await params;
  const { state } = await searchParams;
  const data = await getBoard(locale, boardId, state);

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

export default async function LeaderboardPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: "zh" | "en"; boardId: string }>;
  searchParams: Promise<{ state?: string }>;
}) {
  const { locale, boardId } = await params;
  const { state } = await searchParams;
  const data = await getBoard(locale, boardId, state);

  if (!data) {
    notFound();
  }

  return (
    <article className="grid">
      <JsonLdScript jsonld={data.jsonld} />

      <section className="card">
        <div className="top-bar" style={{ marginBottom: 8 }}>
          <div>
            <p className="meta" style={{ margin: 0 }}>
              {data.boardId} | {data.doc.mode}
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
      </section>

      <section className="card">
        <h2 className="section-title">{locale === "en" ? "ItemList" : "榜单条目"}</h2>
        <div className="list">
          {data.items.map((item, index) => (
            <article key={`${item.canonicalId}-${index}`} className="card">
              <strong>
                #{item.rank ?? index + 1} {item.name}
              </strong>
              <p>{item.summary}</p>
              <p className="meta">
                {item.reason ?? ""} {item.badges?.length ? `| ${item.badges.join(", ")}` : ""}
              </p>
              <Link href={`/${locale}/products/${item.slug}`} className="button">
                {locale === "en" ? "Open Product" : "查看产品"}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">{locale === "en" ? "Media" : "媒体资源"}</h2>
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
    </article>
  );
}
