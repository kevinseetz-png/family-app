import PicnicApi from "picnic-api";
import { adminDb } from "@/lib/firebase-admin";
import { decrypt } from "@/lib/encryption";

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
  const encryptedKey = typeof data?.authKey === "string" ? data.authKey : null;
  if (!encryptedKey) {
    return null;
  }

  const authKey = decrypt(encryptedKey);
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
