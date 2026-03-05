import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "mint" | "gold" | "red" | "blue" | "purple" | "neutral";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

const VARIANTS = {
  mint:    "bg-[rgba(82,183,136,.12)] text-brand border-[rgba(82,183,136,.3)]",
  gold:    "bg-[rgba(196,163,90,.12)] text-gold border-[rgba(196,163,90,.3)]",
  red:     "bg-[rgba(248,113,113,.12)] text-error border-[rgba(248,113,113,.3)]",
  blue:    "bg-[rgba(56,189,248,.12)] text-info border-[rgba(56,189,248,.3)]",
  purple:  "bg-[rgba(167,139,250,.12)] text-[#a78bfa] border-[rgba(167,139,250,.3)]",
  neutral: "bg-surface-hover text-text-secondary border-border-strong",
};

export function Badge({ children, variant = "neutral", size = "md", dot, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-[family-name:var(--font-sans)] font-medium",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        VARIANTS[variant],
        className
      )}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
