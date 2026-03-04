import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  color?: "mint" | "gold" | "ivory";
  className?: string;
}

const SIZES = {
  xs: "w-3 h-3 border",
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-[3px]",
};

const COLORS = {
  mint:  "border-[rgba(82,183,136,.2)] border-t-[var(--mint)]",
  gold:  "border-[rgba(196,163,90,.2)] border-t-[var(--gold)]",
  ivory: "border-[rgba(237,231,217,.2)] border-t-[var(--ivory)]",
};

export function Spinner({ size = "md", color = "mint", className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Carregando..."
      className={cn(
        "inline-block rounded-full animate-spin",
        SIZES[size],
        COLORS[color],
        className
      )}
    />
  );
}
