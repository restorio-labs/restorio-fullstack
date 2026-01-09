import { forwardRef, type ReactElement } from "react";

import { cn } from "@utils";

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-interactive-primary text-text-inverse hover:bg-interactive-primaryHover active:bg-interactive-primaryActive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
  secondary:
    "bg-interactive-secondary text-text-primary hover:bg-interactive-secondaryHover active:bg-interactive-secondaryActive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
  danger:
    "bg-interactive-danger text-text-inverse hover:bg-interactive-dangerHover active:bg-interactive-dangerActive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-button",
  md: "px-4 py-2 text-base rounded-button",
  lg: "px-6 py-3 text-lg rounded-button",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", fullWidth = false, className, disabled, children, ...props },
    ref,
  ): ReactElement => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
