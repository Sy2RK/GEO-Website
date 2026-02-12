import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHomepageEditor } from "../../../../components/AdminHomepageEditor";
import { AdminNav } from "../../../../components/AdminNav";
import { apiGet } from "../../../../lib/api";
import { requireEditorSession } from "../../../../lib/admin";
import { resolveUiLocale, t } from "../../../../lib/ui-locale";

export default async function AdminHomepagePage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ui?: string }>;
}) {
  const { locale } = await params;
  const { ui } = await searchParams;
  const uiLocale = resolveUiLocale(ui);
  if (locale !== "zh-CN" && locale !== "en") {
    notFound();
  }

  const { token, user } = await requireEditorSession();

  const homepage = await apiGet<{
    draft: {
      content: {
        featured: Array<{
          canonicalId: string;
          badge?: string;
          reason?: string;
          priority?: number;
          startAt?: string;
          endAt?: string;
        }>;
        leaderboardRefs: Array<{ boardId: string; placement: string; maxItems: number }>;
        collectionRefs: Array<{ collectionId: string; placement: string; maxItems: number }>;
      };
    } | null;
    published: {
      content: {
        featured: Array<{
          canonicalId: string;
          badge?: string;
          reason?: string;
          priority?: number;
          startAt?: string;
          endAt?: string;
        }>;
        leaderboardRefs: Array<{ boardId: string; placement: string; maxItems: number }>;
        collectionRefs: Array<{ collectionId: string; placement: string; maxItems: number }>;
      };
    } | null;
  }>(`/api/admin/homepage/${locale}`, {
    token
  });

  const products = await apiGet<{ items: Array<{ canonicalId: string }> }>("/api/admin/products", {
    token,
    params: {
      page: 1,
      pageSize: 100
    }
  });

  const collections = await apiGet<{ items: Array<{ collectionId: string }> }>("/api/admin/collections", {
    token,
    params: {
      locale,
      state: "published"
    }
  });

  const media = await apiGet<{ items: Array<{ id: string; type: string; url: string; meta?: { altText?: string; sortOrder?: number } }> }>(
    "/api/media",
    {
      token,
      params: {
        ownerType: "homepage",
        ownerId: locale,
        locale
      }
    }
  );

  const initial = homepage.draft?.content ??
    homepage.published?.content ?? {
      featured: [],
      leaderboardRefs: [],
      collectionRefs: []
    };

  return (
    <div className="admin-layout">
      <AdminNav uiLocale={uiLocale} />
      <main className="admin-main">
        <section className="card">
          <div className="top-bar">
            <h2 style={{ margin: 0 }}>{t(uiLocale, { zh: "首页配置", en: "Homepage Config" })}</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href={`/admin/homepage/zh-CN?ui=${uiLocale}`} className="button">
                zh-CN
              </Link>
              <Link href={`/admin/homepage/en?ui=${uiLocale}`} className="button">
                en
              </Link>
              <Link href={`/admin/homepage/${locale}?ui=zh`} className={`button${uiLocale === "zh" ? " primary" : ""}`}>
                UI 中文
              </Link>
              <Link href={`/admin/homepage/${locale}?ui=en`} className={`button${uiLocale === "en" ? " primary" : ""}`}>
                UI English
              </Link>
            </div>
          </div>
          <p className="meta">
            {t(uiLocale, { zh: "登录用户", en: "Signed in" })}: {user.email} ({user.role})
          </p>
        </section>

        <AdminHomepageEditor
          uiLocale={uiLocale}
          locale={locale}
          initial={initial}
          availableProducts={products.items}
          availableCollections={collections.items.length > 0 ? collections.items : [{ collectionId: "" }]}
          initialMedia={media.items}
        />
      </main>
    </div>
  );
}
