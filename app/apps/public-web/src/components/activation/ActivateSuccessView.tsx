import { Button, Text } from "@restorio/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

interface ActivateSuccessViewProps {
  onGoToAdmin: () => void;
}

export const ActivateSuccessView = ({ onGoToAdmin }: ActivateSuccessViewProps): ReactElement => {
  const t = useTranslations("activate");

  return (
    <>
      <Text variant="h2" weight="bold" className="mb-4">
        {t("success.title")}
      </Text>
      <Text variant="body-lg" className="text-text-secondary">
        {t("success.description")}
      </Text>
      <div className="mt-8 flex justify-center">
        <Button variant="primary" size="lg" onClick={onGoToAdmin}>
          {t("buttons.goToAdmin")}
        </Button>
      </div>
    </>
  );
};
