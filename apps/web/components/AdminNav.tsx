import Link from "next/link";
import { t, type UiLocale } from "../lib/ui-locale";

function withUi(path: string, uiLocale: UiLocale): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}ui=${uiLocale}`;
}

export function AdminNav({ uiLocale = "zh" }: { uiLocale?: UiLocale }) {
  return (
    <nav className="admin-nav">
      <Link href={withUi("/admin/products", uiLocale)}>
        {t(uiLocale, { zh: "产品列表", en: "Products" })}
      </Link>
      <Link href={withUi("/admin/products/new", uiLocale)}>
        {t(uiLocale, { zh: "新建产品", en: "New Product" })}
      </Link>
      <Link href={withUi("/admin/homepage/zh-CN", uiLocale)}>
        {t(uiLocale, { zh: "首页 zh-CN", en: "Homepage zh-CN" })}
      </Link>
      <Link href={withUi("/admin/homepage/en", uiLocale)}>
        {t(uiLocale, { zh: "首页 en", en: "Homepage en" })}
      </Link>
      <Link href={withUi("/admin/leaderboards/games_top/zh-CN", uiLocale)}>
        {t(uiLocale, { zh: "榜单", en: "Leaderboard" })}
      </Link>
      <Link href={withUi("/admin/collections/guru:collection:3d-sorting/zh-CN", uiLocale)}>
        {t(uiLocale, { zh: "专题", en: "Collection" })}
      </Link>
      <Link href={withUi("/admin/skills", uiLocale)}>
        {t(uiLocale, { zh: "技能面板", en: "Skills" })}
      </Link>
    </nav>
  );
}
