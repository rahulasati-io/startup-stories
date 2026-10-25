import type {Metadata} from "next";
import {cache, Fragment} from "react";
import Header from "@/components/Header";
import FeaturedStories from "@/components/FeaturedStories";
import HomepageArticleSection from "@/components/HomepageArticleSection";
import IntentCards from "@/components/IntentCards";
import Topics from "@/components/Topics";
import CompanyRow, {COMPANIES_QUERY} from "@/components/CompanyRow";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import HomepageDataSection from "@/components/HomepageDataSection";
import type {Company} from "@/components/CompanyDirectory";
import {ARTICLE_CARDS_QUERY, type ArticleCardData} from "@/lib/article-card-data";
import {HOMEPAGE_SETTINGS_QUERY, type HomepageSettings} from "@/lib/homepage-content";
import {DEFAULT_HOME_TITLE, DEFAULT_HOME_DESCRIPTION, DEFAULT_HOME_HEADING, homepageHref, homepageSections, selectHomepageArticles, selectFeaturedHomepageArticles} from "@/lib/homepage-config";
import {client} from "@/sanity/lib/client";
import {absoluteUrl} from "@/lib/site-url";

// Share one settings read between metadata and the visible page; outages retain safe defaults.
const getHomepageSettings = cache(async () => {
  try {
    return await client.fetch<HomepageSettings | null>(HOMEPAGE_SETTINGS_QUERY, {}, {perspective: "published", stega: false, next: {revalidate: 60}, signal: AbortSignal.timeout(6000)});
  } catch {
    return null;
  }
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getHomepageSettings();
  const title = settings?.seoTitle?.trim() || DEFAULT_HOME_TITLE;
  const description = settings?.seoDescription?.trim() || DEFAULT_HOME_DESCRIPTION;
  const images = settings?.socialImageUrl ? [{url: settings.socialImageUrl}] : undefined;
  return {
    title, description, alternates: {canonical: absoluteUrl("/")},
    openGraph: {title, description, url: absoluteUrl("/"), type: "website", siteName: "MisterStory", ...(images ? {images} : {})},
    twitter: {card: "summary_large_image", title, description, ...(images ? {images: images.map((image) => image.url)} : {})},
  };
}

export default async function Home() {
  const [companies, articles, settings] = await Promise.all([
    client.fetch<Company[]>(COMPANIES_QUERY, {}, {perspective: "published", next: {revalidate: 60}, signal: AbortSignal.timeout(6000)}).catch(() => [] as Company[]),
    client.fetch<ArticleCardData[]>(ARTICLE_CARDS_QUERY, {}, {perspective: "published", next: {revalidate: 60}, signal: AbortSignal.timeout(6000)}).catch(() => [] as ArticleCardData[]),
    getHomepageSettings(),
  ]);
  const featured = selectFeaturedHomepageArticles(articles, settings);
  const sections = homepageSections(settings?.sections);
  const orderedSections = [...sections.filter(section=>section.kind==='featured'),...sections.filter(section=>section.kind!=='featured')];
  const dataAfterIndex=orderedSections.findIndex(section=>section.kind==='articles'&&(section.categorySlug==='business-model'||section._key==='business'));
  // Reserve editorial highlights even when their section is moved below another shelf.
  const used = new Set(sections.some((section) => section.kind === "featured") ? featured.map((article) => article._id) : []);
  const renderedSections = orderedSections.map((section) => {
    const limit = Math.min(12, Math.max(1, Math.trunc(section.limit || 4)));
    const href = homepageHref(section.href, "/articles");
    const links = section.links?.map((link) => ({...link, href: homepageHref(link.href, "/articles")}));
    const textProps = {title: section.title, description: section.description, eyebrow: section.eyebrow};
    switch (section.kind) {
      case "featured":
        return <FeaturedStories key={section._key} articles={featured} {...textProps} href={href} linkLabel={section.linkLabel} />;
      case "articles": {
        const selected = selectHomepageArticles(section, articles, used);
        return <HomepageArticleSection key={section._key} articles={selected} title={section.title || "Articles"} description={section.description || ""} eyebrow={section.eyebrow || ""} href={href} linkLabel={section.linkLabel} />;
      }
      case "explore": return <IntentCards key={section._key} articles={articles} {...textProps} links={links} />;
      case "topics": return <Topics key={section._key} articles={articles} {...textProps} links={links} />;
      case "companies": return <CompanyRow key={section._key} companies={companies} {...textProps} limit={limit} href={homepageHref(section.href, "/companies")} linkLabel={section.linkLabel} />;
      case "newsletter": return <Newsletter key={section._key} title={section.title} description={section.description} buttonLabel={section.linkLabel} />;
      case "text": return <section key={section._key} className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        {section.eyebrow && <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{section.eyebrow}</p>}
        <h2 className="mt-2 text-2xl font-bold text-zinc-950 md:text-3xl">{section.title}</h2>
        {section.description && <p className="mt-3 max-w-4xl whitespace-pre-line text-base leading-7 text-zinc-600">{section.description}</p>}
      </section>;
      default: return null;
    }
  });
  return <>
    <Header />
    <main>
      <h1 className="sr-only">{settings?.homepageHeading?.trim() || DEFAULT_HOME_HEADING}</h1>
      {renderedSections.map((section,index)=><Fragment key={orderedSections[index]._key}>{section}{index===dataAfterIndex&&<HomepageDataSection/>}</Fragment>)}
      {dataAfterIndex<0&&<HomepageDataSection/>}
    </main>
    <Footer />
  </>;
}
