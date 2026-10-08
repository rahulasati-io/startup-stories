import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import XLSX from "xlsx";
import { assertArticleSlug, isValidArticleSlug } from "../lib/article-slug.mjs";

test("accepts canonical article slugs", () => {
  for (const slug of ["a", "123", "story-2026", "quanfluence-quantum-computer-funding"]) {
    assert.equal(isValidArticleSlug(slug), true);
    assert.doesNotThrow(() => assertArticleSlug(slug));
  }
});

test("importer rejects invalid selected rows before querying Sanity in every mode", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "article-slug-test-"));
  try {
    for (const slug of ["story ", "story\n", "quanfluence-quantum-computer-funding   Copy"]) {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
        { import_id: "valid", article_slug: "valid-story", company_slug: "company", title: "Valid", article_tag: "strategy", author_slug: "author", article_body: "Body", status: "published" },
        { import_id: "invalid", article_slug: slug, company_slug: "company", title: "Invalid", article_tag: "strategy", author_slug: "author", article_body: "Body", status: "published" },
      ]), "Articles");
      const filename = path.join(directory, "articles.xlsx");
      XLSX.writeFile(workbook, filename);
      for (const flags of [[], ["--publish"], ["--dry-run"]]) {
        const result = spawnSync(process.execPath, ["scripts/import-articles.mjs", filename, ...flags], {
          encoding: "utf8",
          timeout: 10000,
          env: { ...process.env, NEXT_PUBLIC_SANITY_PROJECT_ID: "testproject", NEXT_PUBLIC_SANITY_DATASET: "production", SANITY_WRITE_TOKEN: "test-token" },
        });
        assert.equal(result.status, 1);
        assert.match(result.stderr, /Articles row 3: article_slug:/);
        assert.doesNotMatch(result.stderr, /fetch failed/);
      }
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("rejects malformed slugs without normalizing input", () => {
  for (const slug of [undefined, null, 123, {}, "", "Copy", "a--b", "-a", "a-", "a_b", "a/b", "a%20b", " a", "a ", "a\n", "a\r\n", "é", "quanfluence-quantum-computer-funding   Copy"]) {
    assert.equal(isValidArticleSlug(slug), false);
    assert.throws(() => assertArticleSlug(slug), /Article slug:/);
  }
});
