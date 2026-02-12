import Link from "next/link";
import { AdminNav } from "../../../components/AdminNav";
import { apiGet } from "../../../lib/api";
import { requireEditorSession } from "../../../lib/admin";
import { resolveUiLocale, t } from "../../../lib/ui-locale";

export default async function AdminProductsPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; type?: string; status?: string; locale?: string; ui?: string }>;
}) {
  const { token, user } = await requireEditorSession();
  const params = await searchParams;
  const uiLocale = resolveUiLocale(params.ui);
  const contentLocale = params.locale === "en" ? "en" : "zh-CN";
  const statusFilter = params.status === "archived" ? "archived" : params.status === "all" ? undefined : "active";

  const products = await apiGet<{
    total: number;
    items: Array<{
      canonicalId: string;
      status: string;
      typeTaxonomy: string[];
      platforms: string[];
      slugByLocale: { [k: string]: string };
      updatedAt: string;
    }>;
  }>("/api/admin/products", {
    token,
    params: {
      search: params.search,
      type: params.type,
      status: statusFilter,
      page: 1,
      pageSize: 50
    }
  });

  const logs = await apiGet<{ items: Array<{ id: string; action: string; entityType: string; createdAt: string }> }>(
    "/api/admin/audit-logs",
    {
      token,
      params: {
        limit: 20
      }
    }
  );

  return (
    <div className="admin-layout">
      <AdminNav uiLocale={uiLocale} />

      <main className="admin-main">
        <section className="card">
          <div className="top-bar" style={{ marginBottom: 8 }}>
            <h1 style={{ margin: 0 }}>{t(uiLocale, { zh: "产品列表", en: "Products" })}</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Link href="/admin/products?ui=zh" className={`button${uiLocale === "zh" ? " primary" : ""}`}>
                UI 中文
              </Link>
              <Link href="/admin/products?ui=en" className={`button${uiLocale === "en" ? " primary" : ""}`}>
                UI English
              </Link>
              <div className="meta">
                {t(uiLocale, { zh: "登录用户", en: "Signed in" })}: {user.email} ({user.role})
              </div>
              <Link href={`/admin/products/new?ui=${uiLocale}`} className="button primary">
                {t(uiLocale, { zh: "新建产品", en: "New Product" })}
              </Link>
            </div>
          </div>

          <form style={{ display: "grid", gap: 10 }}>
            <input type="hidden" name="ui" value={uiLocale} />
            <input type="hidden" name="locale" value={contentLocale} />
            <div className="two-col">
              <input
                name="search"
                defaultValue={params.search ?? ""}
                placeholder={t(uiLocale, {
                  zh: "搜索 canonicalId/品牌",
                  en: "search canonicalId/brand"
                })}
              />
              <select name="type" defaultValue={params.type ?? ""}>
                <option value="">{t(uiLocale, { zh: "全部类型", en: "All type" })}</option>
                <option value="game">game</option>
                <option value="ai">ai</option>
              </select>
            </div>
            <div className="two-col">
              <select name="status" defaultValue={params.status ?? "active"}>
                <option value="active">active</option>
                <option value="archived">archived</option>
                <option value="all">{t(uiLocale, { zh: "全部状态", en: "All status" })}</option>
              </select>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  name="locale"
                  defaultValue={contentLocale}
                  aria-label={t(uiLocale, { zh: "内容语言", en: "Content locale" })}
                >
                  <option value="zh-CN">zh-CN</option>
                  <option value="en">en</option>
                </select>
                <button className="primary" type="submit">
                  {t(uiLocale, { zh: "搜索", en: "Search" })}
                </button>
              </div>
            </div>
          </form>

          <table className="table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>canonicalId</th>
                <th>{t(uiLocale, { zh: "类型/平台", en: "type/platform" })}</th>
                <th>slug</th>
                <th>{t(uiLocale, { zh: "更新时间", en: "updatedAt" })}</th>
              </tr>
            </thead>
            <tbody>
              {products.items.map((item) => (
                <tr key={item.canonicalId}>
                  <td>
                    <Link
                      href={`/admin/products/${encodeURIComponent(item.canonicalId)}?locale=${encodeURIComponent(contentLocale)}&ui=${uiLocale}`}
                    >
                      {item.canonicalId}
                    </Link>
                  </td>
                  <td>
                    {item.typeTaxonomy.join(", ")} | {item.platforms.join(", ")}
                  </td>
                  <td>{item.slugByLocale["zh-CN"] ?? item.slugByLocale.en}</td>
                  <td>{new Date(item.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h2 className="section-title">{t(uiLocale, { zh: "最近审计日志", en: "Recent Audit Logs" })}</h2>
          <div className="list">
            {logs.items.map((log) => (
              <div key={log.id} className="meta">
                {new Date(log.createdAt).toLocaleString()} | {log.entityType} | {log.action}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
