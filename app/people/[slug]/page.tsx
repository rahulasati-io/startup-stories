import { PortableText, type PortableTextBlock, type PortableTextComponents } from "@portabletext/react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { defineQuery } from "next-sanity";
import CompanyRow from "@/components/CompanyRow";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Newsletter from "@/components/Newsletter";
import { getBusinessModelThumbnailPath } from "@/lib/business-model-thumbnail";
import PeopleRow from "@/components/PeopleRow";
import { absoluteUrl } from "@/lib/site-url";
import { client } from "@/sanity/lib/client";
import { DEFAULT_SEO_TEMPLATES, fillSeoTemplate, SEO_SETTINGS_QUERY, type SeoSettings } from "@/sanity/lib/seo";

const PERSON_QUERY = defineQuery(/* groq */ `
  *[_type == "founder" && slug.current == $slug][0] {
    _id,
    name,
    role,
    bio,
    website,
    linkedinUrl,
    seoTitle,
    seoDescription,
    "photoUrl": photo.asset->url,
    "photoAlt": coalesce(photo.alt, name),
    "companyRoles": *[_type == "companyPersonRole" && person._ref == ^._id]
      | order(status asc, startDate asc) {
        _id,
        relationship,
        status,
        company->{_id, name, "slug": slug.current, "industry": coalesce(industryCategory->name, industry)}
      },
    "relatedArticles": *[
      _type == "post" &&
      ^._id in people[]._ref &&
      defined(slug.current) &&
      defined(category->slug.current)
    ] | order(publishedAt desc)[0...3] {
      _id,
      _updatedAt,
      title,
      "slug": slug.current,
      publishedAt,
      contentUpdatedAt,
      seoDescription,
      "imageUrl": mainImage.asset->url,
      "imageAlt": coalesce(mainImage.alt, title),
      "category": category->{title, "slug": slug.current}
    }
  }
`);

type CompanyRole = {
  _id: string;
  relationship?: string;
  status?: string;
  company?: { _id: string; name: string; slug?: string; industry?: string };
};

type RelatedArticle = {
  _id: string;
  _updatedAt: string;
  title: string;
  slug: string;
  publishedAt?: string;
  contentUpdatedAt?: string;
  seoDescription?: string;
  imageUrl?: string;
  imageAlt?: string;
  category?: { title?: string; slug?: string };
};

type Person = {
  _id: string;
  name: string;
  role?: string;
  bio?: PortableTextBlock[];
  website?: string;
  linkedinUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  photoUrl?: string;
  photoAlt?: string;
  companyRoles?: CompanyRole[];
  relatedArticles?: RelatedArticle[];
};

type Props = { params: Promise<{ slug: string }> };

const biographyComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="mb-6 leading-8 text-zinc-700 last:mb-0">{children}</p>,
    h2: ({ children }) => <h2 className="mb-4 mt-10 text-2xl font-semibold tracking-[-.02em] text-zinc-950 first:mt-0">{children}</h2>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-zinc-950">{children}</strong>,
    link: ({ children, value }) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer" className="font-medium text-amber-700 underline decoration-amber-300 underline-offset-4 hover:text-amber-900">
        {children}
      </a>
    ),
  },
};

const relationshipLabels: Record<string, string> = {
  founder: "Founder",
  coFounder: "Co-founder",
  promoter: "Promoter",
  acquirer: "Acquirer",
  chairperson: "Chairperson",
  managingDirector: "Managing Director",
  chiefExecutive: "Chief Executive Officer",
  owner: "Owner",
  other: "Associated person",
};

const statusLabel = (status?: string) => status ? status.charAt(0).toUpperCase() + status.slice(1) : "";

async function getPerson(slug: string) {
  return client.fetch<Person | null>(PERSON_QUERY, { slug });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [person, settings] = await Promise.all([
    getPerson(slug),
    client.fetch<SeoSettings | null>(SEO_SETTINGS_QUERY, {}, { stega: false }),
  ]);
  if (!person) return {};
  const values = { person_name: person.name, primary_role: person.role };
  return {
    title: person.seoTitle || fillSeoTemplate(settings?.founderTitleTemplate || DEFAULT_SEO_TEMPLATES.founderTitleTemplate, values),
    description: person.seoDescription || fillSeoTemplate(settings?.founderDescriptionTemplate || DEFAULT_SEO_TEMPLATES.founderDescriptionTemplate, values),
    alternates: { canonical: absoluteUrl(`/people/${slug}`) },
  };
}

export default async function PersonPage({ params }: Props) {
  const { slug } = await params;
  const person = await getPerson(slug);
  if (!person) notFound();

  const associatedCompanies = Array.from(
    (person.companyRoles ?? []).reduce((companies, item) => {
      if (item.company?._id && !companies.has(item.company._id)) companies.set(item.company._id, item);
      return companies;
    }, new Map<string, CompanyRole>()).values(),
  );
  const relatedArticles = person.relatedArticles ?? [];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f7f6f2] text-zinc-950">
        <section className="border-b border-zinc-200">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-[180px_1fr] md:items-center md:px-8 md:py-20">
            <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl border border-zinc-200 bg-white">
              {person.photoUrl ? (
                <Image src={person.photoUrl} alt={person.photoAlt || person.name} width={320} height={320} className="h-full w-full object-cover" priority />
              ) : (
                <span className="text-5xl font-semibold text-zinc-300">{person.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-amber-700">Person profile</p>
              <h1 className="mt-3 text-5xl font-semibold tracking-[-.04em] md:text-6xl">{person.name}</h1>
              {person.role && <p className="mt-4 text-lg text-zinc-600">{person.role}</p>}
              {(person.website || person.linkedinUrl) && (
                <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
                  {person.linkedinUrl && <a href={person.linkedinUrl} target="_blank" rel="noreferrer" className="rounded-full border border-zinc-300 bg-white px-4 py-2 hover:border-zinc-500">LinkedIn ↗</a>}
                  {person.website && <a href={person.website} target="_blank" rel="noreferrer" className="rounded-full border border-zinc-300 bg-white px-4 py-2 hover:border-zinc-500">Website ↗</a>}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="sticky top-16 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur md:top-20">
          <nav aria-label={`${person.name} page sections`} className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-5 md:px-8">
            <a href="#about" className="shrink-0 border-b-2 border-amber-700 py-4 text-xs font-semibold text-amber-800">About</a>
            {associatedCompanies.length > 0 && <a href="#associated-companies" className="shrink-0 border-b-2 border-transparent py-4 text-xs font-semibold text-zinc-600 hover:text-zinc-950">Associated companies</a>}
            {relatedArticles.length > 0 && <a href="#related-articles" className="shrink-0 border-b-2 border-transparent py-4 text-xs font-semibold text-zinc-600 hover:text-zinc-950">Related articles</a>}
          </nav>
        </div>

        <div id="about" className="mx-auto grid max-w-6xl scroll-mt-36 gap-6 px-5 py-12 md:grid-cols-[minmax(0,2.35fr)_minmax(260px,.8fr)] md:px-8 md:py-16">
          <article className="rounded-3xl border border-zinc-200 bg-white p-7 md:p-9">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-zinc-500">Background</p>
            <h2 className="mt-3 text-3xl font-semibold">About {person.name}</h2>
            {person.bio?.length ? (
              <div className="mt-7 max-w-none"><PortableText value={person.bio} components={biographyComponents} /></div>
            ) : (
              <p className="mt-5 leading-7 text-zinc-600">A detailed biography will appear here once it is added in Sanity.</p>
            )}
          </article>

          {associatedCompanies.length > 0 && (
            <aside id="associated-companies" className="scroll-mt-36 rounded-3xl border border-zinc-200 bg-white p-7">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-zinc-500">Connections</p>
              <h2 className="mt-3 text-2xl font-semibold">Associated companies</h2>
              <div className="mt-5 divide-y divide-zinc-100">
                {associatedCompanies.map((item) => item.company?.slug ? (
                  <Link key={item.company._id} href={`/companies/${item.company.slug}`} className="group block py-5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold group-hover:text-amber-800">{item.company.name}</p>
                        <p className="mt-1 text-sm text-zinc-600">
                          {relationshipLabels[item.relationship || ""] || "Associated person"}
                          {item.status ? ` · ${statusLabel(item.status)}` : ""}
                        </p>
                        {item.company.industry && <p className="mt-2 text-xs text-zinc-500">{item.company.industry}</p>}
                      </div>
                      <span className="text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-amber-700">→</span>
                    </div>
                  </Link>
                ) : null)}
              </div>
            </aside>
          )}
        </div>

        {relatedArticles.length > 0 && (
          <section id="related-articles" className="mx-auto max-w-6xl scroll-mt-36 px-5 pb-16 md:px-8 md:pb-20">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-zinc-500">Continue reading</p>
            <h2 className="mt-3 text-3xl font-semibold">Articles about {person.name}</h2>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((article) => {
                const imageUrl = article.imageUrl || getBusinessModelThumbnailPath(article.category?.slug, article.slug, article._updatedAt);
                return (
                <Link key={article._id} href={`/articles/${article.slug}`} className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={article.imageAlt || `${article.title} thumbnail`} width={720} height={378} className="aspect-[1200/630] w-full object-cover" />
                  ) : (
                    <div className="aspect-[12/7] bg-zinc-100" />
                  )}
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-[.12em] text-amber-700">{article.category?.title || "Article"}</p>
                    <h3 className="mt-2 text-xl font-semibold leading-tight group-hover:text-amber-800">{article.title}</h3>
                    {article.seoDescription && <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">{article.seoDescription}</p>}
                    {(article.contentUpdatedAt || article.publishedAt) && <p className="mt-4 text-xs text-zinc-500">{article.contentUpdatedAt ? "Updated" : "Published"} {new Date(article.contentUpdatedAt || article.publishedAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>}
                  </div>
                </Link>
                );
              })}
            </div>
          </section>
        )}

        <PeopleRow excludeSlug={slug} />
        <div className="border-t border-zinc-200 bg-white">
          <CompanyRow title="Explore More Companies" description="Continue exploring company stories, strategies, business models, people and key numbers." />
        </div>
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
