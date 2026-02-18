import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { search } from "./jumbo";

describe("Jumbo connector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call Jumbo mobile API with query", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        products: { data: [] },
      }),
    });

    await search("melk");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toContain("jumbo.com");
    expect(mockFetch.mock.calls[0][0]).toContain("melk");
  });

  it("should map Jumbo products to SupermarktProduct format", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        products: {
          data: [
            {
              id: "j-123",
              title: "Jumbo Halfvolle Melk",
              prices: { price: { amount: 1.49 } },
              quantityOptions: [{ unit: "stuk", defaultAmount: 1 }],
              imageInfo: { primaryView: [{ url: "https://jumbo.nl/img/j-123" }] },
            },
          ],
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
      unitQuantity: "1 stuk",
      imageUrl: null,
      supermarkt: "jumbo",
    });
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

  it("should handle products without images", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        products: {
          data: [
            {
              id: "j-456",
              title: "Jumbo Product",
              prices: { price: { amount: 2.99 } },
              quantityOptions: [{ unit: "stuk", defaultAmount: 1 }],
              imageInfo: null,
            },
          ],
        },
      }),
    });

    const results = await search("product");
    expect(results[0].imageUrl).toBeNull();
  });
});
