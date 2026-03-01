import { Button, Input, Select } from "@restorio/ui";
import { type FormEvent, type ReactElement, useEffect, useMemo, useState } from "react";

import { api } from "../api/client";
import { PageLayout } from "../layouts/PageLayout";

type AccessLevel = "kitchen" | "waiter";

interface StaffUser {
  id: string;
  email: string;
  accessLevel: AccessLevel;
}

interface StaffApiClient {
  listUsers: () => Promise<{ id: string; email: string; account_type: string }[]>;
  createUser: (payload: { email: string; access_level: AccessLevel }) => Promise<unknown>;
  deleteUser: (userId: string) => Promise<unknown>;
}

const staffApi = api.auth as unknown as StaffApiClient;

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const toAccessLevel = (value: unknown): AccessLevel | null => {
  if (value === "kitchen" || value === "waiter") {
    return value;
  }

  return null;
};

export const StaffPage = (): ReactElement => {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("kitchen");
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const accessOptions = useMemo(
    () => [
      { value: "kitchen", label: "Kitchen" },
      { value: "waiter", label: "Waiter" },
    ],
    [],
  );

  useEffect(() => {
    const loadUsers = async (): Promise<void> => {
      setIsLoadingUsers(true);

      try {
        const loadedUsers = await staffApi.listUsers();
        const parsedUsers = loadedUsers
          .map((user): StaffUser | null => {
            const accessLevel = toAccessLevel(user.account_type);

            if (accessLevel === null) {
              return null;
            }

            return {
              id: user.id,
              email: user.email,
              accessLevel,
            };
          })
          .filter((user): user is StaffUser => user !== null);

        setUsers(parsedUsers);
      } catch {
        setUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    void loadUsers();
  }, []);

  const isFormValid = isValidEmail(email);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFeedback(null);

    if (!isFormValid) {
      setFeedback({ type: "error", message: "Enter a valid email address." });

      return;
    }

    setIsSubmitting(true);

    const payload = {
      email: email.trim(),
      access_level: accessLevel,
    };

    try {
      await staffApi.createUser(payload);

      setUsers((prevUsers) => [
        {
          id: crypto.randomUUID(),
          email: email.trim(),
          accessLevel,
        },
        ...prevUsers.filter((user) => user.email.toLowerCase() !== email.trim().toLowerCase()),
      ]);
      setEmail("");
      setAccessLevel("kitchen");
      setShowForm(false);
      setFeedback({ type: "success", message: "User created. Activation email should be sent shortly." });
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim() !== "" ? error.message : "Unable to create user.";

      setFeedback({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string): Promise<void> => {
    if (deletingUserId !== null) {
      return;
    }

    setFeedback(null);
    setDeletingUserId(userId);

    try {
      await staffApi.deleteUser(userId);

      setUsers((previous) => previous.filter((user) => user.id !== userId));
      setPendingDeleteUserId(null);
      setFeedback({ type: "success", message: "User deleted successfully." });
    } catch (error: unknown) {
      const message = error instanceof Error && error.message.trim() !== "" ? error.message : "Unable to delete user.";

      setFeedback({ type: "error", message });
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <PageLayout title="Staff Management" description="Manage kitchen, waiter, and other staff accounts">
      <div className="w-full p-6 space-y-4">
        <div className="rounded-lg border border-border-default bg-surface-secondary p-4">
          <Button type="button" onClick={() => setShowForm((current) => !current)}>
            {showForm ? "Cancel" : "Add user"}
          </Button>

          {showForm && (
            <form
              className="mt-4 grid gap-3 md:grid-cols-[1fr_200px_auto]"
              onSubmit={(event) => void handleSubmit(event)}
            >
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Select
                label="Access level"
                value={accessLevel}
                onChange={(event) => {
                  const nextValue = toAccessLevel(event.target.value);

                  if (nextValue !== null) {
                    setAccessLevel(nextValue);
                  }
                }}
                options={accessOptions}
              />
              <div className="md:self-end">
                <Button type="submit" disabled={!isFormValid || isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create user"}
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
            All users
          </div>
          <div className="px-4">
            {isLoadingUsers && <p className="text-sm text-text-tertiary">Loading users...</p>}
            {!isLoadingUsers && users.length === 0 && <p className="text-sm text-text-tertiary">No users yet.</p>}
            {!isLoadingUsers && users.length > 0 && (
              <ul className="m-0 list-none divide-y divide-border-default p-0">
                {users.map((user) => (
                  <li key={user.id} className="flex items-center justify-between py-3">
                    <span className="text-sm text-text-primary">{user.email}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs uppercase tracking-wide text-text-tertiary">{user.accessLevel}</span>
                      <div className="relative">
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          disabled={deletingUserId === user.id}
                          onClick={() => {
                            setPendingDeleteUserId((current) => (current === user.id ? null : user.id));
                          }}
                        >
                          {deletingUserId === user.id ? "Deleting..." : "Delete user"}
                        </Button>
                        {pendingDeleteUserId === user.id && (
                          <div className="absolute bottom-full right-0 z-10 mb-2 w-64 rounded-md border border-border-default bg-surface-primary p-3 shadow-lg">
                            <p className="text-xs text-text-secondary">Delete this user?</p>
                            <div className="mt-3 flex justify-end gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setPendingDeleteUserId(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="danger"
                                disabled={deletingUserId === user.id}
                                onClick={() => {
                                  void handleDeleteUser(user.id);
                                }}
                              >
                                Confirm
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
