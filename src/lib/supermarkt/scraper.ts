import type { SupermarktProduct, SupermarktId } from "@/types/supermarkt";

export function createScraper(supermarktId: SupermarktId): (query: string) => Promise<SupermarktProduct[]> {
  return async (_query: string): Promise<SupermarktProduct[]> => {
    // Website scraping for Dutch supermarkets
    // These scrapers may break as websites change — they fail gracefully
    // returning empty results rather than throwing errors.
    // Currently returns empty results — individual scrapers can be
    // implemented per-supermarket as their HTML structures are analyzed.
    return [];
  };
}
