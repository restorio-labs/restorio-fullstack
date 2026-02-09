import { forwardRef } from "react";

import { cn } from "../../utils";

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  disabled?: boolean;
}

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ required, disabled, className, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "block text-sm font-medium text-text-primary",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="ml-1 text-status-error-text" aria-label="required">
            *
          </span>
        )}
      </label>
    );
  },
);

FormLabel.displayName = "FormLabel";
