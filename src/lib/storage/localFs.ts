import { promises as fs } from "node:fs";
import path from "node:path";
import { assertSafeKey, type Storage, type StoredObject } from "./types";

/** Dateisystem-Ablage für die Entwicklung. */
export class LocalFsStorage implements Storage {
  constructor(private baseDir: string) {}

  private resolve(key: string): string {
    assertSafeKey(key);
    const base = path.resolve(this.baseDir);
    const full = path.resolve(base, key);
    // Doppelte Absicherung gegen Path-Traversal.
    if (full !== base && !full.startsWith(base + path.sep)) {
      throw new Error("Storage-Key liegt außerhalb des Basisverzeichnisses");
    }
    return full;
  }

  async put(key: string, data: Buffer): Promise<void> {
    const full = this.resolve(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
  }

  async get(key: string): Promise<StoredObject | null> {
    try {
      const data = await fs.readFile(this.resolve(key));
      return { data, contentType: "application/pdf" };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  }
}
