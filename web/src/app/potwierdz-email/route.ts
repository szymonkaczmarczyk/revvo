import { NextResponse, type NextRequest } from "next/server";
import { confirmEmail } from "@/server/auth/accounts";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const confirmed = token.length > 0 && token.length <= 100 && (await confirmEmail(token));
  return NextResponse.redirect(new URL(`/moj-garaz?email=${confirmed ? "potwierdzony" : "link-wygasl"}`, request.url));
}
