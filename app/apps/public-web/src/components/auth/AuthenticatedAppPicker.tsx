"use client";

import type { AppSlug } from "@restorio/types";
import { ChooseApp } from "@restorio/ui";
import { goToApp } from "@restorio/utils";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

export const AuthenticatedAppPicker = (): ReactElement => {
  const t = useTranslations();

  const chooseAppLabels = {
    adminPanel: t("chooseApp.labels.adminPanel"),
    kitchenPanel: t("chooseApp.labels.kitchenPanel"),
    waiterPanel: t("chooseApp.labels.waiterPanel"),
  };

  const handleSelect = (slug: AppSlug): void => {
    goToApp(slug);
  };

  return (
    <ChooseApp
      onSelectApp={handleSelect}
      labels={chooseAppLabels}
      title={t("chooseApp.title")}
      subtitle={t("chooseApp.subtitle")}
    />
  );
};
