import Link from "next/link";

const topics = [
  { label: "Distribution", href: "/articles?q=Distribution" },
  { label: "Business Models", href: "/articles?category=Business%20Model" },
  { label: "Food Delivery", href: "/articles?q=Food%20Delivery" },
  { label: "Consumer Internet", href: "/articles?q=Consumer%20Internet" },
  { label: "Moats", href: "/articles?q=Moats" },
  { label: "Pricing Power", href: "/articles?q=Pricing%20Power" },
  { label: "Retail", href: "/articles?q=Retail" },
  { label: "Brand Building", href: "/articles?q=Brand%20Building" },
];

export default function Topics() {
  return (
    <section
      id="topics"
      className="mx-auto mt-14 max-w-7xl border-y border-zinc-200 bg-[#ece8dc] px-5 py-8 md:mt-16 md:px-8 md:py-10"
    >
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-amber-700">
          Explore by idea
        </p>

        <h2 className="mt-2 font-serif text-3xl font-normal tracking-tight text-zinc-900 md:text-4xl">
          Topics worth following
        </h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible">
        {topics.map((topic) => (
          <Link
            key={topic.label}
            href={topic.href}
            className="shrink-0 rounded-full border border-[#d5cfbf] px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-[#f4f1e8]"
          >
            {topic.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
