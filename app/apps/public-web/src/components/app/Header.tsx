"use client";

import { Button, ContentContainer, Text } from "@restorio/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactElement } from "react";

export const Header = (): ReactElement => {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-default bg-surface-primary/80 backdrop-blur-md">
      <ContentContainer maxWidth="2xl" padding className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="h-8 w-8 rounded-lg bg-interactive-primary" />
          <Text variant="h4" weight="bold" className="hidden sm:block">
            Restorio
          </Text>
        </Link>

        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-interactive-primary ${
                pathname === item.href ? "text-interactive-primary" : "text-text-secondary"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="ml-2 hidden sm:block">
            <Button size="sm" variant="primary">
              Get Started
            </Button>
          </div>
        </nav>
      </ContentContainer>
    </header>
  );
};
