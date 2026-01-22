import { forwardRef, type ReactElement, type ReactNode } from "react";

import { ScrollArea } from "../../layouts/ScrollArea";
import { cn } from "../../utils";

export interface OrdersBoardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  ariaLabel: string;
  columnsLabel?: string;
  columnsClassName?: string;
  containerClassName?: string;
}

export const OrdersBoard = forwardRef<HTMLDivElement, OrdersBoardProps>(
  (
    { children, ariaLabel, columnsLabel, columnsClassName, containerClassName, className, ...props },
    ref,
  ): ReactElement => {
    return (
      <section aria-label={ariaLabel} role="region" className={cn("w-full", containerClassName)}>
        <ScrollArea
          ref={ref}
          orientation="vertical"
          tabIndex={0}
          className={cn("w-full overscroll-y-contain px-4 py-4", className)}
          {...props}
        >
          <div
            role="list"
            aria-label={columnsLabel ?? ariaLabel}
            className={cn("grid w-full gap-4 items-start auto-rows-min", columnsClassName)}
          >
            {children}
          </div>
        </ScrollArea>
      </section>
    );
  },
);

OrdersBoard.displayName = "OrdersBoard";
