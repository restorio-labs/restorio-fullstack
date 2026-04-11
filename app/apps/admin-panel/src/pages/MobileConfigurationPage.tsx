import { Button, FormActions, Loader, Tooltip, useI18n, useToast } from "@restorio/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChangeEvent, FormEvent, ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TbHelpCircle } from "react-icons/tb";

import { api } from "../api/client";
import { useCurrentTenant } from "../context/TenantContext";
import { PageLayout } from "../layouts/PageLayout";

const mobileConfigQueryKey = (tenantId: string): readonly string[] => ["tenant-mobile-config", tenantId];

const ICO_TYPES = new Set(["image/x-icon", "image/vnd.microsoft.icon"]);

export const MobileConfigurationPage = (): ReactElement => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { selectedTenantId, tenants } = useCurrentTenant();

  const [pageTitle, setPageTitle] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("");
  const [googleFontUrl, setGoogleFontUrl] = useState("");
  const [fontError, setFontError] = useState("");
  const [faviconError, setFaviconError] = useState("");
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [copySourceId, setCopySourceId] = useState("");

  const tenantId = selectedTenantId;

  const { data: config, isLoading } = useQuery({
    queryKey: mobileConfigQueryKey(tenantId ?? ""),
    queryFn: () => api.tenantMobileConfig.get(tenantId!),
    enabled: tenantId !== null,
  });

  useEffect(() => {
    if (!config) {
      setPageTitle("");
      setBackgroundColor("");
      setGoogleFontUrl("");
      setFontError("");

      return;
    }

    setPageTitle(config.pageTitle ?? "");

    const override = config.themeOverride;

    if (override && typeof override === "object") {
      const colors = override.colors as Record<string, Record<string, string>> | undefined;

      setBackgroundColor(colors?.background?.primary ?? "");

      const typography = override.typography as Record<string, Record<string, string>> | undefined;

      setGoogleFontUrl(typography?.fontFamily?.googleFontUrl ?? "");
    } else {
      setBackgroundColor("");
      setGoogleFontUrl("");
    }

    setFontError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const otherTenants = useMemo(() => {
    if (!tenantId || !tenants) {
      return [];
    }

    return tenants.filter((x) => x.id !== tenantId);
  }, [tenantId, tenants]);

  const validateGoogleFontUrl = (url: string): boolean => {
    if (!url.trim()) {
      return true;
    }

    const pattern = /^https:\/\/fonts\.googleapis\.com\/css2?\?family=/;

    return pattern.test(url.trim());
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId) {
        throw new Error("No tenant");
      }

      const trimmedFont = googleFontUrl.trim();
      if (trimmedFont && !validateGoogleFontUrl(trimmedFont)) {
        setFontError(t("mobileConfiguration.errors.invalidGoogleFontUrl"));

        throw new Error("font");
      }

      setFontError("");

      let themeOverride: Record<string, unknown> | null | undefined;

      const trimmedBg = backgroundColor.trim();

      if (!trimmedBg && !trimmedFont) {
        themeOverride = null;
      } else {
        themeOverride = {};

        if (trimmedBg) {
          themeOverride.colors = {
            background: {
              primary: trimmedBg,
            },
          };
        }

        if (trimmedFont) {
          themeOverride.typography = {
            fontFamily: {
              googleFontUrl: trimmedFont,
            },
          };
        }
      }

      let afterSave = await api.tenantMobileConfig.update(tenantId, {
        pageTitle: pageTitle.trim() === "" ? null : pageTitle.trim(),
        themeOverride,
      });

      if (faviconFile) {
        if (!ICO_TYPES.has(faviconFile.type)) {
          setFaviconError(t("mobileConfiguration.errors.invalidFaviconType"));

          throw new Error("favicon-type");
        }

        if (!faviconFile.name.toLowerCase().endsWith(".ico")) {
          setFaviconError(t("mobileConfiguration.errors.invalidFaviconExtension"));

          throw new Error("favicon-ext");
        }

        const presign = await api.tenantMobileConfig.presignFavicon(tenantId, faviconFile.type);
        const put = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": faviconFile.type },
          body: faviconFile,
        });

        if (!put.ok) {
          setFaviconError(t("mobileConfiguration.errors.faviconUploadFailed"));

          throw new Error("favicon-upload");
        }

        afterSave = await api.tenantMobileConfig.finalizeFavicon(tenantId, presign.objectKey);
        setFaviconFile(null);
        setFaviconError("");
      }

      return afterSave;
    },
    onSuccess: () => {
      showToast(
        "success",
        t("mobileConfiguration.toast.saveSuccessTitle"),
        t("mobileConfiguration.toast.saveSuccessBody"),
      );
      if (tenantId) {
        void queryClient.invalidateQueries({ queryKey: mobileConfigQueryKey(tenantId) });
      }
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message === "font") {
        return;
      }

      if (err instanceof Error && err.message.startsWith("favicon")) {
        return;
      }

      showToast("error", t("mobileConfiguration.toast.saveErrorTitle"), t("mobileConfiguration.toast.saveErrorBody"));
    },
  });

  const copyMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId || !copySourceId) {
        throw new Error("missing");
      }

      return api.tenantMobileConfig.copyThemeFrom(tenantId, copySourceId);
    },
    onSuccess: (data) => {
      const override = data.themeOverride;

      if (override && typeof override === "object") {
        const colors = override.colors as Record<string, Record<string, string>> | undefined;

        setBackgroundColor(colors?.background?.primary ?? "");

        const typography = override.typography as Record<string, Record<string, string>> | undefined;

        setGoogleFontUrl(typography?.fontFamily?.googleFontUrl ?? "");
      } else {
        setBackgroundColor("");
        setGoogleFontUrl("");
      }

      setFontError("");

      showToast(
        "success",
        t("mobileConfiguration.toast.copySuccessTitle"),
        t("mobileConfiguration.toast.copySuccessBody"),
      );
      if (tenantId) {
        void queryClient.invalidateQueries({ queryKey: mobileConfigQueryKey(tenantId) });
      }
    },
    onError: () => {
      showToast("error", t("mobileConfiguration.toast.copyErrorTitle"), t("mobileConfiguration.toast.copyErrorBody"));
    },
  });

  const handleFaviconChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setFaviconError("");
    const file = event.target.files?.[0] ?? null;
    setFaviconFile(file);
    event.target.value = "";
  };

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    saveMutation.mutate();
  };

  const handleCopyTheme = useCallback((): void => {
    if (!copySourceId) {
      return;
    }

    copyMutation.mutate();
  }, [copyMutation, copySourceId]);

  const canSave = tenantId !== null && !saveMutation.isPending;

  return (
    <PageLayout
      title={t("mobileConfiguration.title")}
      description={t("mobileConfiguration.description")}
      headerActions={
        <FormActions>
          <Button type="submit" form="mobile-config-form" disabled={!canSave}>
            {saveMutation.isPending ? t("mobileConfiguration.actions.saving") : t("mobileConfiguration.actions.save")}
          </Button>
        </FormActions>
      }
    >
      <div className="mx-auto max-w-3xl p-6">
        {tenantId === null && (
          <div className="rounded-lg border border-status-warning-border bg-status-warning-background px-4 py-3 text-sm text-status-warning-text">
            {t("mobileConfiguration.errors.selectRestaurant")}
          </div>
        )}

        {isLoading && tenantId !== null && (
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <Loader size="sm" />
            <span>{t("mobileConfiguration.loading")}</span>
          </div>
        )}

        <form id="mobile-config-form" onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary" htmlFor="mobile-page-title">
              {t("mobileConfiguration.fields.pageTitle")}
            </label>
            <input
              id="mobile-page-title"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
              placeholder={t("mobileConfiguration.placeholders.pageTitle")}
            />
            <p className="mt-1 text-xs text-text-tertiary">{t("mobileConfiguration.hints.pageTitle")}</p>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-1">
              <label className="block text-xs font-medium text-text-secondary" htmlFor="mobile-favicon">
                {t("mobileConfiguration.fields.favicon")}
              </label>
              <Tooltip content={t("mobileConfiguration.hints.favicon")} placement="right">
                <button type="button" className="text-text-tertiary hover:text-text-secondary">
                  <TbHelpCircle className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>
            <input
              id="mobile-favicon"
              type="file"
              accept=".ico,image/x-icon,image/vnd.microsoft.icon"
              onChange={handleFaviconChange}
              className="block w-full text-sm text-text-secondary"
            />
            {faviconFile && (
              <p className="mt-1 text-xs text-text-tertiary">
                {t("mobileConfiguration.hints.faviconSelected", { name: faviconFile.name })}
              </p>
            )}
            {config?.hasFavicon && !faviconFile && (
              <p className="mt-1 text-xs text-text-tertiary">{t("mobileConfiguration.hints.faviconCurrent")}</p>
            )}
            {faviconError && <p className="mt-1 text-xs text-status-error-text">{faviconError}</p>}
          </div>

          <div className="rounded-lg border border-border-default bg-surface-secondary/40 p-4">
            <p className="mb-4 text-sm font-medium text-text-primary">{t("mobileConfiguration.themeSection.title")}</p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary" htmlFor="mobile-bg-color">
                  {t("mobileConfiguration.fields.backgroundColor")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="mobile-bg-color"
                    type="color"
                    value={backgroundColor || "#ffffff"}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-md border border-border-default bg-surface-primary p-1"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary font-mono"
                  />
                  {backgroundColor && (
                    <button
                      type="button"
                      onClick={() => setBackgroundColor("")}
                      className="text-xs text-text-tertiary hover:text-text-secondary"
                    >
                      {t("mobileConfiguration.actions.clear")}
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-text-tertiary">{t("mobileConfiguration.hints.backgroundColor")}</p>
              </div>

              <div>
                <div className="mb-1 flex items-center gap-1">
                  <label className="block text-xs font-medium text-text-secondary" htmlFor="mobile-google-font">
                    {t("mobileConfiguration.fields.googleFontUrl")}
                  </label>
                  <Tooltip content={t("mobileConfiguration.hints.googleFontUrlTooltip")} placement="right">
                    <button type="button" className="text-text-tertiary hover:text-text-secondary">
                      <TbHelpCircle className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
                <input
                  id="mobile-google-font"
                  type="url"
                  value={googleFontUrl}
                  onChange={(e) => {
                    setGoogleFontUrl(e.target.value);
                    setFontError("");
                  }}
                  placeholder="https://fonts.googleapis.com/css2?family=Roboto"
                  className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
                />
                {fontError && <p className="mt-1 text-xs text-status-error-text">{fontError}</p>}
                <p className="mt-1 text-xs text-text-tertiary">{t("mobileConfiguration.hints.googleFontUrl")}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border-default bg-surface-secondary/60 p-4">
            <p className="mb-2 text-sm font-medium text-text-primary">{t("mobileConfiguration.copySection.title")}</p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[200px] flex-1">
                <label className="mb-1 block text-xs font-medium text-text-secondary" htmlFor="copy-theme-source">
                  {t("mobileConfiguration.copySection.source")}
                </label>
                <select
                  id="copy-theme-source"
                  value={copySourceId}
                  onChange={(e) => setCopySourceId(e.target.value)}
                  className="w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary"
                >
                  <option value="">{t("mobileConfiguration.copySection.placeholder")}</option>
                  {otherTenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={!copySourceId || copyMutation.isPending}
                onClick={handleCopyTheme}
              >
                {copyMutation.isPending
                  ? t("mobileConfiguration.copySection.copying")
                  : t("mobileConfiguration.copySection.copy")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </PageLayout>
  );
};
