import { Button, Input, useI18n } from "@restorio/ui";
import { type FormEvent, type ReactElement, useState } from "react";

interface CheckoutFormProps {
  totalAmount: number;
  disabled: boolean;
  isSubmitting: boolean;
  onSubmit: (email: string, note: string) => void;
}

export const CheckoutForm = ({
  totalAmount,
  disabled,
  isSubmitting,
  onSubmit,
}: CheckoutFormProps): ReactElement => {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailError(t("checkout.emailRequired"));

      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError(t("checkout.emailInvalid"));

      return false;
    }
    setEmailError("");

    return true;
  };

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();

    if (!validateEmail(email)) {
      return;
    }
    onSubmit(email.trim(), note.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        label={t("checkout.emailLabel")}
        type="email"
        placeholder={t("checkout.emailPlaceholder")}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);

          if (emailError) {
            validateEmail(e.target.value);
          }
        }}
        error={emailError}
        required
      />
      <Input
        label={t("checkout.noteLabel")}
        placeholder={t("checkout.notePlaceholder")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button type="submit" variant="primary" size="lg" fullWidth disabled={disabled || isSubmitting} className="mt-2">
        {isSubmitting
          ? t("checkout.payProcessing")
          : t("checkout.payButton", { amount: totalAmount.toFixed(2), currency: t("common.currency") })}
      </Button>
    </form>
  );
};
