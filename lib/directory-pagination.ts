export type DirectoryParams = Record<string, string | string[] | undefined>;
export type DirectoryFilter = {name: string; label: string; value: string; options: string[]};
export type DirectoryPagination = {
  path: string;
  page: number;
  total: number;
  pageSize: number;
  query: Record<string, string>;
  filters: DirectoryFilter[];
};

export const DIRECTORY_PAGE_SIZE = 24;

export function directoryParams(params: DirectoryParams) {
  const value = (name: string) => {
    const raw = params[name];
    return (Array.isArray(raw) ? raw[0] : raw || "").trim().slice(0, 120);
  };
  const rawPage = value("page") || "1";
  const page = /^\d+$/.test(rawPage) ? Number(rawPage) : 0;
  const query = Object.fromEntries(["q", "category", "company", "industry"]
    .map((name) => [name, value(name)])
    .filter(([, item]) => item && item !== "All"));
  return {page: Number.isSafeInteger(page) && page > 0 ? page : 0, query};
}

export function directoryHref(path: string, page: number, query: Record<string, string> = {}) {
  const params = new URLSearchParams(query);
  if (page > 1) params.set("page", String(page));
  else params.delete("page");
  return params.size ? `${path}?${params}` : path;
}
