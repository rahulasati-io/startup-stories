import type { ReactNode } from "react";

export function TrustPage({
  eyebrow,
  title,
  introduction,
  lastUpdated,
  children,
}: {
  eyebrow: string;
  title: string;
  introduction: string;
  lastUpdated?: string;
  children: ReactNode;
}) {
  return (
    <main className="bg-[#f7f6f2]">
      <article className="mx-auto max-w-4xl px-5 py-14 md:px-8 md:py-20">
        <header className="border-b border-zinc-300 pb-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-zinc-950 md:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-700">
            {introduction}
          </p>
          {lastUpdated && (
            <p className="mt-5 text-sm text-zinc-500">Last updated: {lastUpdated}</p>
          )}
        </header>

        <div className="mt-10 space-y-12 text-[17px] leading-8 text-zinc-700">
          {children}
        </div>
      </article>
    </main>
  );
}

export function TrustSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function TrustList({ children }: { children: ReactNode }) {
  return <ul className="ml-5 list-disc space-y-3 marker:text-amber-700">{children}</ul>;
}
