import type { PublicTenantInfo, TenantMenu } from "@restorio/types";
import { Button, EmptyState, Loader, Text } from "@restorio/ui";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type ReactElement, useCallback, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { publicApi } from "../api/client";
import { CartSummary } from "../features/order/components/CartSummary";
import { CheckoutForm } from "../features/order/components/CheckoutForm";
import { MenuCategorySection } from "../features/order/components/MenuCategorySection";
import { useCart } from "../features/order/hooks/useCart";

export const OrderPage = (): ReactElement => {
  const { tenantSlug, tableNumber } = useParams<{ tenantSlug: string; tableNumber: string }>();
  const tableNum = Number(tableNumber);
  const [submitError, setSubmitError] = useState("");
  const checkoutRef = useRef<HTMLDivElement>(null);
  const cart = useCart();

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

  const paymentMutation = useMutation({
    mutationFn: (data: { email: string; note: string }) =>
      publicApi.createOrderPayment({
        tenantSlug: tenantSlug!,
        tableNumber: tableNum,
        email: data.email,
        items: cart.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        note: data.note || undefined,
      }),
    onSuccess: (data) => {
      window.location.href = data.redirectUrl;
    },
    onError: () => {
      setSubmitError("Nie udało się przetworzyć płatności. Spróbuj ponownie.");
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
        <EmptyState title="Nieprawidłowy link" description="Zeskanuj kod QR ponownie." />
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
            Ładowanie menu...
          </Text>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <EmptyState
          title="Nie udało się załadować"
          description="Sprawdź połączenie z internetem i spróbuj ponownie."
          action={
            <Button variant="primary" onClick={() => window.location.reload()}>
              Odśwież stronę
            </Button>
          }
        />
      </div>
    );
  }

  const categories = menuQuery.data?.categories ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background-primary">
      <header className="sticky top-0 z-10 border-b border-border-default bg-surface-primary px-4 py-3">
        <Text as="h1" variant="h4" weight="bold" className="truncate">
          {tenantQuery.data?.name}
        </Text>
        <Text as="p" variant="body-sm" className="text-text-secondary">
          Stolik {tableNum}
        </Text>
      </header>

      <main className="flex-1 px-4 py-4">
        {categories.length === 0 ? (
          <EmptyState title="Menu jest puste" description="Restauracja nie ma jeszcze pozycji w menu." />
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
            Koszyk ({cart.totalItems}) · {cart.totalAmount.toFixed(2)} zł
          </Button>
        </div>
      )}

      {cart.items.length > 0 && (
        <div ref={checkoutRef} className="border-t border-border-default bg-surface-secondary px-4 py-6">
          <Text as="h2" variant="h4" weight="semibold" className="mb-4">
            Podsumowanie
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
