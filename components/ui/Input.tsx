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
            className="text-xs font-medium text-[var(--ivoryD)] tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3.5 text-[var(--ivoryDD)] text-sm pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            aria-invalid={!!error}
            className={cn(
              "w-full bg-[var(--card2)] border text-[var(--text)] rounded-xl px-4 py-3 text-sm",
              "font-[family-name:var(--fs)] outline-none transition-all duration-200",
              "placeholder:text-[var(--ivoryDD)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:border-[var(--mint)] focus:bg-[var(--bg3)] focus:shadow-[0_0_0_3px_rgba(82,183,136,.12)]",
              error
                ? "border-[rgba(184,84,80,.6)] focus:border-[var(--red)] focus:shadow-[0_0_0_3px_rgba(184,84,80,.12)]"
                : "border-[var(--border2)]",
              prefix && "pl-9",
              suffix && "pr-9",
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3.5 text-[var(--ivoryDD)] text-sm pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-[var(--red)]">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-xs text-[var(--ivoryDD)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
