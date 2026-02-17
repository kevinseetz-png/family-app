import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { picnicCartAddSchema, picnicCartRemoveSchema } from "@/lib/validation";
import { getPicnicClientForFamily, handlePicnicAuthError } from "@/lib/picnic-client";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const picnicClient = await getPicnicClientForFamily(user.familyId);
    if (!picnicClient) {
      return NextResponse.json(
        { message: "Niet verbonden met Picnic" },
        { status: 403 }
      );
    }

    const cart = await picnicClient.getShoppingCart();
    const items = cart.items.map((line) => ({
      id: line.id,
      items: line.items.map((article) => ({
        id: article.id,
        name: article.name,
        price: article.price,
        unitQuantity: article.unit_quantity,
        imageIds: article.image_ids,
      })),
      price: line.price,
      displayPrice: line.display_price,
    }));

    return NextResponse.json({
      items,
      totalPrice: cart.total_price,
      totalCount: cart.total_count,
    });
  } catch (err: unknown) {
    if (await handlePicnicAuthError(err, user.familyId)) {
      return NextResponse.json(
        { message: "Picnic sessie verlopen, log opnieuw in" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: "Kon winkelwagen niet ophalen" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const result = picnicCartAddSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { productId, count } = result.data;

  try {
    const picnicClient = await getPicnicClientForFamily(user.familyId);
    if (!picnicClient) {
      return NextResponse.json(
        { message: "Niet verbonden met Picnic" },
        { status: 403 }
      );
    }

    await picnicClient.addProductToShoppingCart(productId, count);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (await handlePicnicAuthError(err, user.familyId)) {
      return NextResponse.json(
        { message: "Picnic sessie verlopen, log opnieuw in" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: "Kon product niet toevoegen aan mandje" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const result = picnicCartRemoveSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { productId, count } = result.data;

  try {
    const picnicClient = await getPicnicClientForFamily(user.familyId);
    if (!picnicClient) {
      return NextResponse.json(
        { message: "Niet verbonden met Picnic" },
        { status: 403 }
      );
    }

    await picnicClient.removeProductFromShoppingCart(productId, count);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (await handlePicnicAuthError(err, user.familyId)) {
      return NextResponse.json(
        { message: "Picnic sessie verlopen, log opnieuw in" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: "Kon product niet verwijderen uit mandje" },
      { status: 500 }
    );
  }
}
