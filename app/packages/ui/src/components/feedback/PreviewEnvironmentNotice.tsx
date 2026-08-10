"use client";

import { Environment } from "@restorio/types";
import { getCurrentEnvironment } from "@restorio/utils";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";

export const PreviewEnvironmentNotice = (): ReactElement | null => {
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    setIsPreview(getCurrentEnvironment() === Environment.PREVIEW);
  }, []);

  if (!isPreview) {
    return null;
  }

  return (
    <aside
      role="status"
      aria-label="Środowisko podglądowe"
      className="pointer-events-none fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-[100] flex items-center gap-2 rounded-md border border-status-warning-border bg-status-warning-background px-3 py-2 text-xs font-medium text-status-warning-text shadow-lg"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current">
        <path d="M12 3.75 2.9 19.5a1.5 1.5 0 0 0 1.3 2.25h15.6a1.5 1.5 0 0 0 1.3-2.25L12 3.75Zm0 4.2c.4 0 .72.32.72.72v5.1a.72.72 0 1 1-1.44 0v-5.1c0-.4.32-.72.72-.72Zm0 9.23a.96.96 0 1 1 0-1.92.96.96 0 0 1 0 1.92Z" />
      </svg>
      <span>Preview - środowisko testowe</span>
    </aside>
  );
};
