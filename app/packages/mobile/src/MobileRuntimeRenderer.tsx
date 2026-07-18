import type { ReactElement, ReactNode } from "react";

import { MobileBottomNavigation } from "./navigation";
import { MobileLandingScreen, MobileMenuScreen, MobileOrderScreen, MobileTablesScreen } from "./screens";
import { MobileAppShell } from "./shell";
import type { MobileRuntimeActions, MobileRuntimeViewModel } from "./view-models";

export interface MobileRuntimeRendererProps {
  viewModel: MobileRuntimeViewModel;
  actions?: MobileRuntimeActions;
  navigationAccessory?: ReactNode;
  disabled?: boolean;
  contained?: boolean;
  className?: string;
}

export const MobileRuntimeRenderer = ({
  viewModel,
  actions = {},
  navigationAccessory,
  disabled = false,
  contained = false,
  className,
}: MobileRuntimeRendererProps): ReactElement => {
  const { screen } = viewModel.screen;
  let content: ReactElement;

  switch (screen) {
    case "landing":
      content = (
        <MobileLandingScreen
          viewModel={viewModel.screen.content}
          onPrimaryAction={actions.onPrimaryLandingAction}
          onSecondaryAction={actions.onSecondaryLandingAction}
          disabled={disabled}
        />
      );

      break;
    case "tables":
      content = (
        <MobileTablesScreen
          viewModel={viewModel.screen.content}
          onBack={actions.onBack}
          onSelectTable={actions.onSelectTable}
          disabled={disabled}
        />
      );

      break;
    case "menu":
      content = (
        <MobileMenuScreen
          viewModel={viewModel.screen.content}
          onBack={actions.onBack}
          onOpenItem={actions.onOpenMenuItem}
          disabled={disabled}
        />
      );

      break;
    case "order":
      content = (
        <MobileOrderScreen
          viewModel={viewModel.screen.content}
          onOpenItem={actions.onOpenMenuItem}
          onAddItem={actions.onAddMenuItem}
          onRemoveItem={actions.onRemoveMenuItem}
          onOpenCart={actions.onOpenCart}
          onSubmit={actions.onSubmitOrder}
          disabled={disabled}
        />
      );

      break;
  }

  const navigation = viewModel.navigation ? (
    <MobileBottomNavigation
      navigation={viewModel.navigation}
      onNavigate={actions.onNavigate}
      accessory={navigationAccessory}
      disabled={disabled}
      contained={contained}
    />
  ) : undefined;

  return (
    <MobileAppShell
      screen={screen}
      theme={viewModel.theme}
      navigation={navigation}
      contained={contained}
      className={className}
    >
      {content}
    </MobileAppShell>
  );
};
