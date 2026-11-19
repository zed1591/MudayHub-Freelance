import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F8FA",
        surface: "#FFFFFF",
        "surface-raised": "#F1F3F6",
        "surface-overlay": "#FFFFFF",
        "surface-card": "#FFFFFF",
        border: "rgba(28, 35, 45, 0.10)",
        "border-subtle": "rgba(28, 35, 45, 0.06)",
        "border-bright": "rgba(28, 35, 45, 0.18)",
        "border-brand": "rgba(217, 119, 33, 0.3)",

        // Unified MudayHub Ethiopian Brand Palette (warm ochre, terracotta gold, slate, escrow emerald)
        c2sa: {
          crimson: "#D97721", // Unified to MudayHub Brand Ochre
          "crimson-hover": "#BD5D13",
          "crimson-light": "rgba(217, 119, 33, 0.12)",
          slate: "#1E293B",
          "slate-dark": "#0F172A",
          "slate-light": "#334155",
          emerald: "#10B981",
          cyan: "#0EA5E9",
        },

        // MudayHub Brand Colors (from mudayhub corporate design system)
        brand: {
          DEFAULT: "#D97721",
          hover: "#BD5D13",
          light: "#A65310",
          dark: "#8E430D",
          terracotta: "#B94F2B",
          amber: "#F59E0B",
          "amber-light": "#FEF3C7",
          charcoal: "#181C20",
          "charcoal-light": "#24292F",
        },
        ochre: {
          DEFAULT: "#DF8A33",
          hover: "#C97524",
          light: "#F1C58F",
          dark: "#BD5D38",
        },
        terracotta: {
          DEFAULT: "#BD5D38",
          hover: "#A84C2A",
          light: "#E28867",
        },
        accent: {
          DEFAULT: "#DF8A33",
          hover: "#C97524",
        },
        // Financial & Escrow Trust Colors
        escrow: {
          DEFAULT: "#10B981", // Telebirr / CBE Trust Green
          hover: "#059669",
          light: "#34D399",
          dark: "#065F46",
        },
        dispute: {
          DEFAULT: "#EF4444",
          hover: "#DC2626",
          light: "#F87171",
        },
        muted: "#667085",
      },
      fontFamily: {
        sans: [
          "'Plus Jakarta Sans'",
          "'Noto Sans Ethiopic'",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
        ethio: ["'Noto Sans Ethiopic'", "sans-serif"],
        mono: ["'Space Grotesk'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 8px 24px -5px rgba(217, 119, 33, 0.18)",
        "glow-brand": "0 8px 26px -5px rgba(217, 119, 33, 0.22)",
        "glow-terracotta": "0 8px 24px -5px rgba(185, 79, 43, 0.2)",
        "glow-emerald": "0 0 35px -5px rgba(16, 185, 129, 0.3)",
        "glow-c2sa": "0 0 25px rgba(200, 16, 46, 0.28)",
        "glow-cortex": "0 0 35px rgba(200, 16, 46, 0.35)",
        ochre: "0 4px 14px -2px rgba(217, 119, 33, 0.28)",
        tactile: "0 1px 2px rgba(28, 35, 45, 0.08), 0 4px 14px rgba(28, 35, 45, 0.05)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "radial-highlight":
          "radial-gradient(circle at 50% 0%, rgba(217, 119, 33, 0.10) 0%, transparent 65%)",
        "radial-emerald":
          "radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.15) 0%, transparent 60%)",
        "radial-c2sa":
          "radial-gradient(circle at 50% 0%, rgba(200, 16, 46, 0.15) 0%, transparent 65%)",
        "muday-gradient": "linear-gradient(135deg, #E38A35 0%, #B94F2B 100%)",
        "muday-warm": "linear-gradient(135deg, #F59E0B 0%, #D97721 50%, #B94F2B 100%)",
        "c2sa-crimson": "linear-gradient(135deg, #C8102E 0%, #8E1437 100%)",
        "c2sa-tactical": "linear-gradient(135deg, #232D3F 0%, #1A222D 100%)",
        "c2sa-cyber": "linear-gradient(135deg, #C8102E 0%, #D97721 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
