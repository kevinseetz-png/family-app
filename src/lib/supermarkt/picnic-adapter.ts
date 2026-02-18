import type { SupermarktProduct } from "@/types/supermarkt";
import { formatPrice } from "./format";
import { getPicnicClientForFamily } from "@/lib/picnic-client";

export async function search(query: string, familyId: string): Promise<SupermarktProduct[]> {
  try {
    const client = await getPicnicClientForFamily(familyId);
    if (!client) return [];

    const results = await client.search(query.trim());

    return results.slice(0, 20).map((item) => {
      const price = parseInt(item.display_price, 10);
      return {
        id: item.id,
        name: item.name,
        price,
        displayPrice: formatPrice(price),
        unitQuantity: item.unit_quantity,
        imageUrl: null,
        supermarkt: "picnic" as const,
      };
    });
  } catch {
    return [];
  }
}
