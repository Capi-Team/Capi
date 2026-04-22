import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[#f3ad3c] text-[#1f2d4d] hover:bg-[#f0a52c]",
  secondary: "bg-[#f8f3e7] text-[#1f2d4d] hover:bg-[#f2ead6]",
  outline: "border border-[#efc26f] bg-transparent text-[#f8f3e7] hover:bg-[#ffffff1a]",
  danger: "bg-red-600 text-white hover:bg-red-500",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#efc26f]/70",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
