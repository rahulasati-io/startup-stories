"use client";

import { AddIcon } from "@sanity/icons/Add";
import { SearchIcon } from "@sanity/icons/Search";
import { Badge, Box, Button, Card, Flex, Spinner, Stack, Text, TextInput } from "@sanity/ui";
import { useEffect, useMemo, useState } from "react";
import { useClient } from "sanity";
import { IntentLink } from "sanity/router";

const API_VERSION = "2025-01-01";

type CompanyRow = {
  _id: string;
  _updatedAt: string;
  name?: string;
  slug?: string;
  industry?: string;
  seoTitle?: string;
  seoDescription?: string;
};

type DisplayCompany = CompanyRow & {
  documentId: string;
  hasDraft: boolean;
  hasPublished: boolean;
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

export function CompaniesManager() {
  const client = useClient({ apiVersion: API_VERSION });
  const [companies, setCompanies] = useState<DisplayCompany[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const rows = await client.fetch<CompanyRow[]>(
        `*[_type == "company" && !(_id in path("versions.**"))]{
          _id,
          _updatedAt,
          name,
          "slug": slug.current,
          "industry": coalesce(industryCategory->name, industry),
          seoTitle,
          seoDescription
        } | order(lower(name) asc)`,
        {},
        { perspective: "raw" },
      );

      const grouped = new Map<string, CompanyRow[]>();
      for (const row of rows) {
        const id = plainId(row._id);
        grouped.set(id, [...(grouped.get(id) ?? []), row]);
      }

      const merged = Array.from(grouped.entries()).map(([documentId, variants]) => {
        const draft = variants.find((row) => row._id.startsWith("drafts."));
        const published = variants.find((row) => row._id === documentId);
        const current = draft ?? published ?? variants[0];

        return {
          ...current,
          documentId,
          hasDraft: Boolean(draft),
          hasPublished: Boolean(published),
        };
      });

      if (active) {
        setCompanies(merged);
        setLoading(false);
      }
    };

    void load();
    const subscription = client
      .listen('*[_type == "company"]', {}, { includeResult: false, visibility: "query" })
      .subscribe(() => void load());

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [client]);

  const visibleCompanies = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return companies;

    return companies.filter((company) =>
      [company.name, company.slug, company.industry, company.seoTitle, company.seoDescription]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  }, [companies, search]);

  return (
    <Card height="fill" overflow="auto" padding={4} tone="transparent">
      <Stack space={4}>
        <Flex align="center" gap={3} justify="space-between" wrap="wrap">
          <Box>
            <Text size={2} weight="semibold">Companies</Text>
            <Box marginTop={2}>
              <Text muted size={1}>{companies.length} company records</Text>
            </Box>
          </Box>
          <IntentLink intent="create" params={{ type: "company" }} style={{ textDecoration: "none" }}>
            <Button icon={AddIcon} text="Create company" tone="primary" />
          </IntentLink>
        </Flex>

        <TextInput
          aria-label="Search companies"
          icon={SearchIcon}
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder="Search by company, slug, industry or SEO text"
          value={search}
        />

        {loading ? (
          <Flex align="center" gap={3} justify="center" padding={6}>
            <Spinner muted />
            <Text muted>Loading companies…</Text>
          </Flex>
        ) : (
          <Card border radius={2} overflow="auto">
            <table style={{ borderCollapse: "collapse", minWidth: 1050, width: "100%" }}>
              <thead>
                <tr>
                  {["Company", "Slug", "Industry", "Meta title", "Meta description", "Status", "Updated"].map((label) => (
                    <th key={label} style={{ borderBottom: "1px solid var(--card-border-color)", padding: 14, textAlign: "left" }}>
                      <Text muted size={1} weight="semibold">{label}</Text>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleCompanies.map((company) => (
                  <tr key={company.documentId}>
                    <td style={{ borderBottom: "1px solid var(--card-border-color)", padding: 14 }}>
                      <IntentLink
                        intent="edit"
                        params={{ id: company.documentId, type: "company" }}
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        <Text size={1} weight="semibold">{company.name || "Untitled company"}</Text>
                      </IntentLink>
                    </td>
                    <td style={{ borderBottom: "1px solid var(--card-border-color)", padding: 14 }}><Text muted size={1}>{company.slug || "—"}</Text></td>
                    <td style={{ borderBottom: "1px solid var(--card-border-color)", padding: 14 }}><Text size={1}>{company.industry || "—"}</Text></td>
                    <td style={{ borderBottom: "1px solid var(--card-border-color)", padding: 14 }}><Text size={1}>{company.seoTitle || "—"}</Text></td>
                    <td style={{ borderBottom: "1px solid var(--card-border-color)", maxWidth: 320, padding: 14 }}>
                      <Text muted size={1} textOverflow="ellipsis">{company.seoDescription || "—"}</Text>
                    </td>
                    <td style={{ borderBottom: "1px solid var(--card-border-color)", padding: 14 }}>
                      <Badge tone={company.hasDraft ? "caution" : "positive"}>
                        {company.hasDraft && company.hasPublished ? "Unpublished changes" : company.hasDraft ? "Draft" : "Published"}
                      </Badge>
                    </td>
                    <td style={{ borderBottom: "1px solid var(--card-border-color)", padding: 14 }}><Text muted size={1}>{formatDate(company._updatedAt)}</Text></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleCompanies.length === 0 && (
              <Box padding={6}><Text align="center" muted>No companies match your search.</Text></Box>
            )}
          </Card>
        )}
      </Stack>
    </Card>
  );
}
