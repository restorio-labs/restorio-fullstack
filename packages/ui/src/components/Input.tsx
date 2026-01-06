import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, id, className = "", ...props }) => {
  const inputId = id ?? `input-${Math.random()}`;

  return (
    <div className="input-wrapper">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <input id={inputId} className={`input ${error ? "input-error" : ""} ${className}`} {...props} />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};
