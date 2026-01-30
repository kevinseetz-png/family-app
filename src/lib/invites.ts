import { adminDb } from "@/lib/firebase-admin";

export interface Invite {
  code: string;
  createdBy: string;
  familyId: string;
  used: boolean;
  createdAt: Date;
}

const invitesCol = () => adminDb.collection("invites");

export async function createInvite(createdBy: string, familyId: string): Promise<Invite> {
  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  const invite: Invite = { code, createdBy, familyId, used: false, createdAt: new Date() };
  await invitesCol().doc(code).set(invite);
  return invite;
}

export async function validateInvite(code: string): Promise<boolean> {
  const doc = await invitesCol().doc(code).get();
  if (!doc.exists) return false;
  return !doc.data()!.used;
}

export async function redeemInvite(code: string): Promise<string | null> {
  const doc = await invitesCol().doc(code).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  if (data.used) return null;
  await invitesCol().doc(code).update({ used: true });
  return data.familyId;
}
