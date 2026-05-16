import { NextResponse } from "next/server";

/** RFC 7009 stub — acknowledge revocation (Supabase session revoke optional later). */
export async function POST() {
  return new NextResponse(null, { status: 200 });
}
