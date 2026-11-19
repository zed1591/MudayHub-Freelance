import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mudayhub.et";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/jobs",
          "/jobs/*",
          "/gigs",
          "/gigs/*",
          "/talent",
          "/how-it-works",
          "/escrow",
          "/verify",
          "/verify/*",
          "/login",
          "/register",
          "/forgot-password",
        ],
        disallow: [
          "/api/",
          "/admin/",
          "/admin/*",
          "/dashboard",
          "/contracts/",
          "/contracts/*",
          "/proposals",
          "/onboarding",
        ],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
