import type { SaveTenantMenuPayload, TenantMenuCategory } from "@restorio/types";
import { Button, FormActions, useI18n, Loader } from "@restorio/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

import { api } from "../api/client";
import { useCurrentTenant } from "../context/TenantContext";
import { moveItemById } from "../features/menu/moveItemById";
import { PageLayout } from "../layouts/PageLayout";

interface MenuItemFormState {
  id: string;
  name: string;
  price: string;
  promoted: boolean;
  isAvailable: boolean;
  desc: string;
  tags: string[];
  tagInput: string;
}

interface MenuCategoryFormState {
  id: string;
  name: string;
  items: MenuItemFormState[];
}

interface QueryErrorWithStatusCode {
  status?: number;
  response?: {
    status?: number;
    data?: {
      detail?: string;
    };
  };
}

const menuQueryKey = (tenantId: string): readonly string[] => ["tenant-menu", tenantId];
const ITEM_DESCRIPTION_MAX_LENGTH = 2000;

const createLocalId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createEmptyItem = (): MenuItemFormState => ({
  id: createLocalId(),
  name: "",
  price: "",
  promoted: false,
  isAvailable: true,
  desc: "",
  tags: [],
  tagInput: "",
});

const createEmptyCategory = (): MenuCategoryFormState => ({
  id: createLocalId(),
  name: "",
  items: [createEmptyItem()],
});

const toFormCategories = (categories: TenantMenuCategory[]): MenuCategoryFormState[] =>
  categories.map((category) => ({
    id: createLocalId(),
    name: category.name,
    items: category.items.map((item) => ({
      id: createLocalId(),
      name: item.name,
      price: String(item.price),
      promoted: item.promoted,
      isAvailable: item.isAvailable,
      desc: item.desc,
      tags: item.tags,
      tagInput: "",
    })),
  }));

export const MenuCreatorPage = (): ReactElement => {
  const { t } = useI18n();
  const { selectedTenantId } = useCurrentTenant();
  const [categories, setCategories] = useState<MenuCategoryFormState[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successVisible, setSuccessVisible] = useState(false);
  const [didUserEdit, setDidUserEdit] = useState(false);
  const [loadedTenantId, setLoadedTenantId] = useState<string | null>(null);

  const tenantId = selectedTenantId;

  const { data: menuData, isLoading } = useQuery({
    queryKey: menuQueryKey(tenantId ?? ""),
    queryFn: async () => {
      try {
        return await api.menus.get(tenantId!);
      } catch (error) {
        const normalizedError = error as QueryErrorWithStatusCode;
        const statusCode = normalizedError.response?.status ?? normalizedError.status;
        const isNotFoundResponse =
          statusCode === 404 || normalizedError.response?.data?.detail?.toLowerCase() === "not found";

        if (isNotFoundResponse) {
          return null;
        }

        throw error;
      }
    },
    enabled: tenantId !== null,
  });

  useEffect(() => {
    if (!tenantId) {
      setCategories([]);
      setDidUserEdit(false);
      setLoadedTenantId(null);

      return;
    }

    if (loadedTenantId !== tenantId) {
      if (isLoading) {
        return;
      }

      if (menuData?.categories) {
        setCategories(toFormCategories(menuData.categories));
      } else {
        setCategories([]);
      }

      setDidUserEdit(false);
      setLoadedTenantId(tenantId);

      return;
    }

    if (didUserEdit) {
      return;
    }

    if (menuData?.categories) {
      setCategories(toFormCategories(menuData.categories));

      return;
    }

    if (!isLoading && !menuData?.categories) {
      setCategories([]);
    }
  }, [categories.length, didUserEdit, isLoading, loadedTenantId, menuData, tenantId]);

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

  const canSave = useMemo(
    () => tenantId !== null && categories.length > 0 && !saveMutation.isPending,
    [categories.length, saveMutation.isPending, tenantId],
  );

  const updateCategory = (categoryId: string, patch: Partial<MenuCategoryFormState>): void => {
    setDidUserEdit(true);
    setCategories((prev) =>
      prev.map((category) => (category.id === categoryId ? { ...category, ...patch } : category)),
    );
  };

  const removeCategory = (categoryId: string): void => {
    setDidUserEdit(true);
    setCategories((prev) => prev.filter((category) => category.id !== categoryId));
  };

  const addCategory = (): void => {
    setDidUserEdit(true);
    setCategories((prev) => [...prev, createEmptyCategory()]);
  };

  const moveCategory = (categoryId: string, direction: "up" | "down"): void => {
    setDidUserEdit(true);
    setCategories((prev) => {
      const next = moveItemById(prev, categoryId, direction);

      return next ?? prev;
    });
  };

  const addItem = (categoryId: string): void => {
    setDidUserEdit(true);
    setCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId ? { ...category, items: [...category.items, createEmptyItem()] } : category,
      ),
    );
  };

  const updateItem = (categoryId: string, itemId: string, patch: Partial<MenuItemFormState>): void => {
    setDidUserEdit(true);
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
    setDidUserEdit(true);
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

  const addTagToItem = (categoryId: string, itemId: string): void => {
    setDidUserEdit(true);
    setCategories((prev) =>
      prev.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items: category.items.map((item) => {
                if (item.id !== itemId) {
                  return item;
                }

                const normalizedTag = item.tagInput.trim();

                if (
                  normalizedTag === "" ||
                  item.tags.some((tag) => tag.toLowerCase() === normalizedTag.toLowerCase())
                ) {
                  return item;
                }

                return {
                  ...item,
                  tags: [...item.tags, normalizedTag],
                  tagInput: "",
                };
              }),
            },
      ),
    );
  };

  const removeTagFromItem = (categoryId: string, itemId: string, tagToRemove: string): void => {
    setDidUserEdit(true);
    setCategories((prev) =>
      prev.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items: category.items.map((item) =>
                item.id !== itemId
                  ? item
                  : {
                      ...item,
                      tags: item.tags.filter((tag) => tag !== tagToRemove),
                    },
              ),
            },
      ),
    );
  };

  const buildPayload = (): SaveTenantMenuPayload | null => {
    const normalizedCategories: TenantMenuCategory[] = [];

    for (const [index, category] of categories.entries()) {
      const categoryName = category.name.trim();

      if (categoryName === "") {
        setErrorMessage(t("menuCreator.errors.invalidCategory"));

        return null;
      }

      const normalizedItems: TenantMenuCategory["items"] = [];
      const seenItemNames = new Set<string>();

      for (const item of category.items) {
        const itemName = item.name.trim();
        const rawPrice = item.price.trim();

        if (itemName === "" || rawPrice === "") {
          setErrorMessage(t("menuCreator.errors.invalidItem"));

          return null;
        }

        const itemPrice = Number(rawPrice);

        if (Number.isNaN(itemPrice) || itemPrice < 0) {
          setErrorMessage(t("menuCreator.errors.invalidItem"));

          return null;
        }

        const normalizedName = itemName.toLowerCase();

        if (seenItemNames.has(normalizedName)) {
          setErrorMessage(t("menuCreator.errors.invalidItem"));

          return null;
        }

        seenItemNames.add(normalizedName);
        normalizedItems.push({
          name: itemName,
          price: itemPrice,
          promoted: item.promoted,
          isAvailable: item.isAvailable,
          desc: item.desc.trim(),
          tags: item.tags,
        });
      }

      normalizedCategories.push({
        name: categoryName,
        order: index,
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

        {isLoading && tenantId !== null && (
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <Loader size="sm" />
            <span>{t("menuCreator.loading")}</span>
          </div>
        )}

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
            <section
              key={category.id}
              className="rounded-xl border border-border-default bg-surface-secondary/60 p-4 shadow-sm"
            >
              <div className="grid gap-4 md:grid-cols-12">
                <div className="md:col-span-5">
                  <label className="mb-1 block text-xs font-medium text-text-secondary">
                    {t("menuCreator.fields.categoryName")}
                  </label>
                  <input
                    value={category.name}
                    onChange={(event) => updateCategory(category.id, { name: event.target.value })}
                    className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
                    placeholder={t("menuCreator.placeholders.categoryName")}
                  />
                </div>
                <div className="flex items-end gap-2 md:col-span-7">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-text-secondary">
                      {t("menuCreator.fields.categoryOrderControls")}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => moveCategory(category.id, "up")}
                        disabled={categoryIndex === 0}
                        aria-label={t("menuCreator.actions.moveCategoryUp")}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => moveCategory(category.id, "down")}
                        disabled={categoryIndex === categories.length - 1}
                        aria-label={t("menuCreator.actions.moveCategoryDown")}
                      >
                        ↓
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => addItem(category.id)}
                    className="whitespace-nowrap"
                  >
                    {t("menuCreator.actions.addItem")}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => removeCategory(category.id)}
                    className="whitespace-nowrap"
                  >
                    {t("menuCreator.actions.removeCategory")}
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="relative rounded-lg border border-border-default bg-surface-primary p-3 pt-9"
                  >
                    <button
                      type="button"
                      aria-label={t("menuCreator.actions.removeItem")}
                      onClick={() => removeItem(category.id, item.id)}
                      className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md border border-status-error-border bg-status-error-background text-sm font-semibold leading-none text-status-error-text"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                    <div className="grid gap-3 md:grid-cols-12">
                      <div className="md:col-span-4">
                        <label className="mb-1 block text-xs font-medium text-text-secondary">
                          {t("menuCreator.fields.itemName")}
                        </label>
                        <input
                          value={item.name}
                          onChange={(event) => updateItem(category.id, item.id, { name: event.target.value })}
                          className="w-full rounded-md border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary"
                          placeholder={t("menuCreator.placeholders.itemName", { index: categoryIndex + 1 })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-text-secondary">
                          {t("menuCreator.fields.itemPrice")}
                        </label>
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
                        <label className="mb-1 block text-xs font-medium text-text-secondary">
                          {t("menuCreator.fields.itemTags")}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            value={item.tagInput}
                            onChange={(event) => updateItem(category.id, item.id, { tagInput: event.target.value })}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                addTagToItem(category.id, item.id);
                              }
                            }}
                            className="w-full rounded-md border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary"
                            placeholder={t("menuCreator.placeholders.itemTags")}
                          />
                          <button
                            type="button"
                            aria-label={t("menuCreator.actions.addTag")}
                            onClick={() => addTagToItem(category.id, item.id)}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface-secondary text-base font-semibold text-text-primary"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 pt-6 md:col-span-2">
                        <div className="flex items-center gap-2">
                          <input
                            id={`active-${item.id}`}
                            type="checkbox"
                            checked={item.isAvailable}
                            onChange={(event) =>
                              updateItem(category.id, item.id, { isAvailable: event.target.checked })
                            }
                          />
                          <label htmlFor={`active-${item.id}`} className="text-xs text-text-secondary">
                            {t("menuCreator.fields.itemActive")}
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
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
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <label className="block text-xs font-medium text-text-secondary">
                        {t("menuCreator.fields.itemDescription")}
                      </label>
                      <span className="text-xs text-text-tertiary">
                        {item.desc.length}/{ITEM_DESCRIPTION_MAX_LENGTH}
                      </span>
                    </div>
                    <div className="mt-2">
                      <textarea
                        value={item.desc}
                        onChange={(event) => updateItem(category.id, item.id, { desc: event.target.value })}
                        className="min-h-20 w-full rounded-md border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary"
                        placeholder={t("menuCreator.placeholders.itemDescription")}
                        maxLength={ITEM_DESCRIPTION_MAX_LENGTH}
                      />
                    </div>
                    {item.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <span
                            key={`${item.id}-${tag}`}
                            className="inline-flex items-center gap-1 rounded-md border border-border-default bg-surface-secondary px-2 py-1 text-xs text-text-secondary"
                          >
                            {tag}
                            <button
                              type="button"
                              aria-label={t("menuCreator.actions.removeTag")}
                              onClick={() => removeTagFromItem(category.id, item.id, tag)}
                              className="inline-flex h-5 w-5 items-center justify-center rounded border border-status-error-border bg-status-error-background text-[10px] font-semibold leading-none text-status-error-text"
                            >
                              -
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
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
