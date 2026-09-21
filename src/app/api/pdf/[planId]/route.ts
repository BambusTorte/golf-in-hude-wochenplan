import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { getSessionAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Liefert die Wochenplan-PDF aus. Veröffentlichte Pläne sind öffentlich; für
 * Entwürfe ist eine Admin-Session nötig.
 *
 * Wichtig: Dieser Hot-Path importiert NICHT den schweren PDF-Renderer
 * (@react-pdf). Fehlt eine PDF, wird der Renderer bewusst dynamisch nachgeladen.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const { planId } = await params;
  const plan = await prisma.weeklyPlan.findUnique({ where: { id: planId } });
  if (!plan) return new NextResponse("Nicht gefunden", { status: 404 });

  // Entwürfe/ungeprüfte Pläne nur für angemeldete Admins sichtbar.
  if (plan.status !== "PUBLISHED") {
    const admin = await getSessionAdmin();
    if (!admin) return new NextResponse("Nicht gefunden", { status: 404 });
  }

  let pdf = await prisma.pdfFile.findFirst({
    where: { planId },
    orderBy: { createdAt: "desc" },
  });
  if (!pdf) {
    const { renderAndStorePdf } = await import("@/lib/pdf/render");
    await renderAndStorePdf(planId);
    pdf = await prisma.pdfFile.findFirst({
      where: { planId },
      orderBy: { createdAt: "desc" },
    });
  }
  if (!pdf) return new NextResponse("PDF nicht verfügbar", { status: 404 });

  const obj = await getStorage().get(pdf.storageKey);
  if (!obj) return new NextResponse("PDF nicht verfügbar", { status: 404 });

  const download = req.nextUrl.searchParams.get("download") === "1";
  const filename = `Wochenplan-KW${String(plan.isoWeek).padStart(2, "0")}-${plan.year}.pdf`;

  return new NextResponse(new Uint8Array(obj.data), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
