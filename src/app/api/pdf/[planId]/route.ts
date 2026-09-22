import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Liefert die Wochenplan-PDF aus – zustandslos frisch gerendert (funktioniert
 * auf jeder Serverless-Plattform, kein persistenter Speicher nötig).
 * Veröffentlichte Pläne sind öffentlich; Entwürfe nur mit Admin-Session.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const { planId } = await params;
  const plan = await prisma.weeklyPlan.findUnique({ where: { id: planId } });
  if (!plan) return new NextResponse("Nicht gefunden", { status: 404 });

  if (plan.status !== "PUBLISHED") {
    const admin = await getSessionAdmin();
    if (!admin) return new NextResponse("Nicht gefunden", { status: 404 });
  }

  let buffer: Buffer;
  try {
    const { renderPlanPdfBuffer } = await import("@/lib/pdf/render");
    buffer = await renderPlanPdfBuffer(planId);
  } catch (e) {
    console.error("PDF-Render fehlgeschlagen:", e);
    return new NextResponse("PDF konnte nicht erzeugt werden.", { status: 500 });
  }

  const download = req.nextUrl.searchParams.get("download") === "1";
  const filename = `Wochenplan-KW${String(plan.isoWeek).padStart(2, "0")}-${plan.year}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
