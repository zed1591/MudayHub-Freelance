"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Profile editing lives on the dashboard. */
export default function ProfileRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return <div className="px-4 py-16 text-center text-muted">Opening profile…</div>;
}
