"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

// List of routes that belong to the internal authenticated workspace layout (with sidebar)
const WORKSPACE_PREFIXES = [
  "/dashboard",
  "/contracts",
  "/proposals",
  "/notifications",
  "/onboarding",
  "/admin",
  "/profile",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isWorkspace = WORKSPACE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isWorkspace) {
    // Public marketplace layout: Full-width, clean header, no sidebar
    return (
      <div className="flex min-h-screen w-full flex-col bg-slate-50/50">
        <Navbar isWorkspace={false} />
        <main className="w-full min-w-0 flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  // Authenticated workspace layout: Left sidebar navigation + workspace header
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50">
      <div className="flex min-h-screen w-full flex-1">
        {/* Vertical Navigation Sidebar on Desktop */}
        <div className="fixed inset-y-0 left-0 z-40 hidden w-64 md:flex xl:w-72">
          <Sidebar />
        </div>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col md:pl-64 xl:pl-72">
          <Navbar isWorkspace={true} />
          <main className="w-full min-w-0 flex-1">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
