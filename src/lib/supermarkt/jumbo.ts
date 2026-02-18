import type { SupermarktProduct } from "@/types/supermarkt";
import { formatPrice } from "./format";

const SEARCH_URL = "https://mobileapi.jumbo.com/v17/search";

interface JumboRawProduct {
  id: string;
  title: string;
  prices?: { price: { amount: number } };
  quantityOptions?: Array<{ unit: string; defaultAmount: number }>;
  imageInfo?: { primaryView: Array<{ url: string }> } | null;
}

export async function search(query: string): Promise<SupermarktProduct[]> {
  try {
    const res = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(query)}&offset=0&limit=20`, {
      headers: {
        "User-Agent": "Jumbo/9.6.0",
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const products = (data.products?.data ?? []) as JumboRawProduct[];

    return products.map((p) => {
      const priceAmount = p.prices?.price?.amount ?? 0;
      const priceCents = Math.round(priceAmount * 100);

      const unitQuantity = p.quantityOptions?.[0]
        ? `${p.quantityOptions[0].defaultAmount} ${p.quantityOptions[0].unit}`
        : "";

      const imageUrl = p.imageInfo?.primaryView?.[0]?.url ?? null;

      return {
        id: String(p.id),
        name: String(p.title),
        price: priceCents,
        displayPrice: formatPrice(priceCents),
        unitQuantity,
        imageUrl,
        supermarkt: "jumbo" as const,
      };
    });
  } catch {
    return [];
  }
}
