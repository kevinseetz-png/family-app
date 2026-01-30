import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "./useAuth";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });
  });

  it("initially has user as null", async () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("finishes loading with no user when /me returns not ok", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("restores session from cookie on mount", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: "1", name: "A", email: "a@a.com" } }),
    });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toEqual({ id: "1", name: "A", email: "a@a.com" });
  });

  it("handles session restore failure gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network"));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("login sets user on success", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: "1", name: "A", email: "a@a.com" } }),
    });

    let loginResult: string | null = null;
    await act(async () => {
      loginResult = await result.current.login("a@a.com", "pw");
    });
    expect(loginResult).toBeNull();
    expect(result.current.user).toEqual({ id: "1", name: "A", email: "a@a.com" });
  });

  it("login returns error message on failure", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Bad creds" }),
    });

    let loginResult: string | null = null;
    await act(async () => {
      loginResult = await result.current.login("a@a.com", "wrong");
    });
    expect(loginResult).toBe("Bad creds");
  });

  it("register sets user on success", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: "2", name: "B", email: "b@b.com" } }),
    });

    let regResult: string | null = null;
    await act(async () => {
      regResult = await result.current.register("B", "b@b.com", "password123", "INVITE1");
    });
    expect(regResult).toBeNull();
    expect(result.current.user).toEqual({ id: "2", name: "B", email: "b@b.com" });
  });

  it("register returns error on failure", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Email taken" }),
    });

    let regResult: string | null = null;
    await act(async () => {
      regResult = await result.current.register("B", "b@b.com", "pw", "INVITE1");
    });
    expect(regResult).toBe("Email taken");
  });

  it("logout calls /api/auth/logout and clears user", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // First login
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: "1", name: "A", email: "a@a.com" } }),
    });
    await act(async () => { await result.current.login("a@a.com", "pw"); });

    // Logout
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await act(async () => { await result.current.logout(); });
    expect(result.current.user).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
  });
});
