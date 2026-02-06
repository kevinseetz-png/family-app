import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useKlusjes } from "./useKlusjes";

/**
 * @vitest-environment jsdom
 */

describe("useKlusjes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("should start with loading state", () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });

    const { result } = renderHook(() => useKlusjes("fam1"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should not fetch when familyId is undefined", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    const { result } = renderHook(() => useKlusjes(undefined));

    await new Promise((r) => setTimeout(r, 50));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(true);
  });

  it("should fetch klusjes from /api/klusjes", async () => {
    const mockItems = [
      {
        id: "klusje1",
        familyId: "fam1",
        name: "Stofzuigen",
        checked: false,
        createdBy: "user1",
        createdByName: "Test User",
        createdAt: "2026-01-01T00:00:00Z",
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ items: mockItems }),
    });

    const { result } = renderHook(() => useKlusjes("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe("Stofzuigen");
    expect(result.current.error).toBeNull();
  });

  it("should handle fetch error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "Server error" }),
    });

    const { result } = renderHook(() => useKlusjes("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Server error");
    expect(result.current.items).toEqual([]);
  });

  it("should handle network error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error")
    );

    const { result } = renderHook(() => useKlusjes("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Network error loading klusjes");
  });

  it("should add a new klusje via addItem", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });

    const { result } = renderHook(() => useKlusjes("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "klusje1",
        name: "Afwassen",
      }),
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: "klusje1", name: "Afwassen", checked: false }],
      }),
    });

    await result.current.addItem("Afwassen");

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/klusjes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Afwassen" }),
    });
  });

  it("should throw error when addItem fails", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });

    const { result } = renderHook(() => useKlusjes("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Failed to add item" }),
    });

    await expect(result.current.addItem("Test")).rejects.toThrow(
      "Failed to add item"
    );
  });

  it("should toggle a klusje via toggleItem", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: "klusje1", name: "Test", checked: false }],
      }),
    });

    const { result } = renderHook(() => useKlusjes("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Updated" }),
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: "klusje1", name: "Test", checked: true }],
      }),
    });

    await result.current.toggleItem("klusje1", true);

    await waitFor(() => {
      expect(result.current.items[0].checked).toBe(true);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/klusjes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "klusje1", checked: true }),
    });
  });

  it("should delete a klusje via deleteItem", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: "klusje1", name: "To Delete", checked: false }],
      }),
    });

    const { result } = renderHook(() => useKlusjes("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toHaveLength(1);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Deleted" }),
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });

    await result.current.deleteItem("klusje1");

    await waitFor(() => {
      expect(result.current.items).toHaveLength(0);
    });
  });
});
