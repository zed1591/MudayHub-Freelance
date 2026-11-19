import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "success" | "escrow" | "danger" | "outline" | "ghost" | "c2sa";
  size?: "sm" | "md" | "lg";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variantMap: Record<string, string> = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    success: "btn-success",
    escrow: "btn-escrow",
    danger: "btn-danger",
    outline: "btn-outline-brand",
    c2sa: "btn-c2sa",
    ghost: "px-3.5 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition",
  };

  const sizeMap: Record<string, string> = {
    sm: "!py-1.5 !px-3.5 !text-xs",
    md: "!py-2.5 !px-5 !text-xs sm:!text-sm",
    lg: "!py-3.5 !px-7 !text-sm sm:!text-base font-bold",
  };

  return (
    <button className={cn(variantMap[variant], sizeMap[size], className)} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("card-surface p-6", className)}>{children}</div>;
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "ochre" | "brand" | "escrow" | "dispute" | "muted" | "c2sa" | "c2sa-vetted";
  className?: string;
}) {
  const map: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    ochre: "bg-brand/10 text-brand-dark border-brand/20",
    brand: "bg-brand/10 text-brand-dark border-brand/20",
    escrow: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dispute: "bg-rose-50 text-rose-700 border-rose-200",
    muted: "bg-slate-50 text-slate-600 border-slate-200",
    c2sa: "bg-rose-50 text-[#C8102E] border-rose-200 font-bold",
    "c2sa-vetted": "bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
        map[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700", className)}>
      {children}
    </label>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-brand" />
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {hint && <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
      {action}
    </div>
  );
}
