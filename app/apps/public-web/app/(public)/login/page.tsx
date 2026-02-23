"use client";

import { type ReactElement } from "react";

import { LoginContent } from "./LoginContent";

import { AuthWindow } from "@/components/app/AuthWindow";

export default function LoginPage(): ReactElement {
  return (
    <AuthWindow>
      <LoginContent />
    </AuthWindow>
  );
}
