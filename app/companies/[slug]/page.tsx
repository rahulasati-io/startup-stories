import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { defineQuery } from "next-sanity";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import CompanyRow from "@/components/CompanyRow";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Newsletter from "@/components/Newsletter";
import { getBusinessModelThumbnailPath } from "@/lib/business-model-thumbnail";
import { absoluteUrl } from "@/lib/site-url";
import { DEFAULT_SEO_TEMPLATES, fillSeoTemplate, SEO_SETTINGS_QUERY, type SeoSettings } from "@/sanity/lib/seo";

const companyQuery = `*[_type == "company" && slug.current == $slug][0]{_id, name, description, "industry": coalesce(industryCategory->name, industry), foundedYear, founders, body, logo{asset,alt}, seoTitle, seoDescription, parentCompany->{_id,name,"slug":slug.current}, founderProfiles[]->{_id,name,"slug":slug.current,role}}`;
const groupCompaniesQuery = `*[_type == "company" && _id != $companyId && (parentCompany._ref == $companyId || (defined($parentId) && parentCompany._ref == $parentId))]|order(name asc){_id,name,"slug":slug.current,"industry":coalesce(industryCategory->name,industry),description,logo{asset,alt}}`;
const fundingQuery = `*[_type == "fundingRound" && company->slug.current == $slug]|order(date asc){_id,round,date,amount,currency,investors,notes}`;
const timelineQuery = `*[_type == "timelineEvent" && company->slug.current == $slug]|order(date asc){_id,date,title,description}`;
const metricQuery = `*[_type == "companyMetric" && company->slug.current == $slug]|order(period desc){_id,label,value,period,notes}`;
const peopleQuery = `*[_type == "companyPersonRole" && company->slug.current == $slug]|order(status asc,startDate asc){_id,relationship,roleTitle,startDate,endDate,status,notes,person->{_id,name,"slug":slug.current,role}}`;
const relatedArticlesQuery = defineQuery(/* groq */ `
  *[
    _type == "post" &&
    references($companyId) &&
    defined(slug.current) &&
    defined(category)
  ] | order(publishedAt desc) {
    _id,
    _updatedAt,
    title,
    "slug": slug.current,
    publishedAt,
    contentUpdatedAt,
    seoDescription,
    mainImage { asset, alt },
    category->{title, "slug": slug.current}
  }
`);
type Props={params:Promise<{slug:string}>};
type ImageSource=Parameters<typeof urlFor>[0];
type Company={_id:string;name:string;description?:string;industry?:string;foundedYear?:number;founders?:string[];body?:PortableTextBlock[];logo?:{asset?:ImageSource;alt?:string};seoTitle?:string;seoDescription?:string;parentCompany?:{_id:string;name:string;slug?:string};founderProfiles?:{_id:string;name:string;slug?:string;role?:string}[]};
type GroupCompany={_id:string;name:string;slug?:string;industry?:string;description?:string;logo?:{asset?:ImageSource;alt?:string}};
type CompanyPerson={_id:string;relationship:string;roleTitle?:string;startDate?:string;endDate?:string;status:string;notes?:string;person?:{_id:string;name:string;slug?:string;role?:string}};
type RelatedArticle={_id:string;_updatedAt:string;title:string;slug:string;publishedAt?:string;contentUpdatedAt?:string;seoDescription?:string;mainImage?:{asset?:ImageSource;alt?:string};category?:{title?:string;slug?:string}};
type FundingRound={_id:string;round:string;date?:string;amount?:number;currency?:string;investors?:string[];notes?:string};
type TimelineEvent={_id:string;date?:string;title:string;description?:string};
type CompanyMetric={_id:string;label:string;value:string;period?:string;notes?:string};
const section=(eyebrow:string,title:string,body:React.ReactNode,id?:string)=><section id={id} className="mx-auto max-w-6xl scroll-mt-28 px-5 pb-12 md:px-8 md:pb-16"><div className="rounded-3xl border border-zinc-200 bg-white p-7">{eyebrow&&<p className="text-xs font-bold uppercase tracking-[.16em] text-zinc-500">{eyebrow}</p>}<h2 className={`${eyebrow?"mt-3 ":""}text-3xl font-semibold tracking-tight`}>{title}</h2><div className="mt-6">{body}</div></div></section>;
const articleLinks=(articles:RelatedArticle[])=><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{articles.map((article)=>{const image=article.mainImage?.asset?urlFor(article.mainImage).width(720).height(378).url():getBusinessModelThumbnailPath(article.category?.slug,article.slug,article._updatedAt);return <Link key={article._id} href={`/articles/${article.slug}`} className="group overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50/40 hover:shadow-md">{image&&<img src={image} alt={article.mainImage?.alt||`${article.title} thumbnail`} className="aspect-[1200/630] w-full object-cover"/>}<div className="p-5"><p className="text-xs font-bold uppercase tracking-[.12em] text-amber-700">{article.category?.title||"Article"}</p><h3 className="mt-2 text-lg font-semibold leading-snug group-hover:text-amber-800">{article.title}</h3>{article.seoDescription&&<p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600">{article.seoDescription}</p>}<p className="mt-4 text-sm font-semibold text-amber-700">Read full analysis →</p></div></Link>})}</div>;

export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;
 const [company,settings]=await Promise.all([
  client.fetch<Company|null>(companyQuery,{slug},{stega:false}),
  client.fetch<SeoSettings|null>(SEO_SETTINGS_QUERY,{}, {stega:false}),
 ]);
 if(!company)return {};
 const values={company_name:company.name,industry:company.industry};
 return {
  title:company.seoTitle||fillSeoTemplate(settings?.companyTitleTemplate||DEFAULT_SEO_TEMPLATES.companyTitleTemplate,values),
  description:company.seoDescription||fillSeoTemplate(settings?.companyDescriptionTemplate||DEFAULT_SEO_TEMPLATES.companyDescriptionTemplate,values),
  alternates:{canonical:absoluteUrl(`/companies/${slug}`)},
 };
}

export default async function CompanyPage({params}:Props){
 const {slug}=await params;
 const [company,funding,timeline,metrics,people]=await Promise.all([client.fetch<Company|null>(companyQuery,{slug}),client.fetch<FundingRound[]>(fundingQuery,{slug}),client.fetch<TimelineEvent[]>(timelineQuery,{slug}),client.fetch<CompanyMetric[]>(metricQuery,{slug}),client.fetch<CompanyPerson[]>(peopleQuery,{slug})]);
 if(!company)notFound();
 const [relatedArticles,groupCompanies]=await Promise.all([client.fetch<RelatedArticle[]>(relatedArticlesQuery,{companyId:company._id}),client.fetch<GroupCompany[]>(groupCompaniesQuery,{companyId:company._id,parentId:company.parentCompany?._id||null})]);
 const logo=company.logo?.asset?urlFor(company.logo).width(400).url():null;
 const strategyArticles=relatedArticles.filter((article)=>article.category?.slug?.toLowerCase()==="strategy"||article.category?.title?.toLowerCase()==="strategy");
 const businessModelArticles=relatedArticles.filter((article)=>["business-model","business-models"].includes(article.category?.slug?.toLowerCase()||"")||article.category?.title?.toLowerCase()==="business model");
 const otherRelatedArticles=relatedArticles.filter((article)=>!strategyArticles.includes(article)&&!businessModelArticles.includes(article));
 const peopleBehind=Array.from(people.reduce((groups,item)=>{const key=item.person?._id||item._id;const existing=groups.get(key)||[];existing.push(item);groups.set(key,existing);return groups;},new Map<string,CompanyPerson[]>()).values());
 const executiveLeaders=people.filter((item)=>item.status==="current"&&(item.relationship==="chiefExecutive"||item.relationship==="managingDirector"||/chief executive|\bceo\b|managing director|\bmd\b/i.test(item.roleTitle||"")));
 const sectionLinks=[{id:"overview",label:"Overview"},...(businessModelArticles.length?[{id:"business-model",label:"Business Model"}]:[]),...(peopleBehind.length||company.founderProfiles?.length?[{id:"people",label:"People"}]:[]),...(funding.length?[{id:"funding",label:"Funding"}]:[]),...(metrics.length?[{id:"metrics",label:"Key Metrics"}]:[]),...(strategyArticles.length?[{id:"strategies",label:"Strategies"}]:[]),...(groupCompanies.length?[{id:"group-companies",label:"Group Companies"}]:[]),...(otherRelatedArticles.length?[{id:"related-articles",label:"Related Articles"}]:[]),...(timeline.length?[{id:"timeline",label:"Timeline"}]:[])];
 return <><Header/><main className="bg-[#f7f6f2] text-zinc-950"><section className="border-b border-zinc-200"><div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20"><p className="text-xs font-bold uppercase tracking-[.16em] text-amber-700">Company Deep Dive</p><div className="mt-6 grid gap-10 md:grid-cols-[1fr_220px] md:items-end"><div><h1 className="text-5xl font-semibold tracking-[-.04em] md:text-7xl">{company.name}</h1>{company.description&&<p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">{company.description}</p>}<div className="mt-6 flex flex-wrap gap-2">{company.industry&&<span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs">{company.industry}</span>}{company.foundedYear&&<span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs">Founded {company.foundedYear}</span>}</div></div><div className="flex h-[180px] w-[180px] items-center justify-center rounded-3xl border border-zinc-200 bg-white">{logo?<img src={logo} alt={company.logo?.alt||company.name} className="max-h-[110px] max-w-[110px] object-contain"/>:<span className="text-5xl text-zinc-300">{company.name[0]}</span>}</div></div></div></section>
 <div className="sticky top-3 z-20 mx-auto max-w-6xl px-5 pt-5 md:px-8"><nav aria-label={`${company.name} page sections`} className="flex gap-2 overflow-x-auto rounded-2xl border border-zinc-200 bg-white/95 p-2 shadow-sm backdrop-blur">{sectionLinks.map((item)=><a key={item.id} href={`#${item.id}`} className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950">{item.label}</a>)}</nav></div>
 <section id="overview" className="mx-auto grid max-w-6xl scroll-mt-28 gap-6 px-5 py-12 md:grid-cols-[1.4fr_.8fr] md:px-8 md:py-16"><article className="rounded-3xl border border-zinc-200 bg-white p-7"><p className="text-xs font-bold uppercase tracking-[.16em] text-zinc-500">Company overview</p><h2 className="mt-3 text-3xl font-semibold">{company.name} at a glance</h2>{company.body?.length?<div className="prose prose-zinc mt-6 max-w-none"><PortableText value={company.body}/></div>:<p className="mt-5 text-lg text-zinc-600">Company overview will appear here once added in Sanity.</p>}</article><aside className="rounded-3xl border border-zinc-200 bg-white p-7"><p className="text-xs font-bold uppercase tracking-[.16em] text-zinc-500">Company facts</p><dl className="mt-5 space-y-4 text-sm">{company.parentCompany&&<div><dt className="text-zinc-500">Part of</dt><dd className="font-semibold">{company.parentCompany.slug?<Link href={`/companies/${company.parentCompany.slug}`} className="underline decoration-zinc-300 underline-offset-4 hover:text-amber-700">{company.parentCompany.name}</Link>:company.parentCompany.name}</dd></div>}{company.industry&&<div><dt className="text-zinc-500">Industry</dt><dd className="font-semibold">{company.industry}</dd></div>}{company.foundedYear&&<div><dt className="text-zinc-500">Founded</dt><dd className="font-semibold">{company.foundedYear}</dd></div>}{executiveLeaders.map((item)=><div key={item._id}><dt className="text-zinc-500">{item.roleTitle||item.person?.role||"Chief Executive Officer / Managing Director"}</dt><dd className="font-semibold">{item.person?.slug?<Link href={`/people/${item.person.slug}`} className="underline decoration-zinc-300 underline-offset-4 hover:text-amber-700">{item.person.name}</Link>:item.person?.name}</dd></div>)}</dl></aside></section>
 {businessModelArticles.length?section("",`Business model of ${company.name}`,articleLinks(businessModelArticles),"business-model"):null}
 {peopleBehind.length?section("People","People behind the company",<div className="grid gap-4 sm:grid-cols-2">{peopleBehind.map((roles)=>{const person=roles[0].person;const roleTitles=[...new Set(roles.map((item)=>item.roleTitle||item.person?.role||item.relationship).filter(Boolean))];const notes=[...new Set(roles.map((item)=>item.notes).filter(Boolean))];const content=<><h3 className="text-lg font-semibold">{person?.name}</h3><p className="mt-1 text-sm font-medium text-amber-700">{roleTitles.join(" · ")}</p>{notes.map((note)=><p key={note} className="mt-3 text-sm leading-6 text-zinc-600">{note}</p>)}<p className="mt-4 text-sm font-semibold text-amber-700">View profile →</p></>;return person?.slug?<Link key={person._id} href={`/people/${person.slug}`} className="rounded-2xl border border-zinc-200 p-5 transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">{content}</Link>:<article key={roles[0]._id} className="rounded-2xl border border-zinc-200 p-5">{content}</article>})}</div>,"people"):company.founderProfiles?.length?section("People","People behind the company",<div className="grid gap-3 sm:grid-cols-2">{company.founderProfiles.map(f=><Link key={f._id} href={f.slug?`/people/${f.slug}`:"#"} className="rounded-2xl border border-zinc-200 p-4"><p className="font-semibold">{f.name}</p>{f.role&&<p className="mt-1 text-sm text-zinc-500">{f.role}</p>}</Link>)}</div>,"people"):null}
 {funding.length?section("Funding","Capital raised",<div className="divide-y divide-zinc-100">{funding.map(f=><article key={f._id} className="py-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{f.round}</h3>{f.amount!==undefined&&<p className="font-semibold text-amber-700">{new Intl.NumberFormat("en",{style:"currency",currency:f.currency||"USD",maximumFractionDigits:0}).format(f.amount)}</p>}</div><p className="mt-1 text-sm text-zinc-500">{f.date}{f.investors?.length?` · ${f.investors.join(", ")}`:""}</p>{f.notes&&<p className="mt-2 text-sm text-zinc-600">{f.notes}</p>}</article>)}</div>,"funding"):null}
 {metrics.length?section("Key metrics","Numbers that matter",<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(m=><article key={m._id} className="rounded-2xl border border-zinc-200 p-5"><p className="text-sm text-zinc-500">{m.label}</p><p className="mt-2 text-3xl font-semibold">{m.value}</p>{m.period&&<p className="mt-2 text-xs text-zinc-500">{m.period}</p>}{m.notes&&<p className="mt-3 text-sm text-zinc-600">{m.notes}</p>}</article>)}</div>,"metrics"):null}
 {strategyArticles.length?section("",`Strategies used by ${company.name}`,articleLinks(strategyArticles),"strategies"):null}
 {groupCompanies.length?section("Group",company.parentCompany?`Other companies in the ${company.parentCompany.name} group`:`Companies and brands under ${company.name}`,<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{groupCompanies.map((item)=>{const itemLogo=item.logo?.asset?urlFor(item.logo).width(240).url():null;return <Link key={item._id} href={item.slug?`/companies/${item.slug}`:"#"} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"><div className="flex items-center gap-4">{itemLogo?<img src={itemLogo} alt={item.logo?.alt||item.name} className="h-12 w-12 object-contain"/>:<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl text-zinc-400">{item.name[0]}</div>}<div><h3 className="font-semibold">{item.name}</h3>{item.industry&&<p className="mt-1 text-sm text-zinc-500">{item.industry}</p>}</div></div>{item.description&&<p className="mt-4 line-clamp-2 text-sm leading-6 text-zinc-600">{item.description}</p>}</Link>})}</div>,"group-companies"):null}
 {otherRelatedArticles.length?section("Related articles",`More stories about ${company.name}`,<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{otherRelatedArticles.map((article)=>{const image=article.mainImage?.asset?urlFor(article.mainImage).width(720).height(420).url():null;const displayDate=article.contentUpdatedAt||article.publishedAt;return <Link key={article._id} href={`/articles/${article.slug}`} className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">{image?<img src={image} alt={article.mainImage?.alt||article.title} className="aspect-[12/7] w-full object-cover"/>:<div className="aspect-[12/7] bg-zinc-100"/>}<div className="p-5"><p className="text-xs font-bold uppercase tracking-[.12em] text-amber-700">{article.category?.title||"Article"}</p><h3 className="mt-2 text-xl font-semibold leading-tight group-hover:text-amber-800">{article.title}</h3>{article.seoDescription&&<p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">{article.seoDescription}</p>}{displayDate&&<p className="mt-4 text-xs text-zinc-500">{article.contentUpdatedAt?"Updated":"Published"} {new Date(displayDate).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p>}</div></Link>})}</div>,"related-articles"):null}
 {timeline.length?section("Timeline","Key moments",<ol className="space-y-6 border-l border-zinc-200 pl-6">{timeline.map(t=><li key={t._id}><p className="text-sm font-semibold text-amber-700">{t.date}</p><h3 className="mt-1 text-lg font-semibold">{t.title}</h3>{t.description&&<p className="mt-2 text-zinc-600">{t.description}</p>}</li>)}</ol>,"timeline"):null}
 <div className="border-t border-zinc-200 bg-white"><CompanyRow excludeSlug={slug} title="Explore More Companies" description="Continue exploring company stories, strategies, business models, people and key numbers." /></div>
 <Newsletter />
 </main><Footer/></>;
}
