import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "./useAuth";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useAuth register with invite code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });
  });

  it("register sends inviteCode in the request body", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: "1", name: "A", email: "a@a.com" } }),
    });

    await act(async () => {
      await result.current.register("A", "a@a.com", "password123", "INVITE1");
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "A", email: "a@a.com", password: "password123", inviteCode: "INVITE1" }),
    });
  });

  it("register returns error for invalid invite code", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Invalid or expired invite code" }),
    });

    let regResult: string | null = null;
    await act(async () => {
      regResult = await result.current.register("B", "b@b.com", "password123", "BADCODE");
    });
    expect(regResult).toBe("Invalid or expired invite code");
  });
});
