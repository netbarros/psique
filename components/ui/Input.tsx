"use client";
import { cn } from "@/lib/utils";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, fullWidth, id, className, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? `input-${autoId}`;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-text-secondary tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3.5 text-text-muted text-[14px] pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            aria-invalid={!!error}
            className={cn(
              "w-full bg-surface-hover border text-text-primary rounded-xl px-4 py-3 text-[14px]",
              "font-sans outline-none transition-all duration-300",
              "placeholder:text-text-muted placeholder:font-light",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:border-brand focus:bg-surface focus:shadow-[0_0_0_3px_rgba(82,183,136,.15)]",
              error
                ? "border-red-500/40 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,.15)]"
                : "border-border-subtle",
              prefix && "pl-10",
              suffix && "pr-10",
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3.5 text-text-muted text-[14px] pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-[12px] font-medium text-red-500 mt-0.5">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-[12px] text-text-muted mt-0.5">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
