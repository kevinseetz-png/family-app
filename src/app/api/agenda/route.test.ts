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

import { GET, POST, PUT, DELETE } from "./route";
import { adminDb } from "@/lib/firebase-admin";
import { verifyToken } from "@/lib/auth";

const mockCollection = vi.mocked(adminDb.collection);
const mockVerifyToken = vi.mocked(verifyToken);

function makeRequest(method: string, body?: object) {
  const url = "http://localhost:3000/api/agenda";
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

const mockUser = {
  id: "user1",
  name: "Test User",
  email: "test@example.com",
  familyId: "fam1",
  role: "member" as const,
};

describe("GET /api/agenda", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 401 without auth", async () => {
    const req = new NextRequest("http://localhost:3000/api/agenda");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("should return events with birthdayGroup and birthYear", async () => {
    mockVerifyToken.mockResolvedValue(mockUser);
    mockCollection.mockReturnValue({
      where: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          docs: [
            {
              id: "event1",
              data: () => ({
                familyId: "fam1",
                title: "Oma's verjaardag",
                description: "",
                category: "verjaardag",
                date: "2026-03-15",
                startTime: null,
                endTime: null,
                allDay: true,
                recurrence: "yearly",
                assignedTo: null,
                birthdayGroup: "Familie",
                birthYear: 1950,
                createdBy: "user1",
                createdByName: "Test User",
                createdAt: { toDate: () => new Date("2026-01-01") },
              }),
            },
          ],
        }),
      }),
    } as never);

    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.events[0].birthdayGroup).toBe("Familie");
    expect(data.events[0].birthYear).toBe(1950);
  });

  it("should default birthdayGroup and birthYear to null for old events", async () => {
    mockVerifyToken.mockResolvedValue(mockUser);
    mockCollection.mockReturnValue({
      where: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          docs: [
            {
              id: "event2",
              data: () => ({
                familyId: "fam1",
                title: "Meeting",
                description: "",
                category: "werk",
                date: "2026-03-15",
                startTime: "09:00",
                endTime: "10:00",
                allDay: false,
                recurrence: "none",
                assignedTo: null,
                createdBy: "user1",
                createdByName: "Test User",
                createdAt: { toDate: () => new Date("2026-01-01") },
              }),
            },
          ],
        }),
      }),
    } as never);

    const res = await GET(makeRequest("GET"));
    const data = await res.json();
    expect(data.events[0].birthdayGroup).toBeNull();
    expect(data.events[0].birthYear).toBeNull();
  });
});

describe("POST /api/agenda", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should create event with birthdayGroup and birthYear", async () => {
    mockVerifyToken.mockResolvedValue(mockUser);
    const mockAdd = vi.fn().mockResolvedValue({ id: "event1" });
    mockCollection.mockReturnValue({ add: mockAdd } as never);

    const res = await POST(makeRequest("POST", {
      title: "Papa's verjaardag",
      category: "verjaardag",
      date: "2026-06-20",
      startTime: null,
      endTime: null,
      allDay: true,
      recurrence: "yearly",
      birthdayGroup: "Familie",
      birthYear: 1975,
    }));

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.event.birthdayGroup).toBe("Familie");
    expect(data.event.birthYear).toBe(1975);

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        birthdayGroup: "Familie",
        birthYear: 1975,
      })
    );
  });

  it("should default birthdayGroup and birthYear to null", async () => {
    mockVerifyToken.mockResolvedValue(mockUser);
    const mockAdd = vi.fn().mockResolvedValue({ id: "event2" });
    mockCollection.mockReturnValue({ add: mockAdd } as never);

    const res = await POST(makeRequest("POST", {
      title: "Meeting",
      category: "werk",
      date: "2026-03-15",
      startTime: "09:00",
      endTime: "10:00",
      allDay: false,
    }));

    expect(res.status).toBe(201);
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        birthdayGroup: null,
        birthYear: null,
      })
    );
  });
});

describe("PUT /api/agenda", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should update birthdayGroup and birthYear", async () => {
    mockVerifyToken.mockResolvedValue(mockUser);
    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    mockCollection.mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ familyId: "fam1" }),
        }),
        update: mockUpdate,
      }),
    } as never);

    const res = await PUT(makeRequest("PUT", {
      id: "event1",
      birthdayGroup: "Vrienden",
      birthYear: 1990,
    }));

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        birthdayGroup: "Vrienden",
        birthYear: 1990,
      })
    );
  });
});

describe("DELETE /api/agenda", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 401 without auth", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const res = await DELETE(makeRequest("DELETE", { id: "event1" }));
    expect(res.status).toBe(401);
  });

  it("should delete event", async () => {
    mockVerifyToken.mockResolvedValue(mockUser);
    const mockDeleteFn = vi.fn().mockResolvedValue(undefined);
    mockCollection.mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ familyId: "fam1" }),
        }),
        delete: mockDeleteFn,
      }),
    } as never);

    const res = await DELETE(makeRequest("DELETE", { id: "event1" }));
    expect(res.status).toBe(200);
    expect(mockDeleteFn).toHaveBeenCalled();
  });
});
