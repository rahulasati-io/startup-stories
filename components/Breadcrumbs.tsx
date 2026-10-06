import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="overflow-x-auto pb-1">
      <ol className="flex min-w-max items-center gap-2 text-xs font-medium text-zinc-500">
        {items.map((item, index) => {
          const current = index === items.length - 1;

          return (
            <li key={`${item.href || "current"}-${item.label}`} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true" className="text-zinc-300">/</span>}
              {item.href && !current ? (
                <Link href={item.href} className="transition hover:text-amber-800 hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={current ? "page" : undefined} className="max-w-[60vw] truncate text-zinc-700" title={item.label}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
