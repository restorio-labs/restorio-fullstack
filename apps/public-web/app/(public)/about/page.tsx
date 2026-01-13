import type { Metadata } from "next";

import { AboutContent } from "./AboutContent";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about the mission and goals of the Restorio Platform.",
};

export default function AboutPage(): JSX.Element {
  return <AboutContent />;
}
