export function isDemoMode(): boolean {
  // The server flag is authoritative. The public flag mirrors it for client UI,
  // but can never turn a production server back into demo mode.
  if (typeof window === "undefined") return process.env.DEMO_MODE === "true";
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
