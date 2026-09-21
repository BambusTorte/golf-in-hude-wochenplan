import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Card, CardBody } from "@/components/ui/Card";
import { LoginForm } from "@/components/admin/LoginForm";
import { getSessionAdmin } from "@/lib/auth/session";
import { isSetupCompleted } from "@/lib/auth/setup";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin-Anmeldung" };

export default async function LoginPage() {
  if (await getSessionAdmin()) redirect("/admin/dashboard");
  const setupDone = await isSetupCompleted();
  if (!setupDone) redirect("/admin/setup");

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo size={64} />
          <div>
            <p className="text-lg font-extrabold text-white">Golf in Hude</p>
            <p className="text-sm text-accent-400">Wochenplan-Administration</p>
          </div>
        </div>
        <Card>
          <CardBody>
            <h1 className="mb-4 text-xl font-bold text-ink">Anmelden</h1>
            <LoginForm />
          </CardBody>
        </Card>
        <p className="mt-6 text-center text-sm text-white/60">
          <Link href="/" className="hover:text-white">
            ← Zurück zur öffentlichen Seite
          </Link>
        </p>
      </div>
    </div>
  );
}
