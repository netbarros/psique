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
        "rounded-2xl border border-border-subtle bg-surface",
        "transition-all duration-300",
        hoverable && [
          "cursor-pointer",
          "hover:border-border-strong",
          "hover:shadow-[0_8px_32px_rgba(0,0,0,.3)]",
          "hover:-translate-y-0.5",
        ],
        glow && "hover:shadow-[0_0_32px_rgba(82,183,136,.18)]",
        PADDING[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type CardHeaderProps = HTMLAttributes<HTMLDivElement>;
Card.Header = function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn("mb-5", className)} {...props}>
      {children}
    </div>
  );
};

type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;
Card.Title = function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn("font-display text-xl font-light text-text-primary", className)}
      {...props}
    >
      {children}
    </h3>
  );
};
