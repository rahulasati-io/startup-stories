export default function ProfileSectionsLoading() {
  return (
    <div role="status" className="mx-auto max-w-6xl px-5 py-8 md:px-8">
      <span className="sr-only">Loading related content</span>
      <div aria-hidden="true" className="h-40 rounded-3xl border border-zinc-200 bg-white" />
    </div>
  );
}
