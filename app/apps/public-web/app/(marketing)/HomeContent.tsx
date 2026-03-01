"use client";

import type { AppSlug } from "@restorio/types";
import {
  Button,
  ChooseApp,
  cn,
  ContentContainer,
  Icon,
  Stack,
  Text,
  useAuthRoute,
  type AuthRouteStatus,
} from "@restorio/ui";
import { getAppUrl, getEnvironmentFromEnv, LAST_VISITED_APP_STORAGE_KEY, getEnvMode } from "@restorio/utils";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactElement } from "react";
import { FaBolt, FaGlobe, FaMobileAlt } from "react-icons/fa";

export const HomeContent = (): ReactElement => {
  const { authStatus }: { authStatus: AuthRouteStatus } = useAuthRoute();
  const t = useTranslations();

  if (authStatus === "authenticated") {
    const envMode = getEnvMode();
    const goToApp = (slug: AppSlug): void => {
      localStorage.setItem(LAST_VISITED_APP_STORAGE_KEY, slug);
      window.location.href = getAppUrl(getEnvironmentFromEnv(envMode), slug);
    };

    return <ChooseApp onSelectApp={goToApp} />;
  }

  return (
    <div className="flex flex-col gap-24 py-12 md:py-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute -top-[30%] -right-[10%] h-[500px] w-[500px] rounded-full bg-interactive-primary blur-[100px]" />
          <div className="absolute -bottom-[30%] -left-[10%] h-[500px] w-[500px] rounded-full bg-interactive-secondary blur-[100px]" />
        </div>

        <ContentContainer maxWidth="xl" padding>
          <div className="flex flex-col items-center text-center">
            <Text
              variant="h1"
              className="mb-6 max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl flex flex-col items-center"
            >
              <span>{t("hero.title")}</span>
            </Text>

            <Text variant="body-lg" className="mb-10 max-w-2xl text-text-secondary">
              {t("hero.subtitle")}
            </Text>

            <Stack direction="row" spacing="md" className="justify-center">
              <Button size="lg" variant="primary" className="min-w-[160px]">
                {t("hero.cta.trial")}
              </Button>
              <Button size="lg" variant="secondary" className="min-w-[160px]">
                {t("hero.cta.demo")}
              </Button>
            </Stack>

            <div className="mt-16 w-full max-w-5xl overflow-hidden rounded-xl border border-border-default bg-surface-primary shadow-2xl mb-16">
              <div className="aspect-[16/9] w-full bg-surface-secondary/50 p-4">
                <div className="flex h-full items-center justify-center text-text-tertiary">
                  {/* Placeholder for App Screenshot */}
                  <div className="text-center">
                    <Text variant="h3" weight="semibold">
                      {t("hero.preview.title")}
                    </Text>
                    <Text variant="body-sm">{t("hero.preview.comingSoon")}</Text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ContentContainer>
      </section>

      {/* Features Grid */}
      <section className="bg-surface-secondary py-24">
        <ContentContainer maxWidth="xl" padding>
          <div className="mb-16 text-center">
            <Text variant="h2" weight="bold" className="mb-4">
              {t("features.title")}
            </Text>
            <Text variant="body-lg" className="text-text-secondary">
              {t("features.subtitle")}
            </Text>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                titleKey: "features.waiterless.title",
                descriptionKey: "features.waiterless.description",
                IconComponent: FaMobileAlt,
                iconBackground: "bg-interactive-primary/10",
              },
              {
                titleKey: "features.kitchen.title",
                descriptionKey: "features.kitchen.description",
                IconComponent: FaBolt,
                iconBackground: "bg-interactive-secondary/10",
              },
              {
                titleKey: "features.multiLocation.title",
                descriptionKey: "features.multiLocation.description",
                IconComponent: FaGlobe,
                iconBackground: "bg-surface-secondary",
              },
            ].map((feature) => (
              <div
                key={feature.titleKey}
                className={cn(
                  "group rounded-2xl border border-border-default bg-surface-primary p-8 transition-all hover:-translate-y-1 hover:shadow-lg",
                  feature.iconBackground,
                )}
              >
                <Icon
                  as={feature.IconComponent}
                  size="xl"
                  className="mb-6 text-interactive-secondary transition-colors group-hover:text-interactive-primary"
                />
                <Text variant="h3" weight="semibold" className="mb-3">
                  {t(feature.titleKey)}
                </Text>
                <Text variant="body-md" className="text-text-secondary">
                  {t(feature.descriptionKey)}
                </Text>
              </div>
            ))}
          </div>
        </ContentContainer>
      </section>

      {/* CTA Section */}
      <section className="mb-24 text-center">
        <ContentContainer maxWidth="md" padding>
          <Text variant="h2" weight="bold" className="mb-6">
            {t("cta.title")}
          </Text>
          <Text variant="body-lg" className="mb-10 text-text-secondary">
            {t("cta.subtitle")}
          </Text>
          <Link href="/about">
            <Button size="lg" variant="primary">
              {t("cta.button")}
            </Button>
          </Link>
        </ContentContainer>
      </section>
    </div>
  );
};
