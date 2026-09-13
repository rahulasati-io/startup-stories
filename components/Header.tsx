"use client";

import Link from "next/link";
import { useState } from "react";

const navigation = [
  { href: "/companies", label: "Companies" },
  { href: "/people", label: "People" },
  { href: "/articles", label: "Articles" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
          <Link href="/" className="text-2xl font-extrabold tracking-tight text-zinc-950">MisterStory</Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium text-zinc-700 transition hover:text-black">
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-lg md:hidden"
          >
            ☰
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-white">
          <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-5">
            <Link href="/" onClick={() => setMenuOpen(false)} className="text-2xl font-extrabold tracking-tight">MisterStory</Link>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
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
                onClick={() => setMenuOpen(false)}
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
