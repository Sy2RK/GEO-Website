import Link from "next/link";
import { AdminCreateProductForm } from "../../../../components/AdminCreateProductForm";
import { AdminNav } from "../../../../components/AdminNav";
import { requireEditorSession } from "../../../../lib/admin";
import { resolveUiLocale, t } from "../../../../lib/ui-locale";

export default async function AdminCreateProductPage({
  searchParams
}: {
  searchParams: Promise<{ ui?: string }>;
}) {
  const { user } = await requireEditorSession();
  const { ui } = await searchParams;
  const uiLocale = resolveUiLocale(ui);

  return (
    <div className="admin-layout">
      <AdminNav uiLocale={uiLocale} />

      <main className="admin-main">
        <section className="card">
          <div className="top-bar" style={{ marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>{t(uiLocale, { zh: "产品操作", en: "Product Operations" })}</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href={`/admin/products/new?ui=zh`} className={`button${uiLocale === "zh" ? " primary" : ""}`}>
                UI 中文
              </Link>
              <Link href={`/admin/products/new?ui=en`} className={`button${uiLocale === "en" ? " primary" : ""}`}>
                UI English
              </Link>
              <Link href={`/admin/products?ui=${uiLocale}`} className="button ghost">
                {t(uiLocale, { zh: "返回产品列表", en: "Back to Product List" })}
              </Link>
            </div>
          </div>
          <p className="meta">
            {t(uiLocale, { zh: "登录用户", en: "Signed in" })}: {user.email} ({user.role})
          </p>
        </section>

        <AdminCreateProductForm uiLocale={uiLocale} />
      </main>
    </div>
  );
}
