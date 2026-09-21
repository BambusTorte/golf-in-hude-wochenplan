import { hash, verify } from "@node-rs/argon2";

/**
 * Passwort-Hashing mit Argon2id (empfohlene Parameter). Es werden niemals
 * Klartextpasswörter gespeichert. (Algorithm-Enum wird als numerischer Wert
 * gesetzt: Argon2id = 2, kompatibel mit isolatedModules.)
 */
const ARGON2ID = 2;
const OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

export async function verifyPassword(
  hashed: string,
  plain: string,
): Promise<boolean> {
  try {
    return await verify(hashed, plain, OPTIONS);
  } catch {
    return false;
  }
}
