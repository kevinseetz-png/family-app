import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCommunity } from "./useCommunity";

/**
 * @vitest-environment jsdom
 */

describe("useCommunity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("should start with loading state", () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ posts: [] }),
    });

    const { result } = renderHook(() => useCommunity());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.posts).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should fetch posts from /api/community", async () => {
    const mockPosts = [
      {
        id: "post1",
        authorId: "user1",
        authorName: "John Doe",
        familyName: "Doe Family",
        content: "Hello world",
        createdAt: "2026-01-31T12:00:00Z",
      },
      {
        id: "post2",
        authorId: "user2",
        authorName: "Jane Smith",
        familyName: "Smith Family",
        content: "Great app!",
        createdAt: "2026-01-31T11:00:00Z",
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ posts: mockPosts }),
    });

    const { result } = renderHook(() => useCommunity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.posts).toHaveLength(2);
    expect(result.current.posts[0].id).toBe("post1");
    expect(result.current.posts[0].authorName).toBe("John Doe");
    expect(result.current.posts[0].familyName).toBe("Doe Family");
    expect(result.current.posts[0].content).toBe("Hello world");
    expect(result.current.posts[0].createdAt).toBeInstanceOf(Date);
    expect(result.current.error).toBeNull();
  });

  it("should handle fetch error with error message", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "Server error" }),
    });

    const { result } = renderHook(() => useCommunity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Server error");
    expect(result.current.posts).toEqual([]);
  });

  it("should handle fetch error without error message", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useCommunity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to load posts (404)");
    expect(result.current.posts).toEqual([]);
  });

  it("should handle network error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network failed"));

    const { result } = renderHook(() => useCommunity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Network error loading posts");
    expect(result.current.posts).toEqual([]);
  });

  it("should add a new post via addPost", async () => {
    const mockInitialPosts = [
      {
        id: "post1",
        authorId: "user1",
        authorName: "John Doe",
        familyName: "Doe Family",
        content: "Hello world",
        createdAt: "2026-01-31T12:00:00Z",
      },
    ];

    const mockNewPost = {
      id: "post2",
      authorId: "user2",
      authorName: "Jane Smith",
      familyName: "Smith Family",
      content: "New post content",
      createdAt: "2026-01-31T13:00:00Z",
    };

    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    // First call: initial fetch
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posts: mockInitialPosts }),
    });

    const { result } = renderHook(() => useCommunity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.posts).toHaveLength(1);

    // Second call: POST to create
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ post: mockNewPost }),
    });

    // Third call: refetch after create
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posts: [mockNewPost, ...mockInitialPosts] }),
    });

    await result.current.addPost("New post content");

    await waitFor(() => {
      expect(result.current.posts).toHaveLength(2);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "New post content" }),
    });
  });

  it("should throw error when addPost fails", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    // Initial fetch
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posts: [] }),
    });

    const { result } = renderHook(() => useCommunity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // POST fails
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Content is required" }),
    });

    await expect(result.current.addPost("")).rejects.toThrow("Content is required");
  });

  it("should throw generic error when addPost fails without message", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    // Initial fetch
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posts: [] }),
    });

    const { result } = renderHook(() => useCommunity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // POST fails without message
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    await expect(result.current.addPost("test")).rejects.toThrow("Failed to add post");
  });

  it("should refetch posts when refetch is called", async () => {
    const mockInitialPosts = [
      {
        id: "post1",
        authorId: "user1",
        authorName: "John Doe",
        familyName: "Doe Family",
        content: "Hello world",
        createdAt: "2026-01-31T12:00:00Z",
      },
    ];

    const mockUpdatedPosts = [
      {
        id: "post2",
        authorId: "user2",
        authorName: "Jane Smith",
        familyName: "Smith Family",
        content: "New post",
        createdAt: "2026-01-31T13:00:00Z",
      },
      ...mockInitialPosts,
    ];

    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;

    // Initial fetch
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posts: mockInitialPosts }),
    });

    const { result } = renderHook(() => useCommunity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.posts).toHaveLength(1);

    // Refetch
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posts: mockUpdatedPosts }),
    });

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.posts).toHaveLength(2);
    });

    expect(result.current.posts[0].id).toBe("post2");
  });
});
