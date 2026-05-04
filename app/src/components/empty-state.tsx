import Link from "next/link";

export function EmptyState({
  title,
  body,
  cta,
  ctaHref,
  secondary,
}: {
  title: string;
  body: string;
  cta: string;
  ctaHref: string;
  secondary?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">{title}</h2>
      <p className="text-slate-500 max-w-md mb-6">{body}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href={ctaHref}
          className="rounded-md bg-cta px-5 py-3 text-white font-medium hover:opacity-90 transition-opacity min-h-[48px] flex items-center"
        >
          {cta}
        </Link>
        {secondary && (
          <Link
            href={secondary.href}
            className="rounded-md border border-slate-200 px-5 py-3 text-slate-700 font-medium hover:bg-slate-50 transition-colors min-h-[48px] flex items-center"
          >
            {secondary.label}
          </Link>
        )}
      </div>
    </div>
  );
}
