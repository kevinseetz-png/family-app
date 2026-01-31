import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyToken } from "@/lib/auth";
import { communityPostSchema } from "@/lib/validation";
import type { CommunityPost } from "@/types/community";

const MAX_POSTS_PER_REQUEST = 50;

export async function GET(): Promise<NextResponse> {
  try {
    const snapshot = await adminDb
      .collection("community_posts")
      .orderBy("createdAt", "desc")
      .limit(MAX_POSTS_PER_REQUEST)
      .get();

    const posts: CommunityPost[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        authorId: data.authorId,
        authorName: data.authorName,
        familyName: data.familyName,
        content: data.content,
        createdAt: data.createdAt.toDate(),
      };
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error loading community posts:", error);
    return NextResponse.json({ message: "Failed to load posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }
    const validation = communityPostSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const familyDoc = await adminDb.collection("families").doc(user.familyId).get();
    const familyName = familyDoc.exists ? familyDoc.data()?.name : "Unknown";

    const postData = {
      authorId: user.id,
      authorName: user.name,
      familyName,
      content: validation.data.content,
      createdAt: new Date(),
    };

    const docRef = await adminDb.collection("community_posts").add(postData);

    const post: CommunityPost = {
      id: docRef.id,
      ...postData,
    };

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Error creating community post:", error);
    return NextResponse.json({ message: "Failed to create post" }, { status: 500 });
  }
}
