import { useId, useState, type ReactElement, type ReactNode } from "react";

import { usePrefersReducedMotion } from "../../hooks";
import { cn } from "../../utils";
import { Card } from "../Card";
import { Button } from "../primitives/Button";
import { Icon } from "../primitives/Icon";
import { Stack } from "../primitives/Stack";

export interface OrderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  summary: ReactNode;
  details?: ReactNode;
  footer?: ReactNode;
  statusIndicator?: ReactNode;
  toggleLabel: string;
  dragHandleLabel: string;
  dragHandleProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  isExpanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  isDragging?: boolean;
  isDisabled?: boolean;
}

export const OrderCard = ({
  summary,
  details,
  footer,
  statusIndicator,
  toggleLabel,
  dragHandleLabel,
  dragHandleProps,
  isExpanded,
  defaultExpanded = false,
  onExpandedChange,
  isDragging = false,
  isDisabled = false,
  className,
  tabIndex,
  ...props
}: OrderCardProps): ReactElement => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(defaultExpanded);
  const contentId = useId();
  const isControlled = typeof isExpanded === "boolean";
  const expanded = isControlled ? isExpanded : uncontrolledExpanded;
  const canExpand = Boolean(details);
  const resolvedTabIndex = tabIndex ?? 0;

  const {
    className: dragHandleClassName,
    disabled: dragHandleDisabled,
    ...restDragHandleProps
  } = dragHandleProps ?? {};
  const isDragHandleDisabled = isDisabled || Boolean(dragHandleDisabled);

  const handleToggle = (): void => {
    if (!canExpand || isDisabled) {
      return;
    }

    const nextExpanded = !expanded;

    if (!isControlled) {
      setUncontrolledExpanded(nextExpanded);
    }

    onExpandedChange?.(nextExpanded);
  };

  return (
    <Card
      role="listitem"
      tabIndex={resolvedTabIndex}
      aria-disabled={isDisabled || undefined}
      data-expanded={expanded}
      data-dragging={isDragging}
      className={cn(
        "w-full rounded-card border border-border-strong bg-surface-primary shadow-card focus-visible-ring",
        "outline-none focus-visible:ring-offset-background-primary",
        isDragging && "ring-2 ring-border-focus shadow-lg",
        isDisabled && "opacity-60",
        className,
      )}
      {...props}
    >
      <Stack spacing="sm">
        <Stack direction="row" align="center" spacing="sm">
          <Button
            variant="secondary"
            size="lg"
            className={cn(
              "flex-1 justify-between border border-border-strong bg-surface-secondary text-text-primary",
              "hover:bg-surface-tertiary active:bg-surface-secondary",
              "min-h-14 px-5 py-4 pr-6",
            )}
            onClick={handleToggle}
            aria-expanded={canExpand ? expanded : undefined}
            aria-controls={canExpand ? contentId : undefined}
            aria-label={toggleLabel}
            disabled={isDisabled || !canExpand}
          >
            <Stack direction="row" align="center" justify="between" spacing="sm" className="w-full">
              <Stack direction="row" align="center" spacing="sm" className="min-w-0 flex-1">
                {statusIndicator}
                <div className="min-w-0 flex-1">{summary}</div>
              </Stack>
              <Icon
                size="md"
                viewBox="0 0 24 24"
                className={cn(
                  "flex-shrink-0",
                  !prefersReducedMotion && "transition-transform duration-200",
                  expanded && "-scale-y-100",
                )}
              >
                <path d="M6 9l6 6 6-6" />
              </Icon>
            </Stack>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className={cn(
              "min-h-10 min-w-10 flex-shrink-0 border border-border-strong bg-surface-tertiary text-text-secondary",
              "hover:bg-surface-secondary active:bg-surface-tertiary",
              "touch-none",
              dragHandleClassName,
            )}
            aria-label={dragHandleLabel}
            disabled={isDragHandleDisabled}
            {...restDragHandleProps}
          >
            <Icon size="lg" aria-hidden="true" viewBox="0 0 24 24">
              <path d="M9 6h1M9 10h1M9 14h1M14 6h1M14 10h1M14 14h1" />
            </Icon>
          </Button>
        </Stack>
        {details && (
          <div
            id={contentId}
            aria-hidden={!expanded}
            className={cn(
              "overflow-hidden",
              prefersReducedMotion ? "transition-none" : "transition-all duration-200",
              expanded ? "max-h-64 opacity-100 mt-3" : "max-h-0 opacity-0 mt-0",
            )}
          >
            <div className="max-h-64 overflow-auto rounded-card border border-border-muted bg-surface-secondary px-4 py-3">
              {details}
            </div>
          </div>
        )}
        {footer && <div className="pt-2">{footer}</div>}
      </Stack>
    </Card>
  );
};
