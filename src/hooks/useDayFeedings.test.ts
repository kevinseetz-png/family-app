import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDayFeedings } from "./useDayFeedings";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function makeFeedingResponse(id: string, timestamp: string) {
  return {
    id,
    familyId: "fam1",
    foodType: "formula",
    amount: 100,
    unit: "ml",
    loggedBy: "u1",
    loggedByName: "Test",
    timestamp,
    createdAt: timestamp,
  };
}

describe("useDayFeedings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should start with no feedings and not loading", () => {
    const { result } = renderHook(() => useDayFeedings("fam1"));
    expect(result.current.feedings).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("should fetch feedings for a date", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        feedings: [makeFeedingResponse("f1", "2025-03-15T10:00:00.000Z")],
      }),
    });

    const { result } = renderHook(() => useDayFeedings("fam1"));

    await act(async () => {
      await result.current.fetchDay("2025-03-15");
    });

    const tzOffset = new Date().getTimezoneOffset();
    expect(mockFetch).toHaveBeenCalledWith(`/api/feedings?date=2025-03-15&tzOffset=${tzOffset}`);
    expect(result.current.feedings).toHaveLength(1);
    expect(result.current.feedings[0].id).toBe("f1");
    expect(result.current.isLoading).toBe(false);
  });

  it("should set isLoading while fetching", async () => {
    let resolvePromise: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockFetch.mockReturnValueOnce(pending);

    const { result } = renderHook(() => useDayFeedings("fam1"));

    act(() => {
      result.current.fetchDay("2025-03-15");
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePromise!({
        ok: true,
        json: async () => ({ feedings: [] }),
      });
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("should clear feedings when fetchDay is called with null", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        feedings: [makeFeedingResponse("f1", "2025-03-15T10:00:00.000Z")],
      }),
    });

    const { result } = renderHook(() => useDayFeedings("fam1"));

    await act(async () => {
      await result.current.fetchDay("2025-03-15");
    });

    expect(result.current.feedings).toHaveLength(1);

    act(() => {
      result.current.fetchDay(null);
    });

    expect(result.current.feedings).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("should not fetch if familyId is undefined", async () => {
    const { result } = renderHook(() => useDayFeedings(undefined));

    await act(async () => {
      await result.current.fetchDay("2025-03-15");
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
