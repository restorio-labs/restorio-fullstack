"use client";

import type { AppSlug } from "@restorio/types";
import { Button, Icon, NavItem, ThemeSwitcher, Topbar, useAuthRoute, type AuthRouteStatus } from "@restorio/ui";
import { goToApp } from "@restorio/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { type ReactElement, useEffect, useMemo, useState } from "react";

export const Header = (): ReactElement => {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { authStatus }: { authStatus: AuthRouteStatus } = useAuthRoute();

  const appSlugs = useMemo((): { slug: AppSlug; label: string }[] => {
    return [
      { slug: "admin-panel", label: t("chooseApp.labels.adminPanel") },
      { slug: "kitchen-panel", label: t("chooseApp.labels.kitchenPanel") },
      { slug: "waiter-panel", label: t("chooseApp.labels.waiterPanel") },
    ];
  }, [t]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const renderCtaSlot = (): ReactElement => {
    if (authStatus === "loading") {
      return <div className="h-9 w-20 animate-pulse rounded-full bg-surface-secondary md:w-40" />;
    }

    if (authStatus === "authenticated") {
      return (
        <div className="hidden flex-wrap items-center justify-end gap-2 md:flex">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="rounded-full border-border-default/70 bg-surface-primary/60 px-3 py-2 text-xs font-medium shadow-sm sm:text-sm"
            onClick={() => goToApp("kitchen-panel")}
          >
            {t("chooseApp.labels.kitchenPanel")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="rounded-full border-border-default/70 bg-surface-primary/60 px-3 py-2 text-xs font-medium shadow-sm sm:text-sm"
            onClick={() => goToApp("waiter-panel")}
          >
            {t("chooseApp.labels.waiterPanel")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            className="rounded-full px-4 py-2 text-xs font-semibold shadow-md shadow-primary/25 sm:text-sm"
            onClick={() => goToApp("admin-panel")}
          >
            {t("chooseApp.labels.adminPanel")}
          </Button>
        </div>
      );
    }

    return (
      <>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login">
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full border-border-default/70 bg-surface-primary/60 px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-surface-secondary"
            >
              {t("navigation.login")}
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="sm"
              variant="primary"
              className="rounded-full px-5 py-2 text-sm font-semibold shadow-md shadow-primary/25 md:text-base"
            >
              {t("navigation.register")}
            </Button>
          </Link>
        </div>
        <Link href="/register" className="md:hidden">
          <Button
            size="sm"
            variant="primary"
            className="rounded-full px-4 py-2 text-sm font-semibold shadow-md shadow-primary/25"
          >
            {t("navigation.register")}
          </Button>
        </Link>
      </>
    );
  };

  return (
    <Topbar
      aria-label="Main navigation"
      sticky
      contentMaxWidth="2xl"
      mobileMenuOpen={mobileMenuOpen}
      onMobileMenuOpenChange={setMobileMenuOpen}
      className="border-b border-border-default/70 bg-surface-primary/85 shadow-[0_10px_40px_-24px_rgba(16,24,40,0.7)] supports-[backdrop-filter]:backdrop-blur-xl"
      brandSlot={
        <Link href={`/${locale}`} className="flex h-16 items-center gap-2 transition-opacity hover:opacity-90">
          <Icon isLogo size="full" logoBackground="transparent" wink />
        </Link>
      }
      ctaSlot={
        <div className="flex items-center gap-2 sm:gap-3">
          {renderCtaSlot()}
          <ThemeSwitcher className="h-9 w-9 rounded-full" />
        </div>
      }
    >
      <Link
        href={`/${locale}#landing-mission`}
        className="hidden rounded-full px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-secondary/80 hover:text-text-primary md:inline-flex"
      >
        {t("landing.nav.mission")}
      </Link>
      {authStatus === "authenticated"
        ? appSlugs.map(({ slug, label }) => (
            <NavItem
              key={slug}
              as="button"
              type="button"
              variant="link"
              className="rounded-full px-3 py-2 text-sm transition-colors hover:bg-surface-secondary/80 md:hidden"
              onClick={() => goToApp(slug)}
            >
              {label}
            </NavItem>
          ))
        : null}
      {authStatus === "anonymous" ? (
        <>
          <NavItem
            as={Link}
            href="/login"
            active={pathname === "/login"}
            variant="link"
            className="rounded-full px-3 py-2 text-sm transition-colors hover:bg-surface-secondary/80 md:hidden md:px-0 md:py-2 md:text-base md:hover:bg-transparent"
          >
            {t("navigation.login")}
          </NavItem>
          <NavItem
            as={Link}
            href="/register"
            active={pathname === "/register"}
            variant="link"
            className="rounded-full px-3 py-2 text-sm transition-colors hover:bg-surface-secondary/80 md:hidden md:px-0 md:py-2 md:text-base md:hover:bg-transparent"
          >
            {t("navigation.register")}
          </NavItem>
        </>
      ) : null}
    </Topbar>
  );
};
