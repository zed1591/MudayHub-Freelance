import Link from "next/link";
import Image from "next/image";


export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand border border-brand/30 shadow-glow">
        <Image src="/logo-emblem.png" alt="Muday-Freelance" width={36} height={36} />
      </div>
      <h2 className="mt-5 text-2xl font-black text-slate-900">Page Not Found</h2>
      <p className="mt-2 text-xs text-slate-600 leading-relaxed max-w-sm">
        The requested resource, service, or project could not be found on MudayHub.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn-primary !text-xs !py-3 !px-6 font-bold shadow-ochre">
          Return to Marketplace
        </Link>
        <Link href="/gigs" className="btn-secondary !text-xs !py-3 !px-5 font-semibold">
          Browse Services
        </Link>
      </div>
    </div>
  );
}
