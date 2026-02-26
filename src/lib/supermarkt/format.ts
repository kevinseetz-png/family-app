export function formatPrice(cents: number): string {
  if (!Number.isFinite(cents) || cents === 0) return "";
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export function parseUnitQuantity(unitStr: string): { amount: number; unit: "g" | "kg" | "ml" | "l" } | null {
  const trimmed = unitStr.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(g|kg|ml|l|liter)$/i);
  if (!match) return null;

  const amount = parseFloat(match[1].replace(",", "."));
  const rawUnit = match[2].toLowerCase();

  let unit: "g" | "kg" | "ml" | "l";
  if (rawUnit === "g") unit = "g";
  else if (rawUnit === "kg") unit = "kg";
  else if (rawUnit === "ml") unit = "ml";
  else unit = "l";

  return { amount, unit };
}

interface PPUComputed {
  /** Numeric value used for sorting (cents per 100g for weight, cents per liter for volume). */
  sortValue: number;
  /** Human-readable label, e.g. "€ 0,28 / 100g". */
  label: string;
}

function computePPU(priceCents: number, unitStr: string): PPUComputed | null {
  if (priceCents === 0) return null;

  const parsed = parseUnitQuantity(unitStr);
  if (!parsed) return null;

  const { amount, unit } = parsed;

  if (unit === "g" || unit === "kg") {
    const totalGrams = unit === "g" ? amount : amount * 1000;
    if (totalGrams < 1000) {
      const per100g = Math.round(priceCents / totalGrams * 100);
      return {
        sortValue: priceCents / totalGrams * 100,
        label: `€ ${(per100g / 100).toFixed(2).replace(".", ",")} / 100g`,
      };
    } else {
      const perKg = Math.round(priceCents / totalGrams * 1000);
      // Normalise to cents-per-100g for consistent cross-unit sorting.
      return {
        sortValue: priceCents / totalGrams * 100,
        label: `€ ${(perKg / 100).toFixed(2).replace(".", ",")} / kg`,
      };
    }
  } else {
    const totalMl = unit === "ml" ? amount : amount * 1000;
    const perLiter = Math.round(priceCents / totalMl * 1000);
    return {
      sortValue: priceCents / totalMl * 1000,
      label: `€ ${(perLiter / 100).toFixed(2).replace(".", ",")} / liter`,
    };
  }
}

export function pricePerUnit(priceCents: number, unitStr: string): string | null {
  return computePPU(priceCents, unitStr)?.label ?? null;
}

/**
 * Returns a numeric value suitable for sorting by unit price.
 * - Weight products: cents per 100g
 * - Volume products: cents per liter
 * Returns null when priceCents === 0 or unitStr cannot be parsed.
 */
export function pricePerUnitValue(priceCents: number, unitStr: string): number | null {
  return computePPU(priceCents, unitStr)?.sortValue ?? null;
}

export function quantityKey(unitStr: string): string | null {
  const parsed = parseUnitQuantity(unitStr);
  if (!parsed) return null;
  return `${parsed.amount}_${parsed.unit}`;
}

export function quantityLabel(unitStr: string): string | null {
  const parsed = parseUnitQuantity(unitStr);
  if (!parsed) return null;
  const unitLabels: Record<string, string> = { g: "g", kg: "kg", ml: "ml", l: "L" };
  return `${parsed.amount} ${unitLabels[parsed.unit]}`;
}
