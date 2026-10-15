import HomepageCompanySearch from "@/components/HomepageCompanySearch";
import type { Company } from "@/components/CompanyDirectory";

export default function Hero({ companies }: { companies: Company[] }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
      {/* Hero headline */}
      <div className="text-center">
        <h1 className="mx-auto max-w-none text-[38px] font-semibold leading-[1.04] tracking-[-0.03em] text-zinc-950 sm:text-[44px] md:whitespace-nowrap md:text-[50px] lg:text-[56px]">
          No BS Business Breakdown
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-600 md:text-base">
          Discover interesting companies, the decisions that shaped them,
          and the strategies behind their success.
        </p>
      </div>

      <HomepageCompanySearch companies={companies} />
    </section>
  );
}
