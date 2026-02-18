import PicnicApi from "picnic-api";
import { adminDb } from "@/lib/firebase-admin";
import { decryptWithLegacyFallback, encrypt } from "@/lib/encryption";

export function createPicnicClient(authKey?: string) {
  return new PicnicApi({
    countryCode: "NL",
    ...(authKey ? { authKey } : {}),
  });
}

/**
 * Retrieves the Picnic client for a family by looking up the stored authKey.
 * Returns null if no connection exists or authKey is invalid.
 */
export async function getPicnicClientForFamily(familyId: string) {
  const doc = await adminDb
    .collection("picnic_connections")
    .doc(familyId)
    .get();

  const data = doc.data();
  const storedKey = typeof data?.authKey === "string" ? data.authKey : null;
  if (!storedKey) {
    return null;
  }

  let authKey: string;
  try {
    const result = decryptWithLegacyFallback(storedKey);
    authKey = result.value;
    if (result.migrated) {
      await adminDb
        .collection("picnic_connections")
        .doc(familyId)
        .update({ authKey: encrypt(authKey) });
    }
  } catch {
    // Legacy plain-text key — migrate to encrypted
    authKey = storedKey;
    await adminDb
      .collection("picnic_connections")
      .doc(familyId)
      .update({ authKey: encrypt(authKey) });
  }

  return createPicnicClient(authKey);
}

/**
 * Checks if a Picnic API error indicates an expired/invalid auth key.
 * If so, clears the stale connection from Firestore.
 */
export async function handlePicnicAuthError(err: unknown, familyId: string): Promise<boolean> {
  if (
    err &&
    typeof err === "object" &&
    "statusCode" in err &&
    (err as { statusCode: number }).statusCode === 401
  ) {
    await adminDb.collection("picnic_connections").doc(familyId).delete();
    return true;
  }
  return false;
}
