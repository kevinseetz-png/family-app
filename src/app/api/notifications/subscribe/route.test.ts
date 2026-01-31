import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  verifyToken: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn(),
  },
}));

vi.mock("@/lib/validation", () => ({
  pushSubscriptionSchema: { safeParse: vi.fn() },
}));

import { POST, DELETE } from "./route";
import { verifyToken } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { pushSubscriptionSchema } from "@/lib/validation";

const mockVerifyToken = vi.mocked(verifyToken);
const mockCollection = vi.mocked(adminDb.collection);
const mockSafeParse = vi.mocked(pushSubscriptionSchema.safeParse);

function makeRequest(method: string, body?: unknown, cookie?: string) {
  const req = new NextRequest("http://localhost:3000/api/notifications/subscribe", {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : undefined,
  });
  if (cookie) req.cookies.set("auth_token", cookie);
  return req;
}

describe("POST /api/notifications/subscribe", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 401 without auth token", async () => {
    const res = await POST(makeRequest("POST", { endpoint: "https://example.com" }));
    expect(res.status).toBe(401);
  });

  it("should return 401 with invalid auth token", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const res = await POST(makeRequest("POST", { endpoint: "https://example.com" }, "bad-token"));
    expect(res.status).toBe(401);
  });

  it("should return 400 with invalid subscription data", async () => {
    mockVerifyToken.mockResolvedValue({ id: "u1", name: "Test", familyId: "fam1", email: "t@t.com", role: "member" });
    mockSafeParse.mockReturnValue({ success: false, error: { issues: [{ message: "Invalid endpoint" }] } } as never);

    const res = await POST(makeRequest("POST", { endpoint: "bad" }, "valid-token"));
    expect(res.status).toBe(400);
  });

  it("should save subscription and return 201", async () => {
    mockVerifyToken.mockResolvedValue({ id: "u1", name: "Test", familyId: "fam1", email: "t@t.com", role: "member" });
    mockSafeParse.mockReturnValue({
      success: true,
      data: {
        endpoint: "https://fcm.googleapis.com/fcm/send/abc",
        keys: { auth: "authkey", p256dh: "p256dhkey" },
      },
    } as never);

    const mockWhere = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: [] }),
      }),
    });
    const mockAdd = vi.fn().mockResolvedValue({ id: "sub1" });
    mockCollection.mockReturnValue({
      where: mockWhere,
      add: mockAdd,
    } as never);

    const res = await POST(makeRequest("POST", {
      endpoint: "https://fcm.googleapis.com/fcm/send/abc",
      keys: { auth: "authkey", p256dh: "p256dhkey" },
    }, "valid-token"));

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe("sub1");
  });

  it("should update existing subscription instead of creating duplicate", async () => {
    mockVerifyToken.mockResolvedValue({ id: "u1", name: "Test", familyId: "fam1", email: "t@t.com", role: "member" });
    mockSafeParse.mockReturnValue({
      success: true,
      data: {
        endpoint: "https://fcm.googleapis.com/fcm/send/abc",
        keys: { auth: "authkey", p256dh: "p256dhkey" },
      },
    } as never);

    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    const mockWhere = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          docs: [{ id: "existing-sub", ref: { update: mockUpdate } }],
        }),
      }),
    });
    mockCollection.mockReturnValue({
      where: mockWhere,
    } as never);

    const res = await POST(makeRequest("POST", {
      endpoint: "https://fcm.googleapis.com/fcm/send/abc",
      keys: { auth: "authkey", p256dh: "p256dhkey" },
    }, "valid-token"));

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe("DELETE /api/notifications/subscribe", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 401 without auth token", async () => {
    const res = await DELETE(makeRequest("DELETE", { endpoint: "https://example.com" }));
    expect(res.status).toBe(401);
  });

  it("should delete subscription and return 200", async () => {
    mockVerifyToken.mockResolvedValue({ id: "u1", name: "Test", familyId: "fam1", email: "t@t.com", role: "member" });

    const mockDelete = vi.fn().mockResolvedValue(undefined);
    const mockWhere = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          docs: [{ ref: { delete: mockDelete } }],
        }),
      }),
    });
    mockCollection.mockReturnValue({ where: mockWhere } as never);

    const res = await DELETE(makeRequest("DELETE", { endpoint: "https://fcm.googleapis.com/fcm/send/abc" }, "valid-token"));
    expect(res.status).toBe(200);
    expect(mockDelete).toHaveBeenCalled();
  });
});
