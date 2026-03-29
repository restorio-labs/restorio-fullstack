import { LogoutButton } from "@restorio/auth";
import { ChooseApp, ThemeSwitcher, NavItem, NavSection, Sidebar, useI18n } from "@restorio/ui";
import { goToApp } from "@restorio/utils";
import type { ReactElement } from "react";
import { useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import { PUBLIC_WEB_URL } from "../../config";
import { TenantSwitcher } from "../tenant/TenantSwitcher";

const FLOOR_EDITOR_NAVIGATION_EVENT = "restorio:floor-editor-navigation-attempt";

export const AdminSidebar = (): ReactElement => {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string): boolean => {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(path);
  };

  const handleLogout = useCallback(async (): Promise<void> => {
    await api.auth.logout();
  }, []);

  const handleRouteNavigation = useCallback(
    (event: React.MouseEvent, path: string): void => {
      if (pathname === "/" && pathname !== path) {
        const navigationEvent = new CustomEvent(FLOOR_EDITOR_NAVIGATION_EVENT, {
          detail: { path },
          cancelable: true,
        });
        const wasBlocked = !window.dispatchEvent(navigationEvent);

        if (wasBlocked) {
          event.preventDefault();

          return;
        }

        navigate(path);

        return;
      }

      navigate(path);
    },
    [navigate, pathname],
  );

  return (
    <Sidebar aria-label={t("sidebar.ariaLabel")} variant="persistent" className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-border-default">
        <TenantSwitcher />
      </div>

      <div className="flex flex-col gap-2 py-2">
        <NavSection aria-label={t("sidebar.sections.floorLayout")}>
          <NavItem
            as={Link}
            to="/"
            active={isActive("/")}
            role="menuitem"
            onClick={(event: React.MouseEvent) => handleRouteNavigation(event, "/")}
          >
            {t("sidebar.items.floorEditor")}
          </NavItem>
        </NavSection>

        <NavSection aria-label={t("sidebar.sections.menu")}>
          <NavItem
            as={Link}
            to="/menu-creator"
            active={isActive("/menu-creator")}
            role="menuitem"
            onClick={(event: React.MouseEvent) => handleRouteNavigation(event, "/menu-creator")}
          >
            {t("sidebar.items.menuCreator")}
          </NavItem>
          {/* <NavItem
            as={Link}
            to="/main-page-configurator"
            active={isActive("/main-page-configurator")}
            role="menuitem"
            onClick={(event: React.MouseEvent) => handleRouteNavigation(event, "/main-page-configurator")}
          >
            {t("sidebar.items.pageConfigurator")}
          </NavItem> */}
        </NavSection>

        <NavSection aria-label={t("sidebar.sections.tools")}>
          <NavItem
            as={Link}
            to="/qr-code-generator"
            active={isActive("/qr-code-generator")}
            role="menuitem"
            onClick={(event: React.MouseEvent) => handleRouteNavigation(event, "/qr-code-generator")}
          >
            {t("sidebar.items.qrCodeGenerator")}
          </NavItem>
        </NavSection>

        <NavSection aria-label={t("sidebar.sections.settings")}>
          <NavItem
            as={Link}
            to="/profile"
            active={isActive("/profile")}
            role="menuitem"
            onClick={(event: React.MouseEvent) => handleRouteNavigation(event, "/profile")}
          >
            {t("sidebar.items.tenantProfile")}
          </NavItem>
          <NavItem
            as={Link}
            to="/payment-config"
            active={isActive("/payment-config")}
            role="menuitem"
            onClick={(event: React.MouseEvent) => handleRouteNavigation(event, "/payment-config")}
          >
            {t("sidebar.items.paymentConfig")}
          </NavItem>
          <NavItem
            as={Link}
            to="/transactions"
            active={isActive("/transactions")}
            role="menuitem"
            onClick={(event: React.MouseEvent) => handleRouteNavigation(event, "/transactions")}
          >
            {t("sidebar.items.transactions")}
          </NavItem>
          <NavItem
            as={Link}
            to="/staff"
            active={isActive("/staff")}
            role="menuitem"
            onClick={(event: React.MouseEvent) => handleRouteNavigation(event, "/staff")}
          >
            {t("sidebar.items.staff")}
          </NavItem>
        </NavSection>
      </div>
      <div className="sticky bottom-0 mt-4 flex flex-col gap-3 border-t border-border-default bg-surface-secondary/80 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary">
          <ThemeSwitcher />
          <div className="flex items-center gap-2">
            <span>{t("languageSwitcher.label")}</span>
            <span className="rounded-md border border-border-default px-2 py-1 text-xs font-semibold tracking-wide">
              PL
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span>{t("sidebar.items.label")}</span>
            <ChooseApp
              variant="dropdown"
              value="admin-panel"
              onSelectApp={goToApp}
              labels={{
                adminPanel: t("sidebar.items.adminPanel"),
                kitchenPanel: t("sidebar.items.kitchenPanel"),
                waiterPanel: t("sidebar.items.waiterPanel"),
              }}
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
