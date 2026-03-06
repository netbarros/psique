"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminNavItem = {
  href: string;
  label: string;
};

type AdminTopNavProps = {
  items: AdminNavItem[];
};

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminTopNav({ items }: AdminTopNavProps) {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-4 pb-4">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors ${
              active
                ? "border-brand/40 bg-brand/10 text-brand"
                : "border-border-subtle bg-surface text-text-secondary hover:border-brand/40 hover:text-brand"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
