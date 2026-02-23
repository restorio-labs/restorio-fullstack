"use client";

import type { ReactElement, ReactNode } from "react";

interface AuthWindowProps {
  children: ReactNode;
}

export const AuthWindow = ({ children }: AuthWindowProps): ReactElement => {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-border-default bg-surface-primary p-6 shadow-sm">{children}</div>
    </div>
  );
};
