import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { usePicnic } from "./usePicnic";

/**
 * @vitest-environment jsdom
 */

describe("usePicnic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("should start with loading status", () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ connected: false }),
    });

    const { result } = renderHook(() => usePicnic("fam1"));
    expect(result.current.status).toBe("loading");
  });

  it("should not fetch when familyId is undefined", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    const { result } = renderHook(() => usePicnic(undefined));

    await new Promise((r) => setTimeout(r, 50));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe("disconnected");
  });

  it("should fetch connection status on mount", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ connected: true }),
    });

    const { result } = renderHook(() => usePicnic("fam1"));

    await waitFor(() => {
      expect(result.current.status).toBe("connected");
    });
  });

  it("should show disconnected when no Picnic connection", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ connected: false }),
    });

    const { result } = renderHook(() => usePicnic("fam1"));

    await waitFor(() => {
      expect(result.current.status).toBe("disconnected");
    });
  });

  it("should login and update status to connected", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    // Initial status check
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ connected: false }),
    });

    const { result } = renderHook(() => usePicnic("fam1"));

    await waitFor(() => {
      expect(result.current.status).toBe("disconnected");
    });

    // Login request
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ connected: true }),
    });

    // Re-fetch status after login
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ connected: true }),
    });

    await act(async () => {
      await result.current.login("user@test.com", "password");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("connected");
    });
  });

  it("should throw error on failed login", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ connected: false }),
    });

    const { result } = renderHook(() => usePicnic("fam1"));

    await waitFor(() => {
      expect(result.current.status).toBe("disconnected");
    });

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: "Invalid credentials" }),
    });

    await expect(
      act(async () => {
        await result.current.login("bad@test.com", "wrong");
      })
    ).rejects.toThrow();
  });

  it("should search products", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ connected: true }),
    });

    const { result } = renderHook(() => usePicnic("fam1"));

    await waitFor(() => {
      expect(result.current.status).toBe("connected");
    });

    const mockProducts = [
      { id: "p1", name: "Halfvolle melk", price: 139, displayPrice: "1.39", imageId: "img1", unitQuantity: "1 L", maxCount: 50 },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: mockProducts }),
    });

    let products: unknown;
    await act(async () => {
      products = await result.current.search("melk");
    });

    expect(products).toHaveLength(1);
    expect((products as { name: string }[])[0].name).toBe("Halfvolle melk");
  });

  it("should add product to cart", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ connected: true }),
    });

    const { result } = renderHook(() => usePicnic("fam1"));

    await waitFor(() => {
      expect(result.current.status).toBe("connected");
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await act(async () => {
      await result.current.addToCart("product-123", 1);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/picnic/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: "product-123", count: 1 }),
    });
  });

  it("should disconnect Picnic account", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ connected: true }),
    });

    const { result } = renderHook(() => usePicnic("fam1"));

    await waitFor(() => {
      expect(result.current.status).toBe("connected");
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await act(async () => {
      await result.current.disconnect();
    });

    expect(result.current.status).toBe("disconnected");
  });
});
