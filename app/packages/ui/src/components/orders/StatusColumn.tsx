import { forwardRef, type ReactElement, type ReactNode } from "react";

import { cn } from "../../utils";
import { Box } from "../primitives/Box";
import { Stack } from "../primitives/Stack";
import { Text } from "../primitives/Text";

export interface StatusColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  ariaLabel?: string;
  statusIndicator?: ReactNode;
  headerAction?: ReactNode;
  footer?: ReactNode;
  stickyHeader?: boolean;
  ordersClassName?: string;
}

export const StatusColumn = forwardRef<HTMLDivElement, StatusColumnProps>(
  (
    {
      label,
      ariaLabel,
      statusIndicator,
      headerAction,
      footer,
      stickyHeader = true,
      ordersClassName,
      className,
      children,
      ...props
    },
    ref,
  ): ReactElement => {
    return (
      <Box
        ref={ref}
        as="section"
        role="listitem"
        aria-label={ariaLabel ?? label}
        data-snap-zone="true"
        className={cn(
          "flex w-full min-w-0 flex-shrink-0 flex-col gap-3 rounded-card border border-border-strong bg-surface-secondary shadow-card",
          className,
        )}
        {...props}
      >
        <Box
          className={cn(
            "flex items-center justify-between gap-3 px-3 py-3",
            stickyHeader && "sticky top-0 z-10 bg-surface-secondary",
          )}
        >
          <Stack direction="row" align="center" spacing="sm">
            {statusIndicator}
            <Text as="h2" variant="body-lg" weight="semibold">
              {label}
            </Text>
          </Stack>
          {headerAction}
        </Box>
        <Box
          role="list"
          className={cn("flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3", ordersClassName)}
        >
          {children}
        </Box>
        {footer && <Box className="px-3 pb-3">{footer}</Box>}
      </Box>
    );
  },
);

StatusColumn.displayName = "StatusColumn";
