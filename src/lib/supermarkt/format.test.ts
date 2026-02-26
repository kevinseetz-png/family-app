import { describe, it, expect } from "vitest";
import { parseUnitQuantity, pricePerUnit, quantityKey, quantityLabel, extractQuantityFromQuery, extractBrand } from "./format";

describe("parseUnitQuantity", () => {
  describe("grams (g)", () => {
    it("should parse '500 g' with a space", () => {
      expect(parseUnitQuantity("500 g")).toEqual({ amount: 500, unit: "g" });
    });

    it("should parse '500g' without a space", () => {
      expect(parseUnitQuantity("500g")).toEqual({ amount: 500, unit: "g" });
    });

    it("should parse '100 g'", () => {
      expect(parseUnitQuantity("100 g")).toEqual({ amount: 100, unit: "g" });
    });
  });

  describe("kilograms (kg)", () => {
    it("should parse '1 kg' with integer amount", () => {
      expect(parseUnitQuantity("1 kg")).toEqual({ amount: 1, unit: "kg" });
    });

    it("should parse '1,5 kg' with comma decimal", () => {
      expect(parseUnitQuantity("1,5 kg")).toEqual({ amount: 1.5, unit: "kg" });
    });

    it("should parse '2 kg'", () => {
      expect(parseUnitQuantity("2 kg")).toEqual({ amount: 2, unit: "kg" });
    });
  });

  describe("liters (l)", () => {
    it("should parse '1 L' (uppercase L) as unit 'l'", () => {
      expect(parseUnitQuantity("1 L")).toEqual({ amount: 1, unit: "l" });
    });

    it("should parse '1.5 L' with dot decimal", () => {
      expect(parseUnitQuantity("1.5 L")).toEqual({ amount: 1.5, unit: "l" });
    });

    it("should parse '1 l' (lowercase l)", () => {
      expect(parseUnitQuantity("1 l")).toEqual({ amount: 1, unit: "l" });
    });

    it("should parse '2 liter' as unit 'l'", () => {
      expect(parseUnitQuantity("2 liter")).toEqual({ amount: 2, unit: "l" });
    });
  });

  describe("milliliters (ml)", () => {
    it("should parse '500 ml' with a space", () => {
      expect(parseUnitQuantity("500 ml")).toEqual({ amount: 500, unit: "ml" });
    });

    it("should parse '750ml' without a space", () => {
      expect(parseUnitQuantity("750ml")).toEqual({ amount: 750, unit: "ml" });
    });

    it("should parse '330 ml'", () => {
      expect(parseUnitQuantity("330 ml")).toEqual({ amount: 330, unit: "ml" });
    });
  });

  describe("unparseable inputs (returns null)", () => {
    it("should return null for '1 stuk' (piece — not a weight/volume unit)", () => {
      expect(parseUnitQuantity("1 stuk")).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(parseUnitQuantity("")).toBeNull();
    });

    it("should return null for 'unknown'", () => {
      expect(parseUnitQuantity("unknown")).toBeNull();
    });

    it("should return null for a bare number with no unit", () => {
      expect(parseUnitQuantity("500")).toBeNull();
    });

    it("should return null for '1 stuk' variant 'stks'", () => {
      expect(parseUnitQuantity("2 stks")).toBeNull();
    });
  });
});

describe("pricePerUnit", () => {
  describe("grams — total < 1000g → price per 100g", () => {
    it("should return price per 100g for (139, '500g')", () => {
      // 139 cents / 500g * 100 = 27.8 → rounds to 28 cents → € 0,28 / 100g
      expect(pricePerUnit(139, "500g")).toBe("€ 0,28 / 100g");
    });

    it("should return price per 100g for (199, '200 g')", () => {
      // 199 / 200 * 100 = 99.5 → rounds to 100 cents → € 1,00 / 100g
      expect(pricePerUnit(199, "200 g")).toBe("€ 1,00 / 100g");
    });

    it("should return price per 100g for (89, '100 g')", () => {
      // 89 / 100 * 100 = 89 cents → € 0,89 / 100g
      expect(pricePerUnit(89, "100 g")).toBe("€ 0,89 / 100g");
    });
  });

  describe("grams — total >= 1000g → price per kg", () => {
    it("should return price per kg for (279, '1 kg')", () => {
      // 279 cents / 1000g * 1000 = 279 cents → € 2,79 / kg
      expect(pricePerUnit(279, "1 kg")).toBe("€ 2,79 / kg");
    });

    it("should return price per kg for (199, '1,5 kg')", () => {
      // 199 / 1500g * 1000 = 132.67 cents → rounds to 133 → € 1,33 / kg
      expect(pricePerUnit(199, "1,5 kg")).toBe("€ 1,33 / kg");
    });

    it("should return price per kg for (499, '2 kg')", () => {
      // 499 / 2000 * 1000 = 249.5 → rounds to 250 → € 2,50 / kg
      expect(pricePerUnit(499, "2 kg")).toBe("€ 2,50 / kg");
    });
  });

  describe("liters and milliliters → price per liter", () => {
    it("should return price per liter for (139, '1 L')", () => {
      // 139 cents / 1L = 139 cents → € 1,39 / liter
      expect(pricePerUnit(139, "1 L")).toBe("€ 1,39 / liter");
    });

    it("should return price per liter for (399, '750 ml')", () => {
      // 399 / 750ml * 1000 = 532 cents → € 5,32 / liter
      expect(pricePerUnit(399, "750 ml")).toBe("€ 5,32 / liter");
    });

    it("should return price per liter for (399, '750ml') — no space variant", () => {
      expect(pricePerUnit(399, "750ml")).toBe("€ 5,32 / liter");
    });

    it("should return price per liter for (299, '500 ml')", () => {
      // 299 / 500 * 1000 = 598 cents → € 5,98 / liter
      expect(pricePerUnit(299, "500 ml")).toBe("€ 5,98 / liter");
    });

    it("should return price per liter for (199, '1,5 l') — 1.5 liter", () => {
      // 199 / 1500ml * 1000 = 132.67 → 133 cents → € 1,33 / liter
      expect(pricePerUnit(199, "1,5 l")).toBe("€ 1,33 / liter");
    });
  });

  describe("null cases", () => {
    it("should return null when unit cannot be parsed ('1 stuk')", () => {
      expect(pricePerUnit(99, "1 stuk")).toBeNull();
    });

    it("should return null when price is 0", () => {
      expect(pricePerUnit(0, "500g")).toBeNull();
    });

    it("should return null when unit string is empty", () => {
      expect(pricePerUnit(199, "")).toBeNull();
    });

    it("should return null when unit string is unrecognised", () => {
      expect(pricePerUnit(199, "unknown")).toBeNull();
    });
  });
});

describe("quantityKey", () => {
  it("should return normalized key for '1 L'", () => {
    expect(quantityKey("1 L")).toBe("1_l");
  });

  it("should return normalized key for '500 g'", () => {
    expect(quantityKey("500 g")).toBe("500_g");
  });

  it("should normalize 1000 ml to 1 L", () => {
    expect(quantityKey("1000 ml")).toBe("1_l");
  });

  it("should normalize 1000 g to 1 kg", () => {
    expect(quantityKey("1000 g")).toBe("1_kg");
  });

  it("should not normalize 500 ml", () => {
    expect(quantityKey("500 ml")).toBe("500_ml");
  });

  it("should return null for unparseable input", () => {
    expect(quantityKey("1 stuk")).toBeNull();
  });
});

describe("quantityLabel", () => {
  it("should return human-readable label for '1 l'", () => {
    expect(quantityLabel("1 l")).toBe("1 L");
  });

  it("should return label for '500 ml'", () => {
    expect(quantityLabel("500 ml")).toBe("500 ml");
  });

  it("should normalize 1000 ml to 1 L", () => {
    expect(quantityLabel("1000 ml")).toBe("1 L");
  });

  it("should return label for '1 kg'", () => {
    expect(quantityLabel("1 kg")).toBe("1 kg");
  });

  it("should return null for unparseable input", () => {
    expect(quantityLabel("1 stuk")).toBeNull();
  });
});

describe("extractQuantityFromQuery", () => {
  it("should extract quantity from 'kwark 1kg'", () => {
    expect(extractQuantityFromQuery("kwark 1kg")).toEqual({ cleanQuery: "kwark", qtyFilter: "1_kg" });
  });

  it("should extract quantity from 'melk 1l'", () => {
    expect(extractQuantityFromQuery("melk 1l")).toEqual({ cleanQuery: "melk", qtyFilter: "1_l" });
  });

  it("should normalize 1000ml to 1_l", () => {
    expect(extractQuantityFromQuery("yoghurt 1000ml")).toEqual({ cleanQuery: "yoghurt", qtyFilter: "1_l" });
  });

  it("should normalize 1000g to 1_kg", () => {
    expect(extractQuantityFromQuery("kwark 1000g")).toEqual({ cleanQuery: "kwark", qtyFilter: "1_kg" });
  });

  it("should return null qtyFilter when no quantity in query", () => {
    expect(extractQuantityFromQuery("melk")).toEqual({ cleanQuery: "melk", qtyFilter: null });
  });

  it("should handle '500 ml' with space", () => {
    expect(extractQuantityFromQuery("yoghurt 500 ml")).toEqual({ cleanQuery: "yoghurt", qtyFilter: "500_ml" });
  });
});

describe("extractBrand", () => {
  it("should extract AH from product name", () => {
    expect(extractBrand("AH Halfvolle melk")).toBe("AH");
  });

  it("should extract Campina from product name", () => {
    expect(extractBrand("Campina Halfvolle melk")).toBe("Campina");
  });

  it("should return Huismerk for unknown brand", () => {
    expect(extractBrand("Halfvolle melk")).toBe("Huismerk");
  });
});
