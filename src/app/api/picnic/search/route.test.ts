import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  verifyToken: vi.fn(),
}));

vi.mock("@/lib/picnic-client", () => ({
  getPicnicClientForFamily: vi.fn(),
  handlePicnicAuthError: vi.fn().mockResolvedValue(false),
}));

import { GET } from "./route";
import { verifyToken } from "@/lib/auth";
import { getPicnicClientForFamily } from "@/lib/picnic-client";

const mockVerifyToken = vi.mocked(verifyToken);
const mockGetPicnicClient = vi.mocked(getPicnicClientForFamily);

function makeRequest(query?: string) {
  const url = query
    ? `http://localhost:3000/api/picnic/search?query=${encodeURIComponent(query)}`
    : "http://localhost:3000/api/picnic/search";
  return new NextRequest(url, {
    method: "GET",
    headers: { Cookie: "auth_token=test-token" },
  });
}

describe("GET /api/picnic/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 without auth", async () => {
    const req = new NextRequest("http://localhost:3000/api/picnic/search?query=melk");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("should return 400 without query param", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });
    const res = await GET(makeRequest());
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

    const res = await GET(makeRequest("melk"));
    expect(res.status).toBe(403);
  });

  it("should return search results from Picnic", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    const mockSearch = vi.fn().mockResolvedValue([
      {
        id: "p1",
        name: "Halfvolle melk",
        image_id: "img1",
        display_price: "139",
        unit_quantity: "1 L",
        max_count: 50,
      },
    ]);

    mockGetPicnicClient.mockResolvedValue({
      search: mockSearch,
    } as never);

    const res = await GET(makeRequest("melk"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.products).toHaveLength(1);
    expect(data.products[0].name).toBe("Halfvolle melk");
  });
});
