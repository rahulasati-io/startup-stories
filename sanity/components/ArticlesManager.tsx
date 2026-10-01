"use client";

import {AddIcon} from "@sanity/icons/Add";
import {SearchIcon} from "@sanity/icons/Search";
import {Badge, Box, Button, Card, Flex, Spinner, Stack, Text, TextInput} from "@sanity/ui";
import {useEffect, useMemo, useState} from "react";
import {useClient} from "sanity";
import {IntentLink} from "sanity/router";

const API_VERSION = "2025-01-01";

type ArticleRow = {
  _id: string;
  _updatedAt: string;
  title?: string;
  slug?: string;
  category?: string;
  company?: string;
};

type ArticleStatus = "draftOnly" | "unpublishedChanges" | "publishedCurrent";
type StatusFilter = "all" | ArticleStatus;

type DisplayArticle = ArticleRow & {
  documentId: string;
  status: ArticleStatus;
};

function plainId(id: string) {
  return id.replace(/^drafts\./, "");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

const statusDetails: Record<ArticleStatus, {label: string; tone: "caution" | "positive" | "primary"}> = {
  draftOnly: {label: "Draft only", tone: "caution"},
  unpublishedChanges: {label: "Live + unpublished changes", tone: "primary"},
  publishedCurrent: {label: "Published/current", tone: "positive"},
};

export function ArticlesManager() {
  const client = useClient({apiVersion: API_VERSION});
  const [articles, setArticles] = useState<DisplayArticle[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const rows = await client.fetch<ArticleRow[]>(
        `*[_type == "post" && !(_id in path("versions.**"))]{
          _id,
          _updatedAt,
          title,
          "slug": slug.current,
          "category": category->title,
          "company": company[0]->name
        } | order(lower(title) asc)`,
        {},
        {perspective: "raw"},
      );

      const grouped = new Map<string, ArticleRow[]>();
      for (const row of rows) {
        const id = plainId(row._id);
        grouped.set(id, [...(grouped.get(id) ?? []), row]);
      }

      const merged = Array.from(grouped.entries()).map(([documentId, variants]) => {
        const draft = variants.find((row) => row._id.startsWith("drafts."));
        const published = variants.find((row) => row._id === documentId);
        const current = draft ?? published ?? variants[0];
        const status: ArticleStatus = draft
          ? published
            ? "unpublishedChanges"
            : "draftOnly"
          : "publishedCurrent";

        return {...current, documentId, status};
      });

      if (active) {
        setArticles(merged);
        setLoading(false);
      }
    };

    void load();
    const subscription = client
      .listen('*[_type == "post"]', {}, {includeResult: false, visibility: "query"})
      .subscribe(() => void load());

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [client]);

  const counts = useMemo(
    () => ({
      all: articles.length,
      draftOnly: articles.filter((article) => article.status === "draftOnly").length,
      unpublishedChanges: articles.filter((article) => article.status === "unpublishedChanges").length,
      publishedCurrent: articles.filter((article) => article.status === "publishedCurrent").length,
    }),
    [articles],
  );

  const visibleArticles = useMemo(() => {
    const term = search.trim().toLowerCase();

    return articles.filter((article) => {
      if (statusFilter !== "all" && article.status !== statusFilter) return false;
      if (!term) return true;

      return [article.title, article.slug, article.category, article.company]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
    });
  }, [articles, search, statusFilter]);

  const filters: Array<{value: StatusFilter; label: string}> = [
    {value: "all", label: "All"},
    {value: "draftOnly", label: "Draft only"},
    {value: "unpublishedChanges", label: "Live + changes"},
    {value: "publishedCurrent", label: "Published/current"},
  ];

  return (
    <Card height="fill" overflow="auto" padding={4} tone="transparent">
      <Stack space={4}>
        <Flex align="center" gap={3} justify="space-between" wrap="wrap">
          <Box>
            <Text size={2} weight="semibold">Articles</Text>
            <Box marginTop={2}>
              <Text muted size={1}>
                Each article appears in exactly one status view. “Live + changes” means the public article has newer edits waiting to be published.
              </Text>
            </Box>
          </Box>
          <IntentLink intent="create" params={{type: "post"}} style={{textDecoration: "none"}}>
            <Button icon={AddIcon} text="Create article" tone="primary" />
          </IntentLink>
        </Flex>

        <Flex gap={2} wrap="wrap">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              mode={statusFilter === filter.value ? "default" : "ghost"}
              onClick={() => setStatusFilter(filter.value)}
              text={`${filter.label} (${counts[filter.value]})`}
              tone={statusFilter === filter.value ? "primary" : "default"}
            />
          ))}
        </Flex>

        <TextInput
          aria-label="Search articles"
          icon={SearchIcon}
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder="Search by title, slug, company or category"
          value={search}
        />

        {loading ? (
          <Flex align="center" gap={3} justify="center" padding={6}>
            <Spinner muted />
            <Text muted>Loading articles…</Text>
          </Flex>
        ) : (
          <Card border radius={2} overflow="auto">
            <table style={{borderCollapse: "collapse", minWidth: 980, width: "100%"}}>
              <thead>
                <tr>
                  {['Article', 'Slug', 'Company', 'Category', 'Status', 'Updated', 'Actions'].map((label) => (
                    <th key={label} style={{borderBottom: "1px solid var(--card-border-color)", padding: 14, textAlign: "left"}}>
                      <Text muted size={1} weight="semibold">{label}</Text>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleArticles.map((article) => {
                  const status = statusDetails[article.status];
                  return (
                    <tr key={article.documentId}>
                      <td style={{borderBottom: "1px solid var(--card-border-color)", maxWidth: 360, padding: 14}}>
                        <IntentLink
                          intent="edit"
                          params={{id: article.documentId, type: "post"}}
                          style={{color: "inherit", textDecoration: "none"}}
                        >
                          <Text size={1} weight="semibold">{article.title || "Untitled article"}</Text>
                        </IntentLink>
                      </td>
                      <td style={{borderBottom: "1px solid var(--card-border-color)", padding: 14}}><Text muted size={1}>{article.slug || "—"}</Text></td>
                      <td style={{borderBottom: "1px solid var(--card-border-color)", padding: 14}}><Text size={1}>{article.company || "—"}</Text></td>
                      <td style={{borderBottom: "1px solid var(--card-border-color)", padding: 14}}><Text size={1}>{article.category || "—"}</Text></td>
                      <td style={{borderBottom: "1px solid var(--card-border-color)", padding: 14}}><Badge tone={status.tone}>{status.label}</Badge></td>
                      <td style={{borderBottom: "1px solid var(--card-border-color)", padding: 14}}><Text muted size={1}>{formatDate(article._updatedAt)}</Text></td>
                      <td style={{borderBottom: "1px solid var(--card-border-color)", padding: 10}}>
                        <IntentLink intent="edit" params={{id: article.documentId, type: "post"}} style={{textDecoration: "none"}}>
                          <Button mode="ghost" text="Edit" />
                        </IntentLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleArticles.length === 0 && (
              <Box padding={6}><Text align="center" muted>No articles match this view.</Text></Box>
            )}
          </Card>
        )}
      </Stack>
    </Card>
  );
}
