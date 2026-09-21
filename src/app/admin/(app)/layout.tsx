import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guard";
import { logoutAction } from "@/app/admin/actions";
import { Logo } from "@/components/brand/Logo";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-content flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <div>
              <p className="font-extrabold leading-tight text-white">Golf in Hude</p>
              <p className="text-xs text-accent-400">Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <AdminNav />
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-white/60 sm:inline">
                {admin.email}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Abmelden
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-content px-4 py-8 sm:px-6">{children}</main>
      <footer className="mx-auto max-w-content px-4 py-6 text-xs text-white/40 sm:px-6">
        <Link href="/" className="hover:text-white">
          Öffentliche Seite ansehen →
        </Link>
      </footer>
    </div>
  );
}
