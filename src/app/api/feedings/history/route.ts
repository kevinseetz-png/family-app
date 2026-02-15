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
    // Client sends tzOffset in minutes (e.g., -60 for CET) to group by local date
    const tzOffsetParam = request.nextUrl.searchParams.get("tzOffset");
    const tzOffsetMs = tzOffsetParam ? parseInt(tzOffsetParam, 10) * 60 * 1000 : 0;

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const snapshot = await adminDb
      .collection("feedings")
      .where("familyId", "==", user.familyId)
      .limit(1000)
      .get();

    const dailyMap = new Map<string, { totalMl: number; count: number }>();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const ts: Date = data.timestamp.toDate();
      if (ts < thirtyDaysAgo) continue;
      // Adjust to local time before extracting date
      const local = new Date(ts.getTime() - tzOffsetMs);
      const y = local.getUTCFullYear();
      const m = String(local.getUTCMonth() + 1).padStart(2, "0");
      const d = String(local.getUTCDate()).padStart(2, "0");
      const dateKey = `${y}-${m}-${d}`;

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
