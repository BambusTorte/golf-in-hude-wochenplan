"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-brand-gradient flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-extrabold text-white">
        Es ist ein Fehler aufgetreten
      </h1>
      <p className="mt-2 max-w-md text-white/70">
        Bitte versuche es erneut. Falls das Problem bestehen bleibt, wende dich an
        den Administrator.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-accent-500 px-6 py-3 font-semibold text-brand-900 transition hover:bg-accent-400"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
