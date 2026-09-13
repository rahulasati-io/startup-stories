import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Company imports should appear immediately instead of waiting for the CDN cache.
  useCdn: false,
});
