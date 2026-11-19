import { PLATFORM_FEE_RATE } from "./types";

export function formatEtb(amount: number): string {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calcFeeSplit(total: number) {
  const platform_fee_etb = Math.round(total * PLATFORM_FEE_RATE * 100) / 100;
  const freelancer_net_etb = Math.round((total - platform_fee_etb) * 100) / 100;
  return { platform_fee_etb, freelancer_net_etb };
}

export function isValidPhone(phone: string): boolean {
  return /^\+251[97][0-9]{8}$/.test(phone);
}

export function paymentReference(contractId: string): string {
  return `muday-${contractId}-${Date.now()}`;
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatMemberSince(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "Recently";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}
