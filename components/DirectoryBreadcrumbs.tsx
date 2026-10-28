import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import {breadcrumbJsonLd} from "@/lib/structured-data";
import {directoryHref, type DirectoryPagination} from "@/lib/directory-pagination";

export default function DirectoryBreadcrumbs({label, path, pagination}: {
  label: string;
  path: string;
  pagination?: DirectoryPagination;
}) {
  const currentPath = pagination ? directoryHref(path, pagination.page, pagination.query) : path;
  const items = [
    {name: "Home", path: "/"},
    {name: label, path},
    ...(pagination && pagination.page > 1 ? [{name: `Page ${pagination.page}`, path: currentPath}] : []),
  ];
  // Filtered first pages keep the same hierarchy, with their actual canonical URL.
  if (items.length === 2) items[1] = {name: label, path: currentPath};
  return <>
    <JsonLd data={breadcrumbJsonLd(items)} />
    <div className="mx-auto -mb-6 max-w-7xl px-5 pt-6 md:px-8">
      <Breadcrumbs items={items.map((item, index) => ({label: item.name, href: index < items.length - 1 ? item.path : undefined}))} />
    </div>
  </>;
}
