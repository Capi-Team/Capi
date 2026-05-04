import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[var(--coffee-border)] bg-[var(--coffee-cream)] px-3 py-2 text-sm text-[var(--coffee-ink)] outline-none placeholder:text-[var(--coffee-muted)] focus:border-[var(--coffee-accent)] focus:ring-2 focus:ring-[var(--coffee-accent)]/25",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
