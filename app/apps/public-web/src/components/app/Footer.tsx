"use client";

import { useBreakpoint } from "@restorio/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

export const Footer = (): ReactElement => {
  const t = useTranslations();
  const isMdUp = useBreakpoint("md");
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { href: "/privacy", label: t("navigation.privacy") },
    { href: "/contact", label: t("navigation.contact") },
    { href: "/terms", label: t("navigation.terms") },
    { href: "/status", label: t("navigation.status") },
  ];

  const leftLinks = navLinks.slice(0, 2);
  const rightLinks = navLinks.slice(2);

  return (
    <footer className="w-full border-t border-slate-800/20 bg-[#0a0e14] px-8 py-12">
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between ${isMdUp ? "flex-row gap-8" : "flex-col gap-6"}`}
      >
        <div className="text-lg font-bold text-slate-200">{t("footer.brand")}</div>

        {isMdUp ? (
          <div className="flex flex-row flex-wrap justify-center gap-8 font-inter text-xs uppercase tracking-widest">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-slate-500 opacity-80 transition-opacity hover:text-white hover:opacity-100"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex w-full gap-8 max-w-xs justify-center gap-x-8">
            <div className="flex flex-col gap-4 text-center font-inter text-xs uppercase tracking-widest">
              {leftLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-slate-500 opacity-80 transition-opacity hover:text-white hover:opacity-100"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-4 text-center font-inter text-xs uppercase tracking-widest">
              {rightLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-slate-500 opacity-80 transition-opacity hover:text-white hover:opacity-100"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div
          className={`font-inter text-[10px] uppercase tracking-widest text-slate-400 ${isMdUp ? "" : "w-full text-center"}`}
        >
          © {currentYear} Restorio Ecosystem. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
