import { useVirtualizer } from "@tanstack/react-virtual";
import type { ReactElement, ReactNode } from "react";
import { useCallback, useRef } from "react";

interface VirtualizedStaffListProps {
  count: number;
  renderRow: (index: number) => ReactNode;
}

export const VirtualizedStaffList = ({ count, renderRow }: VirtualizedStaffListProps): ReactElement => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 72,
    overscan: 6,
  });
  const setScrollRef = useCallback(
    (node: HTMLDivElement | null): void => {
      scrollRef.current = node;
      virtualizer.measure();
    },
    [virtualizer],
  );

  return (
    <div ref={setScrollRef} className="max-h-[32rem] overflow-y-auto rounded-b-lg px-6">
      <ul className="relative m-0 list-none p-0" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((row) => (
          <li
            key={row.key}
            data-index={row.index}
            ref={virtualizer.measureElement}
            className="absolute left-0 top-0 w-full border-b border-border-default last:border-b-0"
            style={{ transform: `translateY(${row.start}px)` }}
          >
            {renderRow(row.index)}
          </li>
        ))}
      </ul>
    </div>
  );
};
