"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/plans", label: "Wochenpläne" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 text-sm font-semibold">
      {LINKS.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-full px-3 py-2 transition",
              active
                ? "bg-accent-500 text-brand-900"
                : "text-white/80 hover:bg-white/10",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
