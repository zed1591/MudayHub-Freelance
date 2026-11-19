import { cookies } from "next/headers";
import { isDemoMode } from "@/lib/demo/mode";
import { demoUserFromToken } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const DEMO_COOKIE = "mudayhub_demo_session";

export async function getSessionUser(): Promise<{
  id: string;
  email: string;
  profile: Profile;
} | null> {
  if (isDemoMode()) {
    const cookieStore = await cookies();
    const token = cookieStore.get(DEMO_COOKIE)?.value;
    const user = demoUserFromToken(token);
    if (!user) return null;
    return { id: user.id, email: user.email, profile: user.profile };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) return null;
    return {
      id: user.id,
      email: user.email || "",
      profile: profile as Profile,
    };
  } catch {
    return null;
  }
}
