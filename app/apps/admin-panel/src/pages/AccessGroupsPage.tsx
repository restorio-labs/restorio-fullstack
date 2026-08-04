import { useCan } from "@restorio/auth";
import { AuthorizationActions } from "@restorio/types";
import { Button, FormActions, Loader, useI18n } from "@restorio/ui";
import { useQuery } from "@tanstack/react-query";
import { type ReactElement, useState } from "react";

import { api } from "../api/client";
import { useCurrentTenant } from "../context/TenantContext";
import { AccessGroupsPanel } from "../features/staff/components/AccessGroupsPanel";
import { PageLayout } from "../layouts/PageLayout";

interface Employee {
  id: string;
  email: string;
}

export const AccessGroupsPage = (): ReactElement => {
  const { t } = useI18n();
  const { selectedTenantId } = useCurrentTenant();
  const canCreateGroup = useCan(AuthorizationActions.ACCESS_GROUP_WRITE);
  const [createRequestKey, setCreateRequestKey] = useState(0);
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["access-group-employees", selectedTenantId ?? ""],
    queryFn: async (): Promise<Employee[]> => {
      if (!selectedTenantId) {
        return [];
      }

      const users = await api.users.list(selectedTenantId);

      return users.map((user) => ({ id: user.id, email: user.email }));
    },
    enabled: selectedTenantId !== null,
  });

  const headerActions = canCreateGroup ? (
    <FormActions>
      <Button type="button" onClick={() => setCreateRequestKey((current) => current + 1)}>
        {t("staff.accessGroups.create")}
      </Button>
    </FormActions>
  ) : undefined;

  return (
    <PageLayout title={t("staff.title")} description={t("staff.description")} headerActions={headerActions}>
      <div className="w-full p-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Loader size="sm" />
            {t("staff.list.loading")}
          </div>
        ) : (
          <AccessGroupsPanel tenantId={selectedTenantId} employees={employees} createRequestKey={createRequestKey} />
        )}
      </div>
    </PageLayout>
  );
};
