import { renderHook, act } from "@testing-library/react";
import { useInstallPrompt } from "./useInstallPrompt";

describe("useInstallPrompt", () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    matchMediaMock = vi.fn().mockReturnValue({ matches: false });
    Object.defineProperty(window, "matchMedia", { value: matchMediaMock, writable: true });
  });

  it("starts with isInstallable false and isInstalled false", () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.isInstallable).toBe(false);
    expect(result.current.isInstalled).toBe(false);
  });

  it("detects standalone mode as installed", () => {
    matchMediaMock.mockReturnValue({ matches: true });
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.isInstalled).toBe(true);
    expect(result.current.isInstallable).toBe(false);
  });

  it("becomes installable on beforeinstallprompt event", () => {
    const { result } = renderHook(() => useInstallPrompt());
    act(() => {
      const event = new Event("beforeinstallprompt");
      (event as unknown as Record<string, unknown>).prompt = vi.fn().mockResolvedValue(undefined);
      (event as unknown as Record<string, unknown>).userChoice = Promise.resolve({ outcome: "dismissed" });
      window.dispatchEvent(event);
    });
    expect(result.current.isInstallable).toBe(true);
  });

  it("install calls prompt and returns true on accepted", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const promptMock = vi.fn().mockResolvedValue(undefined);

    act(() => {
      const event = new Event("beforeinstallprompt");
      (event as unknown as Record<string, unknown>).prompt = promptMock;
      (event as unknown as Record<string, unknown>).userChoice = Promise.resolve({ outcome: "accepted" });
      window.dispatchEvent(event);
    });

    let installResult: boolean | undefined;
    await act(async () => {
      installResult = await result.current.install();
    });
    expect(promptMock).toHaveBeenCalled();
    expect(installResult).toBe(true);
    expect(result.current.isInstalled).toBe(true);
    expect(result.current.isInstallable).toBe(false);
  });

  it("install returns false when dismissed", async () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      const event = new Event("beforeinstallprompt");
      (event as unknown as Record<string, unknown>).prompt = vi.fn().mockResolvedValue(undefined);
      (event as unknown as Record<string, unknown>).userChoice = Promise.resolve({ outcome: "dismissed" });
      window.dispatchEvent(event);
    });

    let installResult: boolean | undefined;
    await act(async () => {
      installResult = await result.current.install();
    });
    expect(installResult).toBe(false);
  });

  it("install returns false when no deferred prompt", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    let installResult: boolean | undefined;
    await act(async () => {
      installResult = await result.current.install();
    });
    expect(installResult).toBe(false);
  });
});
