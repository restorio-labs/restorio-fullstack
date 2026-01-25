import { forwardRef, type ReactElement, type ReactNode } from "react";

import { ScrollArea } from "../../layouts/ScrollArea";
import { cn } from "../../utils";

export type OrdersBoardOrientation = "vertical" | "horizontal";

export interface OrdersBoardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  ariaLabel: string;
  columnsLabel?: string;
  columnsClassName?: string;
  containerClassName?: string;
  orientation?: OrdersBoardOrientation;
  enableSnapScroll?: boolean;
}

export const OrdersBoard = forwardRef<HTMLDivElement, OrdersBoardProps>(
  (
    {
      children,
      ariaLabel,
      columnsLabel,
      columnsClassName,
      containerClassName,
      orientation = "vertical",
      enableSnapScroll = false,
      className,
      ...props
    },
    ref,
  ): ReactElement => {
    const isHorizontal = orientation === "horizontal";
    const scrollOrientation = isHorizontal ? "horizontal" : "vertical";
    const overscrollClass = isHorizontal ? "overscroll-x-contain" : "overscroll-y-contain";
    const snapClass = enableSnapScroll && isHorizontal ? "snap-x snap-mandatory" : "";

    return (
      <section aria-label={ariaLabel} role="region" className={cn("w-full h-full", containerClassName)}>
        <ScrollArea
          ref={ref}
          orientation={scrollOrientation}
          tabIndex={0}
          className={cn("w-full h-full px-4 py-4", overscrollClass, snapClass, className)}
          {...props}
        >
          <div
            role="list"
            aria-label={columnsLabel ?? ariaLabel}
            className={cn(
              "gap-4 items-start",
              isHorizontal ? "flex flex-nowrap h-full" : "grid w-full auto-rows-min",
              columnsClassName,
            )}
          >
            {children}
          </div>
        </ScrollArea>
      </section>
    );
  },
);

OrdersBoard.displayName = "OrdersBoard";
