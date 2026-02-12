"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { switchLocaleInPath } from "../lib/locales";

export function LanguageSwitch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  const zhPath = switchLocaleInPath(pathname, "zh");
  const enPath = switchLocaleInPath(pathname, "en");

  const suffix = query ? `?${query}` : "";

  return (
    <div className="lang-switch">
      <Link href={`${zhPath}${suffix}`} className={pathname.startsWith("/zh") ? "active" : ""}>
        中文
      </Link>
      <Link href={`${enPath}${suffix}`} className={pathname.startsWith("/en") ? "active" : ""}>
        English
      </Link>
    </div>
  );
}
