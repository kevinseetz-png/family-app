import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";
import type { SupermarktProduct } from "@/types/supermarkt";

interface CachedPrice {
  favoriteId: string;
  cheapest: SupermarktProduct | null;
  cachedAt: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const snapshot = await adminDb
      .collection("supermarkt_price_cache")
      .where("familyId", "==", user.familyId)
      .limit(100)
      .get();

    const prices: CachedPrice[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        favoriteId: data.favoriteId,
        cheapest: data.cheapest ?? null,
        cachedAt: data.cachedAt?.toDate?.()
          ? data.cachedAt.toDate().toISOString()
          : new Date(0).toISOString(),
      };
    });

    return NextResponse.json({ prices });
  } catch (err) {
    console.error("Failed to fetch cached prices:", err);
    return NextResponse.json({ message: "Failed to fetch cached prices", prices: [] }, { status: 500 });
  }
}
