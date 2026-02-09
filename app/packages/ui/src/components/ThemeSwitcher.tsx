import type { ReactElement } from "react";

import { useTheme } from "../theme/ThemeProvider";
import type { ThemeMode } from "../tokens/types";
import { cn } from "../utils";

import { Button } from "./primitives/Button";
import { Icon } from "./primitives/Icon";

export interface ThemeSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeSwitcher = ({ className, showLabel = false }: ThemeSwitcherProps): ReactElement => {
  const { mode, setMode } = useTheme();

  const cycleTheme = (): void => {
    const modes: ThemeMode[] = ["light", "dark", "system"];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;

    setMode(modes[nextIndex]);
  };

  const icons: Record<ThemeMode, ReactElement> = {
    light: (
      <Icon size="md" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </Icon>
    ),
    dark: (
      <Icon size="md" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </Icon>
    ),
    system: (
      <Icon size="md" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </Icon>
    ),
  };

  const labels: Record<ThemeMode, string> = {
    light: "Light",
    dark: "Dark",
    system: "System",
  };

  return (
    <Button
      variant="secondary"
      size="md"
      onClick={cycleTheme}
      className={cn("flex items-center gap-2", className)}
      aria-label={`Current theme: ${labels[mode]}. Click to cycle theme.`}
    >
      {icons[mode]}
      {showLabel && <span className="text-sm font-medium">{labels[mode]}</span>}
    </Button>
  );
};
