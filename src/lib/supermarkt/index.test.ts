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

vi.mock("./scraper", () => ({
  createScraper: vi.fn(),
}));

import { searchAllSupermarkten } from "./index";
import { search as ahSearch } from "./ah";
import { search as jumboSearch } from "./jumbo";
import { search as picnicSearch } from "./picnic-adapter";
import type { SupermarktProduct } from "@/types/supermarkt";

const mockAhSearch = vi.mocked(ahSearch);
const mockJumboSearch = vi.mocked(jumboSearch);
const mockPicnicSearch = vi.mocked(picnicSearch);

const mockProduct = (supermarkt: string, name: string, price: number): SupermarktProduct => ({
  id: `${supermarkt}-1`,
  name,
  price,
  displayPrice: `€ ${(price / 100).toFixed(2).replace(".", ",")}`,
  unitQuantity: "1 stuk",
  imageUrl: null,
  supermarkt: supermarkt as SupermarktProduct["supermarkt"],
});

describe("searchAllSupermarkten", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should search active supermarkets in parallel", async () => {
    mockAhSearch.mockResolvedValue([mockProduct("ah", "AH Melk", 139)]);
    mockJumboSearch.mockResolvedValue([mockProduct("jumbo", "Jumbo Melk", 149)]);
    mockPicnicSearch.mockResolvedValue([mockProduct("picnic", "Picnic Melk", 129)]);

    const results = await searchAllSupermarkten("melk", "fam1");

    const ahResult = results.find((r) => r.supermarkt === "ah");
    expect(ahResult?.products).toHaveLength(1);
    expect(ahResult?.error).toBeNull();

    const jumboResult = results.find((r) => r.supermarkt === "jumbo");
    expect(jumboResult?.products).toHaveLength(1);
    expect(jumboResult?.error).toBeNull();

    const picnicResult = results.find((r) => r.supermarkt === "picnic");
    expect(picnicResult?.products).toHaveLength(1);
    expect(picnicResult?.error).toBeNull();
  });

  it("should handle individual connector failures gracefully", async () => {
    mockAhSearch.mockRejectedValue(new Error("AH API down"));
    mockJumboSearch.mockResolvedValue([mockProduct("jumbo", "Jumbo Melk", 149)]);
    mockPicnicSearch.mockResolvedValue([]);

    const results = await searchAllSupermarkten("melk", "fam1");

    const ahResult = results.find((r) => r.supermarkt === "ah");
    expect(ahResult?.products).toEqual([]);
    expect(ahResult?.error).toBeTruthy();

    const jumboResult = results.find((r) => r.supermarkt === "jumbo");
    expect(jumboResult?.products).toHaveLength(1);
    expect(jumboResult?.error).toBeNull();
  });

  it("should only include active supermarkets in results", async () => {
    mockAhSearch.mockResolvedValue([]);
    mockJumboSearch.mockResolvedValue([]);
    mockPicnicSearch.mockResolvedValue([]);

    const results = await searchAllSupermarkten("test", "fam1");

    const supermarktIds = results.map((r) => r.supermarkt);
    expect(supermarktIds).toContain("ah");
    expect(supermarktIds).toContain("jumbo");
    expect(supermarktIds).toContain("picnic");
    // Stubs should not be queried
    expect(supermarktIds).not.toContain("dirk");
    expect(supermarktIds).not.toContain("lidl");
  });

  it("should include correct labels for each supermarket", async () => {
    mockAhSearch.mockResolvedValue([]);
    mockJumboSearch.mockResolvedValue([]);
    mockPicnicSearch.mockResolvedValue([]);

    const results = await searchAllSupermarkten("test", "fam1");

    const ahResult = results.find((r) => r.supermarkt === "ah");
    expect(ahResult?.label).toBe("Albert Heijn");

    const jumboResult = results.find((r) => r.supermarkt === "jumbo");
    expect(jumboResult?.label).toBe("Jumbo");
  });

  it("should pass familyId to picnic adapter", async () => {
    mockAhSearch.mockResolvedValue([]);
    mockJumboSearch.mockResolvedValue([]);
    mockPicnicSearch.mockResolvedValue([]);

    await searchAllSupermarkten("melk", "fam1");
    expect(mockPicnicSearch).toHaveBeenCalledWith("melk", "fam1");
  });
});
