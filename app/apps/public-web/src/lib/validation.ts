export interface PasswordChecks {
  minLength: boolean;
  lowercase: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
}

const MIN_PASSWORD_LENGTH = 8;
const SPECIAL_CHARS = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export const checkPassword = (value: string): PasswordChecks => ({
  minLength: value.length >= MIN_PASSWORD_LENGTH,
  lowercase: /[a-z]/.test(value),
  uppercase: /[A-Z]/.test(value),
  number: /[0-9]/.test(value),
  special: SPECIAL_CHARS.test(value),
});

export const isPasswordValid = (checks: PasswordChecks): boolean =>
  checks.minLength && checks.lowercase && checks.uppercase && checks.number && checks.special;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmailValid = (value: string): boolean => value.trim().length > 0 && EMAIL_REGEX.test(value.trim());
