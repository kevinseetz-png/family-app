import { NextResponse } from "next/server";

// Temporary diagnostic endpoint — DELETE after debugging
export async function GET(): Promise<NextResponse> {
  const key = process.env["PICNIC_ENCRYPTION_KEY"];
  return NextResponse.json({
    exists: !!key,
    length: key?.length ?? 0,
    first4: key ? key.slice(0, 4) + "..." : null,
    nodeEnv: process.env.NODE_ENV,
  });
}
