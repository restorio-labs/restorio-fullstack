import { cloneElement, forwardRef, isValidElement, type ReactElement, type ReactNode } from "react";

import { cn } from "@utils";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: IconSize;
  children?: ReactNode;
  as?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const sizeStyles: Record<IconSize, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
  "2xl": "w-10 h-10",
  "3xl": "w-12 h-12",
  "4xl": "w-14 h-14",
};

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ size = "md", className, children, as: AsComponent, ...props }, ref): ReactElement => {
    const sizeClass = sizeStyles[size];
    const combinedClassName = cn("inline-block flex-shrink-0", sizeClass, className);

    if (AsComponent) {
      return <AsComponent ref={ref} className={combinedClassName} {...props} />;
    }

    if (isValidElement(children)) {
      if (children.type === "svg") {
        const svgElement = children as React.ReactElement<React.SVGProps<SVGSVGElement>>;
        const existingClassName = svgElement.props.className;

        return cloneElement(svgElement, {
          ref,
          className: cn(combinedClassName, existingClassName),
          ...props,
        });
      }

      if (typeof children.type === "function") {
        const existingClassName = (children.props as { className?: string }).className;

        return (
          <span className={combinedClassName} ref={ref as React.Ref<HTMLSpanElement>}>
            {cloneElement(children, {
              className: cn(existingClassName, className),
              ...props,
            } as React.Attributes)}
          </span>
        );
      }
    }

    return (
      <svg
        ref={ref}
        className={combinedClassName}
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
