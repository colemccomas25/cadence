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
      <h2 className="text-2xl font-semibold text-ink mb-2">{title}</h2>
      <p className="text-inkMuted max-w-md mb-6">{body}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href={ctaHref}
          className="rounded-sm bg-accent px-5 py-3 text-white font-medium hover:bg-accentHover transition-colors min-h-[48px] flex items-center"
        >
          {cta}
        </Link>
        {secondary && (
          <Link
            href={secondary.href}
            className="rounded-sm border border-line bg-surface px-5 py-3 text-ink font-medium hover:bg-muted transition-colors min-h-[48px] flex items-center"
          >
            {secondary.label}
          </Link>
        )}
      </div>
    </div>
  );
}
