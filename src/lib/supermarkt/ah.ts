import type { SupermarktProduct } from "@/types/supermarkt";
import { formatPrice } from "./format";

const TOKEN_URL = "https://api.ah.nl/mobile-auth/v1/auth/token/anonymous";
const SEARCH_URL = "https://api.ah.nl/mobile-services/product/search/v2";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export function _resetTokenCache(): void {
  cachedToken = null;
  tokenExpiresAt = 0;
}

async function getToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: "appie" }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return cachedToken;
  } catch {
    return null;
  }
}

function eurosToCents(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 100);
  }
  return 0;
}

export async function search(query: string): Promise<SupermarktProduct[]> {
  try {
    const token = await getToken();
    if (!token) return [];

    const res = await fetch(`${SEARCH_URL}?query=${encodeURIComponent(query)}&size=20`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "Appie/8.22.3",
        "X-Application": "AHWEBSHOP",
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const products = data.products ?? [];

    interface AHRawProduct {
      webshopId: string;
      title: string;
      priceBeforeBonus?: number;
      salesUnitSize?: string;
      unitPriceDescription?: string;
    }

    return (products as AHRawProduct[]).map((p) => {
      const price = eurosToCents(p.priceBeforeBonus);
      return {
        id: String(p.webshopId),
        name: String(p.title),
        price,
        displayPrice: formatPrice(price),
        unitQuantity: String(p.unitPriceDescription ?? p.salesUnitSize ?? ""),
        imageUrl: null,
        supermarkt: "ah" as const,
      };
    });
  } catch {
    return [];
  }
}
