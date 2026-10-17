import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Public, published content should use Sanity's global CDN. Import and audit
  // scripts create their own uncached clients, so administrative writes and
  // verification remain immediately consistent.
  useCdn: true,
});
