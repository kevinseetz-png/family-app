import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./ah", () => ({
  search: vi.fn(),
}));

vi.mock("./jumbo", () => ({
  search: vi.fn(),
}));

vi.mock("./picnic-adapter", () => ({
  search: vi.fn(),
}));

vi.mock("./dirk", () => ({
  search: vi.fn(),
}));

vi.mock("./checkjebon", () => ({
  search: vi.fn(),
}));

import { searchAllSupermarkten } from "./index";
import { search as ahSearch } from "./ah";
import { search as jumboSearch } from "./jumbo";
import { search as picnicSearch } from "./picnic-adapter";
import { search as dirkSearch } from "./dirk";
import { search as checkjebonSearch } from "./checkjebon";
import type { SupermarktProduct } from "@/types/supermarkt";

const mockAhSearch = vi.mocked(ahSearch);
const mockJumboSearch = vi.mocked(jumboSearch);
const mockPicnicSearch = vi.mocked(picnicSearch);
const mockDirkSearch = vi.mocked(dirkSearch);
const mockCheckjebonSearch = vi.mocked(checkjebonSearch);

const mockProduct = (supermarkt: string, name: string, price: number): SupermarktProduct => ({
  id: `${supermarkt}-1`,
  name,
  price,
  displayPrice: `€ ${(price / 100).toFixed(2).replace(".", ",")}`,
  unitQuantity: "1 stuk",
  imageUrl: null,
  supermarkt: supermarkt as SupermarktProduct["supermarkt"],
});

function mockAllEmpty() {
  mockAhSearch.mockResolvedValue([]);
  mockJumboSearch.mockResolvedValue([]);
  mockPicnicSearch.mockResolvedValue([]);
  mockDirkSearch.mockResolvedValue([]);
  mockCheckjebonSearch.mockResolvedValue([]);
}

describe("searchAllSupermarkten", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should search active supermarkets in parallel", async () => {
    mockAhSearch.mockResolvedValue([mockProduct("ah", "AH Melk", 139)]);
    mockJumboSearch.mockResolvedValue([mockProduct("jumbo", "Jumbo Melk", 149)]);
    mockPicnicSearch.mockResolvedValue([mockProduct("picnic", "Picnic Melk", 129)]);
    mockDirkSearch.mockResolvedValue([mockProduct("dirk", "Dirk Melk", 119)]);
    mockCheckjebonSearch.mockResolvedValue([]);

    const results = await searchAllSupermarkten("melk", "fam1");

    const ahResult = results.find((r) => r.supermarkt === "ah");
    expect(ahResult?.products).toHaveLength(1);
    expect(ahResult?.error).toBeNull();

    const dirkResult = results.find((r) => r.supermarkt === "dirk");
    expect(dirkResult?.products).toHaveLength(1);
    expect(dirkResult?.error).toBeNull();
  });

  it("should handle individual connector failures gracefully", async () => {
    mockAhSearch.mockRejectedValue(new Error("AH API down"));
    mockJumboSearch.mockResolvedValue([mockProduct("jumbo", "Jumbo Melk", 149)]);
    mockPicnicSearch.mockResolvedValue([]);
    mockDirkSearch.mockResolvedValue([]);
    mockCheckjebonSearch.mockResolvedValue([]);

    const results = await searchAllSupermarkten("melk", "fam1");

    const ahResult = results.find((r) => r.supermarkt === "ah");
    expect(ahResult?.products).toEqual([]);
    expect(ahResult?.error).toBeTruthy();

    const jumboResult = results.find((r) => r.supermarkt === "jumbo");
    expect(jumboResult?.products).toHaveLength(1);
    expect(jumboResult?.error).toBeNull();
  });

  it("should include all 12 active supermarkets in results", async () => {
    mockAllEmpty();

    const results = await searchAllSupermarkten("test", "fam1");

    const supermarktIds = results.map((r) => r.supermarkt);
    expect(supermarktIds).toContain("ah");
    expect(supermarktIds).toContain("jumbo");
    expect(supermarktIds).toContain("picnic");
    expect(supermarktIds).toContain("dirk");
    expect(supermarktIds).toContain("lidl");
    expect(supermarktIds).toContain("plus");
    expect(supermarktIds).toContain("aldi");
    expect(results).toHaveLength(12);
  });

  it("should use checkjebon fallback for supermarkets without dedicated connector", async () => {
    mockAllEmpty();

    await searchAllSupermarkten("melk", "fam1");

    // Lidl should go through checkjebon
    expect(mockCheckjebonSearch).toHaveBeenCalledWith("melk", "lidl");
    // Plus should go through checkjebon
    expect(mockCheckjebonSearch).toHaveBeenCalledWith("melk", "plus");
    // AH should NOT go through checkjebon (has dedicated connector)
    expect(mockAhSearch).toHaveBeenCalledWith("melk");
  });

  it("should include correct labels for each supermarket", async () => {
    mockAllEmpty();

    const results = await searchAllSupermarkten("test", "fam1");

    const ahResult = results.find((r) => r.supermarkt === "ah");
    expect(ahResult?.label).toBe("Albert Heijn");

    const lidlResult = results.find((r) => r.supermarkt === "lidl");
    expect(lidlResult?.label).toBe("Lidl");

    const dirkResult = results.find((r) => r.supermarkt === "dirk");
    expect(dirkResult?.label).toBe("Dirk");
  });

  it("should pass familyId to picnic adapter", async () => {
    mockAllEmpty();

    await searchAllSupermarkten("melk", "fam1");
    expect(mockPicnicSearch).toHaveBeenCalledWith("melk", "fam1");
  });
});
