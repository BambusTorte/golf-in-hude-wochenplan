import Link from "next/link";
import { Logo } from "./Logo";
import { publicConfig } from "@/env";

export function PublicHeader() {
  return (
    <header className="no-print">
      <div className="mx-auto flex max-w-content items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-3 focus-ring rounded-full">
          <Logo size={44} />
          <span className="leading-tight">
            <span className="block text-lg font-extrabold text-white">
              {publicConfig.clubName.replace(" e. V.", "")}
            </span>
            <span className="block text-sm font-medium text-accent-400">
              Wochenplan
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-semibold text-white/90 sm:gap-2">
          <Link
            href="/"
            className="rounded-full px-3 py-2 transition hover:bg-white/10"
          >
            Wochenpläne
          </Link>
        </nav>
      </div>
    </header>
  );
}
