import type { PortableTextBlock } from "@portabletext/types";
import type {
  BreadcrumbList,
  Organization,
  WebSite,
  WithContext,
} from "schema-dts";
import { absoluteUrl } from "@/lib/site-url";

export const MISTERSTORY_ORGANIZATION_ID = absoluteUrl("/#organization");
export const MISTERSTORY_WEBSITE_ID = absoluteUrl("/#website");

export function misterStoryOrganizationJsonLd(): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": MISTERSTORY_ORGANIZATION_ID,
    name: "MisterStory",
    url: absoluteUrl("/"),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icon.png"),
      width: "512",
      height: "512",
    },
  };
}

export function misterStoryWebsiteJsonLd(): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": MISTERSTORY_WEBSITE_ID,
    name: "MisterStory",
    url: absoluteUrl("/"),
    description:
      "Stories, strategy and numbers that explain how interesting businesses work.",
    publisher: { "@id": MISTERSTORY_ORGANIZATION_ID },
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function portableTextToPlainText(blocks: PortableTextBlock[] = []) {
  return blocks
    .filter((block) => block?._type === "block")
    .map((block) =>
      ("children" in block && Array.isArray(block.children) ? block.children : [])
        .map((child) =>
          child && typeof child === "object" && "text" in child && typeof child.text === "string"
            ? child.text
            : "",
        )
        .join(""),
    )
    .filter(Boolean)
    .join(" ")
    .trim();
}
