import type {ReactNode} from "react";
import Link from "next/link";
import Newsletter from "@/components/Newsletter";
import HomepageArticleSection from "@/components/HomepageArticleSection";
import type {DirectoryPageSettings} from "@/lib/directory-page-config";
import {homepageHref} from "@/lib/homepage-config";
import {ARTICLE_CARDS_QUERY, type ArticleCardData} from "@/lib/article-card-data";
import {client} from "@/sanity/lib/client";

export default async function DirectoryPageLayout({settings, children, breadcrumb}: {settings: DirectoryPageSettings; children: ReactNode; breadcrumb?: ReactNode}) {
  const needsArticles = settings.sections.some(section => section.kind === "articles" && section.articleIds?.length);
  const articles = needsArticles ? await client.fetch<ArticleCardData[]>(ARTICLE_CARDS_QUERY, {}, {perspective: "published", next: {revalidate: 60}, signal: AbortSignal.timeout(6000)}).catch(() => [] as ArticleCardData[]) : [];
  const byId = new Map(articles.map(article => [article._id, article]));
  return <main className="bg-[#f7f6f2]">{breadcrumb}{settings.sections.map(section => {
    switch (section.kind) {
      case "directory": return <div key={section._key}>{children}</div>;
      case "newsletter": return <Newsletter key={section._key} title={section.title} description={section.description} buttonLabel={section.linkLabel} />;
      case "articles": return <HomepageArticleSection key={section._key} title={section.title || "Selected articles"} eyebrow={section.eyebrow || ""} description={section.description || ""} href={homepageHref(section.href, "/articles")} linkLabel={section.linkLabel} articles={[...new Set(section.articleIds || [])].flatMap(id => byId.get(id) ? [byId.get(id)!] : []).slice(0, 12)} />;
      case "text":
      case "links": return <section key={section._key} className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        {section.eyebrow && <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{section.eyebrow}</p>}
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">{section.title}</h2>
        {section.description && <p className="mt-3 max-w-4xl whitespace-pre-line leading-7 text-zinc-600">{section.description}</p>}
        {section.kind === "links" && <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{section.links?.map(link => <Link key={link._key} href={homepageHref(link.href, "/")} className="rounded-2xl border border-zinc-200 bg-white p-5 hover:border-zinc-400"><h3 className="text-lg font-bold text-zinc-950">{link.title}</h3>{link.description && <p className="mt-2 text-sm leading-6 text-zinc-600">{link.description}</p>}<span className="mt-3 block text-sm font-semibold text-zinc-950">{link.action || "Explore"} →</span></Link>)}</div>}
      </section>;
      default: return null;
    }
  })}</main>;
}
