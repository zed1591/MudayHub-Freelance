import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/AppShell";
import { PwaRegister } from "@/components/PwaRegister";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://mudayhub.et"),
  title: {
    default: "MudayHub | Freelance Marketplace Ethiopia | ሙዳይ ፍሪላንስ",
    template: "%s | MudayHub",
  },
  description:
    "Ethiopia's premier freelance talent marketplace. Connect with vetted software engineers, designers, auditors, and digital specialists with milestone escrow protection and instant Telebirr/CBE payment settlement.",
  keywords: [
    "MudayHub",
    "Muday Freelance",
    "ሙዳይ ፍሪላንስ",
    "Ethiopian Freelance Marketplace",
    "Ethiopian Software Engineers",
    "Hire Developers Ethiopia",
    "Addis Ababa Tech Talent",
    "Telebirr Escrow",
    "CBE Birr Escrow",
    "Verified Talent Ethiopia",
  ],
  authors: [{ name: "MudayHub" }],
  creator: "MudayHub",
  publisher: "MudayHub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["am_ET"],
    url: "/",
    siteName: "MudayHub",
    title: "MudayHub | Freelance Marketplace Ethiopia",
    description:
      "Connect with vetted software engineers, designers, auditors, and digital specialists with milestone escrow protection and instant Telebirr/CBE settlement.",
    images: [
      {
        url: "/logo-full.png",
        width: 1200,
        height: 630,
        alt: "MudayHub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MudayHub | Freelance Marketplace Ethiopia",
    description:
      "Connect with vetted software engineers, designers, auditors, and digital specialists with milestone escrow protection and instant Telebirr/CBE settlement.",
    images: ["/c2sa-intel-full.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/c2sa-intel-logo.svg",
    apple: "/c2sa-emblem.webp",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "C²SA INTEL Freelance",
  },
};

export const viewport: Viewport = {
  themeColor: "#C8102E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased bg-canvas text-slate-800 selection:bg-[#C8102E] selection:text-white">
        <PwaRegister />
        <SessionProvider>
          <AppShell>{children}</AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}
