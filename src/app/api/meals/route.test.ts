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
  const url = "http://localhost:3000/api/meals";
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

describe("GET /api/meals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 without auth token", async () => {
    const req = new NextRequest("http://localhost:3000/api/meals");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("should return 401 with invalid token", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("should return meals list", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    const mockMeals = [
      {
        id: "meal1",
        data: () => ({
          name: "Spaghetti Bolognese",
          ingredients: "pasta, tomaat, gehakt",
          instructions: "Kook de pasta...",
          createdBy: "user1",
          createdByName: "Test User",
          createdAt: { toDate: () => new Date("2026-01-01") },
        }),
      },
    ];

    mockCollection.mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: mockMeals }),
        }),
      }),
    } as never);

    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.meals).toHaveLength(1);
    expect(data.meals[0].name).toBe("Spaghetti Bolognese");
  });
});

describe("POST /api/meals", () => {
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

  it("should create a new meal", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    const mockAdd = vi.fn().mockResolvedValue({ id: "meal1" });
    mockCollection.mockReturnValue({ add: mockAdd } as never);

    const res = await POST(
      makeRequest("POST", {
        name: "Pizza Margherita",
        ingredients: "deeg, tomaat, mozzarella",
        instructions: "Verwarm de oven...",
        sourceDay: "mon",
      })
    );

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.meal.name).toBe("Pizza Margherita");
    expect(data.meal.ingredients).toBe("deeg, tomaat, mozzarella");
  });

  it("should create meal with empty ingredients and instructions", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    const mockAdd = vi.fn().mockResolvedValue({ id: "meal1" });
    mockCollection.mockReturnValue({ add: mockAdd } as never);

    const res = await POST(makeRequest("POST", { name: "Quick Meal" }));

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.meal.name).toBe("Quick Meal");
    expect(data.meal.ingredients).toBe("");
    expect(data.meal.instructions).toBe("");
  });
});

describe("PUT /api/meals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 without auth", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const res = await PUT(makeRequest("PUT", { id: "meal1", name: "Updated" }));
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

  it("should return 404 when meal not found", async () => {
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

    const res = await PUT(makeRequest("PUT", { id: "meal1", name: "Updated" }));
    expect(res.status).toBe(404);
  });

  it("should update meal", async () => {
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
        id: "meal1",
        name: "Updated Meal",
        ingredients: "new ingredients",
        instructions: "new instructions",
      })
    );

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe("DELETE /api/meals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 without auth", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const res = await DELETE(makeRequest("DELETE", { id: "meal1" }));
    expect(res.status).toBe(401);
  });

  it("should return 404 when meal not found", async () => {
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

    const res = await DELETE(makeRequest("DELETE", { id: "meal1" }));
    expect(res.status).toBe(404);
  });

  it("should delete meal", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    const mockDelete = vi.fn().mockResolvedValue(undefined);
    mockCollection.mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ familyId: "fam1" }),
        }),
        delete: mockDelete,
      }),
    } as never);

    const res = await DELETE(makeRequest("DELETE", { id: "meal1" }));
    expect(res.status).toBe(200);
    expect(mockDelete).toHaveBeenCalled();
  });
});
