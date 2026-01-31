import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock navigator.serviceWorker
const mockSubscribe = vi.fn();
const mockGetSubscription = vi.fn();
const mockRegistration = {
  pushManager: {
    subscribe: mockSubscribe,
    getSubscription: mockGetSubscription,
  },
};

vi.stubGlobal("navigator", {
  serviceWorker: {
    ready: Promise.resolve(mockRegistration),
  },
});

vi.stubGlobal("Notification", {
  permission: "default",
  requestPermission: vi.fn(),
});

// Stub PushManager so isSupported is true
vi.stubGlobal("PushManager", class {});

import { useNotifications } from "./useNotifications";

describe("useNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSubscription.mockResolvedValue(null);
    (Notification as unknown as { permission: string }).permission = "default";
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.isSupported).toBeDefined();
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.permission).toBe("default");
  });

  it("should detect existing subscription on mount", async () => {
    const mockSub = {
      endpoint: "https://fcm.googleapis.com/fcm/send/abc",
      toJSON: () => ({
        endpoint: "https://fcm.googleapis.com/fcm/send/abc",
        keys: { auth: "a", p256dh: "p" },
      }),
    };
    mockGetSubscription.mockResolvedValue(mockSub);
    (Notification as unknown as { permission: string }).permission = "granted";

    const { result } = renderHook(() => useNotifications());

    await vi.waitFor(() => {
      expect(result.current.isSubscribed).toBe(true);
    });
  });

  it("should subscribe successfully", async () => {
    (Notification as unknown as { permission: string }).permission = "granted";
    (Notification.requestPermission as ReturnType<typeof vi.fn>).mockResolvedValue("granted");

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ publicKey: "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkOs-qy10PnGGmaijIYsv5hVCEET-HSAFE7Ac_CnmA" }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: "sub1" }) });

    const mockSub = {
      endpoint: "https://fcm.googleapis.com/fcm/send/abc",
      toJSON: () => ({
        endpoint: "https://fcm.googleapis.com/fcm/send/abc",
        keys: { auth: "a", p256dh: "p" },
      }),
    };
    mockSubscribe.mockResolvedValue(mockSub);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockSubscribe).toHaveBeenCalled();
    expect(result.current.isSubscribed).toBe(true);
  });

  it("should unsubscribe successfully", async () => {
    const mockUnsubscribe = vi.fn().mockResolvedValue(true);
    const mockSub = {
      endpoint: "https://fcm.googleapis.com/fcm/send/abc",
      unsubscribe: mockUnsubscribe,
      toJSON: () => ({
        endpoint: "https://fcm.googleapis.com/fcm/send/abc",
        keys: { auth: "a", p256dh: "p" },
      }),
    };
    mockGetSubscription.mockResolvedValue(mockSub);
    (Notification as unknown as { permission: string }).permission = "granted";

    mockFetch.mockResolvedValueOnce({ ok: true });

    const { result } = renderHook(() => useNotifications());

    await vi.waitFor(() => {
      expect(result.current.isSubscribed).toBe(true);
    });

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(result.current.isSubscribed).toBe(false);
  });
});
