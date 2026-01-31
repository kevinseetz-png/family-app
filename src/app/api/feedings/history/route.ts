import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const snapshot = await adminDb
      .collection("feedings")
      .where("familyId", "==", user.familyId)
      .get();

    const dailyMap = new Map<string, { totalMl: number; count: number }>();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const ts: Date = data.timestamp.toDate();
      if (ts < thirtyDaysAgo) continue;
      const dateKey = ts.toISOString().slice(0, 10);

      const entry = dailyMap.get(dateKey) ?? { totalMl: 0, count: 0 };
      entry.totalMl += data.amount;
      entry.count += 1;
      dailyMap.set(dateKey, entry);
    }

    const history = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, totalMl: stats.totalMl, count: stats.count }))
      .sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({ history });
  } catch (err) {
    console.error("Failed to fetch feeding history:", err);
    return NextResponse.json({ message: "Failed to fetch feeding history", history: [] }, { status: 500 });
  }
}
