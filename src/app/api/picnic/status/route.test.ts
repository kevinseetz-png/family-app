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

import { GET, DELETE } from "./route";
import { adminDb } from "@/lib/firebase-admin";
import { verifyToken } from "@/lib/auth";

const mockCollection = vi.mocked(adminDb.collection);
const mockVerifyToken = vi.mocked(verifyToken);

describe("GET /api/picnic/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 without auth", async () => {
    const req = new NextRequest("http://localhost:3000/api/picnic/status");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("should return connected: false when no Picnic auth key exists", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    mockCollection.mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ exists: false }),
      }),
    } as never);

    const req = new NextRequest("http://localhost:3000/api/picnic/status", {
      headers: { Cookie: "auth_token=test-token" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.connected).toBe(false);
  });

  it("should return connected: true when Picnic auth key exists", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    mockCollection.mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ authKey: "picnic-key-123" }),
        }),
      }),
    } as never);

    const req = new NextRequest("http://localhost:3000/api/picnic/status", {
      headers: { Cookie: "auth_token=test-token" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.connected).toBe(true);
  });
});

describe("DELETE /api/picnic/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 without auth", async () => {
    const req = new NextRequest("http://localhost:3000/api/picnic/status", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it("should disconnect Picnic account", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    const mockDelete = vi.fn().mockResolvedValue(undefined);
    mockCollection.mockReturnValue({
      doc: vi.fn().mockReturnValue({
        delete: mockDelete,
      }),
    } as never);

    const req = new NextRequest("http://localhost:3000/api/picnic/status", {
      method: "DELETE",
      headers: { Cookie: "auth_token=test-token" },
    });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    expect(mockDelete).toHaveBeenCalled();
  });
});
