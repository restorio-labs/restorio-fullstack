import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

import type { OrderStatus } from "../types/orders.types";

export const useColumnNavigation = (
  statusKeys: OrderStatus[],
  useHorizontalLayout: boolean,
): React.RefObject<HTMLDivElement> => {
  const [searchParams] = useSearchParams();
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const columnParam = searchParams.get("column");

    if (columnParam && boardRef.current) {
      const columnIndex = statusKeys.findIndex((key) => key === columnParam);

      if (columnIndex !== -1 && useHorizontalLayout) {
        const columnElement = boardRef.current.querySelector(`[data-zone-id="${columnParam}"]`);

        if (columnElement) {
          setTimeout(() => {
            columnElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
          }, 100);
        }
      }
    }
  }, [searchParams, useHorizontalLayout, statusKeys]);

  return boardRef;
};
