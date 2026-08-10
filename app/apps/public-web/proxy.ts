import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { locales, defaultLocale } from "./src/i18n/request";
import { filterPreviewCookies } from "./src/services/filterPreviewCookies";

const PREVIEW_API_PROXY_TARGET = "https://preview-api.restorio.org";

export default function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") && process.env.NEXT_PUBLIC_API_PROXY_TARGET === PREVIEW_API_PROXY_TARGET) {
    const headers = new Headers(request.headers);
    const previewCookies = filterPreviewCookies(headers.get("Cookie"));

    if (previewCookies === null) {
      headers.delete("Cookie");
    } else {
      headers.set("Cookie", previewCookies);
    }

    return NextResponse.next({ request: { headers } });
  }

  const pathnameHasLocale = locales.some((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();

  url.pathname = `/${defaultLocale}${pathname}`;

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
