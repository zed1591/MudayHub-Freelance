"use client";

import { useLanguage } from "./LanguageProvider";
import { Globe } from "lucide-react";

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className = "" }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur-xs text-xs font-bold ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <Globe className="h-3.5 w-3.5 text-slate-400 ml-1 mr-0.5 shrink-0" aria-hidden="true" />

      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
        className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
          language === "en"
            ? "bg-slate-900 text-white shadow-xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        }`}
        title="Switch to English"
      >
        EN
      </button>

      <button
        type="button"
        onClick={() => setLanguage("am")}
        aria-pressed={language === "am"}
        className={`px-2 py-1 rounded-lg transition-all cursor-pointer font-ethio ${
          language === "am"
            ? "bg-slate-900 text-white shadow-xs font-bold"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        }`}
        title="ወደ አማርኛ ቀይር"
      >
        አማ
      </button>
    </div>
  );
}
