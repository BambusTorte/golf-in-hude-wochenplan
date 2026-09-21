export type ClassValue = string | false | null | undefined;

/** Minimaler Klassennamen-Merger (ohne externe Abhängigkeit). */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
