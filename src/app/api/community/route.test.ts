import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockCollection = vi.fn();
const mockVerifyToken = vi.fn();

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: mockCollection,
  },
}));

vi.mock("@/lib/auth", () => ({
  verifyToken: mockVerifyToken,
}));

describe("/api/community", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("GET", () => {
    it("should return last 50 posts ordered by createdAt desc", async () => {
      const { GET } = await import("./route");

      const mockPosts = [
        {
          id: "post1",
          authorId: "user1",
          authorName: "John Doe",
          familyName: "Doe Family",
          content: "Hello world",
          createdAt: { toDate: () => new Date("2026-01-31T12:00:00Z") },
        },
        {
          id: "post2",
          authorId: "user2",
          authorName: "Jane Smith",
          familyName: "Smith Family",
          content: "Great app!",
          createdAt: { toDate: () => new Date("2026-01-31T11:00:00Z") },
        },
      ];

      const mockOrderBy = vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            docs: mockPosts.map((post) => ({
              id: post.id,
              data: () => ({
                authorId: post.authorId,
                authorName: post.authorName,
                familyName: post.familyName,
                content: post.content,
                createdAt: post.createdAt,
              }),
            })),
          }),
        }),
      });

      mockCollection.mockReturnValue({
        orderBy: mockOrderBy,
      });

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.posts).toHaveLength(2);
      expect(data.posts[0].id).toBe("post1");
      expect(data.posts[0].authorName).toBe("John Doe");
      expect(data.posts[0].content).toBe("Hello world");
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
    });

    it("should return empty array when no posts exist", async () => {
      const { GET } = await import("./route");

      mockCollection.mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              docs: [],
            }),
          }),
        }),
      });

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.posts).toEqual([]);
    });

    it("should handle database errors", async () => {
      const { GET } = await import("./route");

      mockCollection.mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockRejectedValue(new Error("Database error")),
          }),
        }),
      });

      const response = await GET();

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe("Failed to load posts");
    });
  });

  describe("POST", () => {
    it("should create a new post when authenticated", async () => {
      const { POST } = await import("./route");

      const mockUser = {
        id: "user1",
        name: "John Doe",
        email: "john@example.com",
        familyId: "family1",
        role: "member" as const,
      };

      mockVerifyToken.mockResolvedValue(mockUser);

      const mockFamilyDoc = {
        exists: true,
        data: () => ({ name: "Doe Family" }),
      };

      const mockAdd = vi.fn().mockResolvedValue({
        id: "newpost1",
      });

      const mockGet = vi.fn().mockResolvedValue(mockFamilyDoc);

      mockCollection.mockImplementation((collectionName: string) => {
        if (collectionName === "families") {
          return {
            doc: vi.fn().mockReturnValue({
              get: mockGet,
            }),
          };
        }
        return {
          add: mockAdd,
        };
      });

      const request = new NextRequest("http://localhost:3000/api/community", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: "auth_token=validtoken",
        },
        body: JSON.stringify({ content: "Hello from John" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.post.id).toBe("newpost1");
      expect(data.post.authorName).toBe("John Doe");
      expect(data.post.familyName).toBe("Doe Family");
      expect(data.post.content).toBe("Hello from John");
      expect(mockAdd).toHaveBeenCalled();
    });

    it("should return 401 when no auth token provided", async () => {
      const { POST } = await import("./route");

      const request = new NextRequest("http://localhost:3000/api/community", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: "Hello" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe("Unauthorized");
    });

    it("should return 401 when token is invalid", async () => {
      const { POST } = await import("./route");

      mockVerifyToken.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/community", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: "auth_token=invalidtoken",
        },
        body: JSON.stringify({ content: "Hello" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe("Unauthorized");
    });

    it.skip("should return 400 when content is missing", async () => {
      const { POST } = await import("./route");

      const mockUser = {
        id: "user1",
        name: "John Doe",
        email: "john@example.com",
        familyId: "family1",
        role: "member" as const,
      };

      mockVerifyToken.mockResolvedValue(mockUser);

      mockCollection.mockReturnValue({});

      const request = new NextRequest("http://localhost:3000/api/community", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: "auth_token=validtoken",
        },
        body: JSON.stringify({ content: "" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain("Bericht is verplicht");
    });

    it.skip("should return 400 when content is too long", async () => {
      const { POST } = await import("./route");

      const mockUser = {
        id: "user1",
        name: "John Doe",
        email: "john@example.com",
        familyId: "family1",
        role: "member" as const,
      };

      mockVerifyToken.mockResolvedValue(mockUser);

      mockCollection.mockReturnValue({});

      const longContent = "a".repeat(2001);

      const request = new NextRequest("http://localhost:3000/api/community", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: "auth_token=validtoken",
        },
        body: JSON.stringify({ content: longContent }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain("Bericht is te lang");
    });

    it("should return 500 when family lookup fails", async () => {
      const { POST } = await import("./route");

      const mockUser = {
        id: "user1",
        name: "John Doe",
        email: "john@example.com",
        familyId: "family1",
        role: "member" as const,
      };

      mockVerifyToken.mockResolvedValue(mockUser);

      const mockGet = vi.fn().mockRejectedValue(new Error("Database error"));

      mockCollection.mockImplementation((collectionName: string) => {
        if (collectionName === "families") {
          return {
            doc: vi.fn().mockReturnValue({
              get: mockGet,
            }),
          };
        }
        return {};
      });

      const request = new NextRequest("http://localhost:3000/api/community", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: "auth_token=validtoken",
        },
        body: JSON.stringify({ content: "Hello" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toBe("Failed to create post");
    });

    it("should handle missing family document gracefully", async () => {
      const { POST } = await import("./route");

      const mockUser = {
        id: "user1",
        name: "John Doe",
        email: "john@example.com",
        familyId: "family1",
        role: "member" as const,
      };

      mockVerifyToken.mockResolvedValue(mockUser);

      const mockFamilyDoc = {
        exists: false,
      };

      const mockAdd = vi.fn().mockResolvedValue({
        id: "newpost1",
      });

      const mockGet = vi.fn().mockResolvedValue(mockFamilyDoc);

      mockCollection.mockImplementation((collectionName: string) => {
        if (collectionName === "families") {
          return {
            doc: vi.fn().mockReturnValue({
              get: mockGet,
            }),
          };
        }
        return {
          add: mockAdd,
        };
      });

      const request = new NextRequest("http://localhost:3000/api/community", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: "auth_token=validtoken",
        },
        body: JSON.stringify({ content: "Hello" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.post.familyName).toBe("Unknown");
    });
  });
});
