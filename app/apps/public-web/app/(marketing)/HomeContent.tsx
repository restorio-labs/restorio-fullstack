"use client";

import { Button, cn, ContentContainer, Icon, Stack, Text } from "@restorio/ui";
import Link from "next/link";
import type { ReactElement } from "react";
import { FaBolt, FaGlobe, FaMobileAlt } from "react-icons/fa";

export const HomeContent = (): ReactElement => {
  return (
    <div className="flex flex-col gap-24 py-12 md:py-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute -top-[30%] -right-[10%] h-[500px] w-[500px] rounded-full bg-interactive-primary blur-[100px]" />
          <div className="absolute -bottom-[30%] -left-[10%] h-[500px] w-[500px] rounded-full bg-interactive-secondary blur-[100px]" />
        </div>

        <ContentContainer maxWidth="xl" padding>
          <div className="flex flex-col items-center text-center">
            <Text
              variant="h1"
              className="mb-6 max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl flex flex-col items-center"
            >
              <span>The Future of</span>
              <span className="text-interactive-primary">Restaurant Management</span>
            </Text>

            <Text variant="body-lg" className="mb-10 max-w-2xl text-text-secondary">
              A multi-tenant SaaS platform empowering restaurants with waiterless ordering, real-time kitchen updates,
              and powerful analytics. Open source and built for scale.
            </Text>

            <Stack direction="row" spacing="md" className="justify-center">
              <Button size="lg" variant="primary" className="min-w-[160px]">
                Start Free Trial
              </Button>
              <Button size="lg" variant="secondary" className="min-w-[160px]">
                View Demo
              </Button>
            </Stack>

            <div className="mt-16 w-full max-w-5xl overflow-hidden rounded-xl border border-border-default bg-surface-primary shadow-2xl mb-16">
              <div className="aspect-[16/9] w-full bg-surface-secondary/50 p-4">
                <div className="flex h-full items-center justify-center text-text-tertiary">
                  {/* Placeholder for App Screenshot */}
                  <div className="text-center">
                    <Text variant="h3" weight="semibold">
                      Dashboard Preview
                    </Text>
                    <Text variant="body-sm">Interactive demo coming soon</Text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ContentContainer>
      </section>

      {/* Features Grid */}
      <section className="bg-surface-secondary py-24">
        <ContentContainer maxWidth="xl" padding>
          <div className="mb-16 text-center">
            <Text variant="h2" weight="bold" className="mb-4">
              Everything you need to run your restaurant
            </Text>
            <Text variant="body-lg" className="text-text-secondary">
              From QR code ordering to kitchen management, we've got you covered.
            </Text>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                title: "Waiterless Ordering",
                description: "Customers order directly from their tables via QR codes. No app download required.",
                IconComponent: FaMobileAlt,
                iconBackground: "bg-interactive-primary/10",
              },
              {
                title: "Real-time Kitchen",
                description: "Orders appear instantly on kitchen displays with WebSocket-powered updates.",
                IconComponent: FaBolt,
                iconBackground: "bg-interactive-secondary/10",
              },
              {
                title: "Multi-Location",
                description: "Manage multiple restaurants, menus, and staff from a single unified dashboard.",
                IconComponent: FaGlobe,
                iconBackground: "bg-surface-secondary",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={cn(
                  "group rounded-2xl border border-border-default bg-surface-primary p-8 transition-all hover:-translate-y-1 hover:shadow-lg",
                  feature.iconBackground,
                )}
              >
                <Icon
                  as={feature.IconComponent}
                  size="xl"
                  className="mb-6 text-interactive-secondary transition-colors group-hover:text-interactive-primary"
                />
                <Text variant="h3" weight="semibold" className="mb-3">
                  {feature.title}
                </Text>
                <Text variant="body-md" className="text-text-secondary">
                  {feature.description}
                </Text>
              </div>
            ))}
          </div>
        </ContentContainer>
      </section>

      {/* CTA Section */}
      <section className="mb-24 text-center">
        <ContentContainer maxWidth="md" padding>
          <Text variant="h2" weight="bold" className="mb-6">
            Ready to modernize your restaurant?
          </Text>
          <Text variant="body-lg" className="mb-10 text-text-secondary">
            Join hundreds of restaurants streamlining their operations with Restorio.
          </Text>
          <Link href="/about">
            <Button size="lg" variant="primary">
              Learn More About Us
            </Button>
          </Link>
        </ContentContainer>
      </section>
    </div>
  );
};
