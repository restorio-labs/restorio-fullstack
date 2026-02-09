import { TokenStorage } from "@restorio/auth";
import { Button, Form, FormActions, FormField, Input, Text } from "@restorio/ui";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";

export const LoginView = (): ReactElement => {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const trimmedToken = token.trim();
  const isCodeValid = useMemo(() => /^\d{3}-\d{3}$/.test(trimmedToken), [trimmedToken]);
  const formatCode = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 6);

    if (digits.length <= 3) {
      return digits;
    }

    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  };

  useEffect(() => {
    const existingToken = TokenStorage.getAccessToken();

    if (existingToken && /^\d{3}-\d{3}$/.test(existingToken)) {
      navigate("/demo-tenant", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!isCodeValid) {
      return;
    }

    TokenStorage.setAccessToken(trimmedToken);
    navigate("/demo-tenant", { replace: true });
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-background-primary px-6 py-10">
      <div className="w-full max-w-md rounded-card border border-border-default bg-surface-primary p-6 shadow-card">
        <Text as="h1" variant="h3" weight="semibold" className="mb-2">
          Kitchen Login
        </Text>
        <Text as="p" variant="body-sm" className="text-text-secondary mb-6">
          Enter your 6-digit access code to continue.
        </Text>
        <Form onSubmit={handleSubmit}>
          <FormField>
            <Input
              label="Access code"
              value={token}
              onChange={(event) => setToken(formatCode(event.target.value))}
              placeholder="123-456"
              inputMode="numeric"
              maxLength={7}
            />
          </FormField>
          <FormActions align="stretch">
            <Button type="submit" size="lg" variant="primary" fullWidth disabled={!isCodeValid}>
              Sign in
            </Button>
          </FormActions>
        </Form>
      </div>
    </div>
  );
};
