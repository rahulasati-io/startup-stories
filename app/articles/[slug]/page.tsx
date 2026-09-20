import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Newsletter from "@/components/Newsletter";
import { absoluteUrl } from "@/lib/site-url";
import { ARTICLE_CARDS_QUERY, type ArticleCardData } from "@/lib/article-card-data";
import { getBusinessModelThumbnailPath } from "@/lib/business-model-thumbnail";

const ARTICLE_QUERY = `
  *[
    _type == "post" &&
    slug.current == $slug
  ][0]{
    _id,
    _updatedAt,
    title,
    "slug": slug.current,
    "category": category->title,
    "categorySlug": category->slug.current,
    "author": author->{
      name,
      "slug": slug.current
    },
    publishedAt,
    body,
    mainImage{
      asset,
      alt
    },
    "companies": company[]->{
      _id,
      name,
      "slug": slug.current,
      "industry": coalesce(industryCategory->name, industry)
    },
    "people": people[]->{
      _id,
      name,
      role,
      "slug": slug.current
    },
    "concepts": concepts[]->{
      _id,
      name,
      "slug": slug.current
    },
    seoTitle,
    seoDescription,
    socialImage{
      asset
    }
  }
`;

type Article = {
  _id: string;
  _updatedAt: string;
  title: string;
  slug: string;
  category?: string;
  categorySlug?: string;
  author?: {
    name: string;
    slug?: string;
  };
  publishedAt?: string;
  body?: PortableTextBlock[];
  mainImage?: {
    asset?: Parameters<typeof urlFor>[0];
    alt?: string;
  };
  companies?: {
    _id: string;
    name: string;
    slug: string;
    industry?: string;
  }[];
  people?: {
    _id: string;
    name: string;
    role?: string;
    slug?: string;
  }[];
  concepts?: {
    _id: string;
    name: string;
    slug?: string;
  }[];
  seoTitle?: string;
  seoDescription?: string;
  socialImage?: {
    asset?: Parameters<typeof urlFor>[0];
  };
};

function calculateReadingTime(body: PortableTextBlock[] = []) {
  const text = body
    .filter((block) => block?._type === "block")
    .map((block) =>
      ("children" in block ? block.children : [])
        .map((child) => ("text" in child ? child.text : ""))
        .join(" ")
    )
    .join(" ");

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;

  const article: Article | null = await client.fetch(
    ARTICLE_QUERY,
    {
      slug,
    },
    { next: { revalidate: 60 } }
  );

  if (!article) {
    return {};
  }

  const canonicalUrl = absoluteUrl(
    `/articles/${article.slug}`,
  );
  const generatedThumbnail = getBusinessModelThumbnailPath(
    article.categorySlug,
    article.slug,
    article._updatedAt,
  );

  const socialImage = article.socialImage?.asset
    ? urlFor(article.socialImage).width(1200).height(630).url()
    : article.mainImage?.asset
      ? urlFor(article.mainImage).width(1200).height(630).url()
      : generatedThumbnail
        ? absoluteUrl(generatedThumbnail)
        : undefined;

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.seoDescription || undefined,
      url: canonicalUrl,
      type: "article",
      publishedTime: article.publishedAt,
      authors: article.author?.name ? [article.author.name] : undefined,
      images: socialImage ? [socialImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle || article.title,
      description: article.seoDescription || undefined,
      images: socialImage ? [socialImage] : undefined,
    },
  };
}

const portableTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mb-6 text-[18px] leading-[1.85] text-zinc-700">
        {children}
      </p>
    ),

    h2: ({ children }) => (
      <h2 className="mt-12 mb-5 text-3xl font-semibold tracking-[-0.02em] text-zinc-950">
        {children}
      </h2>
    ),

    h3: ({ children }) => (
      <h3 className="mt-10 mb-4 text-2xl font-semibold tracking-[-0.02em] text-zinc-950">
        {children}
      </h3>
    ),

    blockquote: ({ children }) => (
      <blockquote className="my-8 border-l-2 border-amber-700 pl-5 text-xl italic leading-8 text-zinc-600">
        {children}
      </blockquote>
    ),
  },

  list: {
    bullet: ({ children }) => (
      <ul className="mb-6 list-disc space-y-2 pl-6 text-[17px] leading-8 text-zinc-700">
        {children}
      </ul>
    ),

    number: ({ children }) => (
      <ol className="mb-6 list-decimal space-y-2 pl-6 text-[17px] leading-8 text-zinc-700">
        {children}
      </ol>
    ),
  },

  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-zinc-950">{children}</strong>
    ),

    link: ({ children, value }) => (
      <a
        href={value?.href}
        className="font-medium text-zinc-950 underline decoration-zinc-400 underline-offset-4 hover:decoration-zinc-900"
        target={value?.blank ? "_blank" : undefined}
        rel={value?.blank ? "noreferrer" : undefined}
      >
        {children}
      </a>
    ),
  },
};

export default async function ArticlePage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;

  const [article, allArticles] = await Promise.all([
    client.fetch<Article | null>(ARTICLE_QUERY, { slug }, { next: { revalidate: 60 } }),
    client.fetch<ArticleCardData[]>(ARTICLE_CARDS_QUERY, {}, { perspective: "published", next: { revalidate: 60 } }),
  ]);

  if (!article) {
    notFound();
  }

  const readingTime = calculateReadingTime(article.body);
  const companySlugs = new Set((article.companies || []).map((company) => company.slug));
  const moreAboutCompanies = allArticles
    .filter((item) => item._id !== article._id && item.companies.some((company) => companySlugs.has(company.slug)))
    .slice(0, 3);
  const companyArticleIds = new Set(moreAboutCompanies.map((item) => item._id));
  const moreFromCategory = allArticles
    .filter((item) => item._id !== article._id && !companyArticleIds.has(item._id) && item.categorySlug === article.categorySlug)
    .slice(0, 3);

  const heroImage = article.mainImage?.asset
    ? urlFor(article.mainImage).width(1600).url()
    : getBusinessModelThumbnailPath(article.categorySlug, article.slug, article._updatedAt);

  return (
    <>
    <Header />
    <main className="bg-[#f7f6f2]">
      <article className="mx-auto max-w-[1220px] px-4 py-12 sm:px-6 md:px-8 md:py-16 lg:py-20">
        {article.category && (
          article.categorySlug ? (
            <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
              <Link href={`/topics/${article.categorySlug}`} className="hover:underline">{article.category}</Link>
            </p>
          ) : (
            <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-amber-700">{article.category}</p>
          )
        )}

        <h1 className="mx-auto mt-4 max-w-5xl text-center text-4xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-5xl md:text-6xl">
          {article.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-zinc-500">
          {article.author && (
            article.author.slug
              ? <span>By <Link href={`/authors/${article.author.slug}`} className="font-semibold text-zinc-700 hover:underline">{article.author.name}</Link></span>
              : <span>By {article.author.name}</span>
          )}
          <span>·</span>
          <span>{readingTime}</span>

          {article.publishedAt && (
            <>
              <span>·</span>
              <span>
                {new Date(article.publishedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </>
          )}
        </div>

        {heroImage && (
          <div className="mt-10 aspect-[16/9] overflow-hidden rounded-3xl md:aspect-[16/8]">
            <img
              src={heroImage}
              alt={article.mainImage?.alt || article.title}
              className="h-full w-full object-cover object-center"
            />
          </div>
        )}

        <div className="mx-auto mt-10 w-full max-w-[825px] md:mt-12">
          <PortableText
            value={article.body || []}
            components={portableTextComponents}
          />

          {article.companies && article.companies.length > 0 && (
            <section className="mt-14 rounded-2xl border border-zinc-200 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                {article.companies.length === 1 ? "About the company" : "Companies discussed"}
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {article.companies.map((company) => (
                  <Link
                    key={company._id}
                    href={`/companies/${company.slug}`}
                    className="rounded-xl border border-zinc-200 px-4 py-3 transition hover:border-amber-300 hover:bg-amber-50/40"
                  >
                    <span className="block text-lg font-bold text-zinc-950">{company.name}</span>
                    {company.industry && <span className="mt-1 block text-xs text-zinc-500">{company.industry}</span>}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {article.people && article.people.length > 0 && (
            <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">People featured</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {article.people.map((person) => person.slug ? (
                  <Link key={person._id} href={`/people/${person.slug}`} className="rounded-xl border border-zinc-200 px-4 py-3 transition hover:border-amber-300 hover:bg-amber-50/40">
                    <span className="block font-bold text-zinc-950">{person.name}</span>
                    {person.role && <span className="mt-1 block text-xs text-zinc-500">{person.role}</span>}
                  </Link>
                ) : (
                  <div key={person._id} className="rounded-xl border border-zinc-200 px-4 py-3">
                    <span className="block font-bold text-zinc-950">{person.name}</span>
                    {person.role && <span className="mt-1 block text-xs text-zinc-500">{person.role}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {article.concepts && article.concepts.length > 0 && (
            <section className="mt-8">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Concepts covered</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {article.concepts.map((concept) => <span key={concept._id} className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700">{concept.name}</span>)}
              </div>
            </section>
          )}
        </div>
      </article>
      {moreAboutCompanies.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-14 md:px-8 md:pb-16">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Continue exploring</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">More about these companies</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{moreAboutCompanies.map((item) => <ArticleCard key={item._id} article={item} />)}</div>
        </section>
      )}
      {moreFromCategory.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-14 md:px-8 md:pb-16">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Related reading</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">More {article.category || "articles"}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{moreFromCategory.map((item) => <ArticleCard key={item._id} article={item} />)}</div>
        </section>
      )}
      <Newsletter />
    </main>
    <Footer />
    </>
  );
}
