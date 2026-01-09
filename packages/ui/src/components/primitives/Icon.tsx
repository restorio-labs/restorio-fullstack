import { forwardRef, type ReactElement } from "react";

import { cn } from "@utils";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: IconSize;
  children: React.ReactNode;
}

const sizeStyles: Record<IconSize, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = "md", className, children, ...props }, ref): ReactElement => {
    return (
      <svg
        ref={ref}
        className={cn("inline-block flex-shrink-0", sizeStyles[size], className)}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {children}
      </svg>
    );
  },
);

Icon.displayName = "Icon";
