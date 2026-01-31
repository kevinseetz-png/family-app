"use client";

import { useState, useEffect, useCallback } from "react";
import type { CommunityPost } from "@/types/community";

interface CommunityResponse {
  id: string;
  authorId: string;
  authorName: string;
  familyName: string;
  content: string;
  createdAt: string;
}

interface ErrorResponse {
  message?: string;
}

export function useCommunity(): {
  posts: CommunityPost[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addPost: (content: string) => Promise<void>;
} {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/community");
      if (!res.ok) {
        const body = await res.json().catch((): ErrorResponse => ({}));
        setError(body.message || `Failed to load posts (${res.status})`);
        return;
      }
      const data = await res.json();
      const results: CommunityPost[] = (data.posts as CommunityResponse[]).map((post) => ({
        id: post.id,
        authorId: post.authorId,
        authorName: post.authorName,
        familyName: post.familyName,
        content: post.content,
        createdAt: new Date(post.createdAt),
      }));
      setPosts(results);
      setError(null);
    } catch {
      setError("Network error loading posts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const addPost = useCallback(async (content: string) => {
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const body = await res.json().catch((): ErrorResponse => ({}));
      throw new Error(body.message || "Failed to add post");
    }
    await fetchPosts();
  }, [fetchPosts]);

  return { posts, isLoading, error, refetch: fetchPosts, addPost };
}
