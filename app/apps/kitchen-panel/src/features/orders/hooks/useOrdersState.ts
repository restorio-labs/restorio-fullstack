import type { Order, OrderStatus } from "@restorio/types";
import { useCallback, useState } from "react";

export interface UseOrdersStateReturn {
  orders: Order[];
  moveOrder: (
    orderId: string,
    targetStatus: OrderStatus,
    targetItemId?: string | null,
    position?: "before" | "after" | null,
  ) => void;
  moveOrderUp: (orderId: string) => void;
  moveOrderDown: (orderId: string) => void;
}

export const useOrdersState = (initialOrders: readonly Order[]): UseOrdersStateReturn => {
  const [orders, setOrders] = useState<Order[]>([...initialOrders]);

  const moveOrder = useCallback(
    (
      orderId: string,
      targetStatus: OrderStatus,
      _targetItemId?: string | null,
      _position?: "before" | "after" | null,
    ): void => {
      setOrders((prevOrders) => {
        const movedOrder = prevOrders.find((o) => o.id === orderId);

        if (!movedOrder) {
          return prevOrders;
        }

        const isSameStatus = movedOrder.status === targetStatus;

        if (isSameStatus) {
          return prevOrders;
        }

        const ordersWithoutMoved = prevOrders.filter((o) => o.id !== orderId);
        const updatedOrder = { ...movedOrder, status: targetStatus };
        const targetStatusOrders = ordersWithoutMoved.filter((o) => o.status === targetStatus);
        const otherOrders = ordersWithoutMoved.filter((o) => o.status !== targetStatus);

        return [...targetStatusOrders, updatedOrder, ...otherOrders];
      });
    },
    [],
  );

  const moveOrderUp = useCallback((orderId: string): void => {
    setOrders((prevOrders) => {
      const currentIndex = prevOrders.findIndex((o) => o.id === orderId);

      if (currentIndex <= 0) {
        return prevOrders;
      }

      const order = prevOrders[currentIndex];
      const sameStatusOrders = prevOrders.filter((o) => o.status === order.status);
      const indexInStatus = sameStatusOrders.findIndex((o) => o.id === orderId);

      if (indexInStatus <= 0) {
        return prevOrders;
      }

      const newOrders = [...prevOrders];
      const prevOrderInStatus = sameStatusOrders[indexInStatus - 1];
      const prevOrderGlobalIndex = prevOrders.findIndex((o) => o.id === prevOrderInStatus.id);

      newOrders.splice(currentIndex, 1);
      newOrders.splice(prevOrderGlobalIndex, 0, order);

      return newOrders;
    });
  }, []);

  const moveOrderDown = useCallback((orderId: string): void => {
    setOrders((prevOrders) => {
      const currentIndex = prevOrders.findIndex((o) => o.id === orderId);

      if (currentIndex === -1 || currentIndex >= prevOrders.length - 1) {
        return prevOrders;
      }

      const order = prevOrders[currentIndex];
      const sameStatusOrders = prevOrders.filter((o) => o.status === order.status);
      const indexInStatus = sameStatusOrders.findIndex((o) => o.id === orderId);

      if (indexInStatus >= sameStatusOrders.length - 1) {
        return prevOrders;
      }

      const newOrders = [...prevOrders];
      const nextOrderInStatus = sameStatusOrders[indexInStatus + 1];
      const nextOrderGlobalIndex = prevOrders.findIndex((o) => o.id === nextOrderInStatus.id);

      newOrders.splice(currentIndex, 1);
      newOrders.splice(nextOrderGlobalIndex, 0, order);

      return newOrders;
    });
  }, []);

  return {
    orders,
    moveOrder,
    moveOrderUp,
    moveOrderDown,
  };
};
