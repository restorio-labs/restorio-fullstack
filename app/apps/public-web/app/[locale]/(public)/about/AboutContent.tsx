"use client";

import { ContentContainer, Text } from "@restorio/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

export const AboutContent = (): ReactElement => {
  const t = useTranslations();

  return (
    <div className="py-16 md:py-24">
      {/* Header */}
      <div className="mb-16 border-b border-border-default pb-16">
        <ContentContainer maxWidth="lg" padding>
          <Text variant="caption" className="mb-4 font-semibold uppercase tracking-wider text-interactive-primary">
            {t("about.mission.title")}
          </Text>
          <Text variant="h1" className="mb-6 text-4xl font-bold sm:text-5xl">
            {t("about.mission.subtitle")}
          </Text>
          <Text variant="body-lg" className="max-w-2xl text-text-secondary">
            {t("about.mission.description")}
          </Text>
        </ContentContainer>
      </div>

      <ContentContainer maxWidth="lg" padding>
        <div className="grid gap-16 md:grid-cols-12">
          {/* Sidebar / Table of Contents equivalent */}
          <div className="md:col-span-4">
            <div className="sticky top-24 space-y-8">
              <div>
                <Text variant="h4" weight="bold" className="mb-4">
                  {t("about.goals.title")}
                </Text>
                <ul className="space-y-3 text-text-secondary">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-interactive-primary" />
                    {t("about.goals.waiterless.title")}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-interactive-primary" />
                    {t("about.goals.multiLocation.title")}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-interactive-primary" />
                    {t("about.goals.secure.title")}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-interactive-primary" />
                    {t("about.goals.costEfficient.title")}
                  </li>
                </ul>
              </div>

              <div className="rounded-xl bg-surface-secondary p-6">
                <Text variant="body-sm" weight="semibold" className="mb-2">
                  {t("about.openSource.title")}
                </Text>
                <Text variant="caption" className="mb-4 text-text-secondary">
                  {t("about.openSource.description")}
                </Text>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-8 space-y-16">
            <section>
              <Text variant="h2" weight="bold" className="mb-6">
                {t("about.problem.title")}
              </Text>
              <div className="prose prose-lg text-text-secondary">
                <p className="mb-4">
                  {t("about.problem.description")}
                </p>
              </div>
            </section>

            <section>
              <Text variant="h2" weight="bold" className="mb-6">
                {t("about.users.title")}
              </Text>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-border-default p-6">
                  <Text variant="h4" weight="semibold" className="mb-2">
                    {t("about.users.owners.title")}
                  </Text>
                  <Text variant="body-sm" className="text-text-secondary">
                    {t("about.users.owners.description")}
                  </Text>
                </div>
                <div className="rounded-xl border border-border-default p-6">
                  <Text variant="h4" weight="semibold" className="mb-2">
                    {t("about.users.staff.title")}
                  </Text>
                  <Text variant="body-sm" className="text-text-secondary">
                    {t("about.users.staff.description")}
                  </Text>
                </div>
                <div className="rounded-xl border border-border-default p-6">
                  <Text variant="h4" weight="semibold" className="mb-2">
                    {t("about.users.customers.title")}
                  </Text>
                  <Text variant="body-sm" className="text-text-secondary">
                    {t("about.users.customers.description")}
                  </Text>
                </div>
              </div>
            </section>

            <section>
              <Text variant="h2" weight="bold" className="mb-6">
                {t("about.engineering.title")}
              </Text>
              <div className="space-y-4">
                {[
                  t("about.engineering.frontend"),
                  t("about.engineering.backend"),
                  t("about.engineering.realtime"),
                  t("about.engineering.deployment"),
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1.5 h-px w-8 bg-border-strong" />
                    <Text variant="body-md">{item}</Text>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </ContentContainer>
    </div>
  );
};
