import type { SupermarktId, SupermarktProduct } from "@/types/supermarkt";
import { formatPrice } from "./format";

const DATA_URL =
  "https://raw.githubusercontent.com/supermarkt/checkjebon/main/data/supermarkets.json";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface CheckjebonProduct {
  n: string; // name
  l: string; // link
  p: number; // price in euros
  s: string; // size/unit
}

interface CheckjebonSupermarket {
  n: string; // supermarket id
  d: CheckjebonProduct[]; // products
}

let cachedData: CheckjebonSupermarket[] | null = null;
let cacheTimestamp = 0;

export function _resetCache(): void {
  cachedData = null;
  cacheTimestamp = 0;
}

async function getData(): Promise<CheckjebonSupermarket[]> {
  if (cachedData && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedData;
  }

  const res = await fetch(DATA_URL);
  if (!res.ok) return cachedData ?? [];

  const data = (await res.json()) as CheckjebonSupermarket[];
  cachedData = data;
  cacheTimestamp = Date.now();
  return data;
}

export async function search(
  query: string,
  supermarktId: SupermarktId,
): Promise<SupermarktProduct[]> {
  try {
    const data = await getData();
    const store = data.find((s) => s.n === supermarktId);
    if (!store) return [];

    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = store.d.filter((product) => {
      const name = product.n.toLowerCase();
      return terms.every((term) => name.includes(term));
    });

    return matches.slice(0, 20).map((p, i) => {
      const priceCents = Math.round(p.p * 100);
      return {
        id: `${supermarktId}-cjb-${i}`,
        name: p.n,
        price: priceCents,
        displayPrice: formatPrice(priceCents),
        unitQuantity: p.s,
        imageUrl: null,
        supermarkt: supermarktId,
      };
    });
  } catch {
    return [];
  }
}
