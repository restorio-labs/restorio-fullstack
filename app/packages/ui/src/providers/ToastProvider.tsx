import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import { Toast, ToastContainer, type ToastVariant } from "../components/overlays/Toast";
import { createToastId } from "../components/overlays/Toast/createToastId";

const DEFAULT_DURATION_MS = 4500;

export interface ShowToastInput {
  variant: ToastVariant;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastItem extends ShowToastInput {
  id: string;
}

interface ToastContextValue {
  showToast: (variant: ToastVariant, title: string, description?: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps): ReactElement => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timerIdsRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string): void => {
    const timerId = timerIdsRef.current.get(id);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      timerIdsRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (variant: ToastVariant, title: string, description?: string, durationMs?: number): void => {
      const id = createToastId();
      const nextToast: ToastItem = { id, variant, title, description, durationMs };
      const timeoutMs = durationMs ?? DEFAULT_DURATION_MS;

      setToasts((current) => [...current, nextToast]);

      const timerId = window.setTimeout(() => {
        removeToast(id);
      }, timeoutMs);
      timerIdsRef.current.set(id, timerId);
    },
    [removeToast],
  );

  useEffect(() => {
    return () => {
      timerIdsRef.current.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      timerIdsRef.current.clear();
    };
  }, []);

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      showToast,
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer position="top-right">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
            onClose={(): void => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
};
