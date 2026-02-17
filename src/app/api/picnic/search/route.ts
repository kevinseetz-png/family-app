import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { picnicSearchSchema } from "@/lib/validation";
import { getPicnicClientForFamily, handlePicnicAuthError } from "@/lib/picnic-client";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const parsed = picnicSearchSchema.safeParse({
    query: request.nextUrl.searchParams.get("query") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { query } = parsed.data;

  try {
    const picnicClient = await getPicnicClientForFamily(user.familyId);
    if (!picnicClient) {
      return NextResponse.json(
        { message: "Niet verbonden met Picnic" },
        { status: 403 }
      );
    }

    const results = await picnicClient.search(query.trim());

    const products = results.slice(0, 20).map((item) => ({
      id: item.id,
      name: item.name,
      imageId: item.image_id,
      price: parseInt(item.display_price, 10),
      displayPrice: item.display_price,
      unitQuantity: item.unit_quantity,
      maxCount: item.max_count,
    }));

    return NextResponse.json({ products });
  } catch (err: unknown) {
    if (await handlePicnicAuthError(err, user.familyId)) {
      return NextResponse.json(
        { message: "Picnic sessie verlopen, log opnieuw in" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: "Zoeken mislukt" },
      { status: 500 }
    );
  }
}
