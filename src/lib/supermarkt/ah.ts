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
      currentPrice: number;
      unitPriceDescription?: string;
      images?: Array<{ url: string }>;
    }

    return (products as AHRawProduct[]).map((p) => ({
      id: String(p.webshopId),
      name: String(p.title),
      price: p.currentPrice,
      displayPrice: formatPrice(p.currentPrice),
      unitQuantity: String(p.unitPriceDescription ?? ""),
      imageUrl: p.images && p.images.length > 0 ? p.images[0].url : null,
      supermarkt: "ah" as const,
    }));
  } catch {
    return [];
  }
}

