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
  (
    {
      className,
      variant = "primary",
      type = "button",
      onMouseMove,
      onMouseLeave,
      style,
      ...props
    },
    ref
  ) => {
    const [offset, setOffset] = React.useState({ x: 0, y: 0 });

    function handleMouseMove(event: React.MouseEvent<HTMLButtonElement>) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.12;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.12;
      setOffset({ x, y });
      onMouseMove?.(event);
    }

    function handleMouseLeave(event: React.MouseEvent<HTMLButtonElement>) {
      setOffset({ x: 0, y: 0 });
      onMouseLeave?.(event);
    }

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-[transform,background-color,color,border-color,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coffee-accent)]/35",
          variantClasses[variant],
          className
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          ...style,
        }}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
