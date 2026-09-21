import { publicConfig } from "@/env";

export function PublicFooter() {
  return (
    <footer className="no-print mt-16 border-t border-white/10">
      <div className="mx-auto flex max-w-content flex-col items-center gap-1 px-4 py-8 text-center sm:px-6">
        <p className="text-lg font-extrabold text-accent-400">
          {publicConfig.claim}
        </p>
        <a
          href={`https://${publicConfig.website}`}
          className="text-sm font-medium text-white/70 transition hover:text-white"
          target="_blank"
          rel="noopener noreferrer"
        >
          {publicConfig.website}
        </a>
        <p className="mt-2 text-xs text-white/40">
          © {new Date().getFullYear()} {publicConfig.clubName}
        </p>
      </div>
    </footer>
  );
}
