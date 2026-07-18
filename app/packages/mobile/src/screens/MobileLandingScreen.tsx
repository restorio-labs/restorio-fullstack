import { Button, Text } from "@restorio/ui";
import type { ReactElement } from "react";

import type { MobileLandingViewModel } from "../view-models";

export interface MobileLandingScreenProps {
  viewModel: MobileLandingViewModel;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  disabled?: boolean;
}

export const MobileLandingScreen = ({
  viewModel,
  onPrimaryAction,
  onSecondaryAction,
  disabled = false,
}: MobileLandingScreenProps): ReactElement => (
  <main className="flex flex-1 flex-col items-center px-4 pt-8">
    <header className="mx-auto w-full max-w-md text-center">
      <Text as="h1" variant="h3" weight="bold" className="text-balance text-center">
        {viewModel.headline}
      </Text>
      <Text as="p" variant="body-md" className="mt-3 text-pretty text-center text-text-secondary">
        {viewModel.subtitle}
      </Text>
    </header>
    <div className="mx-auto mt-10 flex w-full max-w-md flex-col gap-3">
      <Button type="button" variant="primary" size="lg" fullWidth disabled={disabled} onClick={onPrimaryAction}>
        {viewModel.primaryActionLabel}
      </Button>
      <Button type="button" variant="secondary" size="lg" fullWidth disabled={disabled} onClick={onSecondaryAction}>
        {viewModel.secondaryActionLabel}
      </Button>
    </div>
  </main>
);
