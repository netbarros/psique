import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "mint" | "gold" | "red" | "blue" | "purple" | "neutral";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

const VARIANTS = {
  mint:    "bg-[rgba(82,183,136,.12)] text-[var(--mint)] border-[rgba(82,183,136,.3)]",
  gold:    "bg-[rgba(196,163,90,.12)] text-[var(--gold)] border-[rgba(196,163,90,.3)]",
  red:     "bg-[rgba(184,84,80,.12)] text-[var(--red)] border-[rgba(184,84,80,.3)]",
  blue:    "bg-[rgba(74,143,168,.12)] text-[var(--blue)] border-[rgba(74,143,168,.3)]",
  purple:  "bg-[rgba(123,94,167,.12)] text-[var(--purple)] border-[rgba(123,94,167,.3)]",
  neutral: "bg-[var(--card2)] text-[var(--ivoryD)] border-[var(--border2)]",
};

export function Badge({ children, variant = "neutral", size = "md", dot, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-[family-name:var(--fs)] font-medium",
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
