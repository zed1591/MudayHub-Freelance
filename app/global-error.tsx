"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function RootGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Root Layout Fatal Error]:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <Image src="/logo-emblem.png" alt="Muday-Freelance" width={32} height={32} />
          </div>
          <h1 className="mt-5 text-xl font-black text-slate-900">Application Error</h1>
          <p className="mt-3 text-xs text-slate-600 leading-relaxed">
            A fatal error occurred at the layout layer. Please refresh your browser to reload MudayHub Freelance.
          </p>
          {error.digest && (
            <p className="mt-2 text-[10px] font-mono text-slate-400">
              Ref: {error.digest}
            </p>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => reset()}
              type="button"
              className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-700 shadow-sm transition"
            >
              Reload Application
            </button>
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-slate-100 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
