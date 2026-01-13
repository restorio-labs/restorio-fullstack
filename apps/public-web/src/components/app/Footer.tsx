import { ContentContainer, Text } from "@restorio/ui";
import Link from "next/link";

export const Footer = (): JSX.Element => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border-default bg-surface-secondary py-12">
      <ContentContainer maxWidth="2xl" padding>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-interactive-primary" />
              <Text variant="h4" weight="bold">
                Restorio
              </Text>
            </div>
            <Text variant="body-sm" className="max-w-xs text-text-secondary">
              A modern, multi-tenant restaurant management platform designed for the future of dining.
            </Text>
          </div>
          <div className="grid grid-cols-2 gap-8 md:col-span-2">
            <div>
              <Text variant="body-sm" weight="semibold" className="mb-4 uppercase tracking-wider text-text-primary">
                Product
              </Text>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#"
                    className="text-sm text-text-secondary transition-colors hover:text-interactive-primary"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-text-secondary transition-colors hover:text-interactive-primary"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-text-secondary transition-colors hover:text-interactive-primary"
                  >
                    Demo
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <Text variant="body-sm" weight="semibold" className="mb-4 uppercase tracking-wider text-text-primary">
                Company
              </Text>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-sm text-text-secondary transition-colors hover:text-interactive-primary"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-text-secondary transition-colors hover:text-interactive-primary"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-text-secondary transition-colors hover:text-interactive-primary"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-border-default pt-8">
          <Text variant="body-sm" className="text-center text-text-tertiary">
            © {currentYear} Restorio Platform. Open Source Academic Project.
          </Text>
        </div>
      </ContentContainer>
    </footer>
  );
};
