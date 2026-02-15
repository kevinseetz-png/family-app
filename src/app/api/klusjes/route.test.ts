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

  it("should return klusjes list with new fields including priority", async () => {
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
          status: "todo",
          priority: 1,
          date: null,
          recurrence: "none",
          completions: {},
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
    expect(data.items[0].status).toBe("todo");
    expect(data.items[0].priority).toBe(1);
    expect(data.items[0].date).toBeNull();
    expect(data.items[0].recurrence).toBe("none");
    expect(data.items[0].completions).toEqual({});
  });

  it("should default priority to 2 when not present in Firestore", async () => {
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
          name: "Old item",
          status: "todo",
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
    expect(data.items[0].priority).toBe(2);
  });

  it("should migrate old checked:true to status:klaar", async () => {
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
          name: "Old item",
          checked: true,
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
    expect(data.items[0].status).toBe("klaar");
    expect(data.items[0].date).toBeNull();
    expect(data.items[0].recurrence).toBe("none");
    expect(data.items[0].completions).toEqual({});
  });

  it("should migrate old checked:false to status:todo", async () => {
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
          name: "Old item",
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
    expect(data.items[0].status).toBe("todo");
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

  it("should create a new klusje with status todo and default priority", async () => {
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
    expect(data.status).toBe("todo");
    expect(data.priority).toBe(2);
    expect(data.date).toBeNull();
    expect(data.recurrence).toBe("none");
  });

  it("should create a klusje with custom priority", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    const mockAdd = vi.fn().mockResolvedValue({ id: "klusje1" });
    mockCollection.mockReturnValue({ add: mockAdd } as never);

    const res = await POST(makeRequest("POST", { name: "Urgent", priority: 1 }));

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.priority).toBe(1);
  });

  it("should create klusje with date and recurrence", async () => {
    mockVerifyToken.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      familyId: "fam1",
      role: "member",
    });

    const mockAdd = vi.fn().mockResolvedValue({ id: "klusje1" });
    mockCollection.mockReturnValue({ add: mockAdd } as never);

    const res = await POST(makeRequest("POST", {
      name: "Stofzuigen",
      date: "2026-02-10",
      recurrence: "weekly",
    }));

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.date).toBe("2026-02-10");
    expect(data.recurrence).toBe("weekly");
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
    const res = await PUT(makeRequest("PUT", { id: "klusje1", status: "klaar" }));
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
    const res = await PUT(makeRequest("PUT", { status: "klaar" }));
    expect(res.status).toBe(400);
  });

  it("should accept update without status (date-only update)", async () => {
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
        get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ familyId: "fam1" }) }),
        update: mockUpdate,
      }),
    } as never);
    const res = await PUT(makeRequest("PUT", { id: "klusje1", date: "2026-03-01" }));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ date: "2026-03-01" });
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

    const res = await PUT(makeRequest("PUT", { id: "klusje1", status: "klaar" }));
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

    const res = await PUT(makeRequest("PUT", { id: "klusje1", status: "klaar" }));
    expect(res.status).toBe(403);
  });

  it("should update klusje status", async () => {
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

    const res = await PUT(makeRequest("PUT", { id: "klusje1", status: "klaar" }));

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ status: "klaar" });
  });

  it("should update completion for recurring item with completionDate", async () => {
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

    const res = await PUT(makeRequest("PUT", {
      id: "klusje1",
      status: "klaar",
      completionDate: "2026-02-10",
    }));

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      "completions.2026-02-10": { status: "klaar" },
    });
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
      makeRequest("PUT", { id: "invalid/id", status: "klaar" })
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
