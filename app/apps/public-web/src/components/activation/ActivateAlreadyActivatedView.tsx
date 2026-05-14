import { Button, Text } from "@restorio/ui";
import type { ReactElement } from "react";

import { useTranslations } from "@/i18n/useT";

interface ActivateAlreadyActivatedViewProps {
  onGoToAdmin: () => void;
}

export const ActivateAlreadyActivatedView = ({ onGoToAdmin }: ActivateAlreadyActivatedViewProps): ReactElement => {
  const t = useTranslations("activate");

  return (
    <>
      <Text variant="h2" weight="bold" className="mb-4 text-center">
        {t("alreadyActivated.title")}
      </Text>
      <div className="mt-8 flex justify-center">
        <Button variant="primary" size="lg" onClick={onGoToAdmin}>
          {t("buttons.goToAdmin")}
        </Button>
      </div>
    </>
  );
};
