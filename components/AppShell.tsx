"use client";

import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { CcsaTopBanner } from "@/components/CcsaTopBanner";
import { Footer } from "@/components/Footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <CcsaTopBanner />
      <div className="flex min-h-screen w-full flex-1">
        {/* Vertical Navigation Sidebar on Desktop */}
        <div className="fixed inset-y-0 left-0 z-40 hidden w-64 md:flex xl:w-72 pt-8">
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
