import createMiddleware from "next-intl/middleware";

import { locales, defaultLocale } from "./src/i18n/request";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});

export const config = {
  matcher: ["/", "/(en|pl|es|ar)/:path*", "/((?!_next|_vercel|.*\\..*).*)"],
};
