import type { ReactElement } from "react";

interface PasswordRulesProps {
  checks: {
    minLength: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export const PasswordRules = ({ checks }: PasswordRulesProps): ReactElement => {
  return (
    <div className="absolute left-full top-0 ml-4 w-56 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-sm">
      <div className={checks.minLength ? "text-green-600" : "text-gray-500"}>- At least 8 characters</div>
      <div className={checks.lowercase ? "text-green-600" : "text-gray-500"}>- 1 small letter</div>
      <div className={checks.uppercase ? "text-green-600" : "text-gray-500"}>- 1 upper letter</div>
      <div className={checks.number ? "text-green-600" : "text-gray-500"}>- 1 number</div>
      <div className={checks.special ? "text-green-600" : "text-gray-500"}>- 1 special character</div>
    </div>
  );
};
