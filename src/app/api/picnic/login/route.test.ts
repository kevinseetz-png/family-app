import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  verifyToken: vi.fn(),
}));

const mockState = vi.hoisted(() => ({
  login: vi.fn(),
  authKey: null as string | null,
}));

vi.mock("@/lib/picnic-client", () => ({
  createPicnicClient: vi.fn().mockImplementation(() => ({
    login: mockState.login,
    get authKey() { return mockState.authKey; },
  })),
}));

vi.mock("@/lib/encryption", () => ({
  encrypt: vi.fn().mockImplementation((val: string) => `encrypted:${val}`),
}));

import { POST } from "./route";
import { adminDb } from "@/lib/firebase-admin";
import { verifyToken } from "@/lib/auth";

const mockCollection = vi.mocked(adminDb.collection);
const mockVerifyToken = vi.mocked(verifyToken);

function makeRequest(body?: object) {
  const url = "http://localhost:3000/api/picnic/login";
  const headers: Record<string, string> = { Cookie: "auth_token=test-token" };
  if (body) {
    headers["Content-Type"] = "application/json";
  }
  return new NextRequest(url, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("POST /api/picnic/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.authKey = null;
  });

  it("should return 401 without auth token", async () => {
    const req = new NextRequest("http://localhost:3000/api/picnic/login", {
      method: "POST",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should return 401 with invalid token", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const res = await POST(makeRequest({ username: "test@test.com", password: "pass" }));
    expect(res.status).toBe(401);
  });

  it("should return 400 with missing credentials", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("should login successfully and store auth key", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    mockState.login.mockImplementation(async () => {
      mockState.authKey = "picnic-auth-key-123";
      return {
        user_id: "picnic-user-1",
        second_factor_authentication_required: false,
        authKey: "picnic-auth-key-123",
      };
    });

    const mockSet = vi.fn().mockResolvedValue(undefined);
    mockCollection.mockReturnValue({
      doc: vi.fn().mockReturnValue({
        set: mockSet,
      }),
    } as never);

    const res = await POST(makeRequest({ username: "user@picnic.nl", password: "picnicpass" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.connected).toBe(true);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        authKey: "encrypted:picnic-auth-key-123",
      })
    );
  });

  it("should return 401 when Picnic login fails", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    mockState.login.mockRejectedValue(new Error("Invalid credentials"));

    const res = await POST(makeRequest({ username: "bad@picnic.nl", password: "wrong" }));
    expect(res.status).toBe(401);
  });
});
