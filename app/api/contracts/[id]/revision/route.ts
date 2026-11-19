import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { demoRequestRevision } from "@/lib/demo/store";
import { parseBody, revisionRequestSchema } from "@/lib/security/validation";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, revisionRequestSchema);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { notes } = parsed.data;

  if (isDemoMode()) {
    try {
      const contract = demoRequestRevision(id, user.id, notes.trim());
      return NextResponse.json({ contract });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to request revision";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  return NextResponse.json(
    { error: "Contract revisions are managed through active dispute review or direct message iteration" },
    { status: 501 }
  );
}
