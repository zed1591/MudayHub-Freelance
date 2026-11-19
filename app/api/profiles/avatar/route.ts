import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore, writeStore } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") || "";

  // 1. JSON payload for direct URL assignment
  if (contentType.includes("application/json")) {
    try {
      const body = await req.json();
      const avatarUrl = typeof body.avatar_url === "string" ? body.avatar_url.trim() : null;

      if (isDemoMode()) {
        const store = readStore();
        const u = store.users.find((x) => x.id === user.id);
        if (u) {
          u.profile.avatar_url = avatarUrl;
          writeStore(store);
        }
        return NextResponse.json({ avatar_url: avatarUrl });
      }

      const supabase = await createClient();
      await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
      return NextResponse.json({ avatar_url: avatarUrl });
    } catch {
      return NextResponse.json({ error: "Invalid JSON request" }, { status: 400 });
    }
  }

  // 2. FormData file upload
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "An image file is required" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only image files (JPEG, PNG, WebP, GIF, SVG) are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json({ error: "Image file exceeds 5MB limit" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext) ? ext : "jpg";
    const filename = `${user.id}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${safeExt}`;

    if (isDemoMode()) {
      const avatarsDir = path.join(process.cwd(), ".demo-data", "avatars");
      if (!fs.existsSync(avatarsDir)) {
        fs.mkdirSync(avatarsDir, { recursive: true });
      }

      fs.writeFileSync(path.join(avatarsDir, filename), buffer);
      const avatarUrl = `/api/storage/avatar/${filename}`;

      const store = readStore();
      const u = store.users.find((x) => x.id === user.id);
      if (u) {
        u.profile.avatar_url = avatarUrl;
        writeStore(store);
      }

      return NextResponse.json({ avatar_url: avatarUrl });
    }

    // In Supabase mode: upload to avatars bucket or store data URL / public URL
    const supabase = await createClient();
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filename, buffer, { contentType: file.type, upsert: true });

    let finalUrl = "";
    if (uploadError) {
      // Fallback to local storage route
      const avatarsDir = path.join(process.cwd(), ".demo-data", "avatars");
      if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });
      fs.writeFileSync(path.join(avatarsDir, filename), buffer);
      finalUrl = `/api/storage/avatar/${filename}`;
    } else {
      const { data } = supabase.storage.from("avatars").getPublicUrl(filename);
      finalUrl = data.publicUrl;
    }

    await supabase.from("profiles").update({ avatar_url: finalUrl }).eq("id", user.id);
    return NextResponse.json({ avatar_url: finalUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to upload image" },
      { status: 500 }
    );
  }
}
