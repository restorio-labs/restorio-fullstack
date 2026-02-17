import { ThemeSwitcher, NavItem, NavSection, Sidebar, SidebarSection } from "@restorio/ui";
import type { ReactElement } from "react";
import { Link, useLocation } from "react-router-dom";

export const AdminSidebar = (): ReactElement => {
  const { pathname } = useLocation();

  const isActive = (path: string): boolean => {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(path);
  };

  return (
    <Sidebar aria-label="Admin navigation" variant="persistent">
      <ThemeSwitcher />
      <SidebarSection title="Venue Management">
        <NavSection>
          <NavItem as={Link} to="/" href="/" active={isActive("/")} role="menuitem">
            Venues
          </NavItem>
          <NavItem
            as={Link}
            to="/venue-creator"
            href="/venue-creator"
            active={isActive("/venue-creator")}
            role="menuitem"
          >
            Venue Creator
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
    </Sidebar>
  );
};
