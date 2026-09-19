import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Newsletter from "@/components/Newsletter";
import { absoluteUrl } from "@/lib/site-url";
import { getBusinessModelThumbnailPath } from "@/lib/business-model-thumbnail";

const ARTICLE_QUERY = `
  *[
    _type == "post" &&
    slug.current == $slug
  ][0]{
    _updatedAt,
    title,
    "slug": slug.current,
    "category": category->title,
    "categorySlug": category->slug.current,
    "author": author->name,
    publishedAt,
    body,
    mainImage{
      asset,
      alt
    },
    "companies": company[]->{
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
  _updatedAt: string;
  title: string;
  slug: string;
  category?: string;
  categorySlug?: string;
  author?: string;
  publishedAt?: string;
  body?: PortableTextBlock[];
  mainImage?: {
    asset?: Parameters<typeof urlFor>[0];
    alt?: string;
  };
  companies?: {
    name: string;
    slug: string;
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
      authors: article.author ? [article.author] : undefined,
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

  const article: Article | null = await client.fetch(
    ARTICLE_QUERY,
    {
      slug,
    },
    { next: { revalidate: 60 } }
  );

  if (!article) {
    notFound();
  }

  const readingTime = calculateReadingTime(article.body);

  const heroImage = article.mainImage?.asset
    ? urlFor(article.mainImage).width(1600).url()
    : getBusinessModelThumbnailPath(article.categorySlug, article.slug, article._updatedAt);

  return (
    <>
    <Header />
    <main className="bg-[#f7f6f2]">
      <article className="mx-auto max-w-5xl px-5 py-14 md:px-8 md:py-20">
        {article.category && (
          article.categorySlug ? (
            <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
              <Link href={`/topics/${article.categorySlug}`} className="hover:underline">{article.category}</Link>
            </p>
          ) : (
            <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-amber-700">{article.category}</p>
          )
        )}

        <h1 className="mx-auto mt-4 max-w-4xl text-center text-4xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-5xl md:text-6xl">
          {article.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-zinc-500">
          {article.author && <span>By {article.author}</span>}
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

        <div className="mx-auto mt-12 max-w-3xl">
          <PortableText
            value={article.body || []}
            components={portableTextComponents}
          />

          {article.companies && article.companies.length > 0 && (
            <div className="mt-14 rounded-2xl border border-zinc-200 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                About the company
              </p>

              <div className="mt-3 space-y-1">
                {article.companies.map((company) => (
                  <a
                    key={company.slug}
                    href={`/companies/${company.slug}`}
                    className="block text-lg font-bold text-zinc-950 hover:underline"
                  >
                    {company.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
      <Newsletter />
    </main>
    <Footer />
    </>
  );
}
