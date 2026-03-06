import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { searchAllSupermarkten } from "@/lib/supermarkt/index";
import { pricePerUnitValue } from "@/lib/supermarkt/format";
import type { SupermarktProduct } from "@/types/supermarkt";

const MAX_BATCH_OPS = 500;
const SEARCH_DELAY_MS = 500; // Delay between searches to avoid rate limiting

interface FavoriteDoc {
  id: string;
  familyId: string;
  name: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch all favorites across all families
    const favoritesSnap = await adminDb
      .collection("supermarkt_favorites")
      .limit(500)
      .get();

    const allFavorites: FavoriteDoc[] = favoritesSnap.docs.map((doc) => ({
      id: doc.id,
      familyId: doc.data().familyId,
      name: doc.data().name,
    }));

    if (allFavorites.length === 0) {
      return NextResponse.json({ cached: 0, message: "No favorites to cache" });
    }

    // 2. Deduplicate by query name (case-insensitive)
    const uniqueQueries = new Map<string, FavoriteDoc[]>();
    for (const fav of allFavorites) {
      const key = fav.name.toLowerCase().trim();
      const existing = uniqueQueries.get(key) ?? [];
      existing.push(fav);
      uniqueQueries.set(key, existing);
    }

    // 3. Search each unique query and collect results
    const queryResults = new Map<string, { products: SupermarktProduct[]; cheapest: SupermarktProduct | null }>();
    let searched = 0;

    for (const [key, favs] of uniqueQueries) {
      const query = favs[0].name; // Use original casing from first occurrence

      try {
        // Pass empty familyId - Picnic requires auth per family, skipped in cache
        const results = await searchAllSupermarkten(query, "");

        const allProducts = results
          .filter((r) => !r.error)
          .flatMap((r) => r.products)
          .filter((p) => p.price > 0)
          .sort((a, b) => {
            const ppuA = a.unitQuantity ? pricePerUnitValue(a.price, a.unitQuantity) : null;
            const ppuB = b.unitQuantity ? pricePerUnitValue(b.price, b.unitQuantity) : null;
            if (ppuA !== null && ppuB !== null) return ppuA - ppuB;
            if (ppuA !== null) return -1;
            if (ppuB !== null) return 1;
            return a.price - b.price;
          });

        queryResults.set(key, {
          products: allProducts.slice(0, 30), // Keep top 30 to limit Firestore doc size
          cheapest: allProducts[0] ?? null,
        });
        searched++;
      } catch (err) {
        console.error(`Cache search failed for "${query}":`, err);
        queryResults.set(key, { products: [], cheapest: null });
      }

      // Rate limit: small delay between searches
      if (searched < uniqueQueries.size) {
        await new Promise((resolve) => setTimeout(resolve, SEARCH_DELAY_MS));
      }
    }

    // 4. Batch write to Firestore
    const cachedAt = new Date();
    let batchCount = 0;
    let batch = adminDb.batch();
    let opsInBatch = 0;

    for (const fav of allFavorites) {
      const key = fav.name.toLowerCase().trim();
      const result = queryResults.get(key);
      if (!result) continue;

      const docRef = adminDb.collection("supermarkt_price_cache").doc(fav.id);
      batch.set(docRef, {
        favoriteId: fav.id,
        familyId: fav.familyId,
        query: fav.name,
        products: result.products,
        cheapest: result.cheapest,
        cachedAt,
      });

      opsInBatch++;
      if (opsInBatch >= MAX_BATCH_OPS) {
        await batch.commit();
        batch = adminDb.batch();
        opsInBatch = 0;
        batchCount++;
      }
    }

    if (opsInBatch > 0) {
      await batch.commit();
      batchCount++;
    }

    return NextResponse.json({
      cached: allFavorites.length,
      uniqueQueries: uniqueQueries.size,
      batches: batchCount,
    });
  } catch (err) {
    console.error("Failed to cache prices:", err);
    return NextResponse.json({ message: "Failed to cache prices" }, { status: 500 });
  }
}
