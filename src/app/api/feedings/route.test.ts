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

function makeRequest(cookie?: string) {
  const req = new NextRequest("http://localhost:3000/api/feedings");
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

describe("GET /api/feedings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return lastFeedingTimestamp from most recent feeding across all days", async () => {
    mockVerifyToken.mockResolvedValue({ id: "u1", name: "Test", familyId: "fam1", email: "t@t.com", role: "member" });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(22, 0, 0, 0);

    const today = new Date();
    today.setHours(8, 0, 0, 0);

    mockCollection.mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            docs: [
              makeDoc("f1", yesterday),
              makeDoc("f2", today),
            ],
          }),
        }),
      }),
    } as unknown as ReturnType<typeof adminDb.collection>);

    const res = await GET(makeRequest("valid-token"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.lastFeedingTimestamp).toBe(today.toISOString());
  });

  it("should return lastFeedingTimestamp even when no feedings are from today", async () => {
    mockVerifyToken.mockResolvedValue({ id: "u1", name: "Test", familyId: "fam1", email: "t@t.com", role: "member" });

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    mockCollection.mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            docs: [makeDoc("f1", twoDaysAgo)],
          }),
        }),
      }),
    } as unknown as ReturnType<typeof adminDb.collection>);

    const res = await GET(makeRequest("valid-token"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.feedings).toHaveLength(0);
    expect(data.lastFeedingTimestamp).toBe(twoDaysAgo.toISOString());
  });

  it("should return null lastFeedingTimestamp when no feedings exist", async () => {
    mockVerifyToken.mockResolvedValue({ id: "u1", name: "Test", familyId: "fam1", email: "t@t.com", role: "member" });

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
    expect(data.lastFeedingTimestamp).toBeNull();
    expect(data.feedings).toHaveLength(0);
  });
});
