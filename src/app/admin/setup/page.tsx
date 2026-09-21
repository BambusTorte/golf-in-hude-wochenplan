import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Card, CardBody } from "@/components/ui/Card";
import { SetupForm } from "@/components/admin/SetupForm";
import { isSetupCompleted } from "@/lib/auth/setup";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ersteinrichtung" };

export default async function SetupPage() {
  // Selbstsperre: nach Abschluss der Ersteinrichtung nicht mehr erreichbar.
  if (await isSetupCompleted()) redirect("/admin/login");

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo size={64} />
          <div>
            <p className="text-lg font-extrabold text-white">Golf in Hude</p>
            <p className="text-sm text-accent-400">Ersteinrichtung</p>
          </div>
        </div>
        <Card>
          <CardBody>
            <h1 className="mb-1 text-xl font-bold text-ink">
              Administrator anlegen
            </h1>
            <p className="mb-4 text-sm text-ink-muted">
              Lege das einmalige Administratorkonto an. Danach wird diese Seite
              dauerhaft gesperrt.
            </p>
            <SetupForm />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
