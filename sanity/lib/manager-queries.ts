import {defineQuery} from "next-sanity";

export type ManagerType = "post" | "company";
export type ManagerStatus = "all" | "draftOnly" | "unpublishedChanges" | "publishedCurrent";
export type ManagerRow = {
  _id: string;
  documentId: string;
  _updatedAt: string;
  title?: string;
  slug?: string;
  category?: string;
  company?: string;
  industry?: string;
  seoTitle?: string;
  seoDescription?: string;
  status: Exclude<ManagerStatus, "all">;
};
export type ManagerResult = {rows: ManagerRow[]; counts: Record<ManagerStatus, number>};
export const MANAGER_PAGE_SIZE = 50;

export function managerQuery(type: ManagerType, page: number, status: ManagerStatus) {
  if (!["post", "company"].includes(type) || !Number.isSafeInteger(page) || page < 1) throw new Error("Invalid manager page");
  const draft = '_id in path("drafts.**")';
  const hasPublished = 'defined(*[_id == string::split(^._id, "drafts.")[1]][0]._id)';
  const statuses = {
    all: "true",
    draftOnly: `(${draft}) && !${hasPublished}`,
    unpublishedChanges: `(${draft}) && ${hasPublished}`,
    publishedCurrent: `!(${draft})`,
  };
  if (!(status in statuses)) throw new Error("Invalid document status");
  // Choose the draft when it exists, otherwise the published copy, BEFORE
  // counting and paging. A document can never be split over two pages.
  const canonical = `_type == "${type}" && !(_id in path("versions.**")) &&
    ((${draft}) || !defined(*[_id == "drafts." + ^._id][0]._id))`;
  const search = type === "post"
    ? `(title match $search || slug.current match $search || category._ref in *[_type == "category" && title match $search]._id || company[0]._ref in *[_type == "company" && name match $search]._id)`
    : `(name match $search || slug.current match $search || industry match $search || seoTitle match $search || seoDescription match $search || industryCategory._ref in *[_type == "industry" && name match $search]._id)`;
  const base = `${canonical} && ($q == "" || ${search})`;
  const start = (page - 1) * MANAGER_PAGE_SIZE;
  return defineQuery(/* groq */ `{
    "counts": {
      "all": count(*[${base}]),
      "draftOnly": count(*[${base} && ${statuses.draftOnly}]),
      "unpublishedChanges": count(*[${base} && ${statuses.unpublishedChanges}]),
      "publishedCurrent": count(*[${base} && ${statuses.publishedCurrent}])
    },
    "rows": *[${base} && ${statuses[status]}]
      | order(${type === "post" ? "title" : "name"} asc, _id asc)[${start}...${start + MANAGER_PAGE_SIZE}] {
        _id,
        _updatedAt,
        "documentId": select(${draft} => string::split(_id, "drafts.")[1], _id),
        "title": ${type === "post" ? "title" : "name"},
        "slug": slug.current,
        ${type === "post" ? '"category": category->title, "company": company[0]->name,' : '"industry": coalesce(industryCategory->name, industry), seoTitle, seoDescription,'}
        "status": select(${draft} => select(${hasPublished} => "unpublishedChanges", "draftOnly"), "publishedCurrent")
      }
  }`);
}
