import { Icon, NavIcon, NavItem, NavRail, useI18n } from "@restorio/ui";
import type { ReactElement } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

const ordersIcon = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
  />
);

const menuIcon = <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />;

export const KitchenRail = (): ReactElement => {
  const location = useLocation();
  const params = useParams();
  const { t } = useI18n();
  const tenantId = params.tenantId ?? "";
  const isMenuPath = location.pathname.endsWith("/menu");

  return (
    <NavRail aria-label={t("aria.kitchenNavigation")} orientation="vertical">
      <NavItem
        as={Link}
        to={tenantId ? `/${tenantId}` : "/"}
        href={tenantId ? `/${tenantId}` : "/"}
        active={!isMenuPath && !location.pathname.includes("login")}
        touchTarget
        aria-label={t("nav.orders")}
        role="menuitem"
        icon={
          <NavIcon>
            <Icon size="lg">{ordersIcon}</Icon>
          </NavIcon>
        }
      />
      <NavItem
        as={Link}
        to={tenantId ? `/${tenantId}/menu` : "/"}
        href={tenantId ? `/${tenantId}/menu` : "/"}
        active={isMenuPath}
        touchTarget
        aria-label={t("nav.menu")}
        role="menuitem"
        icon={
          <NavIcon>
            <Icon size="lg">{menuIcon}</Icon>
          </NavIcon>
        }
      />
    </NavRail>
  );
};
