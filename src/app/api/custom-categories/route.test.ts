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

import { GET, POST, DELETE } from "./route";
import { adminDb } from "@/lib/firebase-admin";
import { verifyToken } from "@/lib/auth";

const mockCollection = vi.mocked(adminDb.collection);
const mockVerifyToken = vi.mocked(verifyToken);

function makeRequest(method: string, body?: object) {
  const url = "http://localhost:3000/api/custom-categories";
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

describe("GET /api/custom-categories", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 401 without auth", async () => {
    const req = new NextRequest("http://localhost:3000/api/custom-categories");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("should return custom categories for family", async () => {
    mockVerifyToken.mockResolvedValue(mockUser);
    mockCollection.mockImplementation((name: string) => {
      if (name === "customCategories") {
        return {
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              docs: [
                {
                  id: "cat1",
                  data: () => ({
                    familyId: "fam1",
                    label: "Huisdier",
                    emoji: "🐕",
                    colorScheme: "groen",
                  }),
                },
              ],
            }),
          }),
        } as never;
      }
      if (name === "categorySettings") {
        return {
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ exists: false }),
          }),
        } as never;
      }
      return {} as never;
    });

    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.categories).toHaveLength(1);
    expect(data.categories[0].label).toBe("Huisdier");
    expect(data.categories[0].id).toBe("cat1");
    expect(data.hiddenBuiltIn).toEqual([]);
  });
});

describe("POST /api/custom-categories", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should create custom category", async () => {
    mockVerifyToken.mockResolvedValue(mockUser);
    const mockAdd = vi.fn().mockResolvedValue({ id: "cat1" });
    mockCollection.mockReturnValue({ add: mockAdd } as never);

    const res = await POST(makeRequest("POST", {
      label: "Huisdier",
      emoji: "🐕",
      colorScheme: "groen",
    }));

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.category.label).toBe("Huisdier");
    expect(data.category.id).toBe("cat1");
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        familyId: "fam1",
        label: "Huisdier",
        emoji: "🐕",
        colorScheme: "groen",
      })
    );
  });

  it("should return 400 for invalid data", async () => {
    mockVerifyToken.mockResolvedValue(mockUser);
    const res = await POST(makeRequest("POST", { label: "" }));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/custom-categories", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should delete custom category", async () => {
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

    const res = await DELETE(makeRequest("DELETE", { id: "cat1" }));
    expect(res.status).toBe(200);
    expect(mockDeleteFn).toHaveBeenCalled();
  });

  it("should return 403 if category belongs to different family", async () => {
    mockVerifyToken.mockResolvedValue(mockUser);
    mockCollection.mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ familyId: "fam2" }),
        }),
      }),
    } as never);

    const res = await DELETE(makeRequest("DELETE", { id: "cat1" }));
    expect(res.status).toBe(403);
  });

  it("should return 404 if category not found", async () => {
    mockVerifyToken.mockResolvedValue(mockUser);
    mockCollection.mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ exists: false }),
      }),
    } as never);

    const res = await DELETE(makeRequest("DELETE", { id: "cat1" }));
    expect(res.status).toBe(404);
  });
});
