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
            <span>Guru GEO Wiki</span>
          </Link>
          <span className="site-tag">{locale === "en" ? "Canonical Knowledge Graph" : "Canonical 知识图谱"}</span>
        </div>

        <nav className="site-nav" aria-label="Primary">
          <a href={`/${locale}#featured`}>{locale === "en" ? "Featured" : "精选"}</a>
          <a href={`/${locale}#leaderboards`}>{locale === "en" ? "Leaderboards" : "榜单"}</a>
          <a href={`/${locale}#collections`}>{locale === "en" ? "Collections" : "专题"}</a>
          <a href={`/${locale}#search`}>{locale === "en" ? "Search" : "搜索"}</a>
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
