import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CommunityList } from "./CommunityList";
import type { CommunityPost } from "@/types/community";

/**
 * @vitest-environment jsdom
 */

describe("CommunityList", () => {
  it("should display empty state when no posts", () => {
    render(<CommunityList posts={[]} isLoading={false} />);

    expect(screen.getByText("Nog geen berichten")).toBeInTheDocument();
  });

  it("should display loading state", () => {
    render(<CommunityList posts={[]} isLoading={true} />);

    expect(screen.getByText(/Berichten laden/i)).toBeInTheDocument();
  });

  it("should display a list of posts", () => {
    const mockPosts: CommunityPost[] = [
      {
        id: "post1",
        authorId: "user1",
        authorName: "John Doe",
        familyName: "Doe Family",
        content: "Hello everyone!",
        createdAt: new Date("2026-01-31T12:00:00Z"),
      },
      {
        id: "post2",
        authorId: "user2",
        authorName: "Jane Smith",
        familyName: "Smith Family",
        content: "Great app!",
        createdAt: new Date("2026-01-31T11:00:00Z"),
      },
    ];

    render(<CommunityList posts={mockPosts} isLoading={false} />);

    expect(screen.getByText("Hello everyone!")).toBeInTheDocument();
    expect(screen.getByText("Great app!")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Doe Family")).toBeInTheDocument();
    expect(screen.getByText("Smith Family")).toBeInTheDocument();
  });

  it("should display relative time for each post", () => {
    const now = new Date("2026-01-31T14:00:00Z");
    vi.setSystemTime(now);

    const mockPosts: CommunityPost[] = [
      {
        id: "post1",
        authorId: "user1",
        authorName: "John Doe",
        familyName: "Doe Family",
        content: "Recent post",
        createdAt: new Date("2026-01-31T13:00:00Z"), // 1 hour ago
      },
      {
        id: "post2",
        authorId: "user2",
        authorName: "Jane Smith",
        familyName: "Smith Family",
        content: "Old post",
        createdAt: new Date("2026-01-30T14:00:00Z"), // 1 day ago
      },
    ];

    render(<CommunityList posts={mockPosts} isLoading={false} />);

    expect(screen.getByText("1 uur geleden")).toBeInTheDocument();
    expect(screen.getByText("1 dag geleden")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("should render posts in the order provided", () => {
    const mockPosts: CommunityPost[] = [
      {
        id: "post1",
        authorId: "user1",
        authorName: "First",
        familyName: "First Family",
        content: "First post",
        createdAt: new Date("2026-01-31T12:00:00Z"),
      },
      {
        id: "post2",
        authorId: "user2",
        authorName: "Second",
        familyName: "Second Family",
        content: "Second post",
        createdAt: new Date("2026-01-31T11:00:00Z"),
      },
    ];

    const { container } = render(<CommunityList posts={mockPosts} isLoading={false} />);
    const posts = container.querySelectorAll("li");

    expect(posts).toHaveLength(2);
    expect(posts[0]).toHaveTextContent("First post");
    expect(posts[1]).toHaveTextContent("Second post");
  });

  it("should display post content with proper formatting", () => {
    const mockPosts: CommunityPost[] = [
      {
        id: "post1",
        authorId: "user1",
        authorName: "John Doe",
        familyName: "Doe Family",
        content: "This is a longer post with multiple words and sentences.",
        createdAt: new Date("2026-01-31T12:00:00Z"),
      },
    ];

    render(<CommunityList posts={mockPosts} isLoading={false} />);

    expect(
      screen.getByText("This is a longer post with multiple words and sentences.")
    ).toBeInTheDocument();
  });

  it("should handle posts with special characters in content", () => {
    const mockPosts: CommunityPost[] = [
      {
        id: "post1",
        authorId: "user1",
        authorName: "John Doe",
        familyName: "Doe Family",
        content: "Special chars: <>&\"'",
        createdAt: new Date("2026-01-31T12:00:00Z"),
      },
    ];

    render(<CommunityList posts={mockPosts} isLoading={false} />);

    expect(screen.getByText("Special chars: <>&\"'")).toBeInTheDocument();
  });

  it("should show just now for posts less than a minute old", () => {
    const now = new Date("2026-01-31T14:00:00Z");
    vi.setSystemTime(now);

    const mockPosts: CommunityPost[] = [
      {
        id: "post1",
        authorId: "user1",
        authorName: "John Doe",
        familyName: "Doe Family",
        content: "Just posted",
        createdAt: new Date("2026-01-31T13:59:30Z"), // 30 seconds ago
      },
    ];

    render(<CommunityList posts={mockPosts} isLoading={false} />);

    expect(screen.getByText("zojuist")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("should show minutes for posts less than an hour old", () => {
    const now = new Date("2026-01-31T14:00:00Z");
    vi.setSystemTime(now);

    const mockPosts: CommunityPost[] = [
      {
        id: "post1",
        authorId: "user1",
        authorName: "John Doe",
        familyName: "Doe Family",
        content: "Recent",
        createdAt: new Date("2026-01-31T13:30:00Z"), // 30 minutes ago
      },
    ];

    render(<CommunityList posts={mockPosts} isLoading={false} />);

    expect(screen.getByText("30 minuten geleden")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("should handle singular minute", () => {
    const now = new Date("2026-01-31T14:00:00Z");
    vi.setSystemTime(now);

    const mockPosts: CommunityPost[] = [
      {
        id: "post1",
        authorId: "user1",
        authorName: "John Doe",
        familyName: "Doe Family",
        content: "Recent",
        createdAt: new Date("2026-01-31T13:59:00Z"), // 1 minute ago
      },
    ];

    render(<CommunityList posts={mockPosts} isLoading={false} />);

    expect(screen.getByText("1 minuut geleden")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("should handle singular hour", () => {
    const now = new Date("2026-01-31T14:00:00Z");
    vi.setSystemTime(now);

    const mockPosts: CommunityPost[] = [
      {
        id: "post1",
        authorId: "user1",
        authorName: "John Doe",
        familyName: "Doe Family",
        content: "Recent",
        createdAt: new Date("2026-01-31T13:00:00Z"), // 1 hour ago
      },
    ];

    render(<CommunityList posts={mockPosts} isLoading={false} />);

    expect(screen.getByText("1 uur geleden")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("should handle singular day", () => {
    const now = new Date("2026-01-31T14:00:00Z");
    vi.setSystemTime(now);

    const mockPosts: CommunityPost[] = [
      {
        id: "post1",
        authorId: "user1",
        authorName: "John Doe",
        familyName: "Doe Family",
        content: "Old",
        createdAt: new Date("2026-01-30T14:00:00Z"), // 1 day ago
      },
    ];

    render(<CommunityList posts={mockPosts} isLoading={false} />);

    expect(screen.getByText("1 dag geleden")).toBeInTheDocument();

    vi.useRealTimers();
  });
});
