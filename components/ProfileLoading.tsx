import Header from "@/components/Header";

export default function ProfileLoading({kind}: {kind: "company" | "person"}) {
  return <><Header /><main aria-busy="true" aria-label={`Loading ${kind} profile`} className="min-h-screen bg-[#f7f6f2] px-5 py-8 text-zinc-950 md:px-8">
    <div className="mx-auto max-w-6xl">
      <p role="status" className="mb-6 text-sm font-medium text-zinc-600">Opening {kind} profile…</p>
      <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
        <div className="h-4 w-44 rounded bg-zinc-200" />
        <div className="mt-7 h-14 w-3/4 max-w-xl rounded-xl bg-zinc-200" />
        <div className="mt-5 h-5 w-full max-w-2xl rounded bg-zinc-200" />
        <div className="mt-3 h-5 w-2/3 max-w-xl rounded bg-zinc-200" />
        <div className="mt-10 grid gap-6 md:grid-cols-[1.4fr_.8fr]">
          <div className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-7">
            <div className="mb-8 h-8 w-52 rounded bg-zinc-200" />
            {[100, 92, 96, 82, 95, 70].map((width, i) => <div key={i} style={{width: `${width}%`}} className="h-4 rounded bg-zinc-200" />)}
          </div>
          <div className="space-y-5 self-start rounded-3xl border border-zinc-200 bg-white p-7">
            <div className="h-5 w-36 rounded bg-zinc-200" />
            <div className="h-4 w-3/4 rounded bg-zinc-200" />
            <div className="h-4 w-1/2 rounded bg-zinc-200" />
          </div>
        </div>
      </div>
    </div>
  </main></>;
}
