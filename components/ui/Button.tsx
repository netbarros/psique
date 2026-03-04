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
    "bg-[var(--mint)] text-[#060E09] font-semibold",
    "hover:bg-[var(--mintl)] shadow-[0_4px_24px_rgba(82,183,136,.3)]",
    "hover:shadow-[0_6px_32px_rgba(82,183,136,.45)]",
  ].join(" "),
  ghost: [
    "bg-transparent text-[var(--ivoryD)] border border-[var(--border2)]",
    "hover:border-[var(--mint)] hover:text-[var(--mint)] hover:bg-[rgba(82,183,136,.06)]",
  ].join(" "),
  gold: [
    "bg-[var(--gold)] text-[#0A0A06] font-semibold",
    "hover:bg-[var(--goldl)] shadow-[0_4px_20px_rgba(196,163,90,.25)]",
  ].join(" "),
  dark: [
    "bg-[var(--card2)] text-[var(--ivoryD)] border border-[var(--border2)]",
    "hover:bg-[var(--card)] hover:border-[var(--border2)]",
  ].join(" "),
  danger: [
    "bg-[rgba(184,84,80,.15)] text-[var(--red)] border border-[rgba(184,84,80,.35)]",
    "hover:bg-[rgba(184,84,80,.25)]",
  ].join(" "),
};

const SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "text-xs px-3 py-1.5 rounded-lg",
  md: "text-sm px-4 py-2.5 rounded-xl",
  lg: "text-sm px-6 py-3 rounded-xl",
  xl: "text-base px-8 py-3.5 rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, fullWidth, className, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "mag-btn relative inline-flex items-center justify-center gap-2 font-[family-name:var(--fs)]",
          "transition-all duration-200 cursor-pointer select-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--mint)] focus-visible:outline-offset-2",
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
