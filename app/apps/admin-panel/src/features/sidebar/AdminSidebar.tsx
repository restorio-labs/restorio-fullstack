import { LogoutButton } from "@restorio/auth";
import { ChooseApp, ThemeSwitcher, NavItem, NavSection, Sidebar, SidebarSection } from "@restorio/ui";
import { goToApp, getAppUrl, getEnvironmentFromEnv } from "@restorio/utils";
import type { ReactElement } from "react";
import { useCallback } from "react";
import { Link, useLocation } from "react-router-dom";

import { api } from "../../api/client";
import { TenantSwitcher } from "../tenant/TenantSwitcher";

const ENV = import.meta.env as unknown as Record<string, unknown>;
const envMode = typeof ENV.ENV === "string" ? ENV.ENV : "development";
const publicWebUrlEnv = typeof ENV.VITE_PUBLIC_WEB_URL === "string" ? ENV.VITE_PUBLIC_WEB_URL : undefined;

const PUBLIC_WEB_URL: string = publicWebUrlEnv ?? getAppUrl(getEnvironmentFromEnv(envMode), "public-web");

export const AdminSidebar = (): ReactElement => {
  const { pathname } = useLocation();

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
    <Sidebar aria-label="Admin navigation" variant="persistent" className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-border-default">
        <TenantSwitcher />
      </div>

      <SidebarSection title="Floor Layout">
        <NavSection>
          <NavItem as={Link} to="/" href="/" active={isActive("/")} role="menuitem">
            Floor Editor
          </NavItem>
        </NavSection>
      </SidebarSection>

      <SidebarSection title="Menu">
        <NavSection>
          <NavItem as={Link} to="/menu-creator" href="/menu-creator" active={isActive("/menu-creator")} role="menuitem">
            Menu Creator
          </NavItem>
          <NavItem
            as={Link}
            to="/menu-page-configurator"
            href="/menu-page-configurator"
            active={isActive("/menu-page-configurator")}
            role="menuitem"
          >
            Page Configurator
          </NavItem>
        </NavSection>
      </SidebarSection>

      <SidebarSection title="Tools">
        <NavSection>
          <NavItem
            as={Link}
            to="/qr-code-generator"
            href="/qr-code-generator"
            active={isActive("/qr-code-generator")}
            role="menuitem"
          >
            QR Code Generator
          </NavItem>
        </NavSection>
      </SidebarSection>

      <SidebarSection title="Settings">
        <NavSection>
          <NavItem
            as={Link}
            to="/payment-config"
            href="/payment-config"
            active={isActive("/payment-config")}
            role="menuitem"
          >
            Payment Config
          </NavItem>
          <NavItem as={Link} to="/staff" href="/staff" active={isActive("/staff")} role="menuitem">
            Staff
          </NavItem>
        </NavSection>
      </SidebarSection>
      <div className="sticky bottom-0 mt-4 flex flex-col gap-3 border-t border-border-default bg-surface-secondary/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <ThemeSwitcher />
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <span>View</span>
            <ChooseApp variant="dropdown" value="admin-panel" onSelectApp={goToApp} />
          </label>
        </div>
        <LogoutButton
          variant="secondary"
          fullWidth
          onLogout={handleLogout}
          redirectTo={`${PUBLIC_WEB_URL}/login`}
          loadingLabel="Logging out..."
        />
      </div>
    </Sidebar>
  );
};
