import type {SidebarStory} from "@/components/SidebarArticleLinks";

export function selectSidebarStories(related: SidebarStory[], featured: SidebarStory[]): SidebarStory[] {
  const ids=new Set<string>();
  const slugs=new Set<string>();
  const result:SidebarStory[]=[];
  for(const story of [...related,...featured]){
    const slug=story.slug?.trim().toLowerCase();
    if(!story._id || !story.title?.trim() || !slug || /^(drafts|versions)\./.test(story._id) || ids.has(story._id) || slugs.has(slug))continue;
    ids.add(story._id);slugs.add(slug);result.push(story);
    if(result.length===5)break;
  }
  return result;
}
