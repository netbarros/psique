"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <button className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-transparent text-text-muted opacity-50">
        <span className="material-symbols-outlined inline-block w-[18px] overflow-hidden whitespace-nowrap text-[18px] leading-none">
          light_mode
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-surface text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
      aria-label="Alternar tema"
    >
      <span className="material-symbols-outlined inline-block w-[18px] overflow-hidden whitespace-nowrap text-[18px] leading-none">
        {theme === "dark" ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
