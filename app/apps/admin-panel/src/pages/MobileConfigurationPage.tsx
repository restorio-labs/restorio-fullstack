import { Button, FormActions, Loader, useI18n, useToast } from "@restorio/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChangeEvent, FormEvent, ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  const [themeJson, setThemeJson] = useState("");
  const [themeError, setThemeError] = useState("");
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
      setThemeJson("");
      setThemeError("");

      return;
    }

    setPageTitle(config.pageTitle ?? "");
    setThemeJson(
      config.themeOverride && Object.keys(config.themeOverride).length > 0
        ? JSON.stringify(config.themeOverride, null, 2)
        : "",
    );
    setThemeError("");
  }, [config]);

  const otherTenants = useMemo(() => {
    if (!tenantId || !tenants) {
      return [];
    }

    return tenants.filter((x) => x.id !== tenantId);
  }, [tenantId, tenants]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId) {
        throw new Error("No tenant");
      }

      let themeOverride: Record<string, unknown> | null | undefined;

      const trimmed = themeJson.trim();

      if (trimmed === "") {
        themeOverride = null;
      } else {
        try {
          const parsed: unknown = JSON.parse(trimmed);

          if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error("invalid");
          }

          themeOverride = parsed as Record<string, unknown>;
          setThemeError("");
        } catch {
          setThemeError(t("mobileConfiguration.errors.invalidThemeJson"));

          throw new Error("theme");
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
      if (err instanceof Error && err.message === "theme") {
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
      setThemeJson(
        data.themeOverride && Object.keys(data.themeOverride).length > 0
          ? JSON.stringify(data.themeOverride, null, 2)
          : "",
      );
      setThemeError("");
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
            <label className="mb-1 block text-xs font-medium text-text-secondary" htmlFor="mobile-favicon">
              {t("mobileConfiguration.fields.favicon")}
            </label>
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
            <p className="mt-1 text-xs text-text-tertiary">{t("mobileConfiguration.hints.favicon")}</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary" htmlFor="mobile-theme-json">
              {t("mobileConfiguration.fields.themeOverride")}
            </label>
            <textarea
              id="mobile-theme-json"
              value={themeJson}
              onChange={(e) => {
                setThemeJson(e.target.value);
                setThemeError("");
              }}
              className="min-h-48 w-full rounded-md border border-border-default bg-surface-primary px-3 py-2 font-mono text-xs text-text-primary"
              spellCheck={false}
            />
            {themeError && <p className="mt-1 text-xs text-status-error-text">{themeError}</p>}
            <p className="mt-1 text-xs text-text-tertiary">{t("mobileConfiguration.hints.themeOverride")}</p>
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
