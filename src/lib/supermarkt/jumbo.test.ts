import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { search } from "./jumbo";

describe("Jumbo connector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call Jumbo GraphQL API with query", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { searchProducts: { products: [] } },
      }),
    });

    await search("melk");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toContain("jumbo.com");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.variables.input.searchTerms).toBe("melk");
  });

  it("should map Jumbo products to SupermarktProduct format", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          searchProducts: {
            products: [
              {
                id: "j-123",
                title: "Jumbo Halfvolle Melk",
                subtitle: "1 L",
                prices: { price: 149, promoPrice: null, pricePerUnit: { price: 149, unit: "l" } },
              },
            ],
          },
        },
      }),
    });

    const results = await search("melk");
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      id: "j-123",
      name: "Jumbo Halfvolle Melk",
      price: 149,
      displayPrice: "€ 1,49",
      unitQuantity: "1 L",
      imageUrl: null,
      supermarkt: "jumbo",
    });
  });

  it("should use promoPrice when available", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          searchProducts: {
            products: [
              {
                id: "j-789",
                title: "Jumbo Kwark",
                subtitle: "500 g",
                prices: { price: 199, promoPrice: 149, pricePerUnit: null },
              },
            ],
          },
        },
      }),
    });

    const results = await search("kwark");
    expect(results[0].price).toBe(149);
  });

  it("should return empty array on API failure", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const results = await search("melk");
    expect(results).toEqual([]);
  });

  it("should return empty array on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const results = await search("melk");
    expect(results).toEqual([]);
  });
});
