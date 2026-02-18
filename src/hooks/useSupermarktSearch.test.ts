import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { useSupermarktSearch } from "./useSupermarktSearch";
import type { SupermarktResult } from "@/types/supermarkt";

const mockResults: SupermarktResult[] = [
  {
    supermarkt: "ah",
    label: "Albert Heijn",
    products: [
      {
        id: "ah-1",
        name: "AH Melk",
        price: 139,
        displayPrice: "€ 1,39",
        unitQuantity: "1 L",
        imageUrl: null,
        supermarkt: "ah",
      },
    ],
    error: null,
  },
  {
    supermarkt: "jumbo",
    label: "Jumbo",
    products: [],
    error: "Niet beschikbaar",
  },
];

describe("useSupermarktSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start with empty state", () => {
    const { result } = renderHook(() => useSupermarktSearch());
    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.query).toBe("");
  });

  it("should debounce search calls", async () => {
    vi.useRealTimers();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ results: mockResults }),
    });

    const { result } = renderHook(() => useSupermarktSearch());

    act(() => {
      result.current.setQuery("m");
      result.current.setQuery("me");
      result.current.setQuery("mel");
      result.current.setQuery("melk");
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    }, { timeout: 2000 });
  });

  it("should set isSearching while fetching", async () => {
    vi.useRealTimers();
    let resolveSearch: (value: Response) => void;
    mockFetch.mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve;
      })
    );

    const { result } = renderHook(() => useSupermarktSearch());

    act(() => {
      result.current.setQuery("melk");
    });

    await waitFor(() => {
      expect(result.current.isSearching).toBe(true);
    });

    await act(async () => {
      resolveSearch!({
        ok: true,
        json: async () => ({ results: mockResults }),
      } as Response);
    });

    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });
  });

  it("should update results after successful search", async () => {
    vi.useRealTimers();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ results: mockResults }),
    });

    const { result } = renderHook(() => useSupermarktSearch());

    act(() => {
      result.current.setQuery("melk");
    });

    await waitFor(() => {
      expect(result.current.results).toEqual(mockResults);
    });
  });

  it("should not search for empty query", () => {
    const { result } = renderHook(() => useSupermarktSearch());

    act(() => {
      result.current.setQuery("");
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
  });

  it("should handle fetch errors gracefully", async () => {
    vi.useRealTimers();
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const { result } = renderHook(() => useSupermarktSearch());

    act(() => {
      result.current.setQuery("melk");
    });

    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });
});
