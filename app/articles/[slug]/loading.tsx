import Header from "@/components/Header";

function LoadingLine({ className = "" }: { className?: string }) {
  return <div className={`h-4 rounded-full bg-zinc-200 ${className}`} />;
}

export default function ArticleLoading() {
  return (
    <>
      <Header />
      <main
        aria-busy="true"
        aria-label="Loading article"
        className="min-h-screen bg-[#f7f6f2] text-zinc-950"
      >
        <p className="sr-only" role="status">Loading article…</p>
        <section className="mx-auto max-w-7xl px-5 py-6 md:px-8 md:py-8">
          <div className="animate-pulse motion-reduce:animate-none">
            <LoadingLine className="w-44" />
            <div className="mt-7 max-w-4xl space-y-4">
              <LoadingLine className="h-10 w-full md:h-14" />
              <LoadingLine className="h-10 w-4/5 md:h-14" />
              <LoadingLine className="mt-5 w-72" />
            </div>

            <div className="mt-7 aspect-[2/1] max-w-5xl rounded-3xl bg-zinc-200 max-md:aspect-video" />

            <div className="mt-8 grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
              <article className="rounded-3xl border border-zinc-200 bg-white p-6 md:p-8">
                <div className="space-y-4">
                  <LoadingLine className="w-full" />
                  <LoadingLine className="w-[96%]" />
                  <LoadingLine className="w-[88%]" />
                  <LoadingLine className="w-[93%]" />
                  <LoadingLine className="w-3/4" />
                </div>
              </article>
              <aside className="hidden rounded-3xl border border-zinc-200 bg-white p-6 lg:block">
                <LoadingLine className="h-6 w-36" />
                <div className="mt-5 space-y-4">
                  <LoadingLine />
                  <LoadingLine className="w-5/6" />
                  <LoadingLine className="w-4/6" />
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
