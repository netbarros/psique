"use client";
import { cn } from "@/lib/utils";
import { forwardRef, useId, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, fullWidth, id, options, placeholder, className, ...props }, ref) => {
    const autoId = useId();
    const selectId = id ?? `select-${autoId}`;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label htmlFor={selectId} className="text-[13px] font-medium text-text-secondary tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-describedby={error ? `${selectId}-error` : undefined}
            aria-invalid={!!error}
            className={cn(
              "w-full appearance-none bg-surface-hover border text-text-primary rounded-xl px-4 py-3 text-[14px] pr-10",
              "font-[family-name:var(--font-sans)] outline-none transition-all duration-300 cursor-pointer",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:border-brand focus:bg-surface focus:shadow-[0_0_0_3px_rgba(82,183,136,.15)]",
              error
                ? "border-red-500/40 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,.15)]"
                : "border-border-subtle",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>{placeholder}</option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Chevron */}
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-[12px]">
            ▼
          </span>
        </div>
        {error && (
          <p id={`${selectId}-error`} role="alert" className="text-[12px] font-medium text-red-500 mt-0.5">{error}</p>
        )}
        {!error && hint && (
          <p className="text-[12px] text-text-muted mt-0.5">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
