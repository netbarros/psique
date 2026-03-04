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
          <label htmlFor={selectId} className="text-xs font-medium text-[var(--ivoryD)] tracking-wide">
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
              "w-full appearance-none bg-[var(--card2)] border text-[var(--text)] rounded-xl px-4 py-3 text-sm pr-10",
              "font-[family-name:var(--fs)] outline-none transition-all duration-200 cursor-pointer",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:border-[var(--mint)] focus:bg-[var(--bg3)] focus:shadow-[0_0_0_3px_rgba(82,183,136,.12)]",
              error
                ? "border-[rgba(184,84,80,.6)]"
                : "border-[var(--border2)]",
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
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--ivoryDD)] text-xs">
            ▾
          </span>
        </div>
        {error && (
          <p id={`${selectId}-error`} role="alert" className="text-xs text-[var(--red)]">{error}</p>
        )}
        {!error && hint && (
          <p className="text-xs text-[var(--ivoryDD)]">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
