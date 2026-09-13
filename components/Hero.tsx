import ArticleCard from "@/components/ArticleCard";
import HomepageCompanySearch from "@/components/HomepageCompanySearch";
import type { Company } from "@/components/CompanyDirectory";
import type { ArticleCardData } from "@/lib/article-card-data";

export default function Hero({ companies, featuredArticles }: { companies: Company[]; featuredArticles: ArticleCardData[] }) {
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

      {/* Discovery stories */}
      {featuredArticles.length > 0 && <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{featuredArticles.map((article) => <ArticleCard key={article._id} article={article} compact />)}</div>}
    </section>
  );
}
