import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { defineQuery } from "next-sanity";
import type { Article as ArticleSchema, WithContext } from "schema-dts";
import ArticleCard from "@/components/ArticleCard";
import ArticleSidebar, { type SidebarCompany } from "@/components/ArticleSidebar";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import PortableTextLink from "@/components/PortableTextLink";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { absoluteUrl } from "@/lib/site-url";
import { ARTICLE_CARDS_QUERY, type ArticleCardData } from "@/lib/article-card-data";
import { getGeneratedArticleThumbnailPath } from "@/lib/business-model-thumbnail";
import {
  breadcrumbJsonLd,
  MISTERSTORY_ORGANIZATION_ID,
  MISTERSTORY_WEBSITE_ID,
} from "@/lib/structured-data";

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
    contentUpdatedAt,
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
    seoKeywords,
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
  contentUpdatedAt?: string;
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
  seoKeywords?: string;
  socialImage?: {
    asset?: Parameters<typeof urlFor>[0];
  };
};

type ArticleTableRow = {
  _key?: string;
  cells?: string[];
};

type ArticleTableValue = {
  caption?: string;
  headerRow?: boolean;
  rows?: ArticleTableRow[];
};

function ArticleTable({value}: {value: ArticleTableValue}) {
  const rows = (value.rows || []).filter((row) => Array.isArray(row.cells));
  if (!rows.length) return null;
  const width = Math.max(...rows.map((row) => row.cells?.length || 0));
  const cells = (row: ArticleTableRow) =>
    Array.from({length: width}, (_, index) => row.cells?.[index] || "");
  const heading = value.headerRow !== false ? rows[0] : null;
  const body = heading ? rows.slice(1) : rows;

  return (
    <figure className="my-9">
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] border-collapse text-left text-[15px] leading-6 text-zinc-700">
          {value.caption && (
            <caption className="border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-left text-sm font-semibold text-zinc-800">
              {value.caption}
            </caption>
          )}
          {heading && (
            <thead className="bg-zinc-950 text-white">
              <tr>{cells(heading).map((cell, index) => <th key={index} scope="col" className="px-5 py-3.5 font-semibold">{cell}</th>)}</tr>
            </thead>
          )}
          <tbody>
            {body.map((row, rowIndex) => (
              <tr key={row._key || rowIndex} className="border-t border-zinc-200 first:border-t-0 even:bg-zinc-50/70">
                {cells(row).map((cell, cellIndex) => <td key={cellIndex} className="px-5 py-3 align-top">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-zinc-500 md:hidden">Swipe sideways to view the full table.</p>
    </figure>
  );
}

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
  const generatedThumbnail = getGeneratedArticleThumbnailPath(
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
  const keywords = article.seoKeywords
    ?.split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || undefined,
    keywords: keywords?.length ? keywords : undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.seoDescription || undefined,
      url: canonicalUrl,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.contentUpdatedAt,
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
  types: {
    articleTable: ({value}) => <ArticleTable value={value as ArticleTableValue} />,
  },
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

    link: PortableTextLink,
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
    .slice(0, 10);
  const popularArticles = allArticles
    .filter((item) => item._id !== article._id && item.promotion === "popular")
    .slice(0, 10);
  const companyIds = new Set((article.companies || []).map((company) => company._id));
  const peopleIds = new Set((article.people || []).map((person) => person._id));
  const conceptIds = new Set((article.concepts || []).map((concept) => concept._id));
  const relatedArticles = allArticles
    .flatMap((item, index) => {
      if (item._id === article._id) return [];
      const companyMatches = item.companies.filter((company) => company._id && companyIds.has(company._id)).length;
      const peopleMatches = (item.peopleIds || []).filter((id) => peopleIds.has(id)).length;
      const conceptMatches = (item.conceptIds || []).filter((id) => conceptIds.has(id)).length;
      const categoryMatch = article.categorySlug && item.categorySlug === article.categorySlug ? 1 : 0;
      const score = companyMatches * 12 + peopleMatches * 6 + conceptMatches * 3 + categoryMatch;
      return score > 0 ? [{ item, index, score }] : [];
    })
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 6)
    .map(({ item }) => item);
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
  const currentArticleIndex = allArticles.findIndex((item) => item._id === article._id);
  const previousArticle = currentArticleIndex >= 0 ? allArticles[currentArticleIndex + 1] : undefined;
  const nextArticle = currentArticleIndex > 0 ? allArticles[currentArticleIndex - 1] : undefined;

  const heroImage = article.mainImage?.asset
    ? urlFor(article.mainImage).width(1600).url()
    : getGeneratedArticleThumbnailPath(article.categorySlug, article.slug, article._updatedAt);

  const canonicalUrl = absoluteUrl(`/articles/${article.slug}`);
  const structuredImage = article.socialImage?.asset
    ? urlFor(article.socialImage).width(1200).height(630).url()
    : article.mainImage?.asset
      ? urlFor(article.mainImage).width(1200).height(630).url()
      : heroImage
        ? absoluteUrl(heroImage)
        : undefined;
  const articleJsonLd: WithContext<ArticleSchema> = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${canonicalUrl}#article`,
    headline: article.title,
    description: article.seoDescription,
    keywords: article.seoKeywords,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    image: structuredImage,
    datePublished: article.publishedAt,
    dateModified: article.contentUpdatedAt || article._updatedAt || article.publishedAt,
    author: article.author
      ? {
          "@type": "Person",
          name: article.author.name,
          url: article.author.slug
            ? absoluteUrl(`/authors/${article.author.slug}`)
            : undefined,
        }
      : { "@id": MISTERSTORY_ORGANIZATION_ID },
    publisher: { "@id": MISTERSTORY_ORGANIZATION_ID },
    isPartOf: { "@id": MISTERSTORY_WEBSITE_ID },
    about: article.companies?.map((company) => ({
      "@type": "Organization",
      "@id": `${absoluteUrl(`/companies/${company.slug}`)}#organization`,
      name: company.name,
      url: absoluteUrl(`/companies/${company.slug}`),
    })),
  };
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Articles", path: "/articles" },
    { name: article.title, path: `/articles/${article.slug}` },
  ]);

  return (
    <>
    <JsonLd data={[articleJsonLd, breadcrumb]} />
    <Header />
    <main className="bg-[#f7f6f2]">
      <article className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 md:py-10 lg:py-12">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Articles", href: "/articles" }, { label: article.title }]} />
        <h1 className="mt-6 max-w-[1220px] text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-zinc-950 sm:text-5xl md:text-[3.25rem]">
          {article.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          {article.author && (
            article.author.slug
              ? <span>By <Link href={`/authors/${article.author.slug}`} className="font-semibold text-zinc-700 hover:underline">{article.author.name}</Link></span>
              : <span>By {article.author.name}</span>
          )}
          <span>·</span>
          <span>{readingTime}</span>

          {(article.contentUpdatedAt || article.publishedAt) && (
            <>
              <span>·</span>
              <time dateTime={article.contentUpdatedAt || article.publishedAt}>
                {article.contentUpdatedAt ? "Updated" : "Published"} {new Date(article.contentUpdatedAt || article.publishedAt!).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                  timeZone: "Asia/Kolkata",
                })} IST
              </time>
            </>
          )}
        </div>

        <div className="mt-6 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-10">
          <div className="min-w-0">
            {heroImage && (
              <div className="relative aspect-video overflow-hidden rounded-3xl md:aspect-[2/1]">
                <Image
                  src={heroImage}
                  alt={article.mainImage?.alt || article.title}
                  fill
                  sizes="(min-width: 1280px) 880px, (min-width: 768px) calc(100vw - 4rem), calc(100vw - 2.5rem)"
                  className="h-full w-full object-cover object-center"
                />
              </div>
            )}

            {articleHeadings.length > 0 && (
              <details className="mt-4 rounded-2xl border border-zinc-200 bg-white px-5 py-4">
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

            <div className="mt-6 w-full md:mt-8">
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

              {(previousArticle || nextArticle) && (
                <nav aria-label="Article navigation" className="mt-8 grid gap-4 sm:grid-cols-2">
                  {previousArticle && (
                    <Link href={`/articles/${previousArticle.slug}`} className="group rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:shadow-sm">
                      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">← Previous article</span>
                      <span className="mt-2 block text-lg font-bold leading-snug tracking-tight text-zinc-950 group-hover:text-amber-800">{previousArticle.title}</span>
                    </Link>
                  )}
                  {nextArticle && (
                    <Link href={`/articles/${nextArticle.slug}`} className={`group rounded-2xl border border-zinc-200 bg-white p-6 text-right transition hover:border-zinc-300 hover:shadow-sm ${previousArticle ? "" : "sm:col-start-2"}`}>
                      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">Next article →</span>
                      <span className="mt-2 block text-lg font-bold leading-snug tracking-tight text-zinc-950 group-hover:text-amber-800">{nextArticle.title}</span>
                    </Link>
                  )}
                </nav>
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
      {relatedArticles.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-14 md:px-8 md:pb-16">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Continue exploring</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">Related stories</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{relatedArticles.map((item) => <ArticleCard key={item._id} article={item} />)}</div>
        </section>
      )}
    </main>
    <Footer />
    </>
  );
}
