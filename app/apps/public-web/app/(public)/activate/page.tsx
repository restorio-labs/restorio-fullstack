import type { Metadata } from "next";
import type { ReactElement } from "react";

import { ActivateContent } from "./ActivateContent";

export const metadata: Metadata = {
  title: "Activate Account",
  description: "Activate your Restorio account.",
};

export const dynamic = "force-static";
export const revalidate = false;

export default function ActivatePage(): ReactElement {
  return <ActivateContent />;
}
