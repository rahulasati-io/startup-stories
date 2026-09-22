import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { defineQuery } from "next-sanity";
import ArticleCard from "@/components/ArticleCard";
import ArticleSidebar, { type SidebarCompany } from "@/components/ArticleSidebar";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { absoluteUrl } from "@/lib/site-url";
import { ARTICLE_CARDS_QUERY, type ArticleCardData } from "@/lib/article-card-data";
import { getBusinessModelThumbnailPath } from "@/lib/business-model-thumbnail";

const ARTICLE_QUERY = defineQuery(/* groq */ `
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
      "industry": coalesce(industryCategory->name, industry),
      "industryId": industryCategory._ref,
      description
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
`);

const RELATED_COMPANIES_QUERY = defineQuery(/* groq */ `
  *[
    _type == "company" &&
    !(_id in path("drafts.**")) &&
    defined(name) &&
    defined(slug.current) &&
    !(_id in $excludedIds) &&
    (
      ($industryId != null && industryCategory._ref == $industryId) ||
      ($industryId == null && industry == $industry)
    )
  ] | order(name asc)[0...3] {
    _id,
    name,
    "slug": slug.current,
    "industry": coalesce(industryCategory->name, industry),
    description
  }
`);

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
    industryId?: string;
    description?: string;
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

function getBlockText(block: PortableTextBlock) {
  if (!("children" in block) || !Array.isArray(block.children)) return "";

  return block.children
    .map((child) =>
      child && typeof child === "object" && "text" in child && typeof child.text === "string"
        ? child.text
        : "",
    )
    .join("")
    .trim();
}

function headingId(text: string, key = "heading") {
  const textSlug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  const keySuffix = key.replace(/[^a-z0-9]/gi, "").slice(-6).toLowerCase();

  return `${textSlug || "section"}-${keySuffix || "heading"}`;
}

function getArticleHeadings(body: PortableTextBlock[] = []) {
  return body.flatMap((block) => {
    const style = "style" in block ? block.style : undefined;
    if (block._type !== "block" || style !== "h2") return [];

    const text = getBlockText(block);
    if (!text) return [];

    const id = headingId(text, block._key);
    return [{ key: block._key || id, text, id }];
  });
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

    h2: ({ children, value }) => {
      const block = value as PortableTextBlock;
      const id = headingId(getBlockText(block), block._key);

      return (
        <h2 id={id} className="mt-12 mb-5 scroll-mt-24 text-3xl font-semibold tracking-[-0.02em] text-zinc-950">
          {children}
        </h2>
      );
    },

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
  const articleHeadings = getArticleHeadings(article.body);
  const recentArticles = allArticles
    .filter((item) => item._id !== article._id)
    .slice(0, 5);
  const popularArticles = allArticles
    .filter((item) => item._id !== article._id && item.promotion === "popular")
    .slice(0, 3);
  const companySlugs = new Set((article.companies || []).map((company) => company.slug));
  const moreAboutCompanies = allArticles
    .filter((item) => item._id !== article._id && item.companies.some((company) => companySlugs.has(company.slug)))
    .slice(0, 3);
  const companyArticleIds = new Set(moreAboutCompanies.map((item) => item._id));
  const moreFromCategory = allArticles
    .filter((item) => item._id !== article._id && !companyArticleIds.has(item._id) && item.categorySlug === article.categorySlug)
    .slice(0, 3);
  const primaryCompany = article.companies?.[0];
  const relatedCompanies = primaryCompany?.industry
    ? await client.fetch<SidebarCompany[]>(
        RELATED_COMPANIES_QUERY,
        {
          excludedIds: (article.companies || []).map((company) => company._id),
          industryId: primaryCompany.industryId || null,
          industry: primaryCompany.industry,
        },
        { perspective: "published", next: { revalidate: 60 } },
      )
    : [];
  const nextArticle = moreAboutCompanies[0] || moreFromCategory[0] || recentArticles[0];

  const heroImage = article.mainImage?.asset
    ? urlFor(article.mainImage).width(1600).url()
    : getBusinessModelThumbnailPath(article.categorySlug, article.slug, article._updatedAt);

  return (
    <>
    <Header />
    <main className="bg-[#f7f6f2]">
      <article className="w-full px-4 py-12 sm:px-6 md:px-10 md:py-16 lg:px-14 lg:py-20">
        {article.category && (
          article.categorySlug ? (
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
              <Link href={`/topics/${article.categorySlug}`} className="hover:underline">{article.category}</Link>
            </p>
          ) : (
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">{article.category}</p>
          )
        )}

        <h1 className="mt-4 max-w-[1220px] text-4xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-5xl md:text-6xl">
          {article.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
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

        <div className="mt-10 grid items-start gap-10 xl:grid-cols-[minmax(0,880px)_minmax(280px,320px)]">
          <div className="min-w-0">
            {heroImage && (
              <div className="aspect-[16/9] overflow-hidden rounded-3xl md:aspect-[16/8]">
                <img
                  src={heroImage}
                  alt={article.mainImage?.alt || article.title}
                  className="h-full w-full object-cover object-center"
                />
              </div>
            )}

            {articleHeadings.length > 0 && (
              <details className="mt-6 rounded-2xl border border-zinc-200 bg-white px-5 py-4">
                <summary className="cursor-pointer font-bold text-zinc-950">What&apos;s covered</summary>
                <ol className="mt-4 space-y-2 border-t border-zinc-200 pt-4">
                  {articleHeadings.map((heading) => (
                    <li key={heading.key}>
                      <a href={`#${heading.id}`} className="text-sm leading-6 text-zinc-700 hover:text-amber-800 hover:underline">
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>
            )}

            <div className="mt-10 w-full md:mt-12">
              <PortableText
                value={article.body || []}
                components={portableTextComponents}
              />

              {article.concepts && article.concepts.length > 0 && (
                <section className="mt-8">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Concepts covered</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {article.concepts.map((concept) => <span key={concept._id} className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700">{concept.name}</span>)}
                  </div>
                </section>
              )}

              <p className="mt-12 border-t border-zinc-200 pt-5 text-sm text-zinc-500">
                Last updated {new Date(article._updatedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>

              {nextArticle && (
                <Link href={`/articles/${nextArticle.slug}`} className="group mt-6 block rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">Read next</span>
                  <span className="mt-2 block text-xl font-bold tracking-tight text-zinc-950 group-hover:text-amber-800">{nextArticle.title}</span>
                </Link>
              )}
            </div>
          </div>

          <ArticleSidebar
            companies={article.companies || []}
            recentArticles={recentArticles}
            relatedCompanies={relatedCompanies}
            people={article.people || []}
            popularArticles={popularArticles}
          />
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
    </main>
    <Footer />
    </>
  );
}
