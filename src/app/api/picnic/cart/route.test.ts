import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  verifyToken: vi.fn(),
}));

vi.mock("@/lib/picnic-client", () => ({
  getPicnicClientForFamily: vi.fn(),
  handlePicnicAuthError: vi.fn().mockResolvedValue(false),
}));

import { GET, POST, DELETE } from "./route";
import { verifyToken } from "@/lib/auth";
import { getPicnicClientForFamily } from "@/lib/picnic-client";

const mockVerifyToken = vi.mocked(verifyToken);
const mockGetPicnicClient = vi.mocked(getPicnicClientForFamily);

function makeRequest(method: string, body?: object) {
  const url = "http://localhost:3000/api/picnic/cart";
  const headers: Record<string, string> = { Cookie: "auth_token=test-token" };
  if (body) {
    headers["Content-Type"] = "application/json";
  }
  return new NextRequest(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/picnic/cart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 without auth", async () => {
    const req = new NextRequest("http://localhost:3000/api/picnic/cart");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("should return 403 when not connected to Picnic", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    mockGetPicnicClient.mockResolvedValue(null);

    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(403);
  });
});

describe("POST /api/picnic/cart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 without auth", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const res = await POST(makeRequest("POST", { productId: "p1", count: 1 }));
    expect(res.status).toBe(401);
  });

  it("should return 400 with missing productId", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });
    const res = await POST(makeRequest("POST", {}));
    expect(res.status).toBe(400);
  });

  it("should return 403 when not connected to Picnic", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    mockGetPicnicClient.mockResolvedValue(null);

    const res = await POST(makeRequest("POST", { productId: "p1", count: 1 }));
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/picnic/cart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 without auth", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const res = await DELETE(makeRequest("DELETE", { productId: "p1" }));
    expect(res.status).toBe(401);
  });

  it("should return 400 with missing productId", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });
    const res = await DELETE(makeRequest("DELETE", {}));
    expect(res.status).toBe(400);
  });
});
