"use client";
import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const PADDING = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({ glow, hoverable, padding = "md", className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--card)]",
        "transition-all duration-300",
        hoverable && [
          "cursor-pointer",
          "hover:border-[rgba(82,183,136,.3)]",
          "hover:shadow-[0_8px_32px_rgba(0,0,0,.3)]",
          "hover:-translate-y-0.5",
        ],
        glow && "hover:shadow-[0_0_32px_rgba(82,183,136,.12)]",
        PADDING[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}
Card.Header = function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn("mb-5", className)} {...props}>
      {children}
    </div>
  );
};

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}
Card.Title = function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn("font-[family-name:var(--ff)] text-xl font-light text-[var(--ivory)]", className)}
      {...props}
    >
      {children}
    </h3>
  );
};
