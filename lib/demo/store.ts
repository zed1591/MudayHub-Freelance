import crypto, { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { calcFeeSplit, paymentReference } from "@/lib/utils";
import { sendTelegramAlert } from "@/lib/notifications/telegram";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import type {
  Contract,
  Dispute,
  Gig,
  Job,
  Message,
  Notification,
  Profile,
  Proposal,
  Review,
  StoredUpload,
  TrustDeed,
  UserRole,
  WorklogEntry,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".demo-data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

export interface DemoUser {
  id: string;
  email: string;
  password: string;
  profile: Profile;
}

export interface DemoStore {
  users: DemoUser[];
  jobs: Job[];
  gigs: Gig[];
  proposals: Proposal[];
  contracts: Contract[];
  disputes: Dispute[];
  messages: Message[];
  notifications: Notification[];
  reviews: Review[];
  uploads: StoredUpload[];
  worklogs?: WorklogEntry[];
  deeds?: TrustDeed[];
  sessions: Record<string, string>; // token -> userId
  passwordResets?: Record<string, { userId: string; email: string; expiresAt: number }>;
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function readStore(): DemoStore {
  ensureDir();
  if (!fs.existsSync(STORE_FILE)) {
    const seeded = seedStore();
    writeStore(seeded);
    return seeded;
  }
  const parsed = JSON.parse(fs.readFileSync(STORE_FILE, "utf8")) as DemoStore;
  let mutated = false;
  if (!parsed.gigs || parsed.gigs.length === 0) {
    parsed.gigs = getSeedGigs(parsed.users);
    mutated = true;
  }
  if (!parsed.reviews) {
    parsed.reviews = getSeedReviews();
    mutated = true;
  }
  if (!parsed.uploads) {
    parsed.uploads = [];
    mutated = true;
  }
  if (!parsed.worklogs) {
    parsed.worklogs = [];
    mutated = true;
  }
  if (!parsed.deeds) {
    parsed.deeds = [];
    mutated = true;
  }
  if (!parsed.passwordResets) {
    parsed.passwordResets = {};
    mutated = true;
  }
  if (mutated) {
    writeStore(parsed);
  }
  return parsed;
}

export function writeStore(store: DemoStore) {
  ensureDir();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
}

function makeProfile(
  id: string,
  full_name: string,
  role: UserRole,
  extras: Partial<Profile> = {}
): Profile {
  return {
    id,
    role,
    full_name,
    headline: extras.headline ?? null,
    phone: extras.phone ?? null,
    bio: extras.bio ?? "",
    skills: extras.skills ?? [],
    telebirr_number: extras.telebirr_number ?? null,
    telegram_chat_id: extras.telegram_chat_id ?? null,
    telegram_username: extras.telegram_username ?? null,
    github_url: extras.github_url ?? null,
    portfolio_url: extras.portfolio_url ?? null,
    linkedin_url: extras.linkedin_url ?? null,
    past_projects: extras.past_projects ?? [],
    experience: extras.experience ?? [],
    education: extras.education ?? [],
    certifications: extras.certifications ?? [],
    rating: extras.rating ?? 5,
    is_verified: extras.is_verified ?? false,
    created_at: extras.created_at ?? new Date().toISOString(),
  };
}

export function getSeedGigs(users: DemoUser[]): Gig[] {
  const abebe = users.find((u) => u.email === "freelancer@mudayhub.et")?.id || "22222222-2222-2222-2222-222222222222";
  const hiwot = users.find((u) => u.email === "designer@mudayhub.et")?.id || "33333333-3333-3333-3333-333333333333";

  return [
    {
      id: "gig-fullstack-telebirr",
      freelancer_id: abebe,
      title: "Full-Stack Next.js 15 Web Application with Telebirr Escrow & Identity",
      slug: "fullstack-nextjs-telebirr-escrow",
      category: "Web & Full Stack",
      description:
        "Professional full-stack web application development tailored for modern enterprises and global clients. Built with Next.js 15 App Router, TypeScript, Tailwind CSS, and seamless Telebirr / Chapa payment integration. Fully responsive, optimized for low-bandwidth networks (3G/4G), and backed by clean, maintainable code with automated tests.",
      cover_image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80"
      ],
      tags: ["Next.js", "React", "TypeScript", "Telebirr", "Chapa", "PostgreSQL"],
      packages: {
        basic: {
          name: "basic",
          title: "Landing Page & Lead Funnel",
          description: "High-converting single-page responsive website with contact form and SEO optimization.",
          price_etb: 6500,
          delivery_days: 3,
          revisions: 2,
          features: ["1 Page Design", "Mobile Responsive", "Contact Form", "Basic SEO", "Source Code"]
        },
        standard: {
          name: "standard",
          title: "Complete Web App + Telebirr",
          description: "Up to 5 pages dynamic application with authentication, database models, and Telebirr gateway integration.",
          price_etb: 18500,
          delivery_days: 7,
          revisions: 4,
          features: ["Up to 5 Pages", "Supabase / Postgres DB", "User Auth & Roles", "Telebirr Gateway", "Webhook HMAC", "Source Code"]
        },
        premium: {
          name: "premium",
          title: "Enterprise SaaS & Admin Portal",
          description: "Full production-grade SaaS platform with admin dashboard, analytics, multi-role auth, and complete deployment.",
          price_etb: 42000,
          delivery_days: 14,
          revisions: 99,
          features: ["Full Application", "Admin Management Dashboard", "Telebirr & Chapa Escrow", "Docker / Cloud Setup", "30 Days Support", "Complete Documentation"]
        }
      },
      rating: 4.96,
      reviews_count: 24,
      orders_completed: 31,
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
      id: "gig-telegram-bot-miniapp",
      freelancer_id: abebe,
      title: "Telegram Mini-App & Automated Customer Service Bot with Telebirr Webhooks",
      slug: "telegram-bot-miniapp-telebirr",
      category: "Web & Full Stack",
      description:
        "Transform high-volume Telegram traffic into automated, profitable business operations. Custom Telegram Mini-App (TMA) and interactive chatbot built with Node.js/Python, integrated with automated Telebirr payment confirmation webhooks, order management, and customer support ticket routing.",
      cover_image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80"
      ],
      tags: ["Telegram Bot", "Telegram Mini Apps", "Telebirr", "Python", "Node.js", "Webhooks"],
      packages: {
        basic: {
          name: "basic",
          title: "Essential Telegram Notification Bot",
          description: "Automated alert bot connected to your backend API or database with broadcast commands.",
          price_etb: 5500,
          delivery_days: 2,
          revisions: 2,
          features: ["Custom Commands (/start, /help)", "Admin Broadcast Tool", "Webhook Server Setup", "Deployment Guide"]
        },
        standard: {
          name: "standard",
          title: "E-Commerce Bot + Telebirr Checkout",
          description: "Full conversational store: product catalog browsing, cart management, and instant Telebirr payment verification.",
          price_etb: 15000,
          delivery_days: 6,
          revisions: 4,
          features: ["Product Catalog Menu", "Telebirr Direct Checkout", "Payment Webhook Verification", "Order Receipt Generation", "Admin Dashboard"]
        },
        premium: {
          name: "premium",
          title: "Native Telegram Mini-App (TMA) Suite",
          description: "Full-screen web application running inside Telegram with Next.js UI, user session sync, and database backend.",
          price_etb: 36000,
          delivery_days: 12,
          revisions: 99,
          features: ["Full TMA React/Next.js Webview", "Telegram CloudStorage Sync", "Telebirr & Chapa Escrow", "High-Concurrency Cloud Hosting", "30 Days Maintenance"]
        }
      },
      rating: 5.0,
      reviews_count: 18,
      orders_completed: 22,
      created_at: new Date(Date.now() - 86400000 * 28).toISOString(),
    },
    {
      id: "gig-brand-identity-amharic",
      freelancer_id: hiwot,
      title: "Modern Brand Identity, Ethiopian Logo Mark & Amharic Typography System",
      slug: "brand-identity-amharic-typography",
      category: "Brand Identity & Graphics",
      description:
        "Bilingual brand design crafted specifically for modern enterprises and global brands. We combine deep typography systems with international Swiss-style minimalism. Perfect for tech startups, coffee exporters, hotels, and retail brands.",
      cover_image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=800&auto=format&fit=crop&q=80"
      ],
      tags: ["Brand Identity", "Logo Design", "Amharic Typography", "Figma", "Packaging"],
      packages: {
        basic: {
          name: "basic",
          title: "Essential Logo Mark",
          description: "2 custom logo concepts in English + Amharic ligature, high resolution vector files.",
          price_etb: 4500,
          delivery_days: 2,
          revisions: 2,
          features: ["2 Logo Concepts", "Vector SVG & PNG", "Transparent Background", "Color Palette"]
        },
        standard: {
          name: "standard",
          title: "Full Brand Guidelines & Fonts",
          description: "Complete visual identity: bilingual logo, typography pairing (English + Ge'ez), color system, and social media kit.",
          price_etb: 12000,
          delivery_days: 5,
          revisions: 5,
          features: ["3 Logo Concepts", "Brand Style Guide (PDF)", "Amharic Font Pairing", "Social Media Templates", "Print Ready Files"]
        },
        premium: {
          name: "premium",
          title: "Corporate Identity & Packaging Suite",
          description: "End-to-end corporate branding, packaging design, marketing collateral, stationary, and interactive Figma design system.",
          price_etb: 28000,
          delivery_days: 10,
          revisions: 99,
          features: ["Full Brand Book", "Product Packaging System", "Figma Design System", "Stationery & Business Cards", "3D Mockups", "Copyright Transfer"]
        }
      },
      rating: 4.92,
      reviews_count: 19,
      orders_completed: 26,
      created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
    },
    {
      id: "gig-security-audit-fintech",
      freelancer_id: abebe,
      title: "National Bank (NBE) & OWASP Security Audit for Ethiopian FinTech Platforms",
      slug: "security-audit-pentest-fintech",
      category: "Cybersecurity & Auditing",
      description:
        "Specialized security assessment for fintech, banks, and e-commerce platforms. Certified ethical hacking following OWASP Top 10, API security testing, business logic flaw identification, and actionable remediation guidelines compliant with cybersecurity standards.",
      cover_image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80"
      ],
      tags: ["Penetration Testing", "OWASP", "API Security", "Ethical Hacking", "FinTech"],
      packages: {
        basic: {
          name: "basic",
          title: "Vulnerability Scan & Rapid Assessment",
          description: "Automated vulnerability scan + manual verification of top critical issues for single domain.",
          price_etb: 9500,
          delivery_days: 3,
          revisions: 1,
          features: ["Network & Web Port Scan", "OWASP Top 10 Checks", "Executive Summary Report", "Severity Scoring"]
        },
        standard: {
          name: "standard",
          title: "Deep API & Web App Penetration Test",
          description: "In-depth black-box & grey-box test of web portal and REST/GraphQL APIs. Includes PoC exploits.",
          price_etb: 26000,
          delivery_days: 7,
          revisions: 2,
          features: ["Full API Pentest", "Authentication & Auth Bypass Testing", "Business Logic Flaw Analysis", "Developer Fix Guide", "1 Re-test of fixed items"]
        },
        premium: {
          name: "premium",
          title: "NBE FinTech Compliance & Architecture Review",
          description: "Bank-grade comprehensive audit: source code review, cloud infra review, and official sign-off report.",
          price_etb: 58000,
          delivery_days: 14,
          revisions: 3,
          features: ["Full Source Code Review", "Cloud Infrastructure Audit", "Formal NBE Compliance Documentation", "Executive & Technical Reports", "Verification Retest"]
        }
      },
      rating: 5.0,
      reviews_count: 11,
      orders_completed: 15,
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    },
    {
      id: "gig-mobile-flutter-telebirr",
      freelancer_id: abebe,
      title: "Cross-Platform Flutter Mobile Application with CBE Birr & Telebirr Rails",
      slug: "flutter-mobile-app-telebirr",
      category: "Mobile App Development",
      description:
        "Cross-platform Flutter application for iOS and Android with beautiful native performance. Integrated with offline-first caching for high network reliability, Telebirr and CBE Birr in-app payment callbacks, and push notifications.",
      cover_image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80"
      ],
      tags: ["Flutter", "Mobile App", "Android", "iOS", "Telebirr", "Offline First"],
      packages: {
        basic: {
          name: "basic",
          title: "Mobile UI Prototype",
          description: "Pixel-perfect Flutter UI implementation from Figma with state management (3 screens).",
          price_etb: 11000,
          delivery_days: 4,
          revisions: 2,
          features: ["3 Screens UI", "Fluid Animations", "Responsive Android/iOS", "Source Code"]
        },
        standard: {
          name: "standard",
          title: "Complete Mobile MVP + API Integration",
          description: "Up to 8 screens with REST API connectivity, user authentication, and Telebirr checkout.",
          price_etb: 32000,
          delivery_days: 10,
          revisions: 4,
          features: ["8 Mobile Screens", "Backend API Integration", "Telebirr In-App Payment", "Offline Data Caching", "App Store & Play Store Builds"]
        },
        premium: {
          name: "premium",
          title: "Enterprise Mobile Ecosystem",
          description: "Full-featured production app with background geolocation, push notifications, multi-currency support, and store publishing.",
          price_etb: 65000,
          delivery_days: 21,
          revisions: 99,
          features: ["Unlimited Screens", "Push Notifications & Firebase", "Telebirr + CBE Birr Gateway", "Google Play & App Store Submission", "60 Days Post-Launch Support"]
        }
      },
      rating: 4.95,
      reviews_count: 14,
      orders_completed: 18,
      created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    },
    {
      id: "gig-amharic-translation-localization",
      freelancer_id: hiwot,
      title: "Enterprise Software & FinTech Localization in Amharic, Afaan Oromoo & Tigrinya",
      slug: "amharic-oromoo-software-localization",
      category: "Translation & Localization",
      description:
        "Human-first professional software and marketing localization. Native speakers with tech industry background ensuring proper UI string fit, cultural nuance, fintech terminology, and natural phrasing. No Google Translate awkwardness.",
      cover_image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80"
      ],
      tags: ["Amharic", "Translation", "Localization", "Afaan Oromoo", "Tigrinya", "UI Copy"],
      packages: {
        basic: {
          name: "basic",
          title: "Quick Localization (Up to 1,000 words)",
          description: "Accurate translation of marketing copy, landing pages, or onboarding flows into Amharic or Afaan Oromoo.",
          price_etb: 2500,
          delivery_days: 2,
          revisions: 2,
          features: ["Up to 1,000 Words", "Proofreading & Glossary", "JSON / i18n file delivery", "Cultural Relevance Check"]
        },
        standard: {
          name: "standard",
          title: "App String Localization (Up to 5,000 words)",
          description: "Complete UI translation for mobile or web apps including error messages, buttons, and terms.",
          price_etb: 8000,
          delivery_days: 4,
          revisions: 3,
          features: ["Up to 5,000 Words", "UI Layout Fitting QA", "Dual Language Review", "i18n / gettext formatting"]
        },
        premium: {
          name: "premium",
          title: "Full Product Suite Localization (15,000 words)",
          description: "Complete platform localization across 2 languages (e.g. Amharic + Afaan Oromoo), user documentation, and live QA.",
          price_etb: 21000,
          delivery_days: 8,
          revisions: 99,
          features: ["15,000 Words Across 2 Languages", "In-App UI Live Testing", "Legal Terms & Privacy Policy", "Comprehensive Terminology Guide"]
        }
      },
      rating: 4.89,
      reviews_count: 16,
      orders_completed: 21,
      created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    }
  ];
}

export function getSeedReviews(): Review[] {
  return [
    {
      id: "rev-1",
      contract_id: "seed-completed-contract-1",
      author_id: "11111111-1111-1111-1111-111111111111",
      target_id: "22222222-2222-2222-2222-222222222222",
      gig_id: "gig-fullstack-telebirr",
      rating: 5,
      comment: "Abebe is phenomenal! Delivered our Telebirr integration ahead of schedule and the escrow release was seamless. Truly world-class engineer in Addis.",
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      author: { full_name: "Selam Tech PLC", role: "client" }
    },
    {
      id: "rev-2",
      contract_id: "seed-completed-contract-2",
      author_id: "11111111-1111-1111-1111-111111111111",
      target_id: "33333333-3333-3333-3333-333333333333",
      gig_id: "gig-brand-identity-amharic",
      rating: 5,
      comment: "Hiwot understood our coffee export brand instantly. The typography pairing received praise from all our European distributors.",
      created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
      author: { full_name: "Selam Tech PLC", role: "client" }
    }
  ];
}

export function seedStore(): DemoStore {
  const clientId = "11111111-1111-1111-1111-111111111111";
  const freelancerId = "22222222-2222-2222-2222-222222222222";
  const freelancer2Id = "33333333-3333-3333-3333-333333333333";
  const adminId = "44444444-4444-4444-4444-444444444444";

  const users: DemoUser[] = [
    {
      id: clientId,
      email: "client@mudayhub.et",
      password: "demo1234",
      profile: makeProfile(clientId, "Selam Tech PLC", "client", {
        phone: "+251911234567",
        bio: "Fast-growing startup building fintech and digital logistics for SMEs.",
        is_verified: true,
      }),
    },
    {
      id: freelancerId,
      email: "freelancer@mudayhub.et",
      password: "demo1234",
      profile: makeProfile(freelancerId, "Abebe Kebede", "freelancer", {
        headline: "Principal Full-Stack Engineer & Ethiopian FinTech Specialist",
        phone: "+251911000111",
        bio: "Senior Full-Stack & Security Engineer with 7+ years building enterprise web apps, payment gateways (Telebirr/Chapa), and mobile solutions.",
        skills: ["React", "Next.js", "TypeScript", "PostgreSQL", "Flutter", "Telebirr", "Cybersecurity"],
        telebirr_number: "+251911000111",
        github_url: "https://github.com/abebe-ethio-dev",
        portfolio_url: "https://abebe.dev",
        linkedin_url: "https://linkedin.com/in/abebe-kebede",
        past_projects: [
          {
            id: "proj-1",
            title: "Telebirr Merchant Payment Gateway SDK",
            description: "Production Node.js & Python library for automated QR checkout, webhooks, and B2B payout reconciliation.",
            link: "https://github.com/abebe-ethio-dev/telebirr-sdk",
            tags: ["Node.js", "Telebirr API", "Security", "Open Source"],
          },
          {
            id: "proj-2",
            title: "GuzoHaul B2B Freight Logistics Platform",
            description: "Cross-platform fleet tracking and cargo dispatch connecting distribution hubs with Ethio-Djibouti freight corridors.",
            link: "https://guzohaul.et",
            tags: ["Next.js", "Flutter", "PostgreSQL", "Google Maps"],
          },
        ],
        experience: [
          {
            id: "exp-1",
            title: "Lead FinTech Systems Architect",
            company: "Abyssinia Digital Labs",
            duration: "2021 – Present",
            description: "Architected high-throughput transaction routing and NBE compliance layers for multi-bank clearing rails.",
          },
          {
            id: "exp-2",
            title: "Senior Full-Stack Engineer",
            company: "Addis Software Solutions",
            duration: "2018 – 2021",
            description: "Built customer-facing portals and ERP modules using React, Node.js, and PostgreSQL.",
          },
        ],
        education: [
          {
            id: "edu-1",
            institution: "Addis Ababa University (AAU - AAiT)",
            degree: "B.Sc. in Software Engineering",
            field: "Computer Science & Engineering",
            year: "2018",
          },
        ],
        certifications: [
          {
            id: "cert-1",
            name: "AWS Certified Solutions Architect – Professional",
            issuer: "Amazon Web Services",
            year: "2023",
            credential_url: "https://aws.amazon.com/verification",
          },
          {
            id: "cert-2",
            name: "Certified Ethical Hacker (CEH) & OWASP Auditor",
            issuer: "EC-Council / INSA Ethiopia",
            year: "2022",
          },
        ],
        rating: 4.95,
        is_verified: true,
      }),
    },
    {
      id: freelancer2Id,
      email: "designer@mudayhub.et",
      password: "demo1234",
      profile: makeProfile(freelancer2Id, "Hiwot Assefa", "freelancer", {
        headline: "Lead Product Designer & Amharic Brand Strategist",
        phone: "+251922334455",
        bio: "Product Designer & Amharic Brand Strategist. Specializing in high-converting UI/UX, Ge'ez typography systems, and packaging.",
        skills: ["Figma", "Brand Design", "UI/UX", "Amharic Typography", "Design Systems", "Packaging"],
        telebirr_number: "+251922334455",
        portfolio_url: "https://behance.net/hiwot-design",
        past_projects: [
          {
            id: "proj-d1",
            title: "Fidel Ethiopic Digital Design System",
            description: "Comprehensive Figma UI kit with native Amharic, Afaan Oromoo, and Tigrinya typography scale.",
            link: "https://figma.com/@hiwot-fidel",
            tags: ["Figma", "Design System", "Ethiopic Typography"],
          },
        ],
        education: [
          {
            id: "edu-d1",
            institution: "Alle School of Fine Arts and Design (AAU)",
            degree: "B.A. in Industrial & Graphic Design",
            field: "Visual Communication Design",
            year: "2020",
          },
        ],
        rating: 4.90,
        is_verified: true,
      }),
    },
    {
      id: adminId,
      email: "admin@mudayhub.et",
      password: "demo1234",
      profile: makeProfile(adminId, "C²SA INTEL Arbiter", "admin", {
        phone: "+251911999888",
        is_verified: true,
      }),
    },
  ];

  const now = Date.now();
  const jobs: Job[] = [
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      client_id: clientId,
      title: "Build Telebirr checkout for SME dashboard",
      description:
        "We need a production-ready Telebirr + Chapa checkout flow for our SME analytics dashboard. Include webhook HMAC verification, ETB receipts, and a React admin panel. Prefer TypeScript.",
      category: "Full Stack Development",
      budget_etb: 45000,
      status: "open",
      skills: ["React", "Node.js", "Chapa", "Telebirr"],
      created_at: new Date(now - 86400000 * 2).toISOString(),
    },
    {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      client_id: clientId,
      title: "Security audit of Laravel API",
      description:
        "Perform a black-box and code-assisted security audit of our Laravel 11 API. Deliver findings report with CVSS scores and remediation steps.",
      category: "Security Audit",
      budget_etb: 28000,
      status: "open",
      skills: ["Penetration Testing", "Laravel", "OWASP"],
      created_at: new Date(now - 86400000).toISOString(),
    },
    {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      client_id: clientId,
      title: "Bilingual brand redesign for coffee export",
      description:
        "Redesign logo, packaging system, and bilingual landing page for a specialty coffee exporter targeting global buyers.",
      category: "Brand Design",
      budget_etb: 18000,
      status: "open",
      skills: ["Figma", "Brand Design", "Amharic"],
      created_at: new Date(now - 3600000 * 5).toISOString(),
    },
  ];

  const gigs = getSeedGigs(users);
  const reviews = getSeedReviews();

  return {
    users,
    jobs,
    gigs,
    proposals: [],
    contracts: [],
    disputes: [],
    messages: [],
    notifications: [],
    reviews,
    uploads: [],
    worklogs: [],
    deeds: [],
    sessions: {},
    passwordResets: {},
  };
}

function timingSafeStringCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function demoLogin(email: string, password: string) {
  const store = readStore();
  const user = store.users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() &&
      timingSafeStringCompare(u.password, password)
  );
  if (!user) return null;
  const token = randomUUID();
  store.sessions[token] = user.id;
  writeStore(store);
  return { token, user };
}

export function demoRegister(input: {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone?: string;
}) {
  const store = readStore();
  const normalizedEmail = input.email.trim().toLowerCase();
  if (store.users.some((u) => u.email.trim().toLowerCase() === normalizedEmail)) {
    throw new Error("An account with this email address already exists. Please log in instead.");
  }
  if (input.phone) {
    const cleanPhone = input.phone.trim();
    if (cleanPhone && store.users.some((u) => u.profile.phone === cleanPhone || u.profile.telebirr_number === cleanPhone)) {
      throw new Error("An account with this phone number already exists.");
    }
  }
  const id = randomUUID();
  const user: DemoUser = {
    id,
    email: normalizedEmail,
    password: input.password,
    profile: makeProfile(id, input.full_name, input.role, {
      phone: input.phone || null,
    }),
  };
  store.users.push(user);
  const token = randomUUID();
  store.sessions[token] = id;
  writeStore(store);
  return { token, user };
}

export function demoUserFromToken(token: string | undefined | null) {
  if (!token) return null;
  const store = readStore();
  const userId = store.sessions[token];
  if (!userId) return null;
  return store.users.find((u) => u.id === userId) || null;
}

export function demoAcceptProposal(proposalId: string, clientId: string) {
  const store = readStore();
  const proposal = store.proposals.find((p) => p.id === proposalId);
  if (!proposal) throw new Error("Proposal not found");
  const job = store.jobs.find((j) => j.id === proposal.job_id);
  if (!job || job.client_id !== clientId) throw new Error("Not authorized");
  if (proposal.status !== "pending") throw new Error("Proposal already handled");

  proposal.status = "accepted";
  store.proposals.forEach((p) => {
    if (p.job_id === job.id && p.id !== proposal.id && p.status === "pending") {
      p.status = "rejected";
    }
  });
  job.status = "in_progress";

  const fees = calcFeeSplit(proposal.bid_amount_etb);
  const contractId = randomUUID();
  const contract: Contract = {
    id: contractId,
    job_id: job.id,
    proposal_id: proposal.id,
    client_id: job.client_id,
    freelancer_id: proposal.freelancer_id,
    total_amount_etb: proposal.bid_amount_etb,
    platform_fee_etb: fees.platform_fee_etb,
    freelancer_net_etb: fees.freelancer_net_etb,
    escrow_status: "awaiting_deposit",
    payment_reference: paymentReference(contractId),
    work_submission_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  store.contracts.push(contract);

  pushNotification(store, proposal.freelancer_id, {
    title: "Proposal accepted",
    body: `Your proposal on "${job.title}" was accepted. Waiting for escrow deposit.`,
    link: `/contracts/${contract.id}`,
  });
  pushNotification(store, job.client_id, {
    title: "Contract created",
    body: `Deposit ${proposal.bid_amount_etb} ETB to fund escrow.`,
    link: `/contracts/${contract.id}`,
  });

  writeStore(store);
  return contract;
}

/** Direct gig package order into Escrow */
export function demoOrderGig(params: {
  gigId: string;
  packageTier: "basic" | "standard" | "premium";
  clientId: string;
  requirements?: string;
}) {
  const store = readStore();
  const gig = store.gigs.find((g) => g.id === params.gigId);
  if (!gig) throw new Error("Gig not found");
  if (gig.freelancer_id === params.clientId) {
    throw new Error("Cannot order your own service");
  }
  const pkg = gig.packages[params.packageTier];
  if (!pkg) throw new Error("Invalid package tier");

  const fees = calcFeeSplit(pkg.price_etb);
  const contractId = randomUUID();
  const contract: Contract = {
    id: contractId,
    gig_id: gig.id,
    package_tier: params.packageTier,
    client_id: params.clientId,
    freelancer_id: gig.freelancer_id,
    total_amount_etb: pkg.price_etb,
    platform_fee_etb: fees.platform_fee_etb,
    freelancer_net_etb: fees.freelancer_net_etb,
    escrow_status: "awaiting_deposit",
    payment_reference: paymentReference(contractId),
    work_submission_url: null,
    work_submission_notes: params.requirements || `Ordered ${pkg.title} (${params.packageTier})`,
    revisions_remaining: pkg.revisions,
    revision_requested: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  store.contracts.push(contract);

  // create initial system chat message
  store.messages.push({
    id: randomUUID(),
    contract_id: contractId,
    sender_id: params.clientId,
    body: `Order started for ${gig.title} [${params.packageTier.toUpperCase()} Package: ${pkg.title}]. Requirements: ${params.requirements || "Standard specifications as described in gig."}`,
    created_at: new Date().toISOString(),
  });

  pushNotification(store, gig.freelancer_id, {
    title: "New Gig Order Received!",
    body: `Client ordered "${pkg.title}" on your gig. Escrow deposit pending.`,
    link: `/contracts/${contract.id}`,
  });
  pushNotification(store, params.clientId, {
    title: "Order Placed",
    body: `Your order for "${gig.title}" is ready. Fund escrow to begin work!`,
    link: `/contracts/${contract.id}`,
  });

  writeStore(store);
  return contract;
}

/** Request revision from freelancer */
export function demoRequestRevision(contractId: string, clientId: string, notes: string) {
  const store = readStore();
  const contract = store.contracts.find((c) => c.id === contractId);
  if (!contract) throw new Error("Contract not found");
  if (contract.client_id !== clientId) throw new Error("Not authorized");
  if (contract.escrow_status !== "work_submitted") {
    throw new Error("Can only request revision when work is submitted");
  }

  contract.revision_requested = true;
  contract.revision_notes = notes;
  contract.escrow_status = "funded"; // back to in-progress for freelancer to revise
  contract.updated_at = new Date().toISOString();

  store.messages.push({
    id: randomUUID(),
    contract_id: contractId,
    sender_id: clientId,
    body: `REVISION REQUESTED: ${notes}`,
    created_at: new Date().toISOString(),
  });

  pushNotification(store, contract.freelancer_id, {
    title: "Revision Requested",
    body: `Client requested changes: "${notes.slice(0, 80)}"`,
    link: `/contracts/${contract.id}`,
  });

  writeStore(store);
  return contract;
}

/** Submit Star Rating & Review after contract release */
export function demoAddReview(params: {
  contractId: string;
  authorId: string;
  rating: number;
  comment: string;
}) {
  const store = readStore();
  const contract = store.contracts.find((c) => c.id === params.contractId);
  if (!contract) throw new Error("Contract not found");
  if (contract.escrow_status !== "completed") {
    throw new Error("Reviews can only be submitted for completed contracts");
  }

  const isClient = contract.client_id === params.authorId;
  const isFreelancer = contract.freelancer_id === params.authorId;
  if (!isClient && !isFreelancer) throw new Error("Not authorized to review this contract");

  const targetId = isClient ? contract.freelancer_id : contract.client_id;
  const authorUser = store.users.find((u) => u.id === params.authorId);

  const review: Review = {
    id: randomUUID(),
    contract_id: params.contractId,
    author_id: params.authorId,
    target_id: targetId,
    gig_id: contract.gig_id,
    rating: Math.max(1, Math.min(5, params.rating)),
    comment: params.comment,
    created_at: new Date().toISOString(),
    author: authorUser ? { full_name: authorUser.profile.full_name, role: authorUser.profile.role } : undefined,
  };

  store.reviews.push(review);

  // update target user rating
  const targetUser = store.users.find((u) => u.id === targetId);
  if (targetUser) {
    const targetReviews = store.reviews.filter((r) => r.target_id === targetId);
    const avg = targetReviews.reduce((sum, r) => sum + r.rating, 0) / targetReviews.length;
    targetUser.profile.rating = Number(avg.toFixed(2));
  }

  // update gig rating if gig order
  if (contract.gig_id) {
    const gig = store.gigs.find((g) => g.id === contract.gig_id);
    if (gig) {
      const gigReviews = store.reviews.filter((r) => r.gig_id === contract.gig_id);
      const avg = gigReviews.reduce((sum, r) => sum + r.rating, 0) / gigReviews.length;
      gig.rating = Number(avg.toFixed(2));
      gig.reviews_count = gigReviews.length;
      gig.orders_completed = (gig.orders_completed || 0) + 1;
    }
  }

  writeStore(store);
  return review;
}

export function pushNotification(
  store: DemoStore,
  userId: string,
  n: { title: string; body: string; link?: string }
) {
  store.notifications.unshift({
    id: randomUUID(),
    user_id: userId,
    title: n.title,
    body: n.body,
    link: n.link || null,
    read: false,
    created_at: new Date().toISOString(),
  });

  // Asynchronously dispatch instant Telegram alert if configured
  const targetUser = store.users.find((u) => u.id === userId);
  const chatId = targetUser?.profile.telegram_chat_id || undefined;

  void sendTelegramAlert({
    title: n.title,
    body: n.body,
    link: n.link,
    chatId,
  }).catch(() => {
    /* ignore background delivery errors */
  });

  // Asynchronously dispatch transactional email if user email is present
  if (targetUser?.email) {
    void sendTransactionalEmail({
      to: targetUser.email,
      subject: `${n.title} · ሙዳይ ፍሪላንስ`,
      title: n.title,
      body: n.body,
      actionUrl: n.link || undefined,
      actionLabel: "Open Workspace",
    }).catch(() => {
      /* ignore background email delivery errors */
    });
  }
}

export function resetDemoStore() {
  const seeded = seedStore();
  writeStore(seeded);
  return seeded;
}

export function demoAddWorklog(params: {
  contractId: string;
  milestoneId?: string | null;
  authorId: string;
  title: string;
  description: string;
  hoursSpent?: number;
  deliverableUrl?: string;
}): WorklogEntry {
  const store = readStore();
  const contract = store.contracts.find((c) => c.id === params.contractId);
  if (!contract) throw new Error("Contract not found");
  if (contract.freelancer_id !== params.authorId && contract.client_id !== params.authorId) {
    throw new Error("Unauthorized to log work for this contract");
  }

  const id = `wl-${randomUUID()}`;
  const entry: WorklogEntry = {
    id,
    contract_id: params.contractId,
    milestone_id: params.milestoneId || null,
    author_id: params.authorId,
    title: params.title.trim(),
    description: params.description.trim(),
    hours_spent: params.hoursSpent,
    deliverable_url: params.deliverableUrl?.trim() || undefined,
    status: "submitted",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!store.worklogs) store.worklogs = [];
  store.worklogs.push(entry);

  // Notify client of new progress update
  const recipientId =
    params.authorId === contract.freelancer_id ? contract.client_id : contract.freelancer_id;
  pushNotification(store, recipientId, {
    title: "New Worklog Update",
    body: `Progress update logged: "${params.title}"`,
    link: `/contracts/${contract.id}`,
  });

  writeStore(store);
  return entry;
}

export function demoReviewWorklog(params: {
  worklogId: string;
  reviewerId: string;
  status: "approved" | "needs_revision";
  feedback?: string;
}): WorklogEntry {
  const store = readStore();
  if (!store.worklogs) store.worklogs = [];
  const entry = store.worklogs.find((w) => w.id === params.worklogId);
  if (!entry) throw new Error("Worklog entry not found");

  const contract = store.contracts.find((c) => c.id === entry.contract_id);
  if (!contract || contract.client_id !== params.reviewerId) {
    throw new Error("Only client can review worklogs");
  }

  entry.status = params.status;
  if (params.feedback) entry.feedback = params.feedback.trim();
  entry.updated_at = new Date().toISOString();

  pushNotification(store, entry.author_id, {
    title: params.status === "approved" ? "Worklog Approved" : "Worklog Needs Revision",
    body: params.feedback || `Status updated to ${params.status}`,
    link: `/contracts/${contract.id}`,
  });

  writeStore(store);
  return entry;
}

export function demoFindWorklogs(contractId: string): WorklogEntry[] {
  const store = readStore();
  const entries = (store.worklogs || []).filter((w) => w.contract_id === contractId);
  return entries.map((w) => {
    const author = store.users.find((u) => u.id === w.author_id)?.profile;
    return {
      ...w,
      author: author
        ? { full_name: author.full_name, avatar_url: author.avatar_url, role: author.role }
        : undefined,
    };
  });
}

export function demoRecordDeed(deed: TrustDeed): TrustDeed {
  const store = readStore();
  if (!store.deeds) store.deeds = [];
  const idx = store.deeds.findIndex((d) => d.deed_hash === deed.deed_hash);
  if (idx >= 0) {
    store.deeds[idx] = deed;
  } else {
    store.deeds.push(deed);
  }

  const contract = store.contracts.find((c) => c.id === deed.contract_id);
  if (contract) {
    contract.deed_hash = deed.deed_hash;
  }

  writeStore(store);
  return deed;
}

export function demoGetDeedByHash(hash: string): TrustDeed | null {
  const store = readStore();
  return (store.deeds || []).find((d) => d.deed_hash.toLowerCase() === hash.toLowerCase()) || null;
}

