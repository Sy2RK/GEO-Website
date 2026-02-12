import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/zh", request.url), 307);
  }

  const firstSegment = pathname.split("/").filter(Boolean)[0];
  if (firstSegment !== "zh" && firstSegment !== "en") {
    return NextResponse.redirect(new URL(`/zh${pathname}${search}`, request.url), 307);
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/redirects/resolve?path=${encodeURIComponent(pathname)}&locale=${
        firstSegment === "en" ? "en" : "zh-CN"
      }`,
      {
        headers: request.headers,
        cache: "no-store"
      }
    );

    if (response.ok) {
      const data = (await response.json()) as { found?: boolean; toPath?: string };
      if (data.found && data.toPath) {
        return NextResponse.redirect(new URL(`${data.toPath}${search}`, request.url), 301);
      }
    }
  } catch {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"]
};
