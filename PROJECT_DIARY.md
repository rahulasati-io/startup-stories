# MisterStory Project Diary

This diary records meaningful product, content-model, workflow, and technical decisions for MisterStory. Its purpose is to preserve not only **what changed**, but **why Rahul chose it**.

Older entries were reconstructed on 2026-09-01 from the project, spreadsheet workflow, and the working conversation. Their exact implementation dates may be earlier than the date shown. Future entries should use the actual date of the change.

## How to maintain this diary

- Append an entry whenever a meaningful feature, data model, import workflow, page structure, or editorial rule changes.
- Record the user or product reason, not merely the edited filename.
- Mark decisions as `Implemented`, `Deferred`, `Replaced`, or `Planned`.
- Preserve earlier decisions even when they are later replaced; add a new entry explaining the replacement.
- Do not record trivial formatting corrections unless they reflect a product decision.

## Product direction

MisterStory is a research-led website explaining companies, the people behind them, their business models, strategies, ownership, milestones, and related articles. The initial launch target is at least 100 company pages. The infrastructure should make it practical to add hundreds or thousands of records without manually building each page.

## Decision log

### Reconstructed — Company pages became the core content unit

- **Status:** Implemented
- **Change:** Created reusable company detail pages at `/company/[slug]` instead of manually designed pages for individual companies.
- **Reason:** Rahul wants to launch with at least 100 company pages and eventually support a much larger company database. A reusable template makes this achievable.
- **Result:** Company records in Sanity drive a common page structure.

### Reconstructed — Excel first, Sanity as the website database

- **Status:** Implemented
- **Change:** Company and people research is collected in `companies.xlsx`, then imported into Sanity.
- **Reason:** Excel is faster for bulk research and review, while Sanity is better for structured website content and article publishing. A custom dashboard is unnecessary at the present stage.
- **Result:** Excel remains the bulk-input workflow; Sanity remains the source used by the website.

### Reconstructed — Defer a custom editorial dashboard

- **Status:** Deferred
- **Change:** Decided not to build a separate data-entry dashboard yet.
- **Reason:** The spreadsheet and Sanity Studio already cover the current workflow. Rahul may later build AI tools to collect and prepare company data, so a dashboard now could be premature work.

### Reconstructed — Simplify the company workbook

- **Status:** Implemented
- **Change:** Reduced the workbook to the sheets that still serve the live website workflow: `Companies`, `People`, `Person Profiles`, `Funding Rounds`, `Timeline Events`, and `Metrics`.
- **Reason:** Founder, Company People, Business Model Components, and Strategies sheets duplicated information or became unnecessary once articles and the People relationship model took over.
- **Result:** Fewer sheets must be maintained, and the importer ignores obsolete workflows.

### Reconstructed — Keep the Companies sheet deliberately small

- **Status:** Implemented
- **Change:** The core company research table uses stable fields such as `company_slug`, `company_name`, `industry`, `founded_year`, `founders`, `short_description`, and `company_overview`.
- **Reason:** The first research project should produce only the information required to create useful company pages. More complex editorial content belongs in articles or related structured sheets.

### Reconstructed — Model parent companies and company groups

- **Status:** Implemented, with expansion deferred
- **Change:** Added `parent_company_slug` support and group-company discovery.
- **Reason:** Some businesses are parents, subsidiaries, or brands. Visitors should be able to understand the group relationship and discover sibling companies without duplicating pages.
- **Result:** Company pages can show a parent and other companies or brands in the same group. More elaborate ownership modelling can wait.

### Reconstructed — Use one People sheet for person–company relationships

- **Status:** Implemented
- **Change:** The `People` sheet became the source for connections between people and companies.
- **Reason:** Separate Founder and Company People sheets caused duplication and confusion. One person may be connected to several companies or hold several roles, so the relationship must be stored separately from the person profile.
- **Result:** Repeating a `person_slug` creates multiple company relationships while preserving one person page.

### Reconstructed — Separate profile content into Person Profiles

- **Status:** Implemented
- **Change:** Added a `Person Profiles` sheet containing one row per person, including `person_slug`, `person_name`, `biography`, `primary_role`, `linkedin_url`, and private `source_url`.
- **Reason:** Biography and LinkedIn research is a different project from mapping company relationships. Keeping it separate avoids repeating long biographies for people connected to multiple companies.

### Reconstructed — Source URLs remain private

- **Status:** Implemented
- **Change:** People and profile `source_url` values remain in Excel and are not imported into Sanity or shown publicly.
- **Reason:** Sources are needed for internal verification, but raw research URLs should not clutter public pages.
- **Exception:** A link intentionally written inside biography Markdown is public because it is part of the reader-facing content.

### Reconstructed — Biography uses lightweight Markdown

- **Status:** Implemented
- **Change:** The profile importer converts biography text into Sanity Portable Text.
- **Reason:** Founder biographies need multiple paragraphs, bold text, public links, and headings without requiring manual editing in Sanity.
- **Supported input:** Blank lines create paragraphs, `**text**` creates bold text, `[label](URL)` creates a public link, and `## Heading` creates an H2.
- **Website behaviour:** Paragraph spacing, heading spacing, bold styling, and link styling are controlled consistently by the founder-page renderer.

### Reconstructed — One primary role per person

- **Status:** Implemented
- **Change:** `primary_role` is owned by `Person Profiles` and displayed once below the person’s name.
- **Reason:** Pulling a primary title from repeated People rows produced conflicting or repeated positions. The page needs one clear professional description, typically in the format `Role, Organisation`.
- **Result:** Company-specific connections remain in People; the public headline remains a single profile-level field.

### Reconstructed — Preserve exact relationship types

- **Status:** Implemented
- **Change:** Added `Co-founder` as distinct from `Founder` in the relationship model and importer.
- **Reason:** Converting every co-founder relationship into Founder loses useful meaning and can misrepresent a person’s connection to a company.

### Reconstructed — Company page content is increasingly article-led

- **Status:** Implemented
- **Change:** Business Model and Strategy sections show relevant published articles rather than requiring separate spreadsheet-written cards.
- **Reason:** Rahul wants substantial, evidence-based explanations instead of generic summaries. Articles support multiple paragraphs, links, bold text, images, and deeper analysis.
- **Routing rule:** Articles linked to a company and categorised as Strategy appear in Strategy; Business Model articles appear in Business Model; other company-linked articles remain under Related Articles.

### Reconstructed — Retain Related Articles on company pages

- **Status:** Implemented
- **Change:** Kept a general Related Articles section even after Strategy and Business Model became article-led.
- **Reason:** Some useful company articles do not belong to either category and still need a discovery surface.

### Reconstructed — Related founder articles require a direct person reference

- **Status:** Implemented
- **Change:** Added `People featured` to the Article schema.
- **Reason:** Showing every article about an associated company on a founder page would include irrelevant content. An article should appear on a person page only when that person is directly discussed.
- **Result:** Published articles selected under `People featured` appear automatically on the corresponding founder page. The section is hidden when no articles are linked.

### Reconstructed — Founder pages connect outward, but never to placeholders

- **Status:** Implemented
- **Change:** Founder pages link to associated company pages, directly related articles, LinkedIn, and the existing company explorer.
- **Reason:** Person pages should help readers continue exploring the website, but buttons without real destinations create a misleading experience.
- **Deferred:** A People directory, global search, and “Explore more people” remain hidden until those destinations genuinely exist.

### Reconstructed — Associated companies show relationships, not repeated job titles

- **Status:** Implemented
- **Change:** Founder-page company connections display company name, relationship, status, and industry; they no longer repeat full role titles.
- **Reason:** Repeating several similar titles made the person page look like it contained duplicate positions. The detailed relationship data is retained in Sanity for future use.

### Reconstructed — Widen the founder biography

- **Status:** Implemented
- **Change:** Expanded the founder page to a wider layout, giving the biography roughly three quarters of the main content row and the company connections the smaller column.
- **Reason:** Long biographies felt cramped and difficult to read in the earlier, nearly even two-column layout.
- **Typography note:** The global font size was not reduced. Rahul chose to leave typography unchanged for now and revisit it later if necessary.

### Reconstructed — Add real global navigation to detail pages

- **Status:** Implemented
- **Change:** Reused the MisterStory header on company, founder, and article pages.
- **Reason:** Detail pages looked isolated and offered no obvious route back into the wider website.
- **Current links:** MisterStory returns home; Companies opens the existing company directory; Articles opens the existing stories section.
- **Removed:** The unfinished header search control was removed rather than presenting a non-working feature.

### Reconstructed — Add local section navigation only for available content

- **Status:** Implemented
- **Change:** Company and founder pages expose section links that scroll within the current page.
- **Reason:** Long detail pages need faster navigation, but links for empty sections should not appear.
- **Result:** Founder-page links for Associated Companies and Related Articles are conditional on real content.

### Reconstructed — Keep the company explorer at the bottom of detail pages

- **Status:** Implemented
- **Change:** Reused the searchable Explore More Companies directory at the end of company and founder pages.
- **Reason:** It is an existing, useful destination that encourages further discovery without requiring a People directory or fake recommendations.

### Reconstructed — Logos are optional for the initial launch

- **Status:** Deferred
- **Change:** Added a bulk logo folder/import workflow, but decided not to require logos for every upcoming company page.
- **Reason:** Logo collection was slowing content expansion and causing local image-proxy issues. Pages already have a letter fallback and can launch without complete logo coverage.

### Reconstructed — Avoid local Next.js image proxy failures

- **Status:** Implemented
- **Change:** Configured images to avoid the local optimisation proxy path that was rejecting Sanity CDN addresses resolved through the machine’s network setup.
- **Reason:** The upstream-image error repeatedly interrupted local page previews even though the underlying Sanity image URL was valid.

### Reconstructed — Optimise bulk imports

- **Status:** Implemented
- **Change:** The importer bulk-fetches existing records, skips unchanged data, processes independent records concurrently, writes related records in batches, and reports progress.
- **Reason:** Sequential imports became slow and would not scale to hundreds or thousands of spreadsheet rows.
- **Additional controls:** `--company=<slug>` limits work to one company; `--person=<slug>` limits profile work to one person.

### Reconstructed — Keep development server and importer separate

- **Status:** Implemented workflow
- **Change:** Recommended two VS Code terminals: one persistent `npm run dev` terminal and one terminal for imports.
- **Reason:** Sanity imports do not require restarting Next.js. Repeated restarts waste time and trigger first-page compilation again.

### Reconstructed — Prevent stale company lists during development

- **Status:** Implemented
- **Change:** Disabled CDN-backed stale reads for the company directory and requested fresh company data.
- **Reason:** After importing 100 companies, the website continued showing only the earlier small set even though the import had succeeded.

### 2026-09-01 — Current founder-page implementation completed

- **Status:** Implemented
- **Change:** Connected Person Profiles primary roles, wider biography layout, clean associated-company cards, direct person-linked articles, conditional local navigation, the shared header, and the company explorer.
- **Reason:** Rahul wanted the founder page to feel complete, avoid duplicated roles, provide meaningful next destinations, and remain scalable as new profiles and articles are added.
- **Verification:** Importer syntax and TypeScript checks passed.

### 2026-09-01 — Established a durable project diary

- **Status:** Implemented
- **Change:** Created this decision diary and added a repository instruction requiring future coding sessions to maintain it.
- **Reason:** Rahul wants a lasting record of every meaningful change and the reasoning behind it, rather than relying on long chat history or remembering decisions manually.
- **Result:** Future work in the repository should append decisions here while preserving the earlier history.

### 2026-09-01 — Simplified Sanity Studio into a flat content workspace

- **Status:** Replaced
- **Change:** Replaced the nested company workspace and research folders with direct top-level lists for Companies, People, Articles, Company People and Roles, Funding and Ownership, Timeline Events, Company Metrics, Article Categories, Authors, and Concepts.
- **Reason:** Rahul wants everything that can be entered to remain visible in the left navigation. Selecting a content type should use the remaining Studio area for only that type’s records and editor, with easy access to Sanity’s built-in search and create controls.
- **Result:** Editing requires fewer nested pane selections. Sanity’s normal list-and-document editor panes remain, avoiding the much larger effort of building a custom Studio tool. No content or public website behaviour changed.

### 2026-09-01 — Replaced the flat Companies list with a company manager

- **Status:** Implemented
- **Change:** Companies now opens as a searchable table showing company name, slug, industry, SEO title, SEO description, publication state, and last update. Create and edit actions open Sanity’s complete document editor rather than a reduced custom form.
- **Reason:** Rahul found the flat document panes difficult to scan and wanted the list to disappear while editing. A table makes bulk content review easier, while the standard editor preserves every schema field, validation rule, publishing action, and future schema addition.
- **Result:** Company records are easier to find and audit without changing any content or public website behaviour. People and Articles can adopt the same pattern later if this first manager proves useful.

### 2026-09-03 — Made industries reusable and SEO spreadsheet-driven

- **Status:** Implemented
- **Change:** Replaced free-text industry entry with reusable Industry records. Company editing now provides searchable, scrollable suggestions and permits creating a new industry. The importer creates missing industries from the Companies sheet and links companies to them. It also imports `meta_title` and `meta_description` (with `seo_title` and `seo_description` accepted as aliases).
- **Reason:** Rahul wants consistent company categories without repeatedly typing variations, while retaining an easy way to expand the list. SEO information should remain efficient to prepare in bulk from Excel.
- **Compatibility:** Existing free-text industry data remains stored as a hidden legacy fallback until each company is re-imported; website pages support both formats during the transition.

### 2026-09-03 — Added centrally editable SEO templates

- **Status:** Implemented
- **Change:** Added a singleton SEO Settings screen for company and person title/description templates. Company templates support `{company_name}` and `{industry}`; person templates support `{person_name}` and `{primary_role}`. Existing company spreadsheet/Sanity metadata and new person-level metadata fields remain optional overrides.
- **Reason:** Rahul wants to change shared SEO wording once and have it apply across the website, while retaining control over the wording of individual important pages.
- **Result:** Metadata follows `page override → editable global template → coded safety default`. Publishing SEO Settings updates every company or person page without an override; no re-import is required.

### 2026-09-03 — Added scalable company and people discovery pages

- **Status:** Implemented
- **Change:** Added searchable `/companies` and `/people` directories using reusable company and person cards. Embedded company explorers are capped at six cards (two desktop rows) and lead to the full Companies directory. Header and footer navigation now use these real destinations.
- **Reason:** Rahul is preparing for at least 100 company pages; displaying every company on the homepage and detail pages would become unwieldy. Dedicated directories provide scalable discovery and make person profiles easier to reach.

### 2026-09-03 — Added newsletter prompts across public content

- **Status:** Implemented and connected to Kit
- **Change:** Reused the newsletter widget on company, person, article, Companies-directory, and People-directory pages in addition to the homepage.
- **Reason:** Every high-intent reading path should offer a consistent conversion opportunity.
- **Result:** The shared widget collects addresses through the secure Kit integration described below.

### 2026-09-03 — Added cross-discovery between person profiles

- **Status:** Implemented
- **Change:** Person profiles now show up to six other people in an “Also know about these people” section before the existing company explorer, with a link to the complete People directory. The cards are shared with the directory so their presentation remains consistent.
- **Reason:** Rahul wants person pages to lead naturally to other person profiles as well as companies, rather than ending with only company discovery.

### 2026-09-03 — Enforced publishable URL slugs

- **Status:** Implemented
- **Change:** Article, company, and person slugs are mandatory and must contain only lowercase letters, numbers, and separating hyphens. Sanity displays a specific blocking error when a slug is absent or malformed.
- **Reason:** Public content without a valid slug has no dependable page URL and should not be allowed to go live.

### 2026-09-03 — Connected newsletter signup to Kit

- **Status:** Implemented
- **Change:** Connected the shared newsletter widget to Kit through a private server endpoint. The form now validates email addresses, shows loading/success/error feedback, records the signup page as the referrer, and includes a honeypot plus basic rate limiting against automated abuse.
- **Reason:** Newsletter prompts already appear throughout the public website, so one shared integration makes every placement functional while keeping the Kit API key out of browser code.
- **Privacy:** `KIT_API_KEY` and `KIT_FORM_ID` remain server-only in `.env.local`, which is excluded from Git.

### 2026-09-03 — Added search-engine discovery files

- **Status:** Implemented
- **Change:** Added a dynamic sitemap for the homepage, directories, and every published company, person, and article with a valid URL. Added robots rules that allow public pages while blocking `/studio/` and `/api/`. Centralized the canonical domain as `https://misterstory.in` with an optional `NEXT_PUBLIC_SITE_URL` deployment override, and corrected the article canonical URL from the old `.com` address.
- **Reason:** Rahul plans to launch at least 100 company pages. Search engines need a reliable inventory of public URLs and clear instructions not to crawl the CMS or internal endpoints.
- **Refresh:** Sitemap content is refreshed from published Sanity records at least hourly. If Sanity is temporarily unavailable, core static pages remain listed.

### 2026-09-04 — Activated homepage company search

- **Status:** Implemented temporarily; must be replaced by the planned inline search experience below
- **Change:** Replaced the decorative homepage search button with a working search form. Searches now open `/companies` with the entered company, industry, or descriptive term already applied. Popular links such as Zomato, Jio, Zerodha, and Safari use the same working filtered-results flow instead of nonexistent page anchors.
- **Reason:** Rahul found that both the top search control and the popular company names appeared interactive but did nothing useful.

### Planned — Replace homepage search with inline company results

- **Do not implement yet.**
- **Required behaviour:** Searching on the homepage must keep the visitor on the homepage and show a compact results panel directly beneath the search box, similar to the existing Explore Companies experience. Typing `Zomato` should display every matching company name if more than one record matches. Clicking a result must open that company directly at `/company/[slug]`; it must not redirect first to the complete Companies directory.
- **Popular company links:** Clicking text such as Zomato, Jio, Zerodha, or Safari must use the same inline results interaction, prefilled with that term. It must not navigate to `/companies?q=...`.
- **Result design:** Show company name, industry, and optionally the existing logo/initial. Include a clear “No companies found” state. Support mouse, keyboard selection, Escape to close, and an accessible result announcement.
- **Implementation direction:** Load a compact published company search index for the homepage and filter it in the interactive search component. Keep the full `/companies` directory as a separate browsing destination, not as an intermediate search step. If the company catalogue later grows into the thousands, replace the embedded index with a server search endpoint.

### 2026-09-04 — Replaced homepage redirect search with inline company results

- **Status:** Implemented; replaces the temporary redirect search and completes the plan above
- **Change:** Homepage search now filters the published company index in place and displays a compact result panel. Results link directly to company pages. Popular names prefill and open the same interaction rather than redirecting to the Companies directory.
- **Accessibility:** Added keyboard result selection, Escape-to-close behaviour, result announcements, and a clear no-results state.
- **Reason:** Rahul wanted visitors searching for Zomato or another company to see all matching names immediately and open the chosen company without an unnecessary intermediate page.

### 2026-09-04 — Simplified homepage company search to a Screener-style autocomplete

- **Status:** Implemented; refines the inline search above
- **Change:** Search now matches company names and slugs rather than descriptions, presents compact single-line company names, highlights the first result by default, supports a clear button, and opens the highlighted company with Enter or the selected company with one click.
- **Reason:** Rahul preferred Screener.in's focused company lookup pattern. The earlier two-line results with industries and arrows felt more like a directory panel than a fast company finder.

### 2026-09-04 — Made popular homepage companies direct shortcuts

- **Status:** Implemented
- **Change:** Zomato, Jio, Zerodha, and Safari below the homepage search now link directly to their company pages rather than filling and running the autocomplete.
- **Reason:** The popular list exists to help first-time visitors get started with one click. Requiring another search interaction added work without providing value.

### 2026-09-04 — Made homepage and article discovery resilient to Sanity outages

- **Status:** Implemented
- **Change:** Homepage company/article queries now fail independently with a six-second limit instead of crashing the entire route. The homepage reuses its company result for the explorer rather than querying twice. The Articles directory, shared company explorer, and footer retain their structure and navigation when Sanity is temporarily unreachable.
- **Reason:** A failed Sanity network request produced a slow homepage `500` after the new discovery queries were added. Public navigation should remain usable during a brief CMS or connection interruption.
- **Behaviour:** Content-dependent cards may be temporarily empty during an outage and return automatically on the next successful request; static page content, navigation, newsletter, and footer remain available.

### Planned — Add a dedicated Articles directory

- **Do not implement yet.**
- Add a public `/articles` page listing published articles from Sanity.
- Provide article search and category filtering, using the established reusable article-card design.
- Each card must link directly to its real page at `/articles/[category]/[slug]`.
- Change the header’s Articles link from the homepage anchor to `/articles`.
- Replace homepage placeholder story cards with published Sanity articles so every visible article card has a real destination. Keep a “View all articles” link leading to the new directory.
- Add `/articles` to the sitemap. Individual published articles are already included automatically.

### 2026-09-04 — Added the Articles directory and real homepage article cards

- **Status:** Implemented; completes the plan above
- **Change:** Added `/articles` with article search and category filters. Every card links to its actual category/slug route. Header, footer, sitemap, homepage feature cards, and Latest Stories now use the real published Sanity article collection.
- **Image behaviour:** Article cards share the established image fallback, including generated Business Model thumbnails when no custom image exists.
- **Reason:** Rahul is preparing hundreds of articles and needs a scalable public library rather than placeholder homepage stories.

### Planned — Automate thumbnails for high-volume article publishing

- **Do not implement yet.**
- **Publishing context:** Rahul plans to publish hundreds of recurring “How [Company] makes money” and company Strategy articles. Requiring a separately designed and uploaded thumbnail for every article would make this workflow unnecessarily slow.
- Make the manually uploaded Hero Image optional instead of mandatory. Keep it as a high-quality override for important stories.
- Generate a consistent branded 1200×630 image automatically whenever no custom image exists. The generated image should use the article title, company name, category label, MisterStory branding, and a category-specific visual treatment.
- Start with two reusable templates: **Business Model / How it makes money** and **Strategy**. Maintain a safe text area so the same image works on article cards, article headers, and social previews without important text being cropped.
- Use one fallback order everywhere: custom Social Image → custom Hero Image → generated branded image. Generate sensible alt text from the article title when a custom alt value is absent.
- The article directory, homepage article cards, company-related article cards, article hero, and Open Graph metadata must all use the same image resolver so thumbnails never appear missing in one location but present in another.
- Generated images should use stable article URLs and caching; they should not require uploading hundreds of duplicate assets into Sanity. If the design changes later, updating the shared templates should update all automatically generated thumbnails.
- Before bulk publishing, test long company names, long titles, mobile cards, link previews, missing logos, and both article categories.

### 2026-09-04 — Added automatic Business Model thumbnails

- **Status:** Implemented for Business Model articles only
- **Change:** Added a deterministic 1200×630 MisterStory thumbnail generator for Business Model articles. It reads the published article title and first linked company from Sanity, assigns that company one of 60 stable high-contrast colour palettes, and caches the generated image. Hero Image is now optional. A custom Social Image or Hero Image continues to override the automatic image.
- **Coverage:** The automatic fallback is used by article social metadata, the article hero, company-page Business Model cards, and related article cards on person pages. Other article categories are unchanged.
- **Reason:** Rahul plans to publish hundreds of “How [Company] makes money” articles and does not want manually designing or uploading a thumbnail to become a publishing bottleneck.
- **Fallback rule:** Social Image → Hero Image → automatic Business Model image. The first company linked in the article is the company displayed and the stable source of its colour palette.

## Current deferred decisions

### 2026-09-04 — Added bulk Business Model article import workflow

- **Status:** Implemented
- **Change:** Added a dedicated Excel importer and workbook template for recurring “How [Company] makes money” articles. The importer validates company, category, and author references in bulk; converts structured Markdown into Sanity Portable Text; shows progress; and skips unchanged articles.
- **Publishing safety:** Imports create or update drafts by default. A row is published only when its status is `published` and the import is explicitly run with `--publish`. A dry-run mode and article/company filters support small checks before a large import.
- **Privacy:** The workbook includes a private `source_urls` research column, but the importer deliberately does not send it to Sanity.
- **Reason:** Rahul plans to add hundreds of Business Model articles and needs a fast repeatable workflow that preserves headings, paragraphs, bold text, links, lists, custom images, and manual CMS fields.

### 2026-09-04 — Corrected article draft reuse and company reference keys

- **Status:** Implemented
- **Change:** Changed the article importer to read Sanity's raw document perspective so an existing draft is reused on later imports. Company references created by the importer now receive stable unique `_key` values required by Sanity arrays.
- **Reason:** Re-running the first Zomato article import created multiple drafts with the same slug because the importer could only see published documents. Company references also displayed a “Missing keys” repair warning in Studio.
- **Result:** Re-importing an article now updates its existing draft instead of creating another one, and imported company lists are immediately editable in Studio.

### 2026-09-05 — Expanded automatic Business Model thumbnail system

- **Status:** Implemented
- **Change:** Business Model thumbnails now use light backgrounds, dark text, 30 colour palettes and 21 business-specific visual motifs. Motifs are selected from the linked company's industry with stable company-level variation.
- **Reliability:** Added safe title width for long company names and automatic cache invalidation using a central design version plus each article's Sanity update timestamp.
- **Reason:** Rahul wanted high-volume article thumbnails to remain varied, attractive and relevant to how the company earns money without manual image creation.

### 2026-09-05 — Added Strategy article workbook

- **Status:** Import workflow ready; editorial formats and Strategy thumbnail direction intentionally deferred
- **Change:** Added `outputs/article-importers/strategy-articles-template.xlsx` with Articles, Instructions and Example sheets. It uses the existing generic article importer and fixes `category_slug` to `strategy` through validation. Both Strategy and Business Model workbooks now live together in `outputs/article-importers`.
- **Publishing:** The existing draft and `--publish` safeguards apply unchanged. `source_urls` remains internal and is ignored by the importer.
- **Reason:** Prepare the scalable publishing pipeline now while Rahul decides which repeatable Strategy article formats are worth producing.

- Build a `/subscription-confirmed` page and configure the MisterStory Newsletter form in Kit for double opt-in. Kit should send a branded confirmation email, keep auto-confirm disabled, and redirect confirmed subscribers to the new page. The page should thank them and explain how to add the sender to Contacts or move messages to Gmail's Primary tab. Connect the final production URL after deployment.
- Revisit founder-page body typography only after more real profiles are loaded.
- Build a People directory only when enough complete person profiles exist.
- Build genuine global search before reintroducing a search control.
- Complete bulk logos later; they are not launch blockers.
- Continue refining Strategy and Business Model article coverage as research content grows.
- Add more detailed person/profile fields only when the publishing workflow demonstrates a real need.

## Current operating workflow

1. Research company basics into `Companies`.
2. Map people to companies in `People`.
3. Research one reusable biography, primary role, and LinkedIn URL per person in `Person Profiles`.
4. Keep research evidence in private `source_url` columns.
5. Import all records or use a company/person filter for focused updates.
6. Write and publish deeper Strategy, Business Model, founder, and general company articles in Sanity.
7. Link articles to companies and, only when directly relevant, to `People featured`.
8. Keep `npm run dev` running separately and refresh the page after imports.

### 2026-09-13 — Prepared a private beta deployment workflow

- **Status:** Implemented locally; Vercel connection pending
- **Change:** Chose a GitHub branch and Vercel Preview Deployment workflow for beta testing before connecting `misterstory.in`.
- **Privacy:** Environment files and credentials remain local. Excel workbooks, research inspection files, generated importer outputs, local spreadsheet tooling and logo-drop files are excluded from Git so they cannot be published with the website source.
- **Reason:** Rahul wants to test the complete website online, including on mobile while the desktop is off, without treating the beta as the public launch.

### 2026-09-13 — Private beta deployed on Vercel

- **Status:** Implemented
- **Change:** Connected the existing Vercel `startup-stories` project to the GitHub `beta` branch deployment and supplied only the runtime settings needed by the website.
- **Access:** The stable beta URL is protected by Vercel Authentication and sends `X-Robots-Tag: noindex`; unauthenticated visitors are redirected to Vercel sign-in.
- **Privacy:** Sanity project information, dataset selection and Kit form configuration are scoped to Preview deployments. The Kit API key is stored as a non-revealable Vercel secret. `SANITY_WRITE_TOKEN`, `.env.local`, Excel workbooks and research files remain outside GitHub and Vercel.
- **Behaviour:** Pushing future commits to the `beta` branch automatically creates a protected Preview deployment. The existing `main` production deployment and `misterstory.in` remain unchanged.

### 2026-09-16 — Added the initial MisterStory author team

- **Status:** Implemented in Sanity
- **Change:** Added Aarav Mehta, Ananya Rao, Rohan Kapoor, Meera Iyer, Kabir Malhotra, Nisha Verma, and Arjun Nair as selectable article authors. Priya Shah was excluded as requested.
- **Editorial safeguard:** Only the names and the generic description “Author at MisterStory” were added. Earlier placeholder education and experience were not published as verified facts.
- **Workflow:** Added an idempotent setup script that creates missing author records and skips existing ones, preventing duplicates if it is run again.

### 2026-09-19 — Simplified public URLs before launch

- **Status:** Implemented
- **Change:** Standardized company profiles at `/companies/[slug]`, person profiles at `/people/[slug]`, and articles at `/articles/[slug]`. Removed the old singular company route, founder route, and category segment inside article URLs.
- **Topics:** Added `/topics/[slug]` collection pages so Business Model, Strategy, and future categories remain browsable without controlling an article’s permanent URL.
- **Reason:** Rahul chose company- and people-friendly public paths and category-independent article URLs while the protected beta is not yet publicly indexed.
- **Behaviour:** Updated search, cards, related content, group-company links, footer links, category links, canonical metadata, and the sitemap. No legacy redirects were retained because the site has not launched publicly.
- **Publishing workflow:** Sanity document types and spreadsheet slugs remain unchanged; editors continue linking articles to companies, people, and categories as metadata.

### 2026-09-19 — Expanded article discovery and author profiles

- **Status:** Implemented
- **Change:** Article pages now expose linked companies, featured people and concepts; author names link to new `/authors/[slug]` profiles; and each article recommends more stories about the same companies and from the same category.
- **Directory:** Added company and industry filters to `/articles`. Industry is inherited from linked companies, so editors do not enter it twice. Cards can display multiple linked companies.
- **Taxonomy:** Confirmed Business Model and Strategy already existed, then added Company Story and People & Leadership as the two missing primary categories. Category pages continue to use `/topics/[slug]`.
- **Editorial rules:** Every article now requires one primary category, one author and at least one linked company. People and concepts remain optional and should only be linked when directly relevant.
- **Authors:** Added optional verified role, education, experience and LinkedIn fields to author records and a public profile page that lists each author’s articles. No placeholder credentials were added.
- **Importer:** The spreadsheet importer continues to manage the core article fields while preserving people, concepts, images and other manually managed Sanity fields on later updates.

### 2026-09-19 — Added optional article relationship columns

- **Status:** Implemented
- **Change:** Added optional `people_slugs` and `concept_slugs` columns to both article workbooks and taught the article importer to validate and create those Sanity references.
- **Safe update rule:** A populated cell replaces that article's corresponding links. A blank cell leaves existing people or concept links in Sanity untouched, so later spreadsheet imports cannot accidentally erase manual editorial work.
- **Reason:** Article pages now use linked people and concepts for discovery, and Rahul needs a scalable way to supply those relationships while importing hundreds of articles.

### 2026-09-20 — Consolidated article importing into one workbook

- **Status:** Implemented
- **Change:** Replaced the separate Business Model and Strategy workbooks with one `articles-template.xlsx` for every article type.
- **Tag selection:** The workbook uses a required `article_tag` dropdown with Business Model, Strategy, Company Story, and People & Leadership. The importer converts the readable selection into the corresponding Sanity category reference.
- **Taxonomy rule:** Each article gets one primary article tag for browsing. Optional `concept_slugs` remain available for multiple narrower topics.
- **Reason:** A single master workbook is simpler to maintain and scales better for bulk article publishing.

### 2026-09-20 — Widened the article reading layout

- **Status:** Implemented
- **Change:** Expanded the article canvas and headline area, and set the main reading column to approximately 825 pixels on desktop while retaining compact mobile gutters.
- **Reason:** Rahul wanted article pages to use the more comfortable content spacing of the referenced INDmoney article instead of leaving excessive unused space around the story.
- **Behaviour:** Article copy remains centred and readable, while headlines and hero images have more room on larger screens. Mobile spacing remains responsive.

### 2026-09-20 — Left-aligned the article reading canvas

- **Status:** Implemented; refines the article-spacing change above
- **Change:** Reduced the desktop left gutter to 32 pixels and aligned the category, headline, byline, hero and article body to the same edge. Mobile retains a 16-pixel gutter.
- **Reason:** The centred reading column still left too much unused space on the left. Rahul wanted the article to follow the reference page's compact left spacing more closely.
