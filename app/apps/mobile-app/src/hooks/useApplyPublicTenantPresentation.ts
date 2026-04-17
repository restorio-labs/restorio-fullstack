import type { PublicTenantInfo } from "@restorio/types";
import { useTheme, type ThemeOverride } from "@restorio/ui";
import { useEffect } from "react";

import { API_BASE_URL } from "../config";

const FAVICON_LINK_ID = "tenant-favicon";

export const useApplyPublicTenantPresentation = (tenantData: PublicTenantInfo | undefined): void => {
  const { setOverride } = useTheme();

  useEffect(() => {
    if (!tenantData) {
      return;
    }

    const title = tenantData.pageTitle?.trim() ? tenantData.pageTitle : tenantData.name;

    document.title = title;

    const path = tenantData.faviconPath;

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
    const raw = tenantData?.themeOverride;

    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      setOverride(null);
    } else {
      setOverride(raw as ThemeOverride);
    }

    return (): void => {
      setOverride(null);
    };
  }, [tenantData?.themeOverride, setOverride]);
};
