import { PortableText, type PortableTextBlock } from "@portabletext/react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { defineQuery } from "next-sanity";
import ArticleCard from "@/components/ArticleCard";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Newsletter from "@/components/Newsletter";
import type { ArticleCardData } from "@/lib/article-card-data";
import { absoluteUrl } from "@/lib/site-url";
import { client } from "@/sanity/lib/client";

const AUTHOR_QUERY = defineQuery(/* groq */ `
  *[_type == "author" && slug.current == $slug][0]{
    _id,
    name,
    role,
    bio,
    education,
    experience,
    linkedinUrl,
    "slug": slug.current,
    "imageUrl": image.asset->url,
    "articles": *[
      _type == "post" &&
      author._ref == ^._id &&
      !(_id in path("drafts.**")) &&
      defined(slug.current) &&
      defined(category->slug.current)
    ] | order(publishedAt desc, _updatedAt desc) {
      _id,
      _updatedAt,
      title,
      "slug": slug.current,
      "category": category->title,
      "categorySlug": category->slug.current,
      "description": coalesce(seoDescription, array::join(body[0...2].children[].text, " ")),
      publishedAt,
      "companies": coalesce(company[]->{
        name,
        "slug": slug.current,
        "industry": coalesce(industryCategory->name, industry)
      }, []),
      "socialImageUrl": socialImage.asset->url,
      "mainImageUrl": mainImage.asset->url
    }
  }
`);

type Author = {
  _id: string;
  name: string;
  slug: string;
  role?: string;
  bio?: PortableTextBlock[];
  education?: string[];
  experience?: string[];
  linkedinUrl?: string;
  imageUrl?: string;
  articles?: ArticleCardData[];
};

type Props = { params: Promise<{ slug: string }> };

async function getAuthor(slug: string) {
  return client.fetch<Author | null>(AUTHOR_QUERY, { slug }, { perspective: "published" });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) return {};
  const description = author.role ? `${author.name}, ${author.role} at MisterStory.` : `${author.name}, author at MisterStory.`;
  return {
    title: `${author.name} | MisterStory`,
    description,
    alternates: { canonical: absoluteUrl(`/authors/${author.slug}`) },
  };
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) notFound();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f7f6f2] text-zinc-950">
        <section className="border-b border-zinc-200">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-[180px_1fr] md:items-center md:px-8 md:py-20">
            <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl border border-zinc-200 bg-white">
              {author.imageUrl ? <Image src={author.imageUrl} alt={author.name} width={320} height={320} className="h-full w-full object-cover" priority /> : <span className="text-5xl font-semibold text-zinc-300">{author.name.charAt(0)}</span>}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-amber-700">MisterStory author</p>
              <h1 className="mt-3 text-5xl font-semibold tracking-[-.04em] md:text-6xl">{author.name}</h1>
              {author.role && <p className="mt-4 text-lg text-zinc-600">{author.role}</p>}
              {author.linkedinUrl && <a href={author.linkedinUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold hover:border-zinc-500">LinkedIn ↗</a>}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-5 py-12 md:grid-cols-[minmax(0,1.6fr)_minmax(260px,.8fr)] md:px-8 md:py-16">
          <article className="rounded-3xl border border-zinc-200 bg-white p-7 md:p-9">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-zinc-500">About the author</p>
            <h2 className="mt-3 text-3xl font-semibold">About {author.name}</h2>
            {author.bio?.length ? <div className="mt-6 space-y-5 leading-8 text-zinc-700"><PortableText value={author.bio} /></div> : <p className="mt-5 leading-7 text-zinc-600">A detailed author biography will appear here once verified information is added.</p>}
          </article>

          {(author.education?.length || author.experience?.length) && (
            <aside className="rounded-3xl border border-zinc-200 bg-white p-7">
              {author.experience?.length ? <div><p className="text-xs font-bold uppercase tracking-[.14em] text-zinc-500">Experience</p><ul className="mt-3 space-y-3 text-sm leading-6 text-zinc-700">{author.experience.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
              {author.education?.length ? <div className={author.experience?.length ? "mt-8" : ""}><p className="text-xs font-bold uppercase tracking-[.14em] text-zinc-500">Education</p><ul className="mt-3 space-y-3 text-sm leading-6 text-zinc-700">{author.education.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
            </aside>
          )}
        </section>

        {author.articles?.length ? (
          <section className="mx-auto max-w-7xl px-5 pb-16 md:px-8 md:pb-20">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-zinc-500">Published work</p>
            <h2 className="mt-3 text-3xl font-semibold">Articles by {author.name}</h2>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{author.articles.map((article) => <ArticleCard key={article._id} article={article} />)}</div>
          </section>
        ) : null}

        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
