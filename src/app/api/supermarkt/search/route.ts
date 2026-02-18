import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { supermarktSearchSchema } from "@/lib/validation";
import { searchAllSupermarkten } from "@/lib/supermarkt/index";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const parsed = supermarktSearchSchema.safeParse({
    query: request.nextUrl.searchParams.get("query") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { query } = parsed.data;

  try {
    const results = await searchAllSupermarkten(query.trim(), user.familyId);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { message: "Zoeken mislukt" },
      { status: 500 },
    );
  }
}
