import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

let cachedKey: Buffer | null = null;
let cachedLegacyKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.PICNIC_ENCRYPTION_KEY;
  if (raw) {
    const key = Buffer.from(raw, "hex");
    if (key.length !== 32) {
      throw new Error("PICNIC_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)");
    }
    cachedKey = key;
    return key;
  }

  const firebaseKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!firebaseKey) {
    throw new Error(
      "No encryption key available. Set PICNIC_ENCRYPTION_KEY or ensure FIREBASE_PRIVATE_KEY is configured."
    );
  }

  cachedKey = createHash("sha256").update(firebaseKey).digest();
  return cachedKey;
}

function getLegacyKey(): Buffer | null {
  if (cachedLegacyKey) return cachedLegacyKey;
  if (!process.env.PICNIC_ENCRYPTION_KEY) return null;

  const firebaseKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!firebaseKey) return null;

  cachedLegacyKey = createHash("sha256").update(firebaseKey).digest();
  return cachedLegacyKey;
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(data: string): string {
  const key = getKey();
  const [ivHex, tagHex, encHex] = data.split(":");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return decipher.update(Buffer.from(encHex, "hex"), undefined, "utf8") + decipher.final("utf8");
}

export function decryptWithLegacyFallback(data: string): { value: string; migrated: boolean } {
  try {
    return { value: decrypt(data), migrated: false };
  } catch {
    const legacyKey = getLegacyKey();
    if (!legacyKey) throw new Error("Decryption failed and no legacy key available");

    const [ivHex, tagHex, encHex] = data.split(":");
    const decipher = createDecipheriv("aes-256-gcm", legacyKey, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const value = decipher.update(Buffer.from(encHex, "hex"), undefined, "utf8") + decipher.final("utf8");
    return { value, migrated: true };
  }
}
