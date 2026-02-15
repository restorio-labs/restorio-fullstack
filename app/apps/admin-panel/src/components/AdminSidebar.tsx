import { NavItem, NavSection, Sidebar, SidebarSection } from "@restorio/ui";
import type { ReactElement } from "react";
import { Link, useLocation } from "react-router-dom";

export const AdminSidebar = (): ReactElement => {
  const location = useLocation();
  const { pathname } = location;

  return (
    <Sidebar aria-label="Admin navigation" variant="persistent">
      <SidebarSection title="Manage">
        <NavSection>
          <NavItem
            as={Link}
            to="/"
            href="/"
            active={pathname === "/" || pathname.startsWith("/venues/")}
            role="menuitem"
          >
            Venues
          </NavItem>
        </NavSection>
      </SidebarSection>
    </Sidebar>
  );
};
