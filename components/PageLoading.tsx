import Header from "@/components/Header";

export default function PageLoading({label = "page"}: {label?: string}) {
  return <><Header /><main aria-busy="true" aria-label={`Loading ${label}`} className="mx-auto min-h-screen max-w-7xl px-5 py-8 text-zinc-950 md:px-8">
    <p role="status" className="mb-6 text-sm font-medium text-zinc-600">Opening {label}…</p>
    <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
      <div className="h-4 w-40 rounded bg-zinc-200" />
      <div className="mt-7 h-10 w-3/4 max-w-xl rounded bg-zinc-200" />
      <div className="mt-5 h-4 w-full max-w-2xl rounded bg-zinc-200" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0,1,2,3,4,5].map(key=><div key={key} className="h-48 rounded-2xl border border-zinc-200 bg-zinc-50" />)}
      </div>
    </div>
  </main></>;
}
