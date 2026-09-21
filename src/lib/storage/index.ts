import { getEnv } from "@/env";
import { LocalFsStorage } from "./localFs";
import { NetlifyBlobsStorage } from "./netlifyBlobs";
import type { Storage } from "./types";

export type { Storage } from "./types";

let cached: Storage | null = null;

/** Liefert die konfigurierte Ablage (per STORAGE_DRIVER). */
export function getStorage(): Storage {
  if (cached) return cached;
  const env = getEnv();
  cached =
    env.STORAGE_DRIVER === "netlify-blobs"
      ? new NetlifyBlobsStorage()
      : new LocalFsStorage(env.LOCAL_STORAGE_DIR);
  return cached;
}
