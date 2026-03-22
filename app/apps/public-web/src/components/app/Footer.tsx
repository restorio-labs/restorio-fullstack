"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

export const Footer = (): ReactElement => {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { href: "/privacy", label: t("navigation.privacy") },
    { href: "/terms", label: t("navigation.terms") },
    { href: "/contact", label: t("navigation.contact") },
    { href: "/status", label: t("navigation.status") },
  ];

  return (
    <footer className="w-full border-t border-slate-800/20 bg-[#0a0e14] px-8 py-12">
      <div className="mx-auto flex max-w-7xl flex-row items-center justify-between gap-8 md:flex-row">
        <div className="text-lg font-bold text-slate-200">{t("footer.brand")}</div>

        <div className="flex flex-wrap justify-center gap-8 font-inter text-xs uppercase tracking-widest">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-slate-500 transition-opacity opacity-80 hover:text-white hover:opacity-100"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="font-inter text-[10px] uppercase tracking-widest text-slate-400">
          © {currentYear} Restorio Ecosystem. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
