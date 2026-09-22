import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { buildPdfData } from "./data";
import { WochenplanDocument } from "./WochenplanDocument";

let logoCache: string | null | undefined;

/** Lädt das Logo einmalig als Data-URI (oder null, falls nicht vorhanden). */
async function loadLogo(): Promise<string | undefined> {
  if (logoCache !== undefined) return logoCache ?? undefined;
  try {
    const file = path.join(process.cwd(), "public", "logo.png");
    const buf = await fs.readFile(file);
    logoCache = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    logoCache = null;
  }
  return logoCache ?? undefined;
}

export interface RenderResult {
  pdfFileId: string;
  storageKey: string;
  byteSize: number;
  contentHash: string;
}

/**
 * Rendert die Wochenplan-PDF frisch als Buffer – ohne Speicherung. Dadurch ist
 * die PDF-Auslieferung zustandslos und läuft auf jeder Serverless-Plattform.
 */
export async function renderPlanPdfBuffer(planId: string): Promise<Buffer> {
  const plan = await prisma.weeklyPlan.findUniqueOrThrow({
    where: { id: planId },
    include: { events: true },
  });
  const data = buildPdfData(plan, plan.events);
  const logo = await loadLogo();
  const element = React.createElement(WochenplanDocument, {
    data,
    logo,
  }) as Parameters<typeof renderToBuffer>[0];
  return renderToBuffer(element);
}

/**
 * Rendert die Wochenplan-PDF reproduzierbar aus den DB-Daten, legt sie ab und
 * verweist den Plan darauf. Alte PDFs desselben Plans werden ersetzt.
 * (Optional; die Auslieferung nutzt renderPlanPdfBuffer und braucht das nicht.)
 */
export async function renderAndStorePdf(planId: string): Promise<RenderResult> {
  const plan = await prisma.weeklyPlan.findUniqueOrThrow({
    where: { id: planId },
    include: { events: true },
  });

  const data = buildPdfData(plan, plan.events);
  const logo = await loadLogo();
  const element = React.createElement(WochenplanDocument, {
    data,
    logo,
  }) as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(element);

  const contentHash = createHash("sha256").update(buffer).digest("hex").slice(0, 16);
  const storageKey = `pdf/${plan.year}/kw${String(plan.isoWeek).padStart(2, "0")}-${Date.now()}.pdf`;

  await getStorage().put(storageKey, buffer, "application/pdf");

  // Alte PDFs sammeln, ersetzen (eine aktuelle PDF pro Plan).
  const old = await prisma.pdfFile.findMany({ where: { planId } });
  // Sequenziell statt Transaktion (Neon-HTTP-Treiber ohne interaktive Tx).
  await prisma.pdfFile.deleteMany({ where: { planId } });
  const created = await prisma.pdfFile.create({
    data: { planId, storageKey, byteSize: buffer.length, contentHash },
  });

  // Alte Blobs best-effort entfernen (nach erfolgreicher DB-Aktualisierung).
  for (const o of old) {
    try {
      await getStorage().delete(o.storageKey);
    } catch {
      // ignorieren – verwaiste Datei ist unkritisch
    }
  }

  return {
    pdfFileId: created.id,
    storageKey,
    byteSize: buffer.length,
    contentHash,
  };
}
