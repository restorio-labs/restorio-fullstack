import type { PublicTenantInfo, TenantMenu } from "@restorio/types";
import { Button, EmptyState, Loader, Text, useI18n, useTheme } from "@restorio/ui";
import type { ThemeOverride } from "@restorio/ui";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { publicApi } from "../api/client";
import { API_BASE_URL } from "../config";
import { CartSummary } from "../features/order/components/CartSummary";
import { CheckoutForm } from "../features/order/components/CheckoutForm";
import { MenuCategorySection } from "../features/order/components/MenuCategorySection";
import { useCart } from "../features/order/hooks/useCart";

const FAVICON_LINK_ID = "tenant-favicon";
const extractApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = error as { response?: { data?: { detail?: unknown } } };
    const detail = response.response?.data?.detail;

    if (typeof detail === "string" && detail.trim() !== "") {
      return detail;
    }
  }

  return fallback;
};

export const OrderPage = (): ReactElement => {
  const { t } = useI18n();
  const { setOverride } = useTheme();
  const { tenantSlug, tableNumber } = useParams<{ tenantSlug: string; tableNumber: string }>();
  const tableNum = Number(tableNumber);
  const [submitError, setSubmitError] = useState("");
  const checkoutRef = useRef<HTMLDivElement>(null);
  const cart = useCart();
  const lockStorageKey = tenantSlug ? `restorio:table-lock:${tenantSlug}:${tableNum}` : "";

  const tenantQuery = useQuery<PublicTenantInfo>({
    queryKey: ["public-tenant-info", tenantSlug],
    queryFn: ({ signal }) => publicApi.getTenantInfo(tenantSlug!, signal),
    enabled: !!tenantSlug,
  });

  const menuQuery = useQuery<TenantMenu>({
    queryKey: ["public-tenant-menu", tenantSlug],
    queryFn: ({ signal }) => publicApi.getTenantMenu(tenantSlug!, signal),
    enabled: !!tenantSlug,
  });
  const tenantData = tenantQuery.data;

  useEffect(() => {
    const data = tenantData;

    if (!data) {
      return;
    }

    const title = data.pageTitle?.trim() ? data.pageTitle : data.name;

    document.title = title;

    const path = data.faviconPath;

    if (path) {
      const href = `${API_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
      let link = document.querySelector<HTMLLinkElement>(`link#${FAVICON_LINK_ID}`);

      if (!link) {
        link = document.createElement("link");
        link.id = FAVICON_LINK_ID;
        link.rel = "icon";
        document.head.appendChild(link);
      }

      link.href = href;
    } else {
      document.querySelector(`link#${FAVICON_LINK_ID}`)?.remove();
    }
  }, [tenantData]);

  useEffect(() => {
    const raw = tenantQuery.data?.themeOverride;

    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      setOverride(null);
    } else {
      setOverride(raw as ThemeOverride);
    }

    return (): void => {
      setOverride(null);
    };
  }, [tenantQuery.data?.themeOverride, setOverride]);

  const paymentMutation = useMutation({
    mutationFn: (data: { email: string; note: string }) =>
      publicApi.createOrderPayment({
        tenantSlug: tenantSlug!,
        tableNumber: tableNum,
        lockToken: lockStorageKey ? (window.localStorage.getItem(lockStorageKey) ?? undefined) : undefined,
        email: data.email,
        items: cart.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        note: data.note || undefined,
      }),
    onSuccess: (data) => {
      if (lockStorageKey) {
        window.localStorage.setItem(lockStorageKey, data.lockToken);
      }
      window.location.href = data.redirectUrl;
    },
    onError: (error: unknown) => {
      setSubmitError(extractApiErrorMessage(error, t("checkout.paymentFailed")));
    },
  });

  const handleCheckout = useCallback(
    (email: string, note: string) => {
      setSubmitError("");
      paymentMutation.mutate({ email, note });
    },
    [paymentMutation],
  );

  const scrollToCheckout = useCallback(() => {
    checkoutRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  if (!tenantSlug || isNaN(tableNum)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <EmptyState title={t("order.invalidLinkTitle")} description={t("order.invalidLinkDescription")} />
      </div>
    );
  }

  const isLoading = tenantQuery.isLoading || menuQuery.isLoading;
  const isError = tenantQuery.isError || menuQuery.isError;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader size="lg" />
          <Text as="p" variant="body-sm" className="text-text-secondary">
            {t("order.loadingMenu")}
          </Text>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <EmptyState
          title={t("order.loadErrorTitle")}
          description={t("order.loadErrorDescription")}
          action={
            <Button variant="primary" onClick={() => window.location.reload()}>
              {t("order.reload")}
            </Button>
          }
        />
      </div>
    );
  }

  const categories = menuQuery.data?.categories ?? [];
  const displayName = tenantQuery.data?.pageTitle?.trim()
    ? (tenantQuery.data.pageTitle ?? "")
    : (tenantQuery.data?.name ?? "");
  const currency = t("common.currency");

  return (
    <div className="flex min-h-screen flex-col bg-background-primary">
      <header className="sticky top-0 z-10 border-b border-border-default bg-surface-primary px-4 py-3 text-center">
        <Text as="h1" variant="h4" weight="bold" className="truncate">
          {displayName}
        </Text>
        <Text as="p" variant="body-sm" className="text-text-secondary">
          {t("order.tableLabel", { number: String(tableNum) })}
        </Text>
      </header>

      <main className="flex-1 px-4 py-4">
        {categories.length === 0 ? (
          <EmptyState title={t("order.emptyMenuTitle")} description={t("order.emptyMenuDescription")} />
        ) : (
          categories.map((category) => (
            <MenuCategorySection
              key={category.name}
              category={category}
              cartItems={cart.items}
              onAdd={cart.addItem}
              onRemove={cart.removeItem}
            />
          ))
        )}
      </main>

      {cart.totalItems > 0 && (
        <div className="sticky bottom-0 z-10 border-t border-border-default bg-surface-primary px-4 py-3">
          <Button variant="primary" size="lg" fullWidth onClick={scrollToCheckout}>
            {t("order.cartButton", {
              count: String(cart.totalItems),
              amount: cart.totalAmount.toFixed(2),
              currency,
            })}
          </Button>
        </div>
      )}

      {cart.items.length > 0 && (
        <div ref={checkoutRef} className="border-t border-border-default bg-surface-secondary px-4 py-6">
          <Text as="h2" variant="h4" weight="semibold" className="mb-4 text-center">
            {t("order.summaryTitle")}
          </Text>

          <CartSummary
            items={cart.items}
            totalAmount={cart.totalAmount}
            onRemove={cart.removeItem}
            onUpdateQuantity={cart.updateQuantity}
          />

          <div className="mt-4">
            <CheckoutForm
              totalAmount={cart.totalAmount}
              disabled={cart.items.length === 0}
              isSubmitting={paymentMutation.isPending}
              onSubmit={handleCheckout}
            />
          </div>

          {submitError && (
            <div className="mt-3 rounded-lg bg-status-error-bg p-3">
              <Text as="p" variant="body-sm" className="text-status-error-text">
                {submitError}
              </Text>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
