import { api } from "../api/client";
import { buildInvalidKitchenTenantRedirectUrl } from "../utils/invalidTenantRedirect";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useRef } from "react";
import { Outlet, useParams } from "react-router-dom";

const getErrorStatus = (err: unknown): number | undefined => {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response?: { status?: number } }).response;

    return response?.status;
  }

  return undefined;
};

export const TenantRouteGuard = (): ReactElement => {
  const { tenantId = "" } = useParams();
  const redirectStarted = useRef(false);

  useEffect(() => {
    redirectStarted.current = false;
  }, [tenantId]);

  const query = useQuery({
    queryKey: ["kitchen-tenant-access", tenantId],
    queryFn: () => api.tenants.get(tenantId),
    retry: false,
    enabled: tenantId.length > 0,
  });

  useEffect(() => {
    if (query.isLoading || !query.isError || redirectStarted.current) {
      return;
    }

    const status = getErrorStatus(query.error);

    if (status !== 403 && status !== 404) {
      return;
    }

    redirectStarted.current = true;
    window.location.href = buildInvalidKitchenTenantRedirectUrl();
  }, [query.isError, query.error, query.isLoading]);

  if (tenantId.length === 0) {
    return <div />;
  }

  if (query.isLoading) {
    return <div />;
  }

  if (query.isError) {
    const status = getErrorStatus(query.error);

    if (status === 403 || status === 404) {
      return <div />;
    }

    return <div />;
  }

  return <Outlet />;
};
