import type { Metadata } from "next";
import type { ReactElement } from "react";

import { AboutContent } from "./AboutContent";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about the mission and goals of the Restorio Platform.",
};

export default function AboutPage(): ReactElement {
  return <AboutContent />;
}
