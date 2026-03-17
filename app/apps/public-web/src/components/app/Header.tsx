"use client";

import { Button, Icon, NavItem, Text, ThemeSwitcher, Topbar } from "@restorio/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactElement, useEffect, useMemo, useState } from "react";

export const Header = (): ReactElement => {
  const t = useTranslations();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = useMemo(
    () => [
      // { label: t("navigation.home"), href: "/" },
      // { label: t("navigation.about"), href: "/about" },
      { label: t("navigation.login"), href: "/login", mobileOnly: true },
      { label: t("navigation.register"), href: "/register", mobileOnly: true },
    ],
    [t],
  );

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <Topbar
      aria-label="Main navigation"
      sticky
      contentMaxWidth="2xl"
      mobileMenuOpen={mobileMenuOpen}
      onMobileMenuOpenChange={setMobileMenuOpen}
      className="border-b border-border-default/70 bg-surface-primary/85 shadow-[0_10px_40px_-24px_rgba(16,24,40,0.7)] supports-[backdrop-filter]:backdrop-blur-xl"
      brandSlot={
        <Link href="/" className="flex h-16 items-center gap-2 transition-opacity hover:opacity-90">
          <Icon isLogo size="full" logoBackground="transparent" wink />
          <Text variant="h4" weight="bold" className="hidden sm:block">
            {t("footer.brand")}
          </Text>
        </Link>
      }
      ctaSlot={
        <div className="flex items-center gap-2 sm:gap-3">
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
          <ThemeSwitcher className="h-9 w-9 rounded-full" />
        </div>
      }
    >
      {navItems.map((item) => (
        <NavItem
          key={item.href}
          as={Link}
          href={item.href}
          active={pathname === item.href}
          variant="link"
          className={`rounded-full px-3 py-2 text-sm transition-colors hover:bg-surface-secondary/80 md:px-0 md:py-2 md:text-base md:hover:bg-transparent ${item.mobileOnly ? "md:hidden" : ""}`}
        >
          {item.label}
        </NavItem>
      ))}
    </Topbar>
  );
};
