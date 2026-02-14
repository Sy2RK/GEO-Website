import Link from "next/link";
import { notFound } from "next/navigation";
import { LanguageSwitch } from "../../components/LanguageSwitch";

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "zh" && locale !== "en") {
    notFound();
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="site-brand-wrap">
          <Link href={`/${locale}`} className="brand brand-link">
            <img src="/images/GuruLogo.png" alt="Guru logo" className="brand-logo" />
            <span>Guru Game</span>
          </Link>
        </div>

        <nav className="site-nav" aria-label="Primary">
          <a href={`/${locale}#games-top`}>{locale === "en" ? "Top Games" : "游戏榜"}</a>
          <a href={`/${locale}#tools-top`}>{locale === "en" ? "Top Tools" : "工具榜"}</a>
          <a href={`/${locale}#search`}>{locale === "en" ? "Search" : "搜索"}</a>
          <a href={`/${locale}#products`}>{locale === "en" ? "All Products" : "全部产品"}</a>
        </nav>

        <div className="site-actions">
          <LanguageSwitch />
          <Link href="/openapi.json" className="button ghost">
            OpenAPI
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
