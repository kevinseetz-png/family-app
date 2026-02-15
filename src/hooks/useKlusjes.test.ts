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

  it("should fetch klusjes from /api/klusjes with new fields including priority", async () => {
    const mockItems = [
      {
        id: "klusje1",
        familyId: "fam1",
        name: "Stofzuigen",
        status: "todo",
        priority: 1,
        date: null,
        recurrence: "none",
        completions: {},
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
    expect(result.current.items[0].status).toBe("todo");
    expect(result.current.items[0].priority).toBe(1);
    expect(result.current.items[0].date).toBeNull();
    expect(result.current.items[0].recurrence).toBe("none");
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

  it("should add a new klusje via addItem with object including priority", async () => {
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
        items: [{ id: "klusje1", name: "Afwassen", status: "todo", priority: 2, date: null, recurrence: "none", completions: {} }],
      }),
    });

    await result.current.addItem({ name: "Afwassen", date: null, recurrence: "none", priority: 2 });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/klusjes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Afwassen", date: null, recurrence: "none", priority: 2 }),
    });
  });

  it("should add klusje with date and recurrence", async () => {
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
      json: async () => ({ id: "klusje1" }),
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });

    await result.current.addItem({ name: "Stofzuigen", date: "2026-02-10", recurrence: "weekly", priority: 1 });

    expect(fetchMock).toHaveBeenCalledWith("/api/klusjes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Stofzuigen", date: "2026-02-10", recurrence: "weekly", priority: 1 }),
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

    await expect(result.current.addItem({ name: "Test", date: null, recurrence: "none", priority: 2 })).rejects.toThrow(
      "Failed to add item"
    );
  });

  it("should update status via updateStatus", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: "klusje1", name: "Test", status: "todo", date: null, recurrence: "none", completions: {} }],
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
        items: [{ id: "klusje1", name: "Test", status: "klaar", date: null, recurrence: "none", completions: {} }],
      }),
    });

    await result.current.updateStatus("klusje1", "klaar");

    await waitFor(() => {
      expect(result.current.items[0].status).toBe("klaar");
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/klusjes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "klusje1", status: "klaar" }),
    });
  });

  it("should update status with completionDate for recurring items", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: "klusje1", name: "Test", status: "todo", date: "2026-02-10", recurrence: "daily", completions: {} }],
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
        items: [{ id: "klusje1", name: "Test", status: "todo", date: "2026-02-10", recurrence: "daily", completions: { "2026-02-11": { status: "klaar" } } }],
      }),
    });

    await result.current.updateStatus("klusje1", "klaar", "2026-02-11");

    expect(fetchMock).toHaveBeenCalledWith("/api/klusjes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "klusje1", status: "klaar", completionDate: "2026-02-11" }),
    });
  });

  it("should delete a klusje via deleteItem", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: "klusje1", name: "To Delete", status: "todo", date: null, recurrence: "none", completions: {} }],
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

  it("should get items for a specific date via getItemsForDate", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          { id: "k1", name: "Monday task", status: "todo", date: "2026-02-09", recurrence: "none", completions: {}, createdBy: "u1", createdByName: "User", createdAt: "2026-01-01T00:00:00Z" },
          { id: "k2", name: "Tuesday task", status: "todo", date: "2026-02-10", recurrence: "none", completions: {}, createdBy: "u1", createdByName: "User", createdAt: "2026-01-01T00:00:00Z" },
          { id: "k3", name: "No date task", status: "todo", date: null, recurrence: "none", completions: {}, createdBy: "u1", createdByName: "User", createdAt: "2026-01-01T00:00:00Z" },
        ],
      }),
    });

    const { result } = renderHook(() => useKlusjes("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const mondayItems = result.current.getItemsForDate("2026-02-09");
    expect(mondayItems).toHaveLength(1);
    expect(mondayItems[0].name).toBe("Monday task");
  });

  it("should expand recurring klusjes for a date", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          { id: "k1", name: "Daily chore", status: "todo", date: "2026-02-09", recurrence: "daily", completions: {}, createdBy: "u1", createdByName: "User", createdAt: "2026-01-01T00:00:00Z" },
        ],
      }),
    });

    const { result } = renderHook(() => useKlusjes("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should match on the next day too (expanded from daily recurrence)
    const items = result.current.getItemsForDate("2026-02-10");
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Daily chore");
  });
});
