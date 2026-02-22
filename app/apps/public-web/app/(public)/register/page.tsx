"use client";

import { type ReactElement } from "react";

import { RegisterContent } from "./RegisterContent";

export default function RegisterPage(): ReactElement {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <RegisterContent />
      </div>
    </div>
  );
}
