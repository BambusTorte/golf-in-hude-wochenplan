export interface StoredObject {
  data: Buffer;
  contentType: string;
}

/** Austauschbare Ablage für generierte Dateien (v. a. PDFs). */
export interface Storage {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
}

/**
 * Erlaubt nur sichere Storage-Keys (verhindert Path-Traversal).
 * Erlaubt: Buchstaben, Ziffern, ".", "_", "-", "/". Kein ".." oder führender "/".
 */
export function assertSafeKey(key: string): void {
  if (
    !key ||
    key.startsWith("/") ||
    key.includes("..") ||
    !/^[A-Za-z0-9._/-]+$/.test(key)
  ) {
    throw new Error(`Ungültiger Storage-Key: ${JSON.stringify(key)}`);
  }
}
