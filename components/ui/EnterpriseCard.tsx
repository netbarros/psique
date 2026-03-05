"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

type EnterpriseCardProps = Omit<React.ComponentPropsWithoutRef<typeof motion.div>, "children"> & {
  delay?: number;
  interactive?: boolean;
  children?: React.ReactNode;
};

export function EnterpriseCard({ className, delay = 0, interactive, children, ...props }: EnterpriseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border-subtle bg-surface/95 backdrop-blur-xl",
        "p-7 shadow-[0_20px_45px_rgba(0,0,0,0.35)]",
        interactive && "cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/45 hover:shadow-[0_24px_60px_rgba(0,0,0,0.5)]",
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(82,183,136,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_50%)]" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export function EnterpriseStat({ label, value, trend, trendLabel, delay = 0 }: { label: string, value: string | React.ReactNode, trend?: number, trendLabel?: string, delay?: number }) {
  const isPositive = trend !== undefined && trend >= 0;
  
  return (
    <EnterpriseCard delay={delay} className="flex min-h-[150px] flex-col justify-between gap-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">{label}</div>
      <div className="font-display text-[38px] font-light leading-none tracking-tight text-text-primary">{value}</div>
      {trend !== undefined && (
        <div className={cn("mt-1 flex items-center gap-1.5 text-[13px] font-semibold", isPositive ? "text-brand" : "text-red-500")}>
          {isPositive ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
          <span className="font-normal text-text-muted">{trendLabel}</span>
        </div>
      )}
    </EnterpriseCard>
  );
}
