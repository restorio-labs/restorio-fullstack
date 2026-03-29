import { Button, Input } from "@restorio/ui";
import { type FormEvent, type ReactElement, useState } from "react";

interface CheckoutFormProps {
  totalAmount: number;
  disabled: boolean;
  isSubmitting: boolean;
  onSubmit: (email: string, note: string) => void;
}

export const CheckoutForm = ({ totalAmount, disabled, isSubmitting, onSubmit }: CheckoutFormProps): ReactElement => {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailError("Adres e-mail jest wymagany");

      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError("Podaj poprawny adres e-mail");

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
        label="Adres e-mail"
        type="email"
        placeholder="twoj@email.pl"
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
        label="Uwagi do zamówienia (opcjonalnie)"
        placeholder="np. bez cebuli, dodatkowy sos..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button type="submit" variant="primary" size="lg" fullWidth disabled={disabled || isSubmitting} className="mt-2">
        {isSubmitting ? "Przetwarzanie..." : `Zapłać ${totalAmount.toFixed(2)} zł`}
      </Button>
    </form>
  );
};
