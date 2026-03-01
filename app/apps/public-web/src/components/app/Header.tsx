"use client";

import { Button, Icon, NavItem, Text, ThemeSwitcher, Topbar } from "@restorio/ui";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactElement, useEffect, useState } from "react";

export const Header = (): ReactElement => {
  const t = useTranslations();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: t("navigation.home"), href: "/" },
    { label: t("navigation.about"), href: "/about" },
  ];

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
      brandSlot={
        <Link href="/" className="flex h-16 items-center gap-2 transition-opacity hover:opacity-90">
          <Icon isLogo size="full" logoBackground="transparent" wink />
          <Text variant="h4" weight="bold" className="hidden sm:block">
            {t("footer.brand")}
          </Text>
        </Link>
      }
      ctaSlot={
        <div className="flex items-center gap-2">
          <ThemeSwitcher className="h-9 px-3" />
          <span className="hidden sm:inline-block">
            <Button size="sm" variant="primary">
              {t("navigation.getStarted")}
            </Button>
          </span>
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
          className="text-sm md:py-2 md:px-0"
        >
          {item.label}
        </NavItem>
      ))}
    </Topbar>
  );
};
