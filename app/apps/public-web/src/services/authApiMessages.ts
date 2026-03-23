import type { useTranslations } from "next-intl";

type RootTranslator = ReturnType<typeof useTranslations>;
type RegisterTranslator = ReturnType<typeof useTranslations<"register">>;

export const translateLoginApiMessage = (message: string | undefined, t: RootTranslator): string | undefined => {
  if (message == null || message.trim().length === 0) {
    return undefined;
  }

  switch (message) {
    case "Invalid credentials":
      return t("login.errors.invalidCredentials");
    case "Account is not active":
      return t("login.errors.accountNotActive");
    default:
      return message;
  }
};

export const translateRegisterApiMessage = (message: string | undefined, t: RegisterTranslator): string | undefined => {
  if (message == null || message.trim().length === 0) {
    return undefined;
  }

  switch (message) {
    case "Email already registered":
      return t("errors.emailAlreadyRegistered");
    case "Restaurant slug already exists":
      return t("errors.restaurantSlugExists");
    default:
      return message;
  }
};
