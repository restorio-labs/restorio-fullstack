import { Button, Input, Select } from "@restorio/ui";
import { type FormEvent, type ReactElement, useEffect, useMemo, useState } from "react";

import { PageLayout } from "../layouts/PageLayout";

type AccessLevel = "kitchen" | "waiter";

interface StaffUser {
  id: string;
  email: string;
  accessLevel: AccessLevel;
}

const ENV = import.meta.env as unknown as Record<string, unknown>;
const apiBaseUrlEnv = typeof ENV.VITE_API_BASE_URL === "string" ? ENV.VITE_API_BASE_URL : undefined;
const API_BASE_URL = apiBaseUrlEnv ?? "http://localhost:8000/api/v1";

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const toAccessLevel = (value: unknown): AccessLevel | null => {
  if (value === "kitchen" || value === "waiter") {
    return value;
  }

  return null;
};

const parseUsersResponse = (payload: unknown): StaffUser[] => {
  const rawUsers =
    payload && typeof payload === "object" && "data" in payload ? (payload as { data?: unknown }).data : payload;

  if (!Array.isArray(rawUsers)) {
    return [];
  }

  return rawUsers
    .map((raw): StaffUser | null => {
      if (!raw || typeof raw !== "object") {
        return null;
      }

      const candidate = raw as { id?: unknown; email?: unknown; accessLevel?: unknown; account_type?: unknown };
      const email = typeof candidate.email === "string" ? candidate.email : "";
      const accessLevel = toAccessLevel(candidate.accessLevel ?? candidate.account_type);

      if (email.trim() === "" || accessLevel === null) {
        return null;
      }

      return {
        id: typeof candidate.id === "string" ? candidate.id : crypto.randomUUID(),
        email,
        accessLevel,
      };
    })
    .filter((user): user is StaffUser => user !== null);
};

export const StaffPage = (): ReactElement => {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("kitchen");
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        const usersResponse = await fetch(`${API_BASE_URL}/users`, {
          method: "GET",
          credentials: "include",
        });

        if (usersResponse.ok) {
          const payload: unknown = await usersResponse.json();

          setUsers(parseUsersResponse(payload));

          return;
        }

        const authUsersResponse = await fetch(`${API_BASE_URL}/auth/users`, {
          method: "GET",
          credentials: "include",
        });

        if (!authUsersResponse.ok) {
          return;
        }

        const payload: unknown = await authUsersResponse.json();

        setUsers(parseUsersResponse(payload));
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
      let response = await fetch(`${API_BASE_URL}/createuser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.status === 404) {
        response = await fetch(`${API_BASE_URL}/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }

      if (response.status === 404) {
        response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const responseBody: unknown = await response.json().catch(() => null);
        const errorMessage =
          responseBody && typeof responseBody === "object" && "message" in responseBody
            ? String((responseBody as { message?: unknown }).message)
            : "Unable to create user.";

        throw new Error(errorMessage);
      }

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

  return (
    <PageLayout title="Staff Management" description="Manage kitchen, waiter, and other staff accounts">
      <div className="mx-auto max-w-3xl p-6 space-y-4">
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
          <div className="px-4 py-3">
            {isLoadingUsers && <p className="text-sm text-text-tertiary">Loading users...</p>}
            {!isLoadingUsers && users.length === 0 && <p className="text-sm text-text-tertiary">No users yet.</p>}
            {!isLoadingUsers && users.length > 0 && (
              <ul className="divide-y divide-border-default">
                {users.map((user) => (
                  <li key={user.id} className="flex items-center justify-between py-3">
                    <span className="text-sm text-text-primary">{user.email}</span>
                    <span className="text-xs uppercase tracking-wide text-text-tertiary">{user.accessLevel}</span>
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
