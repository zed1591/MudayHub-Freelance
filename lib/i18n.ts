export type Language = "en" | "am";

export interface Translations {
  // Navigation
  services: string;
  rfps: string;
  talent: string;
  escrow: string;
  howItWorks: string;
  signIn: string;
  postProject: string;
  getStarted: string;
  openDashboard: string;
  protocol: string;
  escrowProtected: string;
  escrowActive: string;
  menu: string;

  // Hero & Marketplace
  heroTag: string;
  heroTitle: string;
  heroHighlight: string;
  heroSub: string;
  searchPlaceholder: string;
  allCategories: string;
  searchBtn: string;
  popular: string;
  joinNetwork: string;
  exploreGigs: string;

  // Metrics
  metric1Label: string;
  metric1Sub: string;
  metric2Label: string;
  metric2Sub: string;
  metric3Label: string;
  metric3Sub: string;
  metric4Label: string;
  metric4Sub: string;

  // Pages
  rfpPageBadge: string;
  rfpPageTitle: string;
  rfpPageSubClient: string;
  rfpPageSubFreelancer: string;
  escrowPageBadge: string;
  escrowPageTitle: string;
  howPageBadge: string;
  howPageTitle: string;

  // Footer & Common
  footerTagline: string;
  copyright: string;
  systemError: string;
  errorDesc: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation
    services: "Services & Gigs",
    rfps: "Project RFPs",
    talent: "Find Talent",
    escrow: "Escrow Security",
    howItWorks: "How It Works",
    signIn: "Sign In",
    postProject: "+ Post a Project",
    getStarted: "Get Started",
    openDashboard: "Open Dashboard →",
    protocol: "Protocol",
    escrowProtected: "Telebirr & CBE Escrow Protected",
    escrowActive: "Escrow Active",
    menu: "Navigation Menu",

    // Hero & Marketplace
    heroTag: "MUDAYHUB FREELANCE MARKETPLACE",
    heroTitle: "Ethiopian Tech Talent & Digital Services.",
    heroHighlight: "Secured by Escrow.",
    heroSub:
      "Commission vetted Ethiopian software engineers, designers, auditors, and digital creators. Zero prepayment risk. Funds are secured in milestone escrow until verified delivery.",
    searchPlaceholder: "What do you need built? (e.g. Telebirr SDK, Next.js, UI/UX)...",
    allCategories: "All Categories",
    searchBtn: "Search Services",
    popular: "Popular:",
    joinNetwork: "Join MudayHub Network",
    exploreGigs: "Explore Ready Services",

    // Metrics
    metric1Label: "ETB Escrow Settlement",
    metric1Sub: "Zero FX friction",
    metric2Label: "Dispute Rate",
    metric2Sub: "Guaranteed by arbitration",
    metric3Label: "Local Payment Rails",
    metric3Sub: "Instant mobile clearing",
    metric4Label: "Trust Integrity",
    metric4Sub: "Cryptographic Trust Deeds",

    // Pages
    rfpPageBadge: "MudayHub Project Requests",
    rfpPageTitle: "Project Requests & RFPs",
    rfpPageSubClient:
      "Browse open marketplace briefs or manage your company's custom requirements and view submitted proposals.",
    rfpPageSubFreelancer:
      "Explore open project briefs and submit formal solution pitches with your proposed milestones, pricing, and turnaround.",
    escrowPageBadge: "MudayHub Sovereign Escrow Protocol",
    escrowPageTitle: "High-Trust Milestone Escrow",
    howPageBadge: "MudayHub Marketplace Protocol",
    howPageTitle: "How MudayHub Works",

    // Footer & Common
    footerTagline:
      "Ethiopia's premier non-custodial freelance marketplace. Verified software engineers, designers, and digital specialists secured by Telebirr & CBE milestone escrow.",
    copyright: "All rights reserved.",
    systemError: "System Notice",
    errorDesc: "Something unexpected happened. Please try again.",
  },
  am: {
    // Navigation
    services: "አገልግሎቶች እና ጊጎች",
    rfps: "የፕሮጀክት ጨረታዎች",
    talent: "ባለሙያዎችን ያግኙ",
    escrow: "የክፍያ ዋስትና",
    howItWorks: "እንዴት እንደሚሰራ",
    signIn: "ይግቡ",
    postProject: "+ ፕሮጀክት ይለጥፉ",
    getStarted: "ይጀምሩ",
    openDashboard: "ዳሽቦርድ ይክፈቱ →",
    protocol: "ስርዓት",
    escrowProtected: "በቴሌብር እና በንግድ ባንክ ዋስትና የተጠበቀ",
    escrowActive: "የክፍያ ዋስትና ንቁ ነው",
    menu: "የአሰሳ ማውጫ",

    // Hero & Marketplace
    heroTag: "የሙዳይ ፍሪላንስ ዲጂታል ገበያ",
    heroTitle: "የኢትዮጵያ የቴክኖሎጂ ባለሙያዎች እና አገልግሎቶች።",
    heroHighlight: "በታማኝ ዋስትና የተጠበቀ።",
    heroSub:
      "የተመረጡ የኢትዮጵያ ሶፍትዌር መሐንዲሶች፣ ዲዛይነሮች እና የዲጂታል ፈጣሪዎችን ይቀጥሩ። ምንም የቅድመ ክፍያ ስጋት የለም። ክፍያዎ በዋስትና ሂሳብ ውስጥ ስራው እስኪረጋገጥ ድረስ ደህንነቱ ተጠብቆ ይቆያል።",
    searchPlaceholder: "ምን ማሰራት ይፈልጋሉ? (ምሳሌ፡ ቴሌብር፣ ዌብሳይት፣ ሞባይል አፕ)...",
    allCategories: "ሁሉም ዘርፎች",
    searchBtn: "አገልግሎቶችን ፈልግ",
    popular: "ተወዳጅ ዘርፎች፡",
    joinNetwork: "ሙዳይሀብን ይቀላቀሉ",
    exploreGigs: "ዝግጁ አገልግሎቶችን ይመልከቱ",

    // Metrics
    metric1Label: "የኢትዮጵያ ብር የክፍያ ዋስትና",
    metric1Sub: "ከውጭ ምንዛሬ ችግር ነፃ",
    metric2Label: "የክርክር መጠን",
    metric2Sub: "በገለልተኛ ሽምግልና የተረጋገጠ",
    metric3Label: "የሀገር ውስጥ የክፍያ አማራጮች",
    metric3Sub: "ቴሌብር እና የኢትዮጵያ ንግድ ባንክ",
    metric4Label: "የመረጃ ትክክለኛነት",
    metric4Sub: "የማይቀየር የዲጂታል ሰርተፍኬት",

    // Pages
    rfpPageBadge: "የሙዳይ የፕሮጀክት ጥያቄዎች",
    rfpPageTitle: "የፕሮጀክት ጥያቄዎች እና ጨረታዎች",
    rfpPageSubClient:
      "ክፍት የሆኑ የፕሮጀክት ፍላጎቶችን ይመልከቱ ወይም የድርጅትዎን ስራዎች በመለጠፍ የቀረቡ የዋጋ ሀሳቦችን ያስተዳድሩ።",
    rfpPageSubFreelancer:
      "ክፍት የሆኑ የስራ ጥያቄዎችን ይመልከቱ እና ተገቢውን የዋጋ፣ የጊዜ እና የክፍያ ደረጃዎችን ያካተተ ሀሳብ ያቅርቡ።",
    escrowPageBadge: "የሙዳይ የክፍያ ዋስትና ፕሮቶኮል",
    escrowPageTitle: "የታማኝ የክፍያ ደረጃዎች ዋስትና",
    howPageBadge: "የሙዳይ ፍሪላንስ አሰራር",
    howPageTitle: "ሙዳይሀብ እንዴት ይሰራል?",

    // Footer & Common
    footerTagline:
      "የኢትዮጵያ ቀዳሚ የፍሪላንስ ስራዎች መድረክ። የተረጋገጡ የሶፍትዌር መሐንዲሶች እና ዲዛይነሮች በቴሌብር እና በኢትዮጵያ ንግድ ባንክ የዋስትና አሰራር የተጠበቁ።",
    copyright: "መብቱ በህግ የተጠበቀ ነው።",
    systemError: "የስርዓት ማሳሰቢያ",
    errorDesc: "ያልተጠበቀ ችግር አጋጥሟል። እባክዎ እንደገና ይሞክሩ።",
  },
};
