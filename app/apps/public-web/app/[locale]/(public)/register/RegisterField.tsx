import type { ChangeEventHandler, FocusEventHandler, ReactElement } from "react";

interface RegisterFieldProps {
  label: string;
  name: string;
  type: "text" | "email" | "password";
  autoComplete?: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  invalid: boolean;
  inputClassName: string;
}

export const RegisterField = ({
  label,
  name,
  type,
  autoComplete,
  value,
  onChange,
  onFocus,
  onBlur,
  invalid,
  inputClassName,
}: RegisterFieldProps): ReactElement => {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input
        className={`${inputClassName} ${invalid ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-gray-300"}`}
        type={type}
        name={name}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        required
      />
    </label>
  );
};
