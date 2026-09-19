import Link from "next/link";

const options = [
  {
    number: "01",
    title: "Company Deep Dives",
    description:
      "Understand how a company started, makes money, grows and wins.",
    action: "Explore companies",
    href: "#company-deep-dives",
  },
  {
    number: "02",
    title: "Business Stories",
    description:
      "Discover the decisions, turning points and moments behind interesting businesses.",
    action: "Read stories",
    href: "/articles",
  },
  {
    number: "03",
    title: "Strategy",
    description:
      "Learn how businesses use pricing, distribution, branding and more to win.",
    action: "Explore strategy",
    href: "/topics/strategy",
  },
];

export default function IntentCards() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-14">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
          Explore MisterStory
        </p>

        <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">
          What do you want to explore?
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {options.map((option) => (
          <Link
            key={option.number}
            href={option.href}
            className="group rounded-2xl border border-zinc-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-xs font-bold text-white">
                {option.number}
              </span>

              <span className="text-xs font-semibold text-zinc-400">
                Explore
              </span>
            </div>

            <h3 className="mt-7 text-xl font-bold tracking-tight text-zinc-950">
              {option.title}
            </h3>

            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {option.description}
            </p>

            <div className="mt-6 text-sm font-bold text-zinc-950">
              {option.action} →
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
