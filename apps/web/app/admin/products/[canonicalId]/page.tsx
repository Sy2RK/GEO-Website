import Link from "next/link";
import { AdminNav } from "../../../../components/AdminNav";
import { AdminProductEditor } from "../../../../components/AdminProductEditor";
import { apiGet } from "../../../../lib/api";
import { requireEditorSession } from "../../../../lib/admin";
import { resolveUiLocale, t } from "../../../../lib/ui-locale";

export default async function AdminProductDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ canonicalId: string }>;
  searchParams: Promise<{ locale?: string; ui?: string }>;
}) {
  const { canonicalId: encodedCanonicalId } = await params;
  const canonicalId = decodeURIComponent(encodedCanonicalId);
  const { locale = "zh-CN", ui } = await searchParams;
  const uiLocale = resolveUiLocale(ui);

  const { token, user } = await requireEditorSession();

  const draftData = await apiGet<{
    product: { canonicalId: string; slugByLocale: { [k: string]: string } };
    draft: { content: Record<string, unknown> } | null;
    published: { content: Record<string, unknown> } | null;
  }>(`/api/admin/products/${encodeURIComponent(canonicalId)}/docs/${locale}/draft`, {
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
  }>("/api/admin/schema/productDoc", {
    token
  });

  const skills = await apiGet<{ skills: Array<{ id: string; name: string; description: string }> }>(
    "/api/skills/list",
    {
      token
    }
  );

  const media = await apiGet<{ items: Array<{ id: string; type: string; url: string; meta?: { altText?: string } }> }>(
    "/api/media",
    {
      token,
      params: {
        ownerType: "product",
        ownerId: canonicalId,
        locale
      }
    }
  );

  return (
    <div className="admin-layout">
      <AdminNav uiLocale={uiLocale} />

      <main className="admin-main">
        <section className="card">
          <div className="top-bar" style={{ marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>{t(uiLocale, { zh: "产品编辑器", en: "Product Editor" })}</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <Link
                href={`/admin/products/${encodeURIComponent(canonicalId)}?locale=zh-CN&ui=${uiLocale}`}
                className="button"
              >
                zh-CN
              </Link>
              <Link
                href={`/admin/products/${encodeURIComponent(canonicalId)}?locale=en&ui=${uiLocale}`}
                className="button"
              >
                en
              </Link>
              <Link
                href={`/admin/products/${encodeURIComponent(canonicalId)}?locale=${locale}&ui=zh`}
                className={`button${uiLocale === "zh" ? " primary" : ""}`}
              >
                UI 中文
              </Link>
              <Link
                href={`/admin/products/${encodeURIComponent(canonicalId)}?locale=${locale}&ui=en`}
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

        <AdminProductEditor
          canonicalId={canonicalId}
          locale={locale}
          uiLocale={uiLocale}
          slugByLocale={(draftData.product.slugByLocale ?? {}) as Record<string, string>}
          role={user.role}
          schema={schema}
          initialDraftContent={(draftData.draft?.content ?? draftData.published?.content ?? {}) as Record<
            string,
            unknown
          >}
          initialPublishedContent={(draftData.published?.content ?? {}) as Record<string, unknown>}
          skills={skills.skills}
          initialMedia={media.items}
        />
      </main>
    </div>
  );
}
