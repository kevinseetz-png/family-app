"use client";

import type { CommunityPost } from "@/types/community";

interface CommunityListProps {
  posts: CommunityPost[];
  isLoading: boolean;
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "zojuist";
  } else if (diffMinutes < 60) {
    return diffMinutes === 1 ? "1 minuut geleden" : `${diffMinutes} minuten geleden`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? "1 uur geleden" : `${diffHours} uur geleden`;
  } else {
    return diffDays === 1 ? "1 dag geleden" : `${diffDays} dagen geleden`;
  }
}

export function CommunityList({ posts, isLoading }: CommunityListProps) {
  if (isLoading) {
    return <p className="text-sm text-gray-500" role="status">Berichten laden...</p>;
  }

  if (posts.length === 0) {
    return <p className="text-sm text-gray-500">Nog geen berichten</p>;
  }

  return (
    <ul className="space-y-4">
      {posts.map((post) => (
        <li
          key={post.id}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-medium text-gray-900">{post.authorName}</p>
              <p className="text-sm text-gray-500">{post.familyName}</p>
            </div>
            <p className="text-sm text-gray-500">{getRelativeTime(post.createdAt)}</p>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
        </li>
      ))}
    </ul>
  );
}
