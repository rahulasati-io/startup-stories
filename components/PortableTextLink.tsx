import type { ReactNode } from "react";
import Link from "next/link";

const MISTERSTORY_HOSTS = new Set(["misterstory.in", "www.misterstory.in"]);

function getInternalHref(href: string) {
  if (href.startsWith("/")) return href;

  try {
    const url = new URL(href);
    if (MISTERSTORY_HOSTS.has(url.hostname.toLowerCase())) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return null;
  }

  return null;
}

export default function PortableTextLink({
  children,
  value,
}: {
  children: ReactNode;
  value?: { href?: string };
}) {
  const href = value?.href?.trim();
  if (!href) return <>{children}</>;

  const internalHref = getInternalHref(href);
  if (internalHref) {
    return (
      <Link
        href={internalHref}
        className="font-medium text-zinc-950 underline decoration-zinc-400 underline-offset-4 hover:decoration-zinc-900"
      >
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-amber-700 underline decoration-amber-300 underline-offset-4 hover:text-amber-900"
    >
      {children}
    </a>
  );
}
