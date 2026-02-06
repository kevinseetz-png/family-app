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

vi.mock("@/lib/push", () => ({
  sendNotificationToFamily: vi.fn().mockResolvedValue(undefined),
}));

import { GET, POST, PUT, DELETE } from "./route";
import { adminDb } from "@/lib/firebase-admin";
import { verifyToken } from "@/lib/auth";

const mockCollection = vi.mocked(adminDb.collection);
const mockVerifyToken = vi.mocked(verifyToken);

function makeRequest(method: string, body?: object) {
  const url = "http://localhost:3000/api/klusjes";
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

describe("GET /api/klusjes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 without auth token", async () => {
    const req = new NextRequest("http://localhost:3000/api/klusjes");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("should return 401 with invalid token", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("should return klusjes list", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    const mockItems = [
      {
        id: "klusje1",
        data: () => ({
          name: "Stofzuigen",
          checked: false,
          createdBy: "user1",
          createdByName: "Test User",
          createdAt: { toDate: () => new Date("2026-01-01") },
        }),
      },
    ];

    mockCollection.mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: mockItems }),
        }),
      }),
    } as never);

    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toHaveLength(1);
    expect(data.items[0].name).toBe("Stofzuigen");
  });

  it("should handle fetch error", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    mockCollection.mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockRejectedValue(new Error("Database error")),
        }),
      }),
    } as never);

    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(500);
  });
});

describe("POST /api/klusjes", () => {
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

  it("should return 400 with empty name", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });
    const res = await POST(makeRequest("POST", { name: "" }));
    expect(res.status).toBe(400);
  });

  it("should return 400 with name too long", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });
    const res = await POST(makeRequest("POST", { name: "a".repeat(201) }));
    expect(res.status).toBe(400);
  });

  it("should create a new klusje", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    const mockAdd = vi.fn().mockResolvedValue({ id: "klusje1" });
    mockCollection.mockReturnValue({ add: mockAdd } as never);

    const res = await POST(makeRequest("POST", { name: "Stofzuigen" }));

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe("Stofzuigen");
    expect(data.checked).toBe(false);
  });

  it("should return 400 with invalid JSON", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    const req = new NextRequest("http://localhost:3000/api/klusjes", {
      method: "POST",
      headers: {
        Cookie: "auth_token=test-token",
        "Content-Type": "application/json",
      },
      body: "invalid json",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/klusjes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 without auth", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const res = await PUT(makeRequest("PUT", { id: "klusje1", checked: true }));
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
    const res = await PUT(makeRequest("PUT", { checked: true }));
    expect(res.status).toBe(400);
  });

  it("should return 400 with missing checked", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });
    const res = await PUT(makeRequest("PUT", { id: "klusje1" }));
    expect(res.status).toBe(400);
  });

  it("should return 404 when klusje not found", async () => {
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

    const res = await PUT(makeRequest("PUT", { id: "klusje1", checked: true }));
    expect(res.status).toBe(404);
  });

  it("should return 403 when klusje belongs to different family", async () => {
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
          data: () => ({ familyId: "fam2" }),
        }),
      }),
    } as never);

    const res = await PUT(makeRequest("PUT", { id: "klusje1", checked: true }));
    expect(res.status).toBe(403);
  });

  it("should update klusje", async () => {
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

    const res = await PUT(makeRequest("PUT", { id: "klusje1", checked: true }));

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ checked: true });
  });

  it("should return 400 with invalid id format", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    const res = await PUT(
      makeRequest("PUT", { id: "invalid/id", checked: true })
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/klusjes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 without auth", async () => {
    mockVerifyToken.mockResolvedValue(null);
    const res = await DELETE(makeRequest("DELETE", { id: "klusje1" }));
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
    const res = await DELETE(makeRequest("DELETE", {}));
    expect(res.status).toBe(400);
  });

  it("should return 404 when klusje not found", async () => {
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

    const res = await DELETE(makeRequest("DELETE", { id: "klusje1" }));
    expect(res.status).toBe(404);
  });

  it("should return 403 when klusje belongs to different family", async () => {
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
          data: () => ({ familyId: "fam2" }),
        }),
      }),
    } as never);

    const res = await DELETE(makeRequest("DELETE", { id: "klusje1" }));
    expect(res.status).toBe(403);
  });

  it("should delete klusje", async () => {
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

    const res = await DELETE(makeRequest("DELETE", { id: "klusje1" }));
    expect(res.status).toBe(200);
    expect(mockDelete).toHaveBeenCalled();
  });
});
