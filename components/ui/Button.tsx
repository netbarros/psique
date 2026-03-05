"use client";
import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "gold" | "dark" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: [
    "bg-brand text-bg-base font-semibold",
    "hover:bg-brand-hover shadow-[0_4px_24px_rgba(82,183,136,.25)]",
    "hover:shadow-[0_6px_32px_rgba(82,183,136,.4)]",
  ].join(" "),
  ghost: [
    "bg-transparent text-text-secondary border border-border-subtle",
    "hover:border-brand/50 hover:text-text-primary hover:bg-surface-hover",
  ].join(" "),
  gold: [
    "bg-amber-500 text-bg-base font-semibold",
    "hover:bg-amber-400 shadow-[0_4px_20px_rgba(245,158,11,.25)]",
  ].join(" "),
  dark: [
    "bg-surface text-text-primary border border-border-subtle",
    "hover:bg-surface-hover hover:border-brand/30",
  ].join(" "),
  danger: [
    "bg-red-500/10 text-red-400 border border-red-500/20",
    "hover:bg-red-500/20 hover:border-red-500/30",
  ].join(" "),
};

const SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "text-[13px] px-4 py-2 rounded-lg",
  md: "text-[14px] px-5 py-2.5 rounded-xl",
  lg: "text-[15px] px-6 py-3 rounded-xl",
  xl: "text-[16px] px-8 py-4 rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, fullWidth, className, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "mag-btn relative inline-flex items-center justify-center gap-2 font-sans",
          "transition-all duration-300 ease-out cursor-pointer select-none active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          "focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2",
          VARIANTS[variant],
          SIZES[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
