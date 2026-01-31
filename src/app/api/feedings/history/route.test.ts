import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  verifyToken: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn(),
  },
}));

import { GET } from "./route";
import { verifyToken } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

const mockVerifyToken = vi.mocked(verifyToken);
const mockCollection = vi.mocked(adminDb.collection);

function makeRequest(cookie?: string) {
  const url = "http://localhost:3000/api/feedings/history";
  const req = new NextRequest(url);
  if (cookie) {
    req.cookies.set("auth_token", cookie);
  }
  return req;
}

function makeDoc(timestamp: Date, amount: number, familyId = "fam1") {
  return {
    data: () => ({
      familyId,
      timestamp: { toDate: () => timestamp },
      amount,
    }),
  };
}

describe("GET /api/feedings/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when no auth token is present", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("should return 401 when token is invalid", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const res = await GET(makeRequest("bad-token"));
    expect(res.status).toBe(401);
  });

  it("should return empty history when no feedings exist", async () => {
    mockVerifyToken.mockResolvedValue({ id: "u1", name: "Test", familyId: "fam1", email: "t@t.com" });
    mockCollection.mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: [] }),
        }),
      }),
    } as unknown as ReturnType<typeof adminDb.collection>);

    const res = await GET(makeRequest("valid-token"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.history).toEqual([]);
  });

  it("should filter out feedings older than 30 days", async () => {
    mockVerifyToken.mockResolvedValue({ id: "u1", name: "Test", familyId: "fam1", email: "t@t.com" });

    const today = new Date();
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    mockCollection.mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            docs: [
              makeDoc(fiveDaysAgo, 100),
              makeDoc(sixtyDaysAgo, 200),
            ],
          }),
        }),
      }),
    } as unknown as ReturnType<typeof adminDb.collection>);

    const res = await GET(makeRequest("valid-token"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.history).toHaveLength(1);
    expect(data.history[0].totalMl).toBe(100);
  });

  it("should aggregate feedings by day", async () => {
    mockVerifyToken.mockResolvedValue({ id: "u1", name: "Test", familyId: "fam1", email: "t@t.com" });

    // Make these dates recent enough to be within 30 days
    const now = new Date();
    const recent1 = new Date(now);
    recent1.setDate(recent1.getDate() - 2);
    recent1.setHours(10, 0, 0, 0);
    const recent1b = new Date(now);
    recent1b.setDate(recent1b.getDate() - 2);
    recent1b.setHours(14, 0, 0, 0);
    const recent2 = new Date(now);
    recent2.setDate(recent2.getDate() - 1);
    recent2.setHours(9, 0, 0, 0);

    mockCollection.mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            docs: [
              makeDoc(recent1, 100),
              makeDoc(recent1b, 50),
              makeDoc(recent2, 200),
            ],
          }),
        }),
      }),
    } as unknown as ReturnType<typeof adminDb.collection>);

    const res = await GET(makeRequest("valid-token"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.history).toHaveLength(2);

    // Sorted descending by date
    expect(data.history[0].totalMl).toBe(200);
    expect(data.history[0].count).toBe(1);
    expect(data.history[1].totalMl).toBe(150);
    expect(data.history[1].count).toBe(2);
  });

  it("should return sorted history descending by date", async () => {
    mockVerifyToken.mockResolvedValue({ id: "u1", name: "Test", familyId: "fam1", email: "t@t.com" });

    const now = new Date();
    const day1 = new Date(now);
    day1.setDate(day1.getDate() - 5);
    const day2 = new Date(now);
    day2.setDate(day2.getDate() - 1);

    mockCollection.mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            docs: [
              makeDoc(day1, 100),
              makeDoc(day2, 200),
            ],
          }),
        }),
      }),
    } as unknown as ReturnType<typeof adminDb.collection>);

    const res = await GET(makeRequest("valid-token"));
    const data = await res.json();
    expect(data.history[0].date > data.history[1].date).toBe(true);
  });

  it("should return 500 on database error", async () => {
    mockVerifyToken.mockResolvedValue({ id: "u1", name: "Test", familyId: "fam1", email: "t@t.com" });
    mockCollection.mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockRejectedValue(new Error("DB error")),
        }),
      }),
    } as unknown as ReturnType<typeof adminDb.collection>);

    const res = await GET(makeRequest("valid-token"));
    const data = await res.json();
    expect(res.status).toBe(500);
    expect(data.history).toEqual([]);
    expect(data.message).toBe("Failed to fetch feeding history");
  });
});
