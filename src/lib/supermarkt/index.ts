import type { SupermarktId, SupermarktResult } from "@/types/supermarkt";
import { SUPERMARKT_LABELS } from "@/types/supermarkt";
import { search as ahSearch } from "./ah";
import { search as jumboSearch } from "./jumbo";
import { search as picnicSearch } from "./picnic-adapter";
import { createScraper } from "./scraper";

const SCRAPED_SUPERMARKTEN: SupermarktId[] = [
  "dirk", "dekamarkt", "lidl", "aldi", "plus", "hoogvliet", "spar", "vomar", "poiesz",
];

interface ConnectorEntry {
  supermarkt: SupermarktId;
  search: (query: string) => Promise<import("@/types/supermarkt").SupermarktProduct[]>;
}

function buildConnectors(familyId: string): ConnectorEntry[] {
  const connectors: ConnectorEntry[] = [
    { supermarkt: "ah", search: ahSearch },
    { supermarkt: "jumbo", search: jumboSearch },
    { supermarkt: "picnic", search: (q) => picnicSearch(q, familyId) },
  ];

  for (const id of SCRAPED_SUPERMARKTEN) {
    connectors.push({ supermarkt: id, search: createScraper(id) });
  }

  return connectors;
}

export async function searchAllSupermarkten(
  query: string,
  familyId: string,
): Promise<SupermarktResult[]> {
  const connectors = buildConnectors(familyId);

  const settled = await Promise.allSettled(
    connectors.map(async (c) => {
      const products = await c.search(query);
      return { supermarkt: c.supermarkt, products };
    }),
  );

  return settled.map((result, i) => {
    const supermarkt = connectors[i].supermarkt;
    if (result.status === "fulfilled") {
      return {
        supermarkt,
        label: SUPERMARKT_LABELS[supermarkt],
        products: result.value.products,
        error: null,
      };
    }
    return {
      supermarkt,
      label: SUPERMARKT_LABELS[supermarkt],
      products: [],
      error: result.reason?.message ?? "Onbekende fout",
    };
  });
}
