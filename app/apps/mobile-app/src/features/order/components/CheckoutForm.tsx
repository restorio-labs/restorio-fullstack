import type { InvoiceData } from "@restorio/types";
import { Button, Checkbox, Input, useI18n } from "@restorio/ui";
import type { ReactElement } from "react";
import { useForm } from "react-hook-form";

interface CheckoutFormProps {
  totalAmount: number;
  disabled: boolean;
  isSubmitting: boolean;
  onSubmit: (email: string, note: string, invoiceData?: InvoiceData) => void;
}

const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7];

const validateNip = (nip: string): boolean => {
  const digitsOnly = nip.replace(/[\s-]/g, "");

  if (!/^\d{10}$/.test(digitsOnly)) {
    return false;
  }

  const digits = digitsOnly.split("").map(Number);
  let checksum = 0;

  for (let i = 0; i < 9; i++) {
    checksum += digits[i] * NIP_WEIGHTS[i];
  }

  checksum = checksum % 11;

  if (checksum === 10) {
    checksum = 0;
  }

  return digits[9] === checksum;
};

const validatePostalCode = (code: string): boolean => {
  return /^\d{2}-?\d{3}$/.test(code.trim());
};

interface CheckoutFormValues {
  email: string;
  note: string;
  wantsInvoice: boolean;
  companyName: string;
  nip: string;
  street: string;
  city: string;
  postalCode: string;
}

export const CheckoutForm = ({ totalAmount, disabled, isSubmitting, onSubmit }: CheckoutFormProps): ReactElement => {
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    mode: "onBlur",
    defaultValues: {
      email: "",
      note: "",
      wantsInvoice: false,
      companyName: "",
      nip: "",
      street: "",
      city: "",
      postalCode: "",
    },
  });
  const wantsInvoice = watch("wantsInvoice");

  const submit = (values: CheckoutFormValues): void => {
    const invoiceData: InvoiceData | undefined = values.wantsInvoice
      ? {
          companyName: values.companyName.trim(),
          nip: values.nip.replace(/[\s-]/g, ""),
          street: values.street.trim(),
          city: values.city.trim(),
          postalCode: values.postalCode.trim().includes("-")
            ? values.postalCode.trim()
            : `${values.postalCode.trim().slice(0, 2)}-${values.postalCode.trim().slice(2)}`,
          country: "PL",
        }
      : undefined;

    onSubmit(values.email.trim(), values.note.trim(), invoiceData);
  };

  return (
    <form onSubmit={(event) => void handleSubmit(submit)(event)} className="flex flex-col gap-3" noValidate>
      <Input
        label={t("checkout.emailLabel")}
        type="email"
        placeholder={t("checkout.emailPlaceholder")}
        error={errors.email?.message}
        {...register("email", {
          required: t("checkout.emailRequired"),
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: t("checkout.emailInvalid"),
          },
        })}
        required
      />
      <Input label={t("checkout.noteLabel")} placeholder={t("checkout.notePlaceholder")} {...register("note")} />

      <Checkbox label={t("checkout.invoice.wantInvoice")} {...register("wantsInvoice")} />

      {wantsInvoice && (
        <div className="flex flex-col gap-3 rounded-lg border border-border-default bg-surface-secondary p-3">
          <Input
            label={t("checkout.invoice.companyNameLabel")}
            placeholder={t("checkout.invoice.companyNamePlaceholder")}
            error={errors.companyName?.message}
            {...register("companyName", {
              validate: (value) => !!value.trim() || t("checkout.invoice.companyNameRequired"),
            })}
            required
          />
          <Input
            label={t("checkout.invoice.nipLabel")}
            placeholder={t("checkout.invoice.nipPlaceholder")}
            error={errors.nip?.message}
            {...register("nip", {
              validate: (value) => {
                if (!value.trim()) {
                  return t("checkout.invoice.nipRequired");
                }

                return validateNip(value) || t("checkout.invoice.nipInvalid");
              },
            })}
            required
          />
          <Input
            label={t("checkout.invoice.streetLabel")}
            placeholder={t("checkout.invoice.streetPlaceholder")}
            error={errors.street?.message}
            {...register("street", {
              validate: (value) => !!value.trim() || t("checkout.invoice.streetRequired"),
            })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("checkout.invoice.postalCodeLabel")}
              placeholder={t("checkout.invoice.postalCodePlaceholder")}
              error={errors.postalCode?.message}
              {...register("postalCode", {
                validate: (value) => {
                  if (!value.trim()) {
                    return t("checkout.invoice.postalCodeRequired");
                  }

                  return validatePostalCode(value) || t("checkout.invoice.postalCodeInvalid");
                },
              })}
              required
            />
            <Input
              label={t("checkout.invoice.cityLabel")}
              placeholder={t("checkout.invoice.cityPlaceholder")}
              error={errors.city?.message}
              {...register("city", {
                validate: (value) => !!value.trim() || t("checkout.invoice.cityRequired"),
              })}
              required
            />
          </div>
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" fullWidth disabled={disabled || isSubmitting} className="mt-2">
        {isSubmitting
          ? t("checkout.payProcessing")
          : t("checkout.payButton", { amount: totalAmount.toFixed(2), currency: t("common.currency") })}
      </Button>
    </form>
  );
};
