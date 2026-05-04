import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--coffee-dark)] text-[var(--coffee-cream)] hover:brightness-110 border border-black/15",
  secondary:
    "bg-[var(--coffee-light)] text-[var(--coffee-dark)] hover:brightness-95",
  outline:
    "border border-[var(--coffee-border)] bg-transparent text-[var(--coffee-dark)] hover:bg-[var(--coffee-light)]/60",
  danger: "bg-red-600 text-white hover:bg-red-500",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coffee-accent)]/35",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
