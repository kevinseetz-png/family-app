import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useMeals } from "./useMeals";

/**
 * @vitest-environment jsdom
 */

describe("useMeals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("should start with loading state", () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ meals: [] }),
    });

    const { result } = renderHook(() => useMeals("fam1"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.meals).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should not fetch when familyId is undefined", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    const { result } = renderHook(() => useMeals(undefined));

    await new Promise((r) => setTimeout(r, 50));

    expect(fetchMock).not.toHaveBeenCalled();
    // isLoading should be false when familyId is undefined to prevent infinite loading
    expect(result.current.isLoading).toBe(false);
  });

  it("should fetch meals from /api/meals", async () => {
    const mockMeals = [
      {
        id: "meal1",
        familyId: "fam1",
        name: "Spaghetti",
        ingredients: "pasta, tomaat",
        instructions: "Kook de pasta",
        createdBy: "user1",
        createdByName: "Test User",
        createdAt: "2026-01-01T00:00:00Z",
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ meals: mockMeals }),
    });

    const { result } = renderHook(() => useMeals("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.meals).toHaveLength(1);
    expect(result.current.meals[0].name).toBe("Spaghetti");
    expect(result.current.error).toBeNull();
  });

  it("should handle fetch error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "Server error" }),
    });

    const { result } = renderHook(() => useMeals("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Server error");
    expect(result.current.meals).toEqual([]);
  });

  it("should add a new meal via addMeal", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ meals: [] }),
    });

    const { result } = renderHook(() => useMeals("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        meal: { id: "meal1", name: "New Meal", ingredients: "", instructions: "" },
      }),
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        meals: [{ id: "meal1", name: "New Meal", ingredients: "", instructions: "" }],
      }),
    });

    await result.current.addMeal("New Meal", "", "", "mon");

    await waitFor(() => {
      expect(result.current.meals).toHaveLength(1);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Meal", ingredients: "", instructions: "", sourceDay: "mon" }),
    });
  });

  it("should update a meal via updateMeal", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        meals: [{ id: "meal1", name: "Old Name", ingredients: "", instructions: "" }],
      }),
    });

    const { result } = renderHook(() => useMeals("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        meals: [{ id: "meal1", name: "New Name", ingredients: "updated", instructions: "updated" }],
      }),
    });

    await result.current.updateMeal("meal1", {
      name: "New Name",
      ingredients: "updated",
      instructions: "updated",
    });

    await waitFor(() => {
      expect(result.current.meals[0].name).toBe("New Name");
    });
  });

  it("should delete a meal via deleteMeal", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        meals: [{ id: "meal1", name: "To Delete", ingredients: "", instructions: "" }],
      }),
    });

    const { result } = renderHook(() => useMeals("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.meals).toHaveLength(1);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ meals: [] }),
    });

    await result.current.deleteMeal("meal1");

    await waitFor(() => {
      expect(result.current.meals).toHaveLength(0);
    });
  });

  it("should get a random meal via getRandomMeal", async () => {
    const mockMeals = [
      { id: "meal1", name: "Meal 1", ingredients: "", instructions: "" },
      { id: "meal2", name: "Meal 2", ingredients: "", instructions: "" },
      { id: "meal3", name: "Meal 3", ingredients: "", instructions: "" },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ meals: mockMeals }),
    });

    const { result } = renderHook(() => useMeals("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const randomMeal = result.current.getRandomMeal();
    expect(randomMeal).not.toBeNull();
    expect(mockMeals.map((m) => m.id)).toContain(randomMeal?.id);
  });

  it("should return null from getRandomMeal when no meals", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ meals: [] }),
    });

    const { result } = renderHook(() => useMeals("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const randomMeal = result.current.getRandomMeal();
    expect(randomMeal).toBeNull();
  });
});
