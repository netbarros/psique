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
          className="w-full h-full rounded-full object-cover border border-[var(--border2)]"
        />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center border border-[rgba(82,183,136,.55)]"
          style={{
            background: "radial-gradient(circle at 35% 35%, rgba(82,183,136,.44), rgba(82,183,136,.22))",
            fontFamily: "var(--ff)",
            color: "var(--mint)",
            fontWeight: 300,
          }}
          aria-label={name ?? "Usuário"}
        >
          {initStr}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-[var(--bg2)]",
            size === "xs" || size === "sm" ? "w-2 h-2" : "w-3 h-3",
            online ? "bg-[var(--mint)]" : "bg-[var(--ivoryDD)]"
          )}
          aria-label={online ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}
