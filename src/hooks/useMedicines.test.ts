import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useMedicines } from "./useMedicines";

/**
 * @vitest-environment jsdom
 */

describe("useMedicines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("should start with loading state", () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ medicines: [] }),
    });

    const { result } = renderHook(() => useMedicines("fam1"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.medicines).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should not fetch when familyId is undefined", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    const { result } = renderHook(() => useMedicines(undefined));

    // Wait a bit to ensure no fetch happens
    await new Promise((r) => setTimeout(r, 50));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(true);
  });

  it("should fetch medicines from /api/medicines", async () => {
    const mockMedicines = [
      {
        id: "med1",
        familyId: "fam1",
        name: "Paracetamol",
        reminderHour: 9,
        reminderMinute: 0,
        active: true,
        createdBy: "user1",
        createdByName: "Test User",
        createdAt: "2026-01-01T00:00:00Z",
        checkedToday: true,
        checkedByName: "Test User",
      },
      {
        id: "med2",
        familyId: "fam1",
        name: "Ibuprofen",
        reminderHour: 21,
        reminderMinute: 30,
        active: true,
        createdBy: "user1",
        createdByName: "Test User",
        createdAt: "2026-01-01T00:00:00Z",
        checkedToday: false,
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ medicines: mockMedicines }),
    });

    const { result } = renderHook(() => useMedicines("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.medicines).toHaveLength(2);
    expect(result.current.medicines[0].name).toBe("Paracetamol");
    expect(result.current.medicines[0].checkedToday).toBe(true);
    expect(result.current.medicines[1].name).toBe("Ibuprofen");
    expect(result.current.medicines[1].checkedToday).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should handle fetch error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "Server error" }),
    });

    const { result } = renderHook(() => useMedicines("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Server error");
    expect(result.current.medicines).toEqual([]);
  });

  it("should handle network error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network failed"));

    const { result } = renderHook(() => useMedicines("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to load medicines");
    expect(result.current.medicines).toEqual([]);
  });

  it("should add a new medicine via addMedicine", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    // Initial fetch
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ medicines: [] }),
    });

    const { result } = renderHook(() => useMedicines("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // POST to create
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        medicine: {
          id: "med1",
          name: "New Medicine",
          reminderHour: 10,
          reminderMinute: 0,
        },
      }),
    });

    // Refetch after create
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        medicines: [
          {
            id: "med1",
            name: "New Medicine",
            reminderHour: 10,
            reminderMinute: 0,
            active: true,
            checkedToday: false,
          },
        ],
      }),
    });

    await result.current.addMedicine("New Medicine", 10, 0);

    await waitFor(() => {
      expect(result.current.medicines).toHaveLength(1);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/medicines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Medicine", reminderHour: 10, reminderMinute: 0 }),
    });
  });

  it("should update a medicine via updateMedicine", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    // Initial fetch
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        medicines: [
          {
            id: "med1",
            name: "Old Name",
            reminderHour: 9,
            reminderMinute: 0,
            active: true,
            checkedToday: false,
          },
        ],
      }),
    });

    const { result } = renderHook(() => useMedicines("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // PUT to update
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Refetch after update
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        medicines: [
          {
            id: "med1",
            name: "New Name",
            reminderHour: 10,
            reminderMinute: 30,
            active: false,
            checkedToday: false,
          },
        ],
      }),
    });

    await result.current.updateMedicine("med1", {
      name: "New Name",
      reminderHour: 10,
      reminderMinute: 30,
      active: false,
    });

    await waitFor(() => {
      expect(result.current.medicines[0].name).toBe("New Name");
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/medicines", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "med1",
        name: "New Name",
        reminderHour: 10,
        reminderMinute: 30,
        active: false,
      }),
    });
  });

  it("should delete a medicine via deleteMedicine", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    // Initial fetch
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        medicines: [
          {
            id: "med1",
            name: "To Delete",
            reminderHour: 9,
            reminderMinute: 0,
            active: true,
            checkedToday: false,
          },
        ],
      }),
    });

    const { result } = renderHook(() => useMedicines("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.medicines).toHaveLength(1);

    // DELETE
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Refetch after delete
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ medicines: [] }),
    });

    await result.current.deleteMedicine("med1");

    await waitFor(() => {
      expect(result.current.medicines).toHaveLength(0);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/medicines", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "med1" }),
    });
  });

  it("should toggle check via toggleCheck", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    // Initial fetch
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        medicines: [
          {
            id: "med1",
            name: "Test Med",
            reminderHour: 9,
            reminderMinute: 0,
            active: true,
            checkedToday: false,
          },
        ],
      }),
    });

    const { result } = renderHook(() => useMedicines("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.medicines[0].checkedToday).toBe(false);

    // POST to toggle check
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ checked: true, checkedByName: "Test User" }),
    });

    // Refetch after toggle
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        medicines: [
          {
            id: "med1",
            name: "Test Med",
            reminderHour: 9,
            reminderMinute: 0,
            active: true,
            checkedToday: true,
            checkedByName: "Test User",
          },
        ],
      }),
    });

    await result.current.toggleCheck("med1");

    await waitFor(() => {
      expect(result.current.medicines[0].checkedToday).toBe(true);
    });
  });

  it("should throw error when addMedicine fails", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    // Initial fetch
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ medicines: [] }),
    });

    const { result } = renderHook(() => useMedicines("fam1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // POST fails
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Name is required" }),
    });

    await expect(result.current.addMedicine("", 10, 0)).rejects.toThrow("Name is required");
  });
});
