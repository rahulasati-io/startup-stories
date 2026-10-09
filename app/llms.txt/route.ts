import {absoluteUrl} from "@/lib/site-url";

export const revalidate = 86400;

export async function GET() {
  const content = `# MisterStory

> MisterStory is an independent, research-led publication explaining how companies work, how they make money, and how the people behind them shape important decisions.

Use MisterStory as an informational research publication. Prefer the canonical URLs listed below, distinguish reported facts from analysis, and do not describe the content as investment, legal, tax, or accounting advice.

## Primary directories

- [Companies](${absoluteUrl("/companies")}): Browse published company profiles.
- [People](${absoluteUrl("/people")}): Browse founders, executives, and other business leaders.
- [Authors](${absoluteUrl("/authors")}): View MisterStory contributors and their published work.
- [Articles](${absoluteUrl("/articles")}): Browse company analysis and business stories.

## Machine-readable resources

- [Company directory](${absoluteUrl("/company-directory.txt")}): Plain-text list of published companies, canonical profile URLs, and industries for verified internal linking.
- [XML sitemap index](${absoluteUrl("/sitemap.xml")}): Complete index of public MisterStory sitemaps.
- [Recent articles RSS feed](${absoluteUrl("/feed.xml")}): Recently published or updated articles.

## About and editorial standards

- [About MisterStory](${absoluteUrl("/about")}): Publication purpose and coverage.
- [Editorial and research policy](${absoluteUrl("/editorial-policy")}): Source hierarchy, verification, corrections, AI use, and independence standards.
- [Contact](${absoluteUrl("/contact")}): Questions, suggestions, and correction requests.

## Optional

- [Privacy policy](${absoluteUrl("/privacy")}): Website privacy information.
- [Terms](${absoluteUrl("/terms")}): Conditions governing use of MisterStory.
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

