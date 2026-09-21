import { assertSafeKey, type Storage, type StoredObject } from "./types";

/**
 * Netlify-Blobs-Ablage für die Produktion. Der Import erfolgt dynamisch,
 * damit die lokale Entwicklung ohne Netlify-Kontext lauffähig bleibt.
 */
export class NetlifyBlobsStorage implements Storage {
  private storeName = "wochenplan-pdfs";

  private async store() {
    const { getStore } = await import("@netlify/blobs");
    // Auf Netlify werden Site-ID/Token automatisch injiziert; für den
    // manuellen Betrieb können sie über Umgebungsvariablen gesetzt werden.
    const siteID = process.env.NETLIFY_BLOBS_SITE_ID;
    const token = process.env.NETLIFY_BLOBS_TOKEN;
    if (siteID && token) {
      return getStore({ name: this.storeName, siteID, token });
    }
    return getStore(this.storeName);
  }

  async put(key: string, data: Buffer): Promise<void> {
    assertSafeKey(key);
    const store = await this.store();
    const ab = data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength,
    ) as ArrayBuffer;
    await store.set(key, ab);
  }

  async get(key: string): Promise<StoredObject | null> {
    assertSafeKey(key);
    const store = await this.store();
    const ab = await store.get(key, { type: "arrayBuffer" });
    if (!ab) return null;
    return { data: Buffer.from(ab), contentType: "application/pdf" };
  }

  async delete(key: string): Promise<void> {
    assertSafeKey(key);
    const store = await this.store();
    await store.delete(key);
  }
}
