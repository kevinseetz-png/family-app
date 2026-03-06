import type { SupermarktProduct } from "@/types/supermarkt";
import { formatPrice } from "./format";

const GRAPHQL_URL = "https://www.jumbo.com/api/graphql";

const SEARCH_QUERY = `
  query SearchProducts($input: ProductSearchInput!) {
    searchProducts(input: $input) {
      products {
        id: sku
        title
        subtitle: packSizeDisplay
        prices: price {
          price
          promoPrice
          pricePerUnit { price unit }
        }
      }
    }
  }
`;

interface JumboGqlProduct {
  id: string;
  title: string;
  subtitle: string;
  prices: {
    price: number;
    promoPrice: number | null;
    pricePerUnit: { price: number; unit: string } | null;
  } | null;
}

export async function search(query: string): Promise<SupermarktProduct[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apollographql-client-name": "JUMBO_WEB",
        "apollographql-client-version": "master-v30.5.0-web",
      },
      body: JSON.stringify({
        query: SEARCH_QUERY,
        variables: {
          input: { searchTerms: query, searchType: "keyword", offSet: 0, limit: 20 },
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return [];

    const json = await res.json();
    const products = (json.data?.searchProducts?.products ?? []) as JumboGqlProduct[];

    return products.map((p) => {
      const regularPrice = p.prices?.price ?? 0;
      const promoPrice = p.prices?.promoPrice ?? null;
      const isOnSale = promoPrice !== null && promoPrice > 0 && promoPrice < regularPrice;
      const price = isOnSale ? promoPrice : regularPrice;

      return {
        id: String(p.id),
        name: String(p.title),
        price,
        displayPrice: formatPrice(price),
        unitQuantity: p.subtitle ?? "",
        imageUrl: null,
        supermarkt: "jumbo" as const,
        wasPrice: isOnSale ? regularPrice : null,
        displayWasPrice: isOnSale ? formatPrice(regularPrice) : null,
        isOnSale,
      };
    });
  } catch {
    return [];
  }
}
