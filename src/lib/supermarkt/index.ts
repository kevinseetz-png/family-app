import type { SupermarktId, SupermarktResult, SupermarktProduct } from "@/types/supermarkt";
import { SUPERMARKT_LABELS, ACTIVE_SUPERMARKTEN } from "@/types/supermarkt";
import { search as ahSearch } from "./ah";
import { search as jumboSearchLive } from "./jumbo";
import { search as picnicSearch } from "./picnic-adapter";
import { search as dirkSearch } from "./dirk";
import { search as checkjebonSearch } from "./checkjebon";

const CONNECTOR_TIMEOUT_MS = 8000;

interface ConnectorEntry {
  supermarkt: SupermarktId;
  search: (query: string) => Promise<SupermarktProduct[]>;
}

function buildConnectors(familyId: string): ConnectorEntry[] {
  async function jumboWithFallback(q: string): Promise<SupermarktProduct[]> {
    const live = await jumboSearchLive(q);
    if (live.length > 0) return live;
    return checkjebonSearch(q, "jumbo");
  }

  const connectorMap: Record<string, (query: string) => Promise<SupermarktProduct[]>> = {
    ah: ahSearch,
    jumbo: jumboWithFallback,
    picnic: (q) => picnicSearch(q, familyId),
    dirk: dirkSearch,
  };

  return ACTIVE_SUPERMARKTEN.map((id) => ({
    supermarkt: id,
    search: connectorMap[id] ?? ((q: string) => checkjebonSearch(q, id)),
  }));
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms),
    ),
  ]);
}

export async function searchAllSupermarkten(
  query: string,
  familyId: string,
): Promise<SupermarktResult[]> {
  const connectors = buildConnectors(familyId);

  const settled = await Promise.allSettled(
    connectors.map(async (c) => {
      const products = await withTimeout(c.search(query), CONNECTOR_TIMEOUT_MS);
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
