"use client";

import { ExternalLink, Mail, CheckCircle2 } from "lucide-react";

export function CcsaTopBanner() {
  return (
    <div className="relative z-40 bg-[#1A222D] text-slate-300 border-b border-slate-800 text-[11px] font-mono py-1.5 px-3 sm:px-6">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-2 max-w-7xl">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-white font-bold tracking-wider uppercase text-[10px] sm:text-[11px]">
            C²SA INTEL SOVEREIGN GRID
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400 inline" />
            <span>Cryptographic Escrow &amp; Audit Layer Active</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px] sm:text-[11px] flex-wrap">
          <a
            href="https://mudayhub.onrender.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-white transition inline-flex items-center gap-1"
          >
            <span>C²SA Enterprise</span>
            <ExternalLink className="h-2.5 w-2.5 text-slate-500" />
          </a>
          <span className="text-slate-700">·</span>
          <a
            href="https://trustnil-ctf.onrender.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-white transition inline-flex items-center gap-1"
          >
            <span>Cyber Range CTF</span>
            <ExternalLink className="h-2.5 w-2.5 text-slate-500" />
          </a>
          <span className="text-slate-700">·</span>
          <a
            href="mailto:contact.ccsa.intel@gmail.com"
            className="text-rose-400 hover:text-rose-300 font-bold transition inline-flex items-center gap-1"
          >
            <Mail className="h-3 w-3" />
            <span className="hidden md:inline">Corporate Dispatch:</span>
            <span>contact.ccsa.intel@gmail.com</span>
          </a>
        </div>
      </div>
    </div>
  );
}
