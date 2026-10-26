"use client";

import Link from "@/components/NavigationLink";
import { usePathname } from "next/navigation";
import { useState } from "react";
import GlobalSearch from "@/components/GlobalSearch";
import SiteLogo from "@/components/SiteLogo";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/companies", label: "Companies" },
  { href: "/people", label: "People" },
  { href: "/authors", label: "Authors" },
  { href: "/articles", label: "Articles" },
  { href: "/data", label: "Data" },
];

export default function Header() {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-5 md:h-20 md:gap-6 md:px-8">
          <Link href="/" aria-label="MisterStory home" loadingLabel="Home" feedback="navigation" className="shrink-0">
            <SiteLogo className="h-8 w-auto md:h-9" />
          </Link>

          <GlobalSearch />

          <nav className="hidden shrink-0 items-center gap-4 md:flex lg:gap-6" aria-label="Main navigation">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} loadingLabel={item.label} feedback="navigation" className="text-sm font-medium text-zinc-700 transition hover:text-black">
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuPath(pathname)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-lg md:hidden"
          >
            ☰
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-white">
          <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-5">
            <Link href="/" aria-label="MisterStory home" loadingLabel="Home" feedback="navigation" onClick={() => { if (pathname === "/") setMenuPath(null); }}>
              <SiteLogo className="h-8 w-auto" />
            </Link>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuPath(null)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-xl"
            >
              ×
            </button>
          </div>

          <nav className="flex flex-col px-6 py-10" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                loadingLabel={item.label}
                feedback="navigation"
                onClick={() => { if (item.href === pathname) setMenuPath(null); }}
                className="border-b border-zinc-100 py-5 text-3xl font-bold"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
