"use client";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

interface AvatarProps {
  name?: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  online?: boolean;
}

const SIZES = {
  xs: "w-6 h-6 text-[9px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-xl",
};

export function Avatar({ name, src, size = "md", className, online }: AvatarProps) {
  const initStr = name ? initials(name) : "?";

  return (
    <div className={cn("relative inline-flex flex-shrink-0", SIZES[size], className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name ?? "Avatar"}
          className="h-full w-full rounded-full border border-border-strong object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full border border-[rgba(82,183,136,.55)] bg-[radial-gradient(circle_at_35%_35%,rgba(82,183,136,.44),rgba(82,183,136,.22))] font-display font-light text-brand"
          aria-label={name ?? "Usuário"}
        >
          {initStr}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-[var(--color-bg-elevated)]",
            size === "xs" || size === "sm" ? "w-2 h-2" : "w-3 h-3",
            online ? "bg-brand" : "bg-[var(--color-text-muted)]"
          )}
          aria-label={online ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}
