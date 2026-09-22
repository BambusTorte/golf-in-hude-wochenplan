"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { requireAdminApi } from "@/lib/auth/guard";
import { checkLoginRateLimit, recordLoginAttempt } from "@/lib/auth/rateLimit";
import { completeSetup, SetupError } from "@/lib/auth/setup";
import { generateWeeklyPlan } from "@/lib/plan/generate";
import {
  addEvent,
  updateEvent,
  deleteEvent,
  publishPlan,
  unpublishPlan,
  setStatus,
  deletePlan,
  createSeries,
  updateSeries,
  deleteSeries,
  setSeriesActive,
  applySeriesToPlan,
} from "@/lib/plan/service";
import { berlinDayInstant } from "@/lib/week/isoWeek";

export interface ActionState {
  error?: string;
  ok?: boolean;
}

async function requestMeta() {
  const h = await headers();
  return {
    ip:
      h.get("x-nf-client-connection-ip") ??
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      undefined,
    userAgent: h.get("user-agent") ?? undefined,
  };
}

// --- Auth --------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().email("Bitte eine gültige E-Mail-Adresse eingeben."),
  password: z.string().min(1, "Bitte das Passwort eingeben."),
});

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const email = parsed.data.email.trim().toLowerCase();
  const meta = await requestMeta();
  const rlKey = `login:${email}`;

  const rl = await checkLoginRateLimit(rlKey);
  if (!rl.allowed) {
    return {
      error: `Zu viele Fehlversuche. Bitte in ${Math.ceil(rl.retryAfterSec / 60)} Minuten erneut versuchen.`,
    };
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  const valid = admin
    ? await verifyPassword(admin.passwordHash, parsed.data.password)
    : false;

  if (!admin || !valid) {
    await recordLoginAttempt(rlKey, false);
    // Bewusst generische Fehlermeldung (keine Konto-Enumeration).
    return { error: "E-Mail-Adresse oder Passwort ist falsch." };
  }

  await recordLoginAttempt(rlKey, true);
  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });
  await createSession(admin.id, meta);
  redirect("/admin/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

const setupSchema = z
  .object({
    email: z.string().email("Bitte eine gültige E-Mail-Adresse eingeben."),
    password: z.string().min(8, "Das Passwort muss mindestens 8 Zeichen haben."),
    passwordConfirm: z.string(),
    setupKey: z.string().min(1, "Bitte den Einrichtungsschlüssel eingeben."),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["passwordConfirm"],
  });

export async function setupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = setupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    setupKey: formData.get("setupKey"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  try {
    const admin = await completeSetup({
      email: parsed.data.email,
      password: parsed.data.password,
      setupKey: parsed.data.setupKey,
    });
    await createSession(admin.id, await requestMeta());
  } catch (err) {
    if (err instanceof SetupError) return { error: err.message };
    return { error: "Die Einrichtung ist fehlgeschlagen." };
  }
  redirect("/admin/dashboard");
}

// --- Guard-Helfer ------------------------------------------------------------

async function ensureAdmin() {
  const admin = await requireAdminApi();
  if (!admin) redirect("/admin/login");
  return admin;
}

// --- Wochenplan-Generierung --------------------------------------------------

const generateSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  week: z.coerce.number().int().min(1).max(53),
});

export async function generateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await ensureAdmin();
  const parsed = generateSchema.safeParse({
    year: formData.get("year"),
    week: formData.get("week"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let planId: string;
  try {
    const res = await generateWeeklyPlan({
      year: parsed.data.year,
      week: parsed.data.week,
    });
    planId = res.planId;
  } catch (err) {
    return {
      error: `Generierung fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
  revalidatePath("/admin/plans");
  revalidatePath("/admin/dashboard");
  redirect(`/admin/plans/${planId}`);
}

// --- Status / Veröffentlichung ----------------------------------------------

export async function publishAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const planId = String(formData.get("planId"));
  await publishPlan(planId, admin.id);
  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath(`/admin/plans/${planId}`);
  redirect(`/admin/plans/${planId}`);
}

export async function unpublishAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const planId = String(formData.get("planId"));
  await unpublishPlan(planId, admin.id);
  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath(`/admin/plans/${planId}`);
  redirect(`/admin/plans/${planId}`);
}

export async function setStatusAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const planId = String(formData.get("planId"));
  const to = String(formData.get("status")) as
    | "DRAFT"
    | "REVIEW"
    | "PUBLISHED"
    | "ARCHIVED";
  await setStatus(planId, to, admin.id);
  revalidatePath(`/admin/plans/${planId}`);
  revalidatePath("/admin/plans");
  redirect(`/admin/plans/${planId}`);
}

export async function deletePlanAction(formData: FormData): Promise<void> {
  await ensureAdmin();
  const planId = String(formData.get("planId"));
  await deletePlan(planId);
  revalidatePath("/admin/plans");
  redirect("/admin/plans");
}

export async function regenerateAction(formData: FormData): Promise<void> {
  await ensureAdmin();
  const planId = String(formData.get("planId"));
  const plan = await prisma.weeklyPlan.findUniqueOrThrow({ where: { id: planId } });
  await generateWeeklyPlan({ year: plan.year, week: plan.isoWeek });
  revalidatePath(`/admin/plans/${planId}`);
  redirect(`/admin/plans/${planId}`);
}

export async function renderPdfAction(formData: FormData): Promise<void> {
  await ensureAdmin();
  const planId = String(formData.get("planId"));
  const { renderAndStorePdf } = await import("@/lib/pdf/render");
  await renderAndStorePdf(planId);
  revalidatePath(`/admin/plans/${planId}`);
  redirect(`/admin/plans/${planId}`);
}

// --- Event-CRUD --------------------------------------------------------------

const eventSchema = z.object({
  planId: z.string().min(1),
  eventId: z.string().optional(),
  title: z.string().min(1, "Bitte einen Titel angeben."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum."),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Ungültige Uhrzeit.")
    .optional()
    .or(z.literal("")),
  course: z.string().optional(),
  holes: z.coerce.number().int().min(0).max(72).optional().or(z.literal("")),
  tee: z.string().optional(),
  participantsEstimate: z.string().optional(),
  playType: z.enum(["CLUB_VW", "CLUB_NVW", "VERBAND", "SPONSOR"]).optional().or(z.literal("")),
  format: z.string().optional(),
});

function toEventInput(data: z.infer<typeof eventSchema>) {
  const [y, m, d] = data.date.split("-").map(Number);
  return {
    date: berlinDayInstant(y, m, d),
    title: data.title.trim(),
    startTime: data.startTime || null,
    course: data.course?.trim() || null,
    holes: data.holes === "" || data.holes === undefined ? null : Number(data.holes),
    tee: data.tee?.trim() || null,
    participantsEstimate: data.participantsEstimate?.trim() || null,
    playType: data.playType ? data.playType : null,
    format: data.format?.trim() || null,
  };
}

export async function saveEventAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await ensureAdmin();
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const input = toEventInput(parsed.data);
  try {
    if (parsed.data.eventId) {
      await updateEvent(parsed.data.eventId, input, admin.id);
    } else {
      await addEvent(parsed.data.planId, input, admin.id);
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Speichern fehlgeschlagen." };
  }
  revalidatePath(`/admin/plans/${parsed.data.planId}`);
  redirect(`/admin/plans/${parsed.data.planId}`);
}

export async function deleteEventAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const eventId = String(formData.get("eventId"));
  const planId = String(formData.get("planId"));
  await deleteEvent(eventId, admin.id);
  revalidatePath(`/admin/plans/${planId}`);
  redirect(`/admin/plans/${planId}`);
}

// --- Turnierserien -----------------------------------------------------------

const seriesSchema = z.object({
  seriesId: z.string().optional(),
  title: z.string().min(1, "Bitte einen Titel angeben."),
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Ungültige Uhrzeit.")
    .optional()
    .or(z.literal("")),
  course: z.string().optional(),
  holes: z.coerce.number().int().min(0).max(72).optional().or(z.literal("")),
  tee: z.string().optional(),
  participantsEstimate: z.string().optional(),
  playType: z
    .enum(["CLUB_VW", "CLUB_NVW", "VERBAND", "SPONSOR"])
    .optional()
    .or(z.literal("")),
  active: z.union([z.literal("on"), z.literal("")]).optional(),
});

export async function saveSeriesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await ensureAdmin();
  const parsed = seriesSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const input = {
    title: d.title.trim(),
    weekday: d.weekday,
    startTime: d.startTime || null,
    course: d.course?.trim() || null,
    holes: d.holes === "" || d.holes === undefined ? null : Number(d.holes),
    tee: d.tee?.trim() || null,
    participantsEstimate: d.participantsEstimate?.trim() || null,
    playType: d.playType && d.playType !== "" ? d.playType : null,
    active: d.active === "on",
  };
  try {
    if (d.seriesId) await updateSeries(d.seriesId, input);
    else await createSeries(input);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Speichern fehlgeschlagen." };
  }
  revalidatePath("/admin/series");
  redirect("/admin/series");
}

export async function deleteSeriesAction(formData: FormData): Promise<void> {
  await ensureAdmin();
  await deleteSeries(String(formData.get("seriesId")));
  revalidatePath("/admin/series");
  redirect("/admin/series");
}

export async function toggleSeriesAction(formData: FormData): Promise<void> {
  await ensureAdmin();
  await setSeriesActive(
    String(formData.get("seriesId")),
    String(formData.get("active")) === "1",
  );
  revalidatePath("/admin/series");
  redirect("/admin/series");
}

export async function applySeriesAction(formData: FormData): Promise<void> {
  await ensureAdmin();
  const planId = String(formData.get("planId"));
  await applySeriesToPlan(planId);
  revalidatePath(`/admin/plans/${planId}`);
  redirect(`/admin/plans/${planId}`);
}
