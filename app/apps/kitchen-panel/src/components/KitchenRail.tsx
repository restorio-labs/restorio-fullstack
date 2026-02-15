import { Icon, NavIcon, NavItem, NavRail } from "@restorio/ui";
import type { ReactElement } from "react";
import { Link, useLocation } from "react-router-dom";

const ordersIcon = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
  />
);

export const KitchenRail = (): ReactElement => {
  const location = useLocation();
  const { pathname } = location;

  return (
    <NavRail aria-label="Kitchen navigation" orientation="vertical">
      <NavItem
        as={Link}
        to="/"
        href="/"
        active={!pathname.includes("login")}
        touchTarget
        aria-label="Orders"
        role="menuitem"
        icon={
          <NavIcon>
            <Icon size="lg">{ordersIcon}</Icon>
          </NavIcon>
        }
      />
    </NavRail>
  );
};
