import type { StructureResolver } from "sanity/structure";
import { CompaniesManager } from "./components/CompaniesManager";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("MisterStory content")
    .items([
      S.listItem()
        .title("Companies")
        .child(S.component(CompaniesManager).id("companies-manager").title("Companies")),
      S.documentTypeListItem("founder").title("People"),
      S.documentTypeListItem("post").title("Articles"),

      S.listItem()
        .title("SEO Settings")
        .child(S.document().schemaType("seoSettings").documentId("seoSettings").title("SEO Settings")),

      S.divider(),

      S.documentTypeListItem("companyPersonRole").title("Company people and roles"),
      S.documentTypeListItem("fundingRound").title("Funding and ownership"),
      S.documentTypeListItem("timelineEvent").title("Timeline events"),
      S.documentTypeListItem("companyMetric").title("Company metrics"),

      S.divider(),

      S.documentTypeListItem("category").title("Article categories"),
      S.documentTypeListItem("author").title("Authors"),
      S.documentTypeListItem("concept").title("Concepts"),
      S.documentTypeListItem("industry").title("Industries"),
    ]);
