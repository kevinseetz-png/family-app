import type { SupermarktProduct } from "@/types/supermarkt";
import { formatPrice } from "./format";

const GRAPHQL_URL = "https://web-gateway.dirk.nl/graphql";
const DEFAULT_STORE_ID = 50;

const SEARCH_QUERY = `
  query SearchProducts($search: String!, $limit: Int!) {
    searchProducts(search: $search, limit: $limit) {
      products {
        product {
          productId
          headerText
          packaging
        }
      }
    }
  }
`;

const PRICES_QUERY = `
  query GetPrices($productIds: [Int!]!, $storeId: Int!) {
    products(productIds: $productIds, storeId: $storeId) {
      productId
      normalPrice
      offerPrice
      productInformation {
        headerText
        packaging
      }
    }
  }
`;

interface DirkSearchProduct {
  product: { productId: number; headerText: string; packaging: string };
}

interface DirkPricedProduct {
  productId: number;
  normalPrice: number;
  offerPrice: number;
  productInformation: { headerText: string; packaging: string } | null;
}

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T | null> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export async function search(query: string): Promise<SupermarktProduct[]> {
  try {
    const searchData = await graphql<{
      searchProducts: { products: DirkSearchProduct[] };
    }>(SEARCH_QUERY, { search: query, limit: 20 });

    if (!searchData?.searchProducts?.products?.length) return [];

    const productIds = searchData.searchProducts.products.map(
      (p) => p.product.productId,
    );

    const priceData = await graphql<{
      products: (DirkPricedProduct | null)[];
    }>(PRICES_QUERY, { productIds, storeId: DEFAULT_STORE_ID });

    const pricedProducts = (priceData?.products ?? []).filter(
      (p): p is DirkPricedProduct => p !== null,
    );

    return pricedProducts.map((p) => {
      const normalCents = Math.round(p.normalPrice * 100);
      const offerCents = p.offerPrice > 0 ? Math.round(p.offerPrice * 100) : 0;
      const isOnSale = offerCents > 0 && offerCents < normalCents;
      const priceCents = isOnSale ? offerCents : normalCents;
      const name = p.productInformation?.headerText ?? `Product ${p.productId}`;
      const packaging = p.productInformation?.packaging ?? "";

      return {
        id: String(p.productId),
        name,
        price: priceCents,
        displayPrice: formatPrice(priceCents),
        unitQuantity: packaging,
        imageUrl: null,
        supermarkt: "dirk" as const,
        wasPrice: isOnSale ? normalCents : null,
        displayWasPrice: isOnSale ? formatPrice(normalCents) : null,
        isOnSale,
      };
    });
  } catch {
    return [];
  }
}
