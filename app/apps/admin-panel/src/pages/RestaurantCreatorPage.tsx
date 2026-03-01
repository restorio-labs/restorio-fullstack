import { useI18n } from "@restorio/ui";
import type { ReactElement } from "react";

import { PageLayout } from "../layouts/PageLayout";

export const RestaurantCreatorPage = (): ReactElement => {
  const { t } = useI18n();

  return (
    <PageLayout title={t("restaurantCreator.title")} description={t("restaurantCreator.description")}>
      <div className="p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border-default rounded-lg">
          <h2 className="text-lg font-medium text-text-secondary">{t("restaurantCreator.placeholderTitle")}</h2>
          <p className="mt-2 text-sm text-text-tertiary">{t("restaurantCreator.placeholderDescription")}</p>
        </div>
      </div>
    </PageLayout>
  );
};
