"use client";

import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  // Unified vertical layout across all pages (both public marketplace and authenticated workspaces)
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50">
      <div className="flex min-h-screen w-full flex-1">
        {/* Vertical Navigation Sidebar on Desktop */}
        <div className="fixed inset-y-0 left-0 z-40 hidden w-64 md:flex xl:w-72">
          <Sidebar />
        </div>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col md:pl-64 xl:pl-72">
          <Navbar />
          <main className="w-full min-w-0 flex-1">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
