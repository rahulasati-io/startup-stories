import {cache} from 'react';
import {defineQuery} from 'next-sanity';
import {client} from '@/sanity/lib/client';
import {selectFeaturedHomepageArticles} from '@/lib/homepage-config';
import type {ArticleCardData} from '@/lib/article-card-data';

export type DataFeaturedStory=Pick<ArticleCardData,'_id'|'_updatedAt'|'title'|'slug'|'categorySlug'|'socialImageUrl'|'mainImageUrl'>;
type FeaturedSettings={featuredArticleId?:string|null;secondFeaturedArticleId?:string|null;supportingFeaturedArticleIds?:string[]};

export const DATA_FEATURED_SETTINGS_QUERY=defineQuery(/* groq */ `
  *[_type == "homepageSettings" && _id == "homepageSettings"][0]{
    "featuredArticleId": featuredArticle._ref,
    "secondFeaturedArticleId": secondFeaturedArticle._ref,
    "supportingFeaturedArticleIds": coalesce(supportingFeaturedArticles[]._ref, [])
  }
`);
export const DATA_FEATURED_ARTICLES_QUERY=defineQuery(/* groq */ `
  *[_type == "post" && _id in $ids && !(_id in path("drafts.**")) &&
    !(_id in path("versions.**")) && defined(title) && defined(slug.current) && defined(category->slug.current)]{
    _id, _updatedAt, title, "slug": slug.current, "categorySlug": category->slug.current,
    "socialImageUrl": socialImage.asset->url, "mainImageUrl": mainImage.asset->url
  }
`);

export const getDataFeaturedStories=cache(async():Promise<DataFeaturedStory[]>=>{
  try{
    // One deadline for both bounded reads. Optional stories must not break data pages.
    const signal=AbortSignal.timeout(3000);
    const options={perspective:'published' as const,stega:false,next:{revalidate:60},signal};
    const settings=await client.fetch<FeaturedSettings|null>(DATA_FEATURED_SETTINGS_QUERY,{},options);
    const ids=[...new Set([settings?.featuredArticleId,...(settings?.supportingFeaturedArticleIds||[]),settings?.secondFeaturedArticleId].filter((id):id is string=>Boolean(id)))].slice(0,6);
    // Unlike homepage fallback, never label ordinary recent uploads as featured here.
    if(!ids.length)return [];
    const articles=await client.fetch<DataFeaturedStory[]>(DATA_FEATURED_ARTICLES_QUERY,{ids},options);
    return selectFeaturedHomepageArticles(articles,settings).slice(0,5);
  }catch{return [];}
});
