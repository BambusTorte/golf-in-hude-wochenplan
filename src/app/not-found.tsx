import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <div className="bg-brand-gradient flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo size={72} />
      <h1 className="mt-6 text-3xl font-extrabold text-white">Seite nicht gefunden</h1>
      <p className="mt-2 max-w-md text-white/70">
        Diese Seite existiert nicht oder der gesuchte Wochenplan ist nicht (mehr)
        veröffentlicht.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-accent-500 px-6 py-3 font-semibold text-brand-900 transition hover:bg-accent-400"
      >
        Zur Startseite
      </Link>
    </div>
  );
}
