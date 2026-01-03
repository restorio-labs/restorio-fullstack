import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restorio Platform",
  description: "Multi-tenant Restaurant Management Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
