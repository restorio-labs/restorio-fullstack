import type { SaveTenantMenuPayload, TenantMenuCategory } from "@restorio/types";
import { Button, FormActions, useI18n } from "@restorio/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

import { api } from "../api/client";
import { useCurrentTenant } from "../context/TenantContext";
import { PageLayout } from "../layouts/PageLayout";

interface MenuItemFormState {
  id: string;
  name: string;
  price: string;
  promoted: boolean;
  desc: string;
  tags: string;
}

interface MenuCategoryFormState {
  id: string;
  name: string;
  order: string;
  items: MenuItemFormState[];
}

const menuQueryKey = (tenantId: string): readonly string[] => ["tenant-menu", tenantId];

const createLocalId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createEmptyItem = (): MenuItemFormState => ({
  id: createLocalId(),
  name: "",
  price: "",
  promoted: false,
  desc: "",
  tags: "",
});

const createEmptyCategory = (order = 0): MenuCategoryFormState => ({
  id: createLocalId(),
  name: "",
  order: String(order),
  items: [createEmptyItem()],
});

const toFormCategories = (categories: TenantMenuCategory[]): MenuCategoryFormState[] =>
  categories.map((category) => ({
    id: createLocalId(),
    name: category.name,
    order: String(category.order),
    items: category.items.map((item) => ({
      id: createLocalId(),
      name: item.name,
      price: String(item.price),
      promoted: item.promoted === 1,
      desc: item.desc,
      tags: item.tags.join(", "),
    })),
  }));

export const MenuCreatorPage = (): ReactElement => {
  const { t } = useI18n();
  const { selectedTenantId } = useCurrentTenant();
  const [categories, setCategories] = useState<MenuCategoryFormState[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successVisible, setSuccessVisible] = useState(false);

  const tenantId = selectedTenantId;

  const { data: menuData, isLoading } = useQuery({
    queryKey: menuQueryKey(tenantId ?? ""),
    queryFn: () => api.menus.get(tenantId!),
    enabled: tenantId !== null,
  });

  useEffect(() => {
    if (!tenantId) {
      setCategories([]);
      return;
    }

    if (menuData?.categories) {
      setCategories(toFormCategories(menuData.categories));
      return;
    }

    setCategories([createEmptyCategory(0)]);
  }, [menuData, tenantId]);

  const saveMutation = useMutation({
    mutationFn: async (payload: SaveTenantMenuPayload) => {
      if (!tenantId) {
        throw new Error(t("menuCreator.errors.selectRestaurant"));
      }
      return api.menus.save(tenantId, payload);
    },
    onSuccess: () => {
      setErrorMessage("");
      setSuccessVisible(true);
    },
    onError: (error: unknown) => {
      setSuccessVisible(false);
      setErrorMessage(
        error instanceof Error && error.message.trim() !== "" ? error.message : t("menuCreator.errors.saveFailed"),
      );
    },
  });

  const canSave = useMemo(() => tenantId !== null && categories.length > 0 && !saveMutation.isPending, [categories.length, saveMutation.isPending, tenantId]);

  const updateCategory = (categoryId: string, patch: Partial<MenuCategoryFormState>): void => {
    setCategories((prev) => prev.map((category) => (category.id === categoryId ? { ...category, ...patch } : category)));
  };

  const removeCategory = (categoryId: string): void => {
    setCategories((prev) => prev.filter((category) => category.id !== categoryId));
  };

  const addCategory = (): void => {
    setCategories((prev) => [...prev, createEmptyCategory(prev.length)]);
  };

  const addItem = (categoryId: string): void => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId ? { ...category, items: [...category.items, createEmptyItem()] } : category,
      ),
    );
  };

  const updateItem = (categoryId: string, itemId: string, patch: Partial<MenuItemFormState>): void => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items: category.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
            },
      ),
    );
  };

  const removeItem = (categoryId: string, itemId: string): void => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items: category.items.filter((item) => item.id !== itemId),
            },
      ),
    );
  };

  const buildPayload = (): SaveTenantMenuPayload | null => {
    const normalizedCategories: TenantMenuCategory[] = [];

    for (const category of categories) {
      const categoryName = category.name.trim();
      const categoryOrder = Number(category.order);
      if (categoryName === "" || Number.isNaN(categoryOrder) || categoryOrder < 0) {
        setErrorMessage(t("menuCreator.errors.invalidCategory"));
        return null;
      }

      const normalizedItems = category.items
        .map((item) => {
          const itemName = item.name.trim();
          const itemPrice = Number(item.price);
          if (itemName === "" || Number.isNaN(itemPrice) || itemPrice < 0) {
            return null;
          }

          return {
            name: itemName,
            price: itemPrice,
            promoted: item.promoted ? 1 : 0,
            desc: item.desc.trim(),
            tags: item.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag !== ""),
          } as const;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (normalizedItems.length !== category.items.length) {
        setErrorMessage(t("menuCreator.errors.invalidItem"));
        return null;
      }

      normalizedCategories.push({
        name: categoryName,
        order: categoryOrder,
        items: normalizedItems,
      });
    }

    return { categories: normalizedCategories };
  };

  const handleSave = (): void => {
    setErrorMessage("");
    setSuccessVisible(false);

    const payload = buildPayload();
    if (!payload) {
      return;
    }

    saveMutation.mutate(payload);
  };

  return (
    <PageLayout
      title={t("menuCreator.title")}
      description={t("menuCreator.description")}
      headerActions={
        <FormActions>
          <Button type="button" variant="secondary" onClick={addCategory} disabled={tenantId === null}>
            {t("menuCreator.actions.addCategory")}
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canSave}>
            {saveMutation.isPending ? t("menuCreator.actions.saving") : t("menuCreator.actions.save")}
          </Button>
        </FormActions>
      }
    >
      <div className="mx-auto max-w-6xl p-6">
        {tenantId === null && (
          <div className="rounded-lg border border-status-warning-border bg-status-warning-background px-4 py-3 text-sm text-status-warning-text">
            {t("menuCreator.errors.selectRestaurant")}
          </div>
        )}

        {isLoading && tenantId !== null && <div className="text-sm text-text-tertiary">{t("menuCreator.loading")}</div>}

        {errorMessage !== "" && (
          <div className="mb-4 rounded-lg border border-status-error-border bg-status-error-background px-4 py-3 text-sm text-status-error-text">
            {errorMessage}
          </div>
        )}

        {successVisible && (
          <div className="mb-4 rounded-lg border border-status-success-border bg-status-success-background px-4 py-3 text-sm text-status-success-text">
            {t("menuCreator.success")}
          </div>
        )}

        <div className="space-y-6">
          {categories.map((category, categoryIndex) => (
            <section key={category.id} className="rounded-xl border border-border-default bg-surface-secondary/60 p-4 shadow-sm">
              <div className="grid gap-4 md:grid-cols-12">
                <div className="md:col-span-6">
                  <label className="mb-1 block text-xs font-medium text-text-secondary">{t("menuCreator.fields.categoryName")}</label>
                  <input
                    value={category.name}
                    onChange={(event) => updateCategory(category.id, { name: event.target.value })}
                    className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
                    placeholder={t("menuCreator.placeholders.categoryName")}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-text-secondary">{t("menuCreator.fields.categoryOrder")}</label>
                  <input
                    type="number"
                    min={0}
                    value={category.order}
                    onChange={(event) => updateCategory(category.id, { order: event.target.value })}
                    className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
                  />
                </div>
                <div className="flex items-end gap-2 md:col-span-4">
                  <Button type="button" variant="secondary" onClick={() => addItem(category.id)}>
                    {t("menuCreator.actions.addItem")}
                  </Button>
                  <Button type="button" variant="danger" onClick={() => removeCategory(category.id)}>
                    {t("menuCreator.actions.removeCategory")}
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {category.items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border-default bg-surface-primary p-3">
                    <div className="grid gap-3 md:grid-cols-12">
                      <div className="md:col-span-4">
                        <label className="mb-1 block text-xs font-medium text-text-secondary">{t("menuCreator.fields.itemName")}</label>
                        <input
                          value={item.name}
                          onChange={(event) => updateItem(category.id, item.id, { name: event.target.value })}
                          className="w-full rounded-md border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary"
                          placeholder={t("menuCreator.placeholders.itemName", { index: categoryIndex + 1 })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-text-secondary">{t("menuCreator.fields.itemPrice")}</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.price}
                          onChange={(event) => updateItem(category.id, item.id, { price: event.target.value })}
                          className="w-full rounded-md border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="mb-1 block text-xs font-medium text-text-secondary">{t("menuCreator.fields.itemTags")}</label>
                        <input
                          value={item.tags}
                          onChange={(event) => updateItem(category.id, item.id, { tags: event.target.value })}
                          className="w-full rounded-md border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary"
                          placeholder={t("menuCreator.placeholders.itemTags")}
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-6 md:col-span-2">
                        <input
                          id={`promoted-${item.id}`}
                          type="checkbox"
                          checked={item.promoted}
                          onChange={(event) => updateItem(category.id, item.id, { promoted: event.target.checked })}
                        />
                        <label htmlFor={`promoted-${item.id}`} className="text-xs text-text-secondary">
                          {t("menuCreator.fields.itemPromoted")}
                        </label>
                      </div>
                      <div className="flex items-end md:col-span-1">
                        <Button type="button" variant="danger" onClick={() => removeItem(category.id, item.id)}>
                          {t("menuCreator.actions.removeItem")}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-medium text-text-secondary">{t("menuCreator.fields.itemDescription")}</label>
                      <textarea
                        value={item.desc}
                        onChange={(event) => updateItem(category.id, item.id, { desc: event.target.value })}
                        className="min-h-20 w-full rounded-md border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary"
                        placeholder={t("menuCreator.placeholders.itemDescription")}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {categories.length === 0 && (
            <div className="rounded-lg border border-dashed border-border-default p-6 text-sm text-text-tertiary">
              {t("menuCreator.emptyState")}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};
