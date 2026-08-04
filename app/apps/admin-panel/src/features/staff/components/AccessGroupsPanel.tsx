import { useCan } from "@restorio/auth";
import type { AccessGroup, AccessGroupInput, AuthorizationAction } from "@restorio/types";
import { AuthorizationActions } from "@restorio/types";
import { Button, Checkbox, Input, Loader, Modal, Textarea, useI18n, useToast } from "@restorio/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactElement, useEffect, useMemo, useRef, useState } from "react";

import { api } from "../../../api/client";

interface Employee {
  id: string;
  email: string;
}

interface AccessGroupsPanelProps {
  tenantId: string | null;
  employees: Employee[];
  createRequestKey?: number;
}

interface GroupFormState {
  name: string;
  description: string;
  capabilities: AuthorizationAction[];
}

const emptyForm: GroupFormState = {
  name: "",
  description: "",
  capabilities: [],
};

const accessGroupsQueryKey = (tenantId: string): readonly string[] => ["access-groups", tenantId];

const capabilityFallbackLabel = (capability: string): string => {
  const label = capability.split(".").join(" ").split("_").join(" ");

  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const AccessGroupsPanel = ({
  tenantId,
  employees,
  createRequestKey = 0,
}: AccessGroupsPanelProps): ReactElement | null => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const canRead = useCan(AuthorizationActions.ACCESS_GROUP_READ);
  const canWrite = useCan(AuthorizationActions.ACCESS_GROUP_WRITE);
  const canAssign = useCan(AuthorizationActions.ACCESS_GROUP_ASSIGN);
  const [editingGroup, setEditingGroup] = useState<AccessGroup | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<GroupFormState>(emptyForm);
  const [groupToDelete, setGroupToDelete] = useState<AccessGroup | null>(null);
  const lastCreateRequestKey = useRef(0);
  const capabilityLabel = (capability: string): string =>
    t(`staff.accessGroups.capabilityLabels.${capability.split(".").join("_")}`, capabilityFallbackLabel(capability));

  const { data: groups = [], isLoading } = useQuery({
    queryKey: accessGroupsQueryKey(tenantId ?? ""),
    queryFn: () => api.accessGroups.list(tenantId!),
    enabled: tenantId !== null && canRead,
  });

  const { data: options } = useQuery({
    queryKey: ["access-group-options", tenantId ?? ""],
    queryFn: () => api.accessGroups.options(tenantId!),
    enabled: tenantId !== null && canWrite,
  });

  useEffect(() => {
    setEditingGroup(null);
    setIsFormOpen(false);
    setForm(emptyForm);
    setGroupToDelete(null);
  }, [tenantId]);

  useEffect(() => {
    if (lastCreateRequestKey.current === createRequestKey) {
      return;
    }

    lastCreateRequestKey.current = createRequestKey;

    if (canWrite) {
      setEditingGroup(null);
      setForm(emptyForm);
      setIsFormOpen(true);
    }
  }, [canWrite, createRequestKey]);

  const refreshGroups = async (): Promise<void> => {
    if (tenantId) {
      await queryClient.invalidateQueries({ queryKey: accessGroupsQueryKey(tenantId) });
    }
  };

  const saveMutation = useMutation<AccessGroup, Error, AccessGroupInput>({
    mutationFn: (input) => {
      if (!tenantId) {
        throw new Error("No tenant selected");
      }

      return editingGroup
        ? api.accessGroups.update(tenantId, editingGroup.id, input)
        : api.accessGroups.create(tenantId, input);
    },
    onSuccess: async () => {
      await refreshGroups();
      setEditingGroup(null);
      setIsFormOpen(false);
      setForm(emptyForm);
      showToast("success", t("staff.accessGroups.toast.savedTitle"), t("staff.accessGroups.toast.savedDescription"));
    },
    onError: (error) => {
      showToast("error", t("staff.accessGroups.toast.errorTitle"), error.message);
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (groupId) => {
      if (!tenantId) {
        throw new Error("No tenant selected");
      }

      return api.accessGroups.delete(tenantId, groupId);
    },
    onSuccess: async () => {
      await refreshGroups();
      setGroupToDelete(null);
      showToast(
        "success",
        t("staff.accessGroups.toast.deletedTitle"),
        t("staff.accessGroups.toast.deletedDescription"),
      );
    },
    onError: (error) => {
      showToast("error", t("staff.accessGroups.toast.errorTitle"), error.message);
    },
  });

  const assignmentMutation = useMutation<void, Error, { groupId: string; employeeId: string; assigned: boolean }>({
    mutationFn: ({ groupId, employeeId, assigned }) => {
      if (!tenantId) {
        throw new Error("No tenant selected");
      }

      return assigned
        ? api.accessGroups.assign(tenantId, groupId, employeeId)
        : api.accessGroups.unassign(tenantId, groupId, employeeId);
    },
    onSuccess: refreshGroups,
    onError: (error) => {
      showToast("error", t("staff.accessGroups.toast.errorTitle"), error.message);
    },
  });

  const sortedCapabilities = useMemo(
    () => [...(options?.capabilities ?? [])].sort((left, right) => left.localeCompare(right)),
    [options?.capabilities],
  );

  if (!canRead) {
    return null;
  }

  const openEditForm = (group: AccessGroup): void => {
    setEditingGroup(group);
    setForm({
      name: group.name,
      description: group.description ?? "",
      capabilities: [...group.capabilities],
    });
    setIsFormOpen(true);
  };

  const closeForm = (): void => {
    setEditingGroup(null);
    setForm(emptyForm);
    setIsFormOpen(false);
  };

  const toggleCapability = (capability: AuthorizationAction): void => {
    setForm((current) => ({
      ...current,
      capabilities: current.capabilities.includes(capability)
        ? current.capabilities.filter((item) => item !== capability)
        : [...current.capabilities, capability],
    }));
  };

  const submitForm = (): void => {
    const name = form.name.trim();

    if (!name) {
      return;
    }

    saveMutation.mutate({
      name,
      description: form.description.trim() || null,
      capabilities: form.capabilities,
    });
  };

  return (
    <section className="rounded-lg border border-border-default bg-surface-primary">
      <div className="border-b border-border-default px-6 py-4">
        <div>
          <h2 className="font-semibold text-text-primary">{t("staff.accessGroups.title")}</h2>
          <p className="mt-1 text-sm text-text-secondary">{t("staff.accessGroups.description")}</p>
        </div>
      </div>

      {isFormOpen && canWrite && (
        <div className="space-y-4 border-b border-border-default bg-surface-secondary p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label={t("staff.accessGroups.form.name")}
              value={form.name}
              maxLength={100}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
            <Textarea
              label={t("staff.accessGroups.form.description")}
              value={form.description}
              maxLength={500}
              className="min-h-20"
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-text-primary">
              {t("staff.accessGroups.form.capabilities")}
            </legend>
            <p className="mt-1 text-xs text-text-secondary">{t("staff.accessGroups.form.capabilitiesHelp")}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sortedCapabilities.map((capability) => (
                <Checkbox
                  key={capability}
                  label={capabilityLabel(capability)}
                  checked={form.capabilities.includes(capability)}
                  onChange={() => toggleCapability(capability)}
                />
              ))}
            </div>
          </fieldset>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeForm}>
              {t("staff.accessGroups.form.cancel")}
            </Button>
            <Button type="button" disabled={!form.name.trim() || saveMutation.isPending} onClick={submitForm}>
              {saveMutation.isPending ? t("staff.accessGroups.form.saving") : t("staff.accessGroups.form.save")}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4 p-6">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Loader size="sm" />
            {t("staff.accessGroups.loading")}
          </div>
        )}

        {!isLoading && groups.length === 0 && (
          <p className="text-sm text-text-secondary">{t("staff.accessGroups.empty")}</p>
        )}

        {groups.map((group) => (
          <article key={group.id} className="rounded-lg border border-border-default p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-medium text-text-primary">{group.name}</h3>
                {group.description && <p className="mt-1 text-sm text-text-secondary">{group.description}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.capabilities.length === 0 ? (
                    <span className="text-xs text-text-tertiary">{t("staff.accessGroups.noCapabilities")}</span>
                  ) : (
                    group.capabilities.map((capability) => (
                      <span
                        key={capability}
                        className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs text-text-secondary"
                      >
                        {capabilityLabel(capability)}
                      </span>
                    ))
                  )}
                </div>
              </div>
              {canWrite && (
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => openEditForm(group)}>
                    {t("staff.accessGroups.edit")}
                  </Button>
                  <Button type="button" size="sm" variant="danger" onClick={() => setGroupToDelete(group)}>
                    {t("staff.accessGroups.delete")}
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-border-default pt-4">
              <h4 className="text-sm font-medium text-text-primary">{t("staff.accessGroups.members")}</h4>
              {employees.length === 0 ? (
                <p className="mt-2 text-sm text-text-secondary">{t("staff.accessGroups.noEmployees")}</p>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {employees.map((employee) => {
                    const assigned = group.member_ids.includes(employee.id);
                    const isPendingAssignment =
                      assignmentMutation.isPending &&
                      assignmentMutation.variables.groupId === group.id &&
                      assignmentMutation.variables.employeeId === employee.id;

                    return (
                      <Checkbox
                        key={employee.id}
                        label={employee.email}
                        checked={assigned}
                        disabled={!canAssign || isPendingAssignment}
                        onChange={() =>
                          assignmentMutation.mutate({
                            groupId: group.id,
                            employeeId: employee.id,
                            assigned: !assigned,
                          })
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      <Modal
        isOpen={groupToDelete !== null}
        onClose={() => setGroupToDelete(null)}
        title={t("staff.accessGroups.deleteConfirm.title")}
        size="sm"
      >
        <p className="text-sm text-text-secondary">
          {t("staff.accessGroups.deleteConfirm.description", { name: groupToDelete?.name ?? "" })}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setGroupToDelete(null)}>
            {t("staff.accessGroups.deleteConfirm.cancel")}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={deleteMutation.isPending}
            onClick={() => groupToDelete && deleteMutation.mutate(groupToDelete.id)}
          >
            {t("staff.accessGroups.deleteConfirm.confirm")}
          </Button>
        </div>
      </Modal>
    </section>
  );
};
