import {ARTICLE_DIRECTORY_FILTER} from "@/lib/article-directory-filter";
import {directoryParams} from "@/lib/directory-pagination";
import {toSearchMatch} from "@/lib/global-search";

// One small batched count request, not one request per topic. Read the actual
// destination URL so Studio labels/search hints cannot change what is counted.
export function homepageTopicCountQuery(hrefs:string[]) {
  const fields:string[]=[];
  const params:Record<string,string>={};
  hrefs.forEach((href,index)=>{
    if(!href.startsWith('/')||href.startsWith('//')||/[\\\s\u0000-\u001f]/.test(href))return;
    const url=new URL(href,'https://misterstory.in');
    if(url.pathname!=='/articles'&&url.pathname!=='/articles/')return;
    const raw=Object.fromEntries([...new Set(url.searchParams.keys())].map(key=>[key,url.searchParams.getAll(key)]));
    const {query}=directoryParams(raw);
    const values={q:query.q||'',search:toSearchMatch(query.q||''),category:query.category||'',company:query.company||'',industry:query.industry||''};
    for(const [key,value] of Object.entries(values))params[`${key}${index}`]=value;
    const filter=ARTICLE_DIRECTORY_FILTER.replace(/\$(q|search|category|company|industry)\b/g,(_,name)=>`$${name}${index}`);
    fields.push(`"topic${index}": count(*[${filter}])`);
  });
  return {query:fields.length?`{${fields.join(',')}}`:null,params};
}
