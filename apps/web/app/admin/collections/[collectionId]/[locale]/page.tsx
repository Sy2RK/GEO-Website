import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCollectionEditor } from "../../../../../components/AdminCollectionEditor";
import { MediaManager } from "../../../../../components/MediaManager";
import { AdminNav } from "../../../../../components/AdminNav";
import { apiGet } from "../../../../../lib/api";
import { requireEditorSession } from "../../../../../lib/admin";
import { resolveUiLocale, t } from "../../../../../lib/ui-locale";

export default async function AdminCollectionPage({
  params,
  searchParams
}: {
  params: Promise<{ collectionId: string; locale: string }>;
  searchParams: Promise<{ ui?: string }>;
}) {
  const { collectionId: encodedCollectionId, locale } = await params;
  const { ui } = await searchParams;
  const uiLocale = resolveUiLocale(ui);
  const collectionId = decodeURIComponent(encodedCollectionId);
  if (locale !== "zh-CN" && locale !== "en") {
    notFound();
  }

  const { token, user } = await requireEditorSession();

  const data = await apiGet<{
    draft: { content: Record<string, unknown>; slugByLocale: Record<string, string> } | null;
    published: { content: Record<string, unknown>; slugByLocale: Record<string, string> } | null;
  }>(`/api/admin/collections/${encodeURIComponent(collectionId)}/${locale}`, {
    token
  });

  const schema = await apiGet<{
    title: string;
    titleI18n?: { zh: string; en: string };
    descriptionI18n?: { zh: string; en: string };
    sections: Array<{
      id: string;
      title: string;
      titleI18n?: { zh: string; en: string };
      descriptionI18n?: { zh: string; en: string };
      fields: Array<{
        key: string;
        label: string;
        labelI18n?: { zh: string; en: string };
        helpTextI18n?: { zh: string; en: string };
        type: "text" | "textarea" | "number" | "string-array" | "json";
        readOnlyFor?: Array<"viewer" | "editor" | "admin">;
      }>;
    }>;
  }>("/api/admin/schema/collection", {
    token
  });

  const media = await apiGet<{ items: Array<{ id: string; type: string; url: string; meta?: { altText?: string; sortOrder?: number } }> }>(
    "/api/media",
    {
      token,
      params: {
        ownerType: "collection",
        ownerId: collectionId,
        locale
      }
    }
  );

  return (
    <div className="admin-layout">
      <AdminNav uiLocale={uiLocale} />

      <main className="admin-main">
        <section className="card">
          <div className="top-bar">
            <h2 style={{ margin: 0 }}>{t(uiLocale, { zh: "专题编辑器", en: "Collection Editor" })}</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <Link
                href={`/admin/collections/${encodeURIComponent(collectionId)}/zh-CN?ui=${uiLocale}`}
                className="button"
              >
                zh-CN
              </Link>
              <Link href={`/admin/collections/${encodeURIComponent(collectionId)}/en?ui=${uiLocale}`} className="button">
                en
              </Link>
              <Link
                href={`/admin/collections/${encodeURIComponent(collectionId)}/${locale}?ui=zh`}
                className={`button${uiLocale === "zh" ? " primary" : ""}`}
              >
                UI 中文
              </Link>
              <Link
                href={`/admin/collections/${encodeURIComponent(collectionId)}/${locale}?ui=en`}
                className={`button${uiLocale === "en" ? " primary" : ""}`}
              >
                UI English
              </Link>
            </div>
          </div>
          <p className="meta">
            {t(uiLocale, { zh: "登录用户", en: "Signed in" })}: {user.email} ({user.role})
          </p>
        </section>

        <AdminCollectionEditor
          collectionId={collectionId}
          locale={locale}
          uiLocale={uiLocale}
          role={user.role}
          schema={schema}
          initialDraftContent={(data.draft?.content ?? data.published?.content ?? {}) as Record<string, unknown>}
          initialPublishedContent={(data.published?.content ?? {}) as Record<string, unknown>}
          initialSlugByLocale={
            (data.draft?.slugByLocale ?? data.published?.slugByLocale ?? {
              "zh-CN": "",
              en: ""
            }) as Record<string, string>
          }
        />

        <MediaManager
          ownerType="collection"
          ownerId={collectionId}
          locale={locale}
          uiLocale={uiLocale}
          initialMedia={media.items}
          title={t(uiLocale, { zh: "专题媒体", en: "Collection Media" })}
        />
      </main>
    </div>
  );
}
