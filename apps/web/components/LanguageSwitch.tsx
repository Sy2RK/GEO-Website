"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { switchLocaleInPath, toApiLocale } from "../lib/locales";

export function LanguageSwitch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const [resolvedZhPath, setResolvedZhPath] = useState<string>(() => switchLocaleInPath(pathname, "zh"));
  const [resolvedEnPath, setResolvedEnPath] = useState<string>(() => switchLocaleInPath(pathname, "en"));

  const fallbackZhPath = switchLocaleInPath(pathname, "zh");
  const fallbackEnPath = switchLocaleInPath(pathname, "en");

  const suffix = query ? `?${query}` : "";

  useEffect(() => {
    let cancelled = false;

    async function resolveAlternatePath() {
      setResolvedZhPath(fallbackZhPath);
      setResolvedEnPath(fallbackEnPath);

      const segments = pathname.split("/").filter(Boolean);
      if (segments.length < 3) {
        return;
      }

      const [pathLocale, section, slugOrId] = segments;
      if (!slugOrId || (pathLocale !== "zh" && pathLocale !== "en")) {
        return;
      }

      let endpoint = "";
      const apiLocale = toApiLocale(pathLocale);
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

      if (section === "products") {
        endpoint = `${apiBaseUrl}/api/products/slug/${encodeURIComponent(slugOrId)}?locale=${encodeURIComponent(apiLocale)}`;
      } else if (section === "collections") {
        endpoint = `${apiBaseUrl}/api/collections/slug/${encodeURIComponent(slugOrId)}?locale=${encodeURIComponent(apiLocale)}`;
      } else if (section === "leaderboards") {
        endpoint = `${apiBaseUrl}/api/leaderboards/${encodeURIComponent(slugOrId)}?locale=${encodeURIComponent(apiLocale)}`;
      } else {
        return;
      }

      const state = searchParams.get("state");
      if (state) {
        endpoint += `&state=${encodeURIComponent(state)}`;
      }

      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as {
          alternateUrls?: {
            "zh-CN"?: string;
            en?: string;
          };
        };
        const alternateUrls = payload.alternateUrls;
        if (!alternateUrls) {
          return;
        }

        const toPathOnly = (url: string): string => {
          try {
            const pathname = new URL(url).pathname;
            // Normalize encoded segments (e.g. %E5...) back to readable slug to avoid double-encoding downstream.
            return pathname
              .split("/")
              .map((segment) => {
                if (!segment) {
                  return segment;
                }
                try {
                  return decodeURIComponent(segment);
                } catch {
                  return segment;
                }
              })
              .join("/");
          } catch {
            return url;
          }
        };

        if (!cancelled) {
          setResolvedZhPath(alternateUrls["zh-CN"] ? toPathOnly(alternateUrls["zh-CN"]) : fallbackZhPath);
          setResolvedEnPath(alternateUrls.en ? toPathOnly(alternateUrls.en) : fallbackEnPath);
        }
      } catch {
        // Keep fallback paths when alternate resolution fails.
      }
    }

    void resolveAlternatePath();

    return () => {
      cancelled = true;
    };
  }, [fallbackEnPath, fallbackZhPath, pathname, searchParams]);

  return (
    <div className="lang-switch">
      <Link href={`${resolvedZhPath}${suffix}`} className={pathname.startsWith("/zh") ? "active" : ""}>
        中文
      </Link>
      <Link href={`${resolvedEnPath}${suffix}`} className={pathname.startsWith("/en") ? "active" : ""}>
        English
      </Link>
    </div>
  );
}
