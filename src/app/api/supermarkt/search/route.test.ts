import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  verifyToken: vi.fn(),
}));

vi.mock("@/lib/supermarkt/index", () => ({
  searchAllSupermarkten: vi.fn(),
}));

import { GET } from "./route";
import { verifyToken } from "@/lib/auth";
import { searchAllSupermarkten } from "@/lib/supermarkt/index";

const mockVerifyToken = vi.mocked(verifyToken);
const mockSearchAll = vi.mocked(searchAllSupermarkten);

function makeRequest(query?: string) {
  const url = query
    ? `http://localhost:3000/api/supermarkt/search?query=${encodeURIComponent(query)}`
    : "http://localhost:3000/api/supermarkt/search";
  return new NextRequest(url, {
    method: "GET",
    headers: { Cookie: "auth_token=test-token" },
  });
}

const mockUser = {
  id: "user1",
  name: "Test User",
  email: "test@example.com",
  familyId: "fam1",
  role: "member" as const,
};

describe("GET /api/supermarkt/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 without auth token", async () => {
    const req = new NextRequest("http://localhost:3000/api/supermarkt/search?query=melk");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("should return 401 with invalid token", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const res = await GET(makeRequest("melk"));
    expect(res.status).toBe(401);
  });

  it("should return 400 without query param", async () => {
    mockVerifyToken.mockResolvedValue(mockUser);
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
  });

  it("should return 400 with empty query", async () => {
    mockVerifyToken.mockResolvedValue(mockUser);
    const res = await GET(makeRequest(""));
    expect(res.status).toBe(400);
  });

  it("should return 400 with query too long", async () => {
    mockVerifyToken.mockResolvedValue(mockUser);
    const longQuery = "a".repeat(101);
    const res = await GET(makeRequest(longQuery));
    expect(res.status).toBe(400);
  });

  it("should return search results on valid request", async () => {
    mockVerifyToken.mockResolvedValue(mockUser);
    mockSearchAll.mockResolvedValue([
      {
        supermarkt: "ah",
        label: "Albert Heijn",
        products: [
          {
            id: "ah-1",
            name: "AH Melk",
            price: 139,
            displayPrice: "€ 1,39",
            unitQuantity: "1 L",
            imageUrl: null,
            supermarkt: "ah",
          },
        ],
        error: null,
      },
    ]);

    const res = await GET(makeRequest("melk"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.results).toHaveLength(1);
    expect(data.results[0].supermarkt).toBe("ah");
    expect(data.results[0].products).toHaveLength(1);
  });

  it("should pass familyId to searchAllSupermarkten", async () => {
    mockVerifyToken.mockResolvedValue(mockUser);
    mockSearchAll.mockResolvedValue([]);

    await GET(makeRequest("melk"));
    expect(mockSearchAll).toHaveBeenCalledWith("melk", "fam1");
  });

  it("should return 500 on unexpected error", async () => {
    mockVerifyToken.mockResolvedValue(mockUser);
    mockSearchAll.mockRejectedValue(new Error("Unexpected"));

    const res = await GET(makeRequest("melk"));
    expect(res.status).toBe(500);
  });
});
