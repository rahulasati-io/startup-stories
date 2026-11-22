import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parse, evaluate} from 'groq-js';
import {selectRecentSidebarArticles} from '../lib/article-sidebar.ts';

const articles = Array.from({length: 20}, (_, i) => ({_id: `post-${i}`}));

test('popular articles keep their slots and Recent backfills in date order', () => {
  const popular = articles.slice(0, 10);
  const recent = selectRecentSidebarArticles(articles, popular);
  assert.deepEqual(recent, articles.slice(10));
  assert.deepEqual(popular, articles.slice(0, 10));
  assert.equal(recent.some(item => popular.some(other => item._id === other._id)), false);
});

test('no popular articles retains newest 10; short or empty lists remain valid', () => {
  assert.deepEqual(selectRecentSidebarArticles(articles, []), articles.slice(0, 10));
  assert.deepEqual(selectRecentSidebarArticles(articles.slice(0, 3), [articles[0]]), articles.slice(1, 3));
  assert.deepEqual(selectRecentSidebarArticles([], articles), []);
});

test('actual page query supplies enough candidates and excludes current/draft articles', async () => {
  const source = fs.readFileSync(new URL('../app/articles/[slug]/page.tsx', import.meta.url), 'utf8');
  const query = source.match(/const ARTICLE_PAGE_SUPPORT_QUERY = defineQuery\(\/\* groq \*\/ `([\s\S]*?)`\);/)[1];
  const posts = articles.map((item, i) => ({...item, _type: 'post', title: item._id,
    slug: {current: item._id}, category: {_ref: 'category'},
    publishedAt: new Date(Date.UTC(2026, 10, 22, 0, 0, 20-i)).toISOString(),
    promotion: i < 10 ? 'popular' : undefined}));
  const result = await (await evaluate(parse(query), {
    dataset: [...posts, {...posts[0], _id: 'current'}, {...posts[0], _id: 'drafts.test'},
      {_id: 'category', _type: 'category', title: 'News', slug: {current: 'news'}}],
    params: {articleId: 'current', categoryId: 'category', referenceIds: []},
  })).get();
  assert.equal(result.recentArticles.length, 20);
  assert.equal(result.popularArticles.length, 10);
  assert.deepEqual(selectRecentSidebarArticles(result.recentArticles, result.popularArticles).map(a => a._id), articles.slice(10).map(a => a._id));
  assert.match(source, /selectRecentSidebarArticles\(support\.recentArticles, popularArticles\)/);
});
