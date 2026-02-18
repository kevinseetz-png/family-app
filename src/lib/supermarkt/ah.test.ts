import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { search, _resetTokenCache } from "./ah";

describe("AH connector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetTokenCache();
  });

  it("should fetch anonymous token before searching", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "test-token", expires_in: 7200 }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        products: [
          {
            webshopId: "12345",
            title: "AH Halfvolle melk",
            priceBeforeBonus: 139,
            currentPrice: 139,
            unitPriceDescription: "1 L",
            images: [{ url: "https://ah.nl/img/12345" }],
          },
        ],
      }),
    });

    const results = await search("melk");
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toContain("auth/token/anonymous");
  });

  it("should map AH products to SupermarktProduct format", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "test-token", expires_in: 7200 }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        products: [
          {
            webshopId: "12345",
            title: "AH Halfvolle melk",
            priceBeforeBonus: 139,
            currentPrice: 139,
            unitPriceDescription: "1 L",
            images: [{ url: "https://ah.nl/img/12345" }],
          },
        ],
      }),
    });

    const results = await search("melk");
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      id: "12345",
      name: "AH Halfvolle melk",
      price: 139,
      displayPrice: "€ 1,39",
      unitQuantity: "1 L",
      imageUrl: "https://ah.nl/img/12345",
      supermarkt: "ah",
    });
  });

  it("should cache token and reuse for subsequent searches", async () => {
    // First search: token + search
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "cached-token", expires_in: 7200 }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: [] }),
    });
    await search("melk");

    // Second search: only search (token cached)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: [] }),
    });
    await search("kaas");

    // Token should only be fetched once (calls: token, search1, search2 = 3)
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("should return empty array on token fetch failure", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const results = await search("melk");
    expect(results).toEqual([]);
  });

  it("should return empty array on search failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "test-token", expires_in: 7200 }),
    });
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const results = await search("melk");
    expect(results).toEqual([]);
  });

  it("should handle products without images", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "test-token", expires_in: 7200 }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        products: [
          {
            webshopId: "99",
            title: "AH Product",
            priceBeforeBonus: 250,
            currentPrice: 250,
            unitPriceDescription: "500 g",
            images: [],
          },
        ],
      }),
    });

    const results = await search("product");
    expect(results[0].imageUrl).toBeNull();
  });
});
