import { Button, Input, Select, useI18n } from "@restorio/ui";
import type { CreateStaffUserRequest } from "@restorio/types";
import { isEmailValid } from "@restorio/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, type ReactElement, useMemo, useState } from "react";

import { api } from "../api/client";
import { useCurrentTenant } from "../context/TenantContext";
import { PageLayout } from "../layouts/PageLayout";

type AccessLevel = "kitchen" | "waiter";

interface StaffUser {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  accessLevel: AccessLevel;
  isActive: boolean;
}

const toAccessLevel = (value: unknown): AccessLevel | null => {
  if (value === "kitchen" || value === "waiter") {
    return value;
  }

  return null;
};

const staffQueryKey = ["staff-users"] as const;

const parseUsers = (
  rawUsers: {
    id: string;
    email: string;
    name: string | null;
    surname: string | null;
    is_active: boolean;
    account_type: unknown;
  }[],
): StaffUser[] =>
  rawUsers
    .map((user): StaffUser | null => {
      const level = toAccessLevel(user.account_type);

      if (level === null) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        accessLevel: level,
        isActive: user.is_active,
      };
    })
    .filter((user): user is StaffUser => user !== null);

export const StaffPage = (): ReactElement => {
  const { t } = useI18n();
  const { selectedTenantId } = useCurrentTenant();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("kitchen");
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: [...staffQueryKey, selectedTenantId ?? ""],
    queryFn: async () => {
      if (!selectedTenantId) {
        return [];
      }

      const raw = await api.users.list(selectedTenantId);

      return parseUsers(raw);
    },
    enabled: selectedTenantId !== null,
  });

  const accessOptions = useMemo(
    () => [
      { value: "kitchen", label: t("staff.accessLevels.kitchen") },
      { value: "waiter", label: t("staff.accessLevels.waiter") },
    ],
    [t],
  );

  const createMutation = useMutation({
    mutationFn: (payload: CreateStaffUserRequest) => api.users.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffQueryKey });
      setEmail("");
      setName("");
      setSurname("");
      setAccessLevel("kitchen");
      setShowForm(false);
      setFeedback({ type: "success", message: t("staff.feedback.createSuccess") });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message.trim() !== "" ? error.message : t("staff.feedback.createError");

      setFeedback({ type: "error", message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api.users.delete(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffQueryKey });
      setPendingDeleteUserId(null);
      setFeedback({ type: "success", message: t("staff.feedback.deleteSuccess") });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message.trim() !== "" ? error.message : t("staff.feedback.deleteError");

      setFeedback({ type: "error", message });
    },
  });

  const isWaiter = accessLevel === "waiter";
  const normalizedName = name.trim();
  const normalizedSurname = surname.trim();
  const isFormValid = isWaiter
    ? isEmailValid(email) && normalizedName.length > 0 && normalizedSurname.length > 0
    : isEmailValid(email);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setFeedback(null);

    if (!isFormValid) {
      setFeedback({ type: "error", message: t("staff.validation.invalidEmail") });

      return;
    }

    if (isWaiter && (normalizedName.length === 0 || normalizedSurname.length === 0)) {
      setFeedback({ type: "error", message: t("staff.validation.waiterNameRequired") });
      return;
    }

    createMutation.mutate({
      email: email.trim(),
      access_level: accessLevel,
      ...(isWaiter ? { name: normalizedName, surname: normalizedSurname } : {}),
    });
  };

  const handleDeleteUser = (userId: string): void => {
    if (deleteMutation.isPending) {
      return;
    }

    setFeedback(null);
    deleteMutation.mutate(userId);
  };

  return (
    <PageLayout title={t("staff.title")} description={t("staff.description")}>
      <div className="w-full p-6 space-y-4">
        <div className="rounded-lg border border-border-default bg-surface-secondary p-4">
          <Button type="button" onClick={() => setShowForm((current) => !current)}>
            {showForm ? t("staff.toggleForm.hide") : t("staff.toggleForm.show")}
          </Button>

          {showForm && (
            <form
              className={`mt-4 grid gap-3 ${
                isWaiter ? "md:grid-cols-[1fr_1fr_1fr_200px_auto]" : "md:grid-cols-[1fr_200px_auto]"
              }`}
              onSubmit={(event) => void handleSubmit(event)}
            >
              <Input
                label={t("staff.form.emailLabel")}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              {isWaiter && (
                <>
                  <Input
                    label={t("staff.form.nameLabel")}
                    value={name}
                    maxLength={50}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                  <Input
                    label={t("staff.form.surnameLabel")}
                    value={surname}
                    maxLength={50}
                    onChange={(event) => setSurname(event.target.value)}
                    required
                  />
                </>
              )}
              <Select
                label={t("staff.form.accessLabel")}
                value={accessLevel}
                onChange={(event) => {
                  const nextValue = toAccessLevel(event.target.value);

                  if (nextValue !== null) {
                    setAccessLevel(nextValue);
                    if (nextValue === "kitchen") {
                      setName("");
                      setSurname("");
                    }
                  }
                }}
                options={accessOptions}
              />
              <div className="md:self-end">
                <Button type="submit" disabled={!isFormValid || createMutation.isPending}>
                  {createMutation.isPending ? t("staff.form.submitting") : t("staff.form.submit")}
                </Button>
              </div>
            </form>
          )}

          {feedback && (
            <div
              className={`mt-4 rounded-md border px-3 py-2 text-sm ${
                feedback.type === "success"
                  ? "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300"
                  : "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300"
              }`}
            >
              {feedback.message}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border-default">
          <div className="border-b border-border-default px-4 py-3 text-sm font-medium text-text-secondary">
            {t("staff.list.title")}
          </div>
          <div className="px-4">
            {isLoadingUsers && <p className="text-sm text-text-tertiary">{t("staff.list.loading")}</p>}
            {!isLoadingUsers && users.length === 0 && (
              <p className="text-sm text-text-tertiary">{t("staff.list.empty")}</p>
            )}
            {!isLoadingUsers && users.length > 0 && (
              <ul className="m-0 list-none divide-y divide-border-default p-0">
                {users.map((user) => (
                  <li key={user.id} className="flex items-center justify-between py-3">
                    <div className="flex flex-col">
                      <span className="text-sm text-text-primary">{user.email}</span>
                      <span className="text-xs text-text-secondary">
                        {t("staff.list.personLabel", {
                          name: user.name ?? t("staff.list.notProvided"),
                          surname: user.surname ?? t("staff.list.notProvided"),
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-medium ${
                          user.isActive ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {user.isActive ? t("staff.status.active") : t("staff.status.inactive")}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-text-tertiary">
                        {t(`staff.accessLevels.${user.accessLevel}`)}
                      </span>
                      <div className="relative">
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          disabled={deleteMutation.isPending && deleteMutation.variables === user.id}
                          onClick={() => {
                            setPendingDeleteUserId((current) => (current === user.id ? null : user.id));
                          }}
                        >
                          {deleteMutation.isPending && deleteMutation.variables === user.id
                            ? t("staff.delete.deleting")
                            : t("staff.delete.button")}
                        </Button>
                        {pendingDeleteUserId === user.id && (
                          <div className="absolute bottom-full right-0 z-10 mb-2 w-64 rounded-md border border-border-default bg-surface-primary p-3 shadow-lg">
                            <p className="text-xs text-text-secondary">{t("staff.delete.confirmTitle")}</p>
                            <div className="mt-3 flex justify-end gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setPendingDeleteUserId(null);
                                }}
                              >
                                {t("staff.delete.cancel")}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="danger"
                                disabled={deleteMutation.isPending && deleteMutation.variables === user.id}
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                {t("staff.delete.confirm")}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
