"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { language } = useLanguage();
  const isAm = language === "am";

  useEffect(() => {
    // Log the error securely for production monitoring
    console.error("[MudayHub Production Error Caught]:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/30 shadow-sm">
        <Image src="/logo-emblem.png" alt="MudayHub" width={36} height={36} />
      </div>

      <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>{isAm ? "የስርዓት ማሳሰቢያ" : "System Notice"}</span>
      </div>

      <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
        {isAm ? "ያልተጠበቀ ችግር አጋጥሟል" : "Something unexpected happened"}
      </h2>

      <p className="mt-3 text-xs leading-relaxed text-slate-600 max-w-md">
        {isAm
          ? "ይቅርታ፣ ያልተጠበቀ ችግር አጋጥሟል። እባክዎ እንደገና ይሞክሩ ወይም ወደ መነሻ ገጽ ይመለሱ።"
          : "The application encountered an error while processing this page. Our escrow and data protections ensure your funds and projects remain completely safe."}
      </p>

      {error.digest && (
        <div className="mt-4 inline-block rounded-lg bg-slate-100 px-3 py-1 text-[11px] font-mono text-slate-500">
          Incident Ref: <span className="text-slate-800 font-bold">{error.digest}</span>
        </div>
      )}

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="btn-primary !py-2.5 !px-5 text-xs font-bold shadow-ochre inline-flex items-center gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>{isAm ? "እንደገና ይሞክሩ" : "Try Again"}</span>
        </button>

        <Link
          href="/"
          className="btn-secondary !py-2.5 !px-5 text-xs font-bold inline-flex items-center gap-2"
        >
          <Home className="h-3.5 w-3.5" />
          <span>{isAm ? "ወደ መነሻ ገጽ" : "Return to Home"}</span>
        </Link>
      </div>
    </div>
  );
}
