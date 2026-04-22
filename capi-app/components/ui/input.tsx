import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-[#f2d49a] bg-[#fffaf0] px-3 py-2 text-sm text-[#1f2d4d] outline-none placeholder:text-[#8f8a7c] focus:border-[#f3ad3c] focus:ring-2 focus:ring-[#f3ad3c]/20",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
