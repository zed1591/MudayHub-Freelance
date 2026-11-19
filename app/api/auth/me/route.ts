import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({
    user,
    demoMode: isDemoMode(),
  });
}
