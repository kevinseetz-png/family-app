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
  feedingSchema: { safeParse: vi.fn() },
  feedingUpdateSchema: { safeParse: vi.fn() },
}));

import { GET } from "./route";
import { verifyToken } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

const mockVerifyToken = vi.mocked(verifyToken);
const mockCollection = vi.mocked(adminDb.collection);

function makeRequest(cookie?: string, date?: string) {
  const url = date
    ? `http://localhost:3000/api/feedings?date=${date}`
    : "http://localhost:3000/api/feedings";
  const req = new NextRequest(url);
  if (cookie) req.cookies.set("auth_token", cookie);
  return req;
}

function makeDoc(id: string, timestamp: Date, familyId = "fam1") {
  return {
    id,
    data: () => ({
      familyId,
      foodType: "formula",
      amount: 100,
      unit: "ml",
      loggedBy: "u1",
      loggedByName: "Test",
      timestamp: { toDate: () => timestamp },
      createdAt: { toDate: () => timestamp },
    }),
  };
}

function mockDbWith(docs: ReturnType<typeof makeDoc>[]) {
  mockCollection.mockReturnValue({
    where: vi.fn().mockReturnValue({
      limit: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs }),
      }),
    }),
  } as unknown as ReturnType<typeof adminDb.collection>);
}

describe("GET /api/feedings?date=", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return feedings for a specific date when date param is provided", async () => {
    mockVerifyToken.mockResolvedValue({ id: "u1", name: "Test", familyId: "fam1", email: "t@t.com", role: "member" });

    const targetDate = new Date("2025-03-15T10:00:00Z");
    const otherDate = new Date("2025-03-14T10:00:00Z");

    mockDbWith([
      makeDoc("f1", targetDate),
      makeDoc("f2", otherDate),
    ]);

    const res = await GET(makeRequest("valid-token", "2025-03-15"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.feedings).toHaveLength(1);
    expect(data.feedings[0].id).toBe("f1");
  });

  it("should return empty feedings array for date with no feedings", async () => {
    mockVerifyToken.mockResolvedValue({ id: "u1", name: "Test", familyId: "fam1", email: "t@t.com", role: "member" });

    const otherDate = new Date("2025-03-14T10:00:00Z");
    mockDbWith([makeDoc("f1", otherDate)]);

    const res = await GET(makeRequest("valid-token", "2025-03-16"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.feedings).toHaveLength(0);
  });

  it("should return 400 for invalid date format", async () => {
    mockVerifyToken.mockResolvedValue({ id: "u1", name: "Test", familyId: "fam1", email: "t@t.com", role: "member" });

    const res = await GET(makeRequest("valid-token", "not-a-date"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/invalid date/i);
  });

  it("should not return lastFeedingTimestamp when date param is provided", async () => {
    mockVerifyToken.mockResolvedValue({ id: "u1", name: "Test", familyId: "fam1", email: "t@t.com", role: "member" });

    const targetDate = new Date("2025-03-15T10:00:00Z");
    mockDbWith([makeDoc("f1", targetDate)]);

    const res = await GET(makeRequest("valid-token", "2025-03-15"));
    const data = await res.json();
    expect(data.lastFeedingTimestamp).toBeUndefined();
  });
});
