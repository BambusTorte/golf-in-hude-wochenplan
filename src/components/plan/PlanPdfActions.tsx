import { ButtonLink } from "@/components/ui/Button";

/** Öffnen/Herunterladen-Buttons für die Wochenplan-PDF. */
export function PlanPdfActions({ planId }: { planId: string }) {
  return (
    <div className="flex flex-wrap gap-2 no-print">
      <ButtonLink href={`/api/pdf/${planId}`} target="_blank" variant="primary" size="sm">
        PDF öffnen
      </ButtonLink>
      <ButtonLink
        href={`/api/pdf/${planId}?download=1`}
        variant="secondary"
        size="sm"
      >
        PDF herunterladen
      </ButtonLink>
    </div>
  );
}
