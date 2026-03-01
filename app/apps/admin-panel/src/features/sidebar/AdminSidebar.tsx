import { LogoutButton } from "@restorio/auth";
import { ChooseApp, LanguageDropdown, ThemeSwitcher, NavItem, NavSection, Sidebar, useI18n } from "@restorio/ui";
import { goToApp, getAppUrl, getEnvironmentFromEnv } from "@restorio/utils";
import type { ReactElement } from "react";
import { useCallback, useId } from "react";
import { Link, useLocation } from "react-router-dom";

import { api } from "../../api/client";
import { TenantSwitcher } from "../tenant/TenantSwitcher";
import { supportedLocales } from "../../i18n/messages";

const ENV = import.meta.env as unknown as Record<string, unknown>;
const envMode = typeof ENV.ENV === "string" ? ENV.ENV : "development";
const publicWebUrlEnv = typeof ENV.VITE_PUBLIC_WEB_URL === "string" ? ENV.VITE_PUBLIC_WEB_URL : undefined;

const PUBLIC_WEB_URL: string = publicWebUrlEnv ?? getAppUrl(getEnvironmentFromEnv(envMode), "public-web");

export const AdminSidebar = (): ReactElement => {
  const { t, locale, setLocale } = useI18n();
  const { pathname } = useLocation();
  const languageSelectId = useId();

  const isActive = (path: string): boolean => {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(path);
  };

  const handleLogout = useCallback(async (): Promise<void> => {
    await api.auth.logout();
  }, []);

  return (
    <Sidebar aria-label={t("sidebar.ariaLabel")} variant="persistent" className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-border-default">
        <TenantSwitcher />
      </div>

      <div className="flex flex-col gap-2 py-2">
        <NavSection aria-label={t("sidebar.sections.floorLayout")}>
          <NavItem as={Link} to="/" href="/" active={isActive("/")} role="menuitem">
            {t("sidebar.items.floorEditor")}
          </NavItem>
        </NavSection>

        <NavSection aria-label={t("sidebar.sections.menu")}>
          <NavItem as={Link} to="/menu-creator" href="/menu-creator" active={isActive("/menu-creator")} role="menuitem">
            {t("sidebar.items.menuCreator")}
          </NavItem>
          <NavItem
            as={Link}
            to="/menu-page-configurator"
            href="/menu-page-configurator"
            active={isActive("/menu-page-configurator")}
            role="menuitem"
          >
            {t("sidebar.items.pageConfigurator")}
          </NavItem>
        </NavSection>

        <NavSection aria-label={t("sidebar.sections.tools")}>
          <NavItem
            as={Link}
            to="/qr-code-generator"
            href="/qr-code-generator"
            active={isActive("/qr-code-generator")}
            role="menuitem"
          >
            {t("sidebar.items.qrCodeGenerator")}
          </NavItem>
        </NavSection>

        <NavSection aria-label={t("sidebar.sections.settings")}>
          <NavItem
            as={Link}
            to="/payment-config"
            href="/payment-config"
            active={isActive("/payment-config")}
            role="menuitem"
          >
            {t("sidebar.items.paymentConfig")}
          </NavItem>
          <NavItem as={Link} to="/staff" href="/staff" active={isActive("/staff")} role="menuitem">
            {t("sidebar.items.staff")}
          </NavItem>
        </NavSection>
      </div>
      <div className="sticky bottom-0 mt-4 flex flex-col gap-3 border-t border-border-default bg-surface-secondary/80 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary">
          <ThemeSwitcher />
          <div className="flex items-center gap-2">
            <span id={languageSelectId}>{t("languageSwitcher.label")}</span>
            <LanguageDropdown
              value={locale}
              options={supportedLocales.map((localeOption) => ({
                value: localeOption,
                label: t(`languageSwitcher.options.${localeOption}`),
              }))}
              onSelect={setLocale}
              ariaLabelledBy={languageSelectId}
              placement="bottom-end"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span>{t("sidebar.items.label")}</span>
            <ChooseApp
              variant="dropdown"
              value="admin-panel"
              onSelectApp={goToApp}
              ariaLabel={t("sidebar.items.label")}
              className="w-auto"
            />
          </div>
        </div>
        <LogoutButton
          variant="danger"
          fullWidth
          onLogout={handleLogout}
          redirectTo={`${PUBLIC_WEB_URL}/login`}
          loadingLabel={t("sidebar.logoutLoading")}
        />
      </div>
    </Sidebar>
  );
};
