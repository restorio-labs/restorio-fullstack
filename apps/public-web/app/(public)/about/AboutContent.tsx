"use client";

import { ContentContainer, Text } from "@restorio/ui";
import type { ReactElement } from "react";

export const AboutContent = (): ReactElement => {
  return (
    <div className="py-16 md:py-24">
      {/* Header */}
      <div className="mb-16 border-b border-border-default pb-16">
        <ContentContainer maxWidth="lg" padding>
          <Text variant="caption" className="mb-4 font-semibold uppercase tracking-wider text-interactive-primary">
            Our Mission
          </Text>
          <Text variant="h1" className="mb-6 text-4xl font-bold sm:text-5xl">
            Empowering small restaurants with enterprise-grade tools.
          </Text>
          <Text variant="body-lg" className="max-w-2xl text-text-secondary">
            Restorio is an open-source, multi-tenant SaaS platform designed to bridge the gap between expensive
            enterprise solutions and the needs of independent restaurant owners.
          </Text>
        </ContentContainer>
      </div>

      <ContentContainer maxWidth="lg" padding>
        <div className="grid gap-16 md:grid-cols-12">
          {/* Sidebar / Table of Contents equivalent */}
          <div className="md:col-span-4">
            <div className="sticky top-24 space-y-8">
              <div>
                <Text variant="h4" weight="bold" className="mb-4">
                  Project Goals
                </Text>
                <ul className="space-y-3 text-text-secondary">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-interactive-primary" />
                    Waiterless Ordering
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-interactive-primary" />
                    Multi-location Support
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-interactive-primary" />
                    Secure & Scalable
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-interactive-primary" />
                    Cost Efficient
                  </li>
                </ul>
              </div>

              <div className="rounded-xl bg-surface-secondary p-6">
                <Text variant="body-sm" weight="semibold" className="mb-2">
                  Open Source
                </Text>
                <Text variant="caption" className="mb-4 text-text-secondary">
                  This project is built as an academic engineer-degree project, focusing on modern architecture and best
                  practices.
                </Text>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-8 space-y-16">
            <section>
              <Text variant="h2" weight="bold" className="mb-6">
                The Problem
              </Text>
              <div className="prose prose-lg text-text-secondary">
                <p className="mb-4">
                  Small restaurant owners often lack affordable, integrated digital tools. Existing solutions are either
                  too expensive, closed-source, or overly complex for small businesses.
                </p>
                <p>Restorio aims to fill this gap by providing a platform to:</p>
                <ul className="list-disc pl-5 space-y-2 mt-4">
                  <li>Present a modern restaurant website and menu</li>
                  <li>Accept digital orders without waiter involvement</li>
                  <li>Manage staff workflows and kitchen operations</li>
                  <li>Integrate modern online payments</li>
                  <li>Analyze sales and customer behavior</li>
                </ul>
              </div>
            </section>

            <section>
              <Text variant="h2" weight="bold" className="mb-6">
                Target Users
              </Text>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-border-default p-6">
                  <Text variant="h4" weight="semibold" className="mb-2">
                    Restaurant Owners
                  </Text>
                  <Text variant="body-sm" className="text-text-secondary">
                    Single or multi-location owners who need full control over their business operations and analytics.
                  </Text>
                </div>
                <div className="rounded-xl border border-border-default p-6">
                  <Text variant="h4" weight="semibold" className="mb-2">
                    Staff & Kitchen
                  </Text>
                  <Text variant="body-sm" className="text-text-secondary">
                    Waiters and kitchen staff who need real-time order updates and efficient workflow management tools.
                  </Text>
                </div>
                <div className="rounded-xl border border-border-default p-6">
                  <Text variant="h4" weight="semibold" className="mb-2">
                    End Customers
                  </Text>
                  <Text variant="body-sm" className="text-text-secondary">
                    Diners who want a seamless, anonymous ordering experience via QR codes without downloading apps.
                  </Text>
                </div>
              </div>
            </section>

            <section>
              <Text variant="h2" weight="bold" className="mb-6">
                Engineering Focus
              </Text>
              <Text variant="body-lg" className="mb-6 text-text-secondary">
                Restorio emphasizes a robust, scalable architecture suitable for real-world production use.
              </Text>
              <div className="space-y-4">
                {[
                  "Multi-tenant SaaS architecture",
                  "Distributed systems (async processing, WebSockets)",
                  "Modular backend design",
                  "Security, RBAC, and regulatory compliance",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 h-px w-8 bg-border-strong" />
                    <Text variant="body-md">{item}</Text>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </ContentContainer>
    </div>
  );
};
