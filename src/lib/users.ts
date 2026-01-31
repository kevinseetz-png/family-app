import bcrypt from "bcryptjs";
import type { User } from "@/types/auth";
import { SALT_ROUNDS } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

const usersCol = () => adminDb.collection("users");
const familiesCol = () => adminDb.collection("families");

export async function hasUsers(): Promise<boolean> {
  const snap = await usersCol().limit(1).get();
  return !snap.empty;
}

export async function createUser(
  name: string,
  email: string,
  password: string,
  familyId?: string,
  role: "admin" | "member" = "member"
): Promise<User | null> {
  const existing = await usersCol().where("email", "==", email).limit(1).get();
  if (!existing.empty) return null;

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const id = crypto.randomUUID();

  let resolvedFamilyId = familyId;
  if (!resolvedFamilyId) {
    const famId = crypto.randomUUID();
    await familiesCol().doc(famId).set({
      name: `${name}'s Family`,
      createdAt: new Date(),
    });
    resolvedFamilyId = famId;
  }

  await usersCol().doc(id).set({
    name,
    email,
    passwordHash,
    familyId: resolvedFamilyId,
    role,
    createdAt: new Date(),
  });

  return { id, name, email, familyId: resolvedFamilyId, role };
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  const snap = await usersCol().where("email", "==", email).limit(1).get();
  if (snap.empty) return null;

  const doc = snap.docs[0];
  const data = doc.data();
  const valid = await bcrypt.compare(password, data.passwordHash);
  if (!valid) return null;

  const role = data.role === "admin" ? "admin" as const : "member" as const;
  return { id: doc.id, name: data.name, email: data.email, familyId: data.familyId, role };
}
