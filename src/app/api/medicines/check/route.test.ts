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

import { POST } from "./route";
import { adminDb } from "@/lib/firebase-admin";
import { verifyToken } from "@/lib/auth";

const mockCollection = vi.mocked(adminDb.collection);
const mockVerifyToken = vi.mocked(verifyToken);

function makeRequest(body: object) {
  return new NextRequest("http://localhost:3000/api/medicines/check", {
    method: "POST",
    headers: {
      Cookie: "auth_token=test-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/medicines/check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 without auth", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const res = await POST(makeRequest({ medicineId: "med1", date: "2026-01-31" }));
    expect(res.status).toBe(401);
  });

  it("should return 400 with missing medicineId", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    const res = await POST(makeRequest({ date: "2026-01-31" }));
    expect(res.status).toBe(400);
  });

  it("should return 400 with invalid date format", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    const res = await POST(makeRequest({ medicineId: "med1", date: "invalid" }));
    expect(res.status).toBe(400);
  });

  it("should toggle check off when already checked", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    const mockCheckDelete = vi.fn().mockResolvedValue(undefined);
    const mockCheckDoc = {
      id: "check1",
      ref: { delete: mockCheckDelete },
    };

    mockCollection.mockImplementation((name: string) => {
      if (name === "medicines") {
        return {
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              exists: true,
              data: () => ({ familyId: "fam1" }),
            }),
          }),
        } as never;
      }
      if (name === "medicine_checks") {
        return {
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  get: vi.fn().mockResolvedValue({
                    empty: false,
                    docs: [mockCheckDoc],
                  }),
                }),
              }),
            }),
          }),
        } as never;
      }
      return {} as never;
    });

    const res = await POST(makeRequest({ medicineId: "med1", date: "2026-01-31" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.checked).toBe(false);
    expect(mockCheckDelete).toHaveBeenCalled();
  });

  it("should create check when not yet checked", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    const mockAdd = vi.fn().mockResolvedValue({ id: "check1" });

    mockCollection.mockImplementation((name: string) => {
      if (name === "medicines") {
        return {
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              exists: true,
              data: () => ({ familyId: "fam1" }),
            }),
          }),
        } as never;
      }
      if (name === "medicine_checks") {
        return {
          where: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
                }),
              }),
            }),
          }),
          add: mockAdd,
        } as never;
      }
      return {} as never;
    });

    const res = await POST(makeRequest({ medicineId: "med1", date: "2026-01-31" }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.checked).toBe(true);
    expect(data.checkedByName).toBe("Test User");
    expect(mockAdd).toHaveBeenCalled();
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

    const res = await POST(makeRequest({ medicineId: "med1", date: "2026-01-31" }));
    expect(res.status).toBe(404);
  });

  it("should return 403 when medicine belongs to different family", async () => {
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
          data: () => ({ familyId: "fam2" }), // Different family
        }),
      }),
    } as never);

    const res = await POST(makeRequest({ medicineId: "med1", date: "2026-01-31" }));
    expect(res.status).toBe(403);
  });
});
