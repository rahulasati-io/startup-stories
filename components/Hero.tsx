import HomepageCompanySearch from "@/components/HomepageCompanySearch";
import type { Company } from "@/components/CompanyDirectory";

export default function Hero({ companies, title = "No BS Business Breakdown", description = "Discover interesting companies, the decisions that shaped them, and the strategies behind their success.", showSearch = true, searchPlaceholder, popularCompanies }: { companies: Company[]; title?: string; description?: string; showSearch?: boolean; searchPlaceholder?: string; popularCompanies?: {label: string; slug: string}[] }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
      {/* Hero headline */}
      <div className="text-center">
        <h1 className="mx-auto max-w-5xl text-[38px] font-semibold leading-[1.04] tracking-[-0.03em] text-zinc-950 sm:text-[44px] md:text-[50px] lg:text-[56px]">
          {title}
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-600 md:text-base">
          {description}
        </p>
      </div>

      {showSearch && <HomepageCompanySearch companies={companies} placeholder={searchPlaceholder} popular={popularCompanies} />}
    </section>
  );
}
