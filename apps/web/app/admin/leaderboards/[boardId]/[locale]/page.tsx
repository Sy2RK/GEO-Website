import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDocEditor } from "../../../../../components/AdminDocEditor";
import { MediaManager } from "../../../../../components/MediaManager";
import { AdminNav } from "../../../../../components/AdminNav";
import { apiGet } from "../../../../../lib/api";
import { requireEditorSession } from "../../../../../lib/admin";
import { resolveUiLocale, t } from "../../../../../lib/ui-locale";

export default async function AdminLeaderboardPage({
  params,
  searchParams
}: {
  params: Promise<{ boardId: string; locale: string }>;
  searchParams: Promise<{ ui?: string }>;
}) {
  const { boardId, locale } = await params;
  const { ui } = await searchParams;
  const uiLocale = resolveUiLocale(ui);
  if (locale !== "zh-CN" && locale !== "en") {
    notFound();
  }

  const { token, user } = await requireEditorSession();

  const data = await apiGet<{
    draft: { content: Record<string, unknown> } | null;
    published: { content: Record<string, unknown> } | null;
  }>(`/api/admin/leaderboards/${boardId}/${locale}`, {
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
  }>("/api/admin/schema/leaderboard", {
    token
  });

  const media = await apiGet<{ items: Array<{ id: string; type: string; url: string; meta?: { altText?: string; sortOrder?: number } }> }>(
    "/api/media",
    {
      token,
      params: {
        ownerType: "leaderboard",
        ownerId: boardId,
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
            <h2 style={{ margin: 0 }}>{t(uiLocale, { zh: "榜单编辑器", en: "Leaderboard Editor" })}</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href={`/admin/leaderboards/${boardId}/zh-CN?ui=${uiLocale}`} className="button">
                zh-CN
              </Link>
              <Link href={`/admin/leaderboards/${boardId}/en?ui=${uiLocale}`} className="button">
                en
              </Link>
              <Link
                href={`/admin/leaderboards/${boardId}/${locale}?ui=zh`}
                className={`button${uiLocale === "zh" ? " primary" : ""}`}
              >
                UI 中文
              </Link>
              <Link
                href={`/admin/leaderboards/${boardId}/${locale}?ui=en`}
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

        <AdminDocEditor
          key={`${boardId}-${locale}`}
          title={`${boardId} (${locale})`}
          uiLocale={uiLocale}
          schema={schema}
          role={user.role}
          initialDraftContent={(data.draft?.content ?? data.published?.content ?? {}) as Record<string, unknown>}
          initialPublishedContent={(data.published?.content ?? {}) as Record<string, unknown>}
          savePath={`/api/admin/leaderboards/${boardId}/${locale}/draft`}
          publishPath={`/api/admin/leaderboards/${boardId}/${locale}/publish`}
          previewUrl={`/${locale === "en" ? "en" : "zh"}/leaderboards/${boardId}?state=draft`}
        />

        <MediaManager
          ownerType="leaderboard"
          ownerId={boardId}
          locale={locale}
          uiLocale={uiLocale}
          initialMedia={media.items}
          title={t(uiLocale, { zh: "榜单媒体", en: "Leaderboard Media" })}
        />
      </main>
    </div>
  );
}
