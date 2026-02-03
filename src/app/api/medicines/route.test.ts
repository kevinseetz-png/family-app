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
  const url = "http://localhost:3000/api/medicines";
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

describe("GET /api/medicines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 without auth token", async () => {
    const req = new NextRequest("http://localhost:3000/api/medicines");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("should return 401 with invalid token", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("should return medicines list with today check status", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    const mockMedicines = [
      {
        id: "med1",
        data: () => ({
          name: "Paracetamol",
          reminderHour: 9,
          reminderMinute: 0,
          active: true,
          createdBy: "user1",
          createdByName: "Test User",
          createdAt: { toDate: () => new Date("2026-01-01") },
        }),
      },
    ];

    const mockChecks = [
      {
        id: "check1",
        data: () => ({
          medicineId: "med1",
          checkedByName: "Test User",
        }),
      },
    ];

    mockCollection.mockImplementation((name: string) => {
      if (name === "medicines") {
        return {
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({ docs: mockMedicines }),
            }),
          }),
        } as never;
      }
      if (name === "medicine_checks") {
        return {
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({ docs: mockChecks }),
            }),
          }),
        } as never;
      }
      return {} as never;
    });

    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.medicines).toHaveLength(1);
    expect(data.medicines[0].name).toBe("Paracetamol");
    expect(data.medicines[0].checkedToday).toBe(true);
    expect(data.medicines[0].checkedByName).toBe("Test User");
  });
});

describe("POST /api/medicines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 without auth", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const res = await POST(makeRequest("POST", { name: "Test" }));
    expect(res.status).toBe(401);
  });

  it("should return 400 with missing name", async () => {
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

  it("should create a new medicine with default reminder time", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    const mockAdd = vi.fn().mockResolvedValue({ id: "med1" });
    mockCollection.mockReturnValue({ add: mockAdd } as never);

    const res = await POST(
      makeRequest("POST", {
        name: "Ibuprofen",
        reminderHour: 8,
        reminderMinute: 30,
      })
    );

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.medicine.name).toBe("Ibuprofen");
    expect(data.medicine.reminderHour).toBe(8);
    expect(data.medicine.reminderMinute).toBe(30);
  });
});

describe("PUT /api/medicines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 without auth", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const res = await PUT(makeRequest("PUT", { id: "med1", name: "Updated" }));
    expect(res.status).toBe(401);
  });

  it("should return 400 with missing id", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });
    const res = await PUT(makeRequest("PUT", { name: "Updated" }));
    expect(res.status).toBe(400);
  });

  it("should return 404 when medicine not found", async () => {
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

    const res = await PUT(makeRequest("PUT", { id: "med1", name: "Updated" }));
    expect(res.status).toBe(404);
  });

  it("should update medicine", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

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

    const res = await PUT(
      makeRequest("PUT", {
        id: "med1",
        name: "Updated Medicine",
        reminderHour: 10,
        reminderMinute: 15,
        active: false,
      })
    );

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe("DELETE /api/medicines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 without auth", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const res = await DELETE(makeRequest("DELETE", { id: "med1" }));
    expect(res.status).toBe(401);
  });

  it("should return 404 when medicine not found", async () => {
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

    const res = await DELETE(makeRequest("DELETE", { id: "med1" }));
    expect(res.status).toBe(404);
  });

  it("should delete medicine and its checks", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    const mockDelete = vi.fn().mockResolvedValue(undefined);
    const mockCheckDocs = [
      { ref: { delete: vi.fn().mockResolvedValue(undefined) } },
    ];

    mockCollection.mockImplementation((name: string) => {
      if (name === "medicines") {
        return {
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              exists: true,
              data: () => ({ familyId: "fam1" }),
            }),
            delete: mockDelete,
          }),
        } as never;
      }
      if (name === "medicine_checks") {
        return {
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ docs: mockCheckDocs }),
          }),
        } as never;
      }
      return {} as never;
    });

    const res = await DELETE(makeRequest("DELETE", { id: "med1" }));
    expect(res.status).toBe(200);
    expect(mockDelete).toHaveBeenCalled();
  });
});
