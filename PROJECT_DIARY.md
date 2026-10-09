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

### 2026-09-23 — Added the article discovery sidebar and collapsible overview

- **Status:** Implemented
- **Layout:** Article pages now use a 56-pixel desktop gutter, a reading column of up to 880 pixels, and a separate discovery sidebar on wide screens. The sidebar moves below the article on smaller screens.
- **What’s covered:** A collapsed section immediately below the hero image is generated from the article’s H2 headings. Its links and headings are present in the server-rendered HTML and jump to the corresponding article sections.
- **Sidebar:** Added the linked company, the existing Kit newsletter form, five recent articles, up to three companies from the same industry, directly linked people, and editor-selected popular articles. Empty or unsupported sections remain hidden.
- **Editorial control:** Added an optional Article promotion field in Sanity. Selecting Popular makes a published article eligible for the Popular articles sidebar; Standard remains the default. This avoids presenting recent stories as popularity data before real analytics exist.
- **Article ending:** Removed duplicate company and person cards from the body and added the Sanity last-updated date plus one contextual Read next article. No public source list is displayed; research URLs remain internal.
- **Reason:** Rahul wanted wider article text, moderate left spacing, useful content on the right, a newsletter conversion point, and stronger discovery without a sidebar table of contents or a public sources section.

### 2026-09-23 — Made spreadsheet article updates identity-safe

- **Status:** Implemented
- **Problem:** Changing an `article_slug` in the workbook created a second Sanity article because the importer previously treated the public slug as the record's identity.
- **Change:** Added a required, permanent `import_id` column to the master article workbook and a hidden `importId` field in Sanity. The importer now finds an existing article by `import_id` first, while still using the slug as a fallback for older records.
- **Editorial rule:** Never edit or reuse an article's `import_id`. Titles, public slugs, article copy and SEO fields may be changed without creating a new record.
- **Performance:** Replaced order-sensitive JSON comparisons with structural equality, so records whose data has not changed are skipped instead of rewritten.
- **Cleanup audit:** Identified five legacy duplicates caused by earlier slug changes: Zomato, Safari Industries, Eternal, Jio Platforms and Policybazaar. These old copies require a one-time deletion; unrelated articles are not included in that cleanup.

### 2026-09-24 — Added launch trust and policy pages

- **Status:** Implemented
- **Change:** Added About, Editorial and Research Policy, Contact, Privacy Policy and Terms of Use pages with page-specific metadata and canonical URLs.
- **Editorial standards:** Published the source hierarchy, verification approach, AI-assistance safeguards, independence rules and correction process that apply to MisterStory content.
- **Newsletter disclosure:** Added a plain-language consent notice and Privacy Policy link immediately below every Kit newsletter form. The Privacy Policy documents the email, referrer and short-lived rate-limiting information currently processed by the site.
- **Discovery:** Added all five pages to the footer and generated sitemap. The existing robots file continues to allow the public site while excluding Studio and API routes.
- **Launch dependency:** `hello@misterstory.in` is now the public contact and privacy address and must be created or forwarded before launch. The legal operator name and a more specific court jurisdiction can be added after the operating entity is finalised.

### 2026-09-24 — Added a reusable article launch audit

- **Status:** Implemented
- **Change:** Added an `audit:articles` command that compares published Sanity articles with the master article workbook. It checks stable identities, duplicate slugs, company and author links, publication dates, article structure and SEO fields.
- **Scope:** The default audit checks published Business Model articles because Strategy publishing is deferred. Optional command flags can inspect one article, include all categories or show articles that passed.
- **Output:** Articles are classified as `PASS`, `REVIEW` or `BLOCKED` in both the terminal and `outputs/audits/article-audit-report.xlsx`. The workbook contains Summary, Blocked, Review, Passed and All articles tabs. Missing live content, missing SEO descriptions and unresolved relationships are launch blockers. Length guidance and lighter structural concerns are review warnings.
- **Source URL policy:** Source URLs remain optional internal research notes. The audit does not require or validate them, and they cannot block an article from launch.
- **Reason:** Rahul wanted a repeatable content-readiness check before making MisterStory public, rather than manually opening every article and spreadsheet row.

### 2026-09-25 — Added global site search

- **Status:** Implemented
- **Change:** Added one search control to the shared public header, so it appears on every page. Suggestions are grouped into Companies, People and Articles, and every result links directly to its destination page.
- **Mobile behaviour:** The compact mobile search button opens a dedicated full-screen search view without crowding the header.
- **Discovery:** Added a `/search` results page for broader searches while keeping the homepage company search as the larger, discovery-focused entry point.
- **Reason:** Rahul wanted visitors to move between research pages without returning to the homepage or opening a directory first.

### 2026-09-26 — Automated article dates and shortened thumbnail titles

- **Status:** Implemented
- **Dates:** Article drafts no longer require a spreadsheet publication date. The first time an article goes live, the importer or Sanity Publish action records `publishedAt`; a later publication containing changed article content records `contentUpdatedAt`. Unchanged spreadsheet imports remain skipped and do not move either timestamp.
- **Display:** Public article pages and article cards show one contextual date: `Published` until the first revision, then `Updated`. The automatic Sanity system timestamp is no longer presented as an editorial update date.
- **Thumbnails:** Added an optional `thumbnailTitle` field and `thumbnail_title` spreadsheet column. It changes only the generated thumbnail; the public article heading and SEO title remain unchanged. Automatic font scaling remains as a fallback when the shorter title is blank.
- **Reason:** Rahul wanted long automatic thumbnails to remain readable and article dates to reflect actual publication and content changes without manual spreadsheet maintenance.
- **Import safety:** Added dedicated `import:articles:check` and `import:articles:publish` commands so Windows cannot silently drop the dry-run or publish mode when forwarding trailing command flags.

### 2026-09-26 — Made thumbnail motifs text-neutral

- **Status:** Implemented
- **Change:** Removed descriptive wording embedded inside generated business-model motifs, including labels such as marketplace, recurring revenue, product portfolio and revenue streams.
- **Preserved:** Article title, company name, Business Model category label, MisterStory branding, colour palette and decorative shapes remain visible.
- **Cache:** Increased the generated-thumbnail version so existing article cards request the updated design instead of retaining cached images.
- **Reason:** A decorative motif can suit the visual composition without accurately describing every company's business model, so the graphics should not make unsupported claims.

### 2026-09-26 — Added article publication time

- **Status:** Implemented
- **Change:** Article bylines now show the precise Published or Updated time in Indian Standard Time alongside the date.
- **Scope:** Directory cards remain date-only to keep the browsing interface compact.
- **Reason:** Rahul wanted readers to see when an article actually went live, not only the calendar date.

### 2026-09-27 — Removed public company-logo dependency

- **Status:** Implemented
- **Change:** Removed logo requests and logo rendering from company-page headers, the company directory and group-company cards. Directory and group cards now use consistent company-initial badges, while the company header uses the reclaimed width for its name and description.
- **Preserved:** Existing logo fields, uploaded Sanity assets and the optional logo importer remain untouched so logos can be restored later without repeating uploads.
- **Reason:** Logos are not part of the current launch workflow, created inconsistent coverage and added avoidable image-loading work.

### 2026-09-27 — Added live audit guidance to the article workbook

- **Status:** Implemented
- **Change:** Added `audit_status` and `audit_warnings` as the final two columns in the master article workbook. Each populated article row now updates automatically to `PASS`, `REVIEW`, or `BLOCKED` and explains missing required fields, duplicate slugs or permanent import IDs, article structure concerns, thumbnail-title length, and SEO-length guidance.
- **Safety:** Audit formulas are prepared for up to 200 rows but are not sent to Sanity. This keeps the workbook responsive while leaving room beyond the current 100 articles. The importer ignores rows that contain formulas but no actual article input, preventing empty records and keeping future workbooks safe.
- **Workflow:** The in-sheet result is an immediate writing aid. The existing `npm run audit:articles` command remains the final pre-publication check because it can compare the workbook with Sanity, validate live references, and confirm publication state.
- **Workbook reliability:** Kept the generated workbook free of Excel table objects and retained normal filters and dropdowns, avoiding the table-repair warning seen in an earlier generated file.
- **Reason:** Rahul wanted problems shown beside each article while editing so bulk updates can be corrected without repeatedly opening a separate audit report.

### 2026-09-27 — Unified company-page articles

- **Status:** Implemented
- **Change:** Replaced the Business Model, Strategy and Related Articles groupings on company pages with one `Articles about [Company]` section and one `Articles` page-navigation link.
- **Behaviour:** Every published Sanity article linked to the company appears in the same section, while each card retains its own category label such as Business Model, Company Story or People & Leadership. Companies without a published article show a clear empty-state message instead of hiding the section.
- **Preserved:** Article URLs, category records, importer fields and company references are unchanged.
- **Reason:** Company pages now support several kinds of editorial coverage, so the page heading should not imply that every linked article is about the business model.

### 2026-09-27 — Removed public person-profile photos

- **Status:** Implemented
- **Change:** Removed the portrait and initial-placeholder block from the public person-page header and expanded the name, role and profile links into the available width.
- **Performance:** Person-page queries no longer request the profile photo because the public page does not render it.
- **Preserved:** The Sanity photo field and uploaded assets remain untouched so portrait support can be restored later without re-uploading images.
- **Reason:** Profile photos are not part of the current launch workflow and would create the same incomplete-coverage problem as company logos.

### 2026-09-27 — Made the Authors area publicly discoverable

- **Status:** Implemented
- **Directory:** Added `/authors` with search by author name, role, education or experience, plus published-article counts and links to the existing individual author profiles.
- **Discovery:** Added Authors to the desktop/mobile header, footer, global search suggestions, full search results and sitemap.
- **Profiles:** Existing `/authors/[slug]` pages remain the canonical author pages and continue to show verified biography, education, experience, LinkedIn and published work.
- **Reason:** Individual author pages already existed but lacked a public directory and navigation entry, making them difficult to find except through an article byline.

### 2026-09-27 — Simplified author presentation

- **Status:** Implemented
- **Profiles:** Removed the public author portrait and initial-placeholder block, expanded the profile header text, and stopped requesting the image in the public author query. Sanity image fields and assets remain preserved.
- **Directory:** Removed the repeated `MisterStory author` label and redundant `View author profile` instruction because the complete card is already an obvious link.
- **Ordering:** Authors are now ranked by the number of published articles, with alphabetical ordering when article counts are equal.
- **Reason:** The author directory should surface active contributors first and keep every card concise without relying on incomplete image coverage.

### Post-launch — Improve newsletter sender trust

- **Status:** Deferred until after the public website launch
- **Planned flow:** After Kit confirmation, show a branded success page with an `Add MisterStory to contacts` vCard download and a prepared `Send a quick hello` email link.
- **Optional guidance:** Explain how Gmail users can move the first newsletter to Primary. Do not claim that the website can automatically favourite, trust or whitelist the sender.
- **Dependency:** Configure and verify the final MisterStory sending address and domain authentication before building this flow.
- **Reason:** This can improve subscriber onboarding and email deliverability, but it is not required for the initial launch.

### 2026-09-27 — Updated article SEO descriptions

- **Status:** Implemented in the article importer workbook
- **Change:** Added the supplied SEO meta descriptions for 30 company articles, from Ola Electric and PB Fintech through HAL and Solar Industries.
- **Preserved:** Article slugs, titles, bodies, publication statuses, spreadsheet formulas, filters, frozen rows, dropdowns and audit sheets remain unchanged.
- **Verification:** The workbook passed structural checks, formula-error checks and a check-only Sanity importer run across all 100 article rows.
- **Reason:** The descriptions now summarize the specific revenue drivers and financial context covered by each article instead of relying on shorter generic descriptions.

### 2026-09-28 — Made homepage topics reflect published coverage

- **Status:** Implemented
- **Change:** Removed empty homepage topics such as Moats, Pricing Power and Brand Building. The section now highlights Business Models, Fintech, Distribution, Electric Vehicles, Automotive, Artificial Intelligence, Space Technology and Food Delivery.
- **Behaviour:** Every topic displays its current matching article count and is automatically hidden when no published article matches it.
- **Reason:** Homepage topic links should lead directly to useful collections rather than empty search results or themes that MisterStory has not covered yet.

### 2026-09-28 — Simplified the published author roster

- **Status:** Implemented
- **Change:** Added a clearly visible, confirmation-protected Unpublish action to Author documents in Sanity Studio. Unpublishing retains the author draft instead of deleting the record.
- **Publishing decision:** Rahul remains the only published author for now. Articles assigned to other authors are reassigned to Rahul before those author profiles are unpublished, preventing broken article bylines and strong-reference errors.
- **Reason:** MisterStory should publicly show only the author who is currently active, while retaining the other prepared author records for possible later use.

### 2026-09-28 — Extended generated thumbnails to every article category

- **Status:** Implemented
- **Change:** The automatic MisterStory thumbnail fallback now applies to every published article category, not only Business Model articles. The thumbnail badge uses the article's actual category, and the category, company and article slug contribute to stable visual variation.
- **Priority:** A custom social image remains first choice on article cards, followed by a custom main image. The generated thumbnail appears only when neither custom image is available. On the article page, a custom main image remains the first choice.
- **Reason:** Every article needs a useful visual without requiring manual thumbnail production, while custom editorial artwork must continue to override automation.

### 2026-09-28 — Centralized the temporary public contact address

- **Status:** Implemented
- **Change:** The Contact and Privacy pages now read the public email address from one shared configuration file. `rahul13asati@gmail.com` is the temporary launch address.
- **Future switch:** When `hello@misterstory.in` is ready, changing the shared value once will update every public use of the address.
- **Reason:** Email forwarding should not delay launch, while centralization avoids searching through several pages during the later domain-email transition.

### 2026-09-29 — Enabled privacy-friendly website analytics

- **Status:** Implemented
- **Change:** Enabled Vercel Web Analytics on the existing Hobby plan and added its official Next.js tracking component to the root layout.
- **Behaviour:** Production page views and anonymous visitor information will appear in the Vercel Analytics dashboard after the updated website is deployed and visited.
- **Privacy:** The integration uses Vercel's cookie-free, anonymized Web Analytics and does not add an advertising tracker.
- **Reason:** Rahul needs basic launch visibility into traffic, popular pages, referrers, countries, devices and browsers.

### Post-launch — Add Google Analytics 4

- **Status:** Deferred until after the initial launch
- **Planned setup:** Create a MisterStory GA4 web data stream for `https://misterstory.in`, store its `G-...` Measurement ID in Vercel, add consent-aware tracking, update the privacy information, deploy through beta and verify the Realtime report.
- **Preserved:** Keep Vercel Web Analytics enabled as the lightweight, cookie-free source for basic page, referrer, country and device reporting.
- **Reason:** GA4 will provide deeper acquisition, campaign, user-journey and newsletter-conversion reporting, but it is not necessary for the website to launch.

### 2026-09-29 — Added the first MisterStory logo system

- **Status:** Implemented
- **Change:** Replaced the plain header and footer text with a reusable white `MisterStory` wordmark on a near-black rounded background. Added a matching stacked-text square mark for browser and mobile icons.
- **Files:** The reusable vector artwork lives in `public/brand`, while Next.js serves generated favicon, general icon and Apple touch-icon assets from the root app segment.
- **Reason:** The public website needed a consistent visual identity instead of relying only on unstyled text branding.

### Post-launch — Operating roadmap and deferred housekeeping

- **Status:** Planned
- **Daily publishing routine:** Define a sustainable schedule for researching, drafting, checking, importing and publishing articles and shorter news posts. Include ownership, quality checks and a simple daily/weekly target rather than publishing without review.
- **Caching and indexing:** Document how Sanity, Next.js and Vercel caching affect article updates, how revalidation works, and how this differs from Google crawling and indexing. Create one reliable publish/update workflow so fresh articles and corrections appear promptly without unnecessary cache clearing.
- **Content expansion:** Continue populating the site with basic company profiles, people profiles and articles. Prioritize complete, interconnected records over isolated pages.
- **Authority and traction:** Build authoritative, source-backed evergreen articles alongside timely business-news coverage. Use clear original analysis, internal linking, author attribution and update dates to improve trust and search visibility.
- **Monetisation:** Evaluate Google AdSense or a suitable alternative only after the site has enough original content, stable traffic, policy compliance and an acceptable reading experience. Define restrained ad placements before enabling ads.
- **Privacy housekeeping:** Update the Privacy Policy so it accurately explains the currently enabled, cookie-free Vercel Web Analytics.
- **Contact housekeeping:** Replace the temporary Gmail contact address with `hello@misterstory.in` after domain email or forwarding is configured.
- **Reason:** These are the next recurring and post-launch tasks after the core website, production domain, sitemap, Search Console, analytics and first logo were completed.

### 2026-09-30 — Added site-wide structured data

- **Status:** Implemented and production-build verified
- **Change:** Added Schema.org JSON-LD for the MisterStory website and publisher, articles, companies, people, authors and page breadcrumbs.
- **Data source:** The markup reuses existing Sanity fields, canonical URLs, publication/update dates, article-company links and profile relationships. It does not require a new spreadsheet or extra CMS fields.
- **Editorial choice:** Evergreen stories use the `Article` type rather than `NewsArticle`. A search action was not added because Google no longer shows the sitelinks search-box feature.
- **Reason:** Structured data helps search engines understand page meaning, authorship, publishing relationships and navigation. It supports eligibility for applicable search enhancements but does not guarantee rankings or rich results.
- **Follow-up:** After deployment, test representative article, company and people URLs in Google Rich Results Test and Schema.org Validator.

### 2026-09-30 — Improved company editing, overview formatting and dark-mode safety

- **Status:** Implemented
- **Company overviews:** Spreadsheet imports now convert Markdown headings, paragraphs, emphasis, links, lists and quotes into real Portable Text blocks. The company page renders those blocks with consistent nested heading and body styles.
- **Existing content:** Audited the current Sanity records before deployment. The inspected company content already uses structured heading blocks, so no bulk content rewrite was required.
- **Studio usability:** Added a visible Edit action to every row in the custom Companies table; the company name remains an edit link as well.

### 2026-10-01 — Simplified article and company editing in Sanity Studio

- **Status:** Implemented locally, pending deployment and visual review
- **Restore point:** Tagged the previous code as `sanity-layout-before-2026-10-01` so the complete earlier Studio layout can be restored if required.
- **Articles:** Reorganized the form into Writing, Connections, and SEO & publishing tabs. Writing is the default and shows only the title, optional thumbnail title, and article body.
- **Companies:** Reorganized the form into Overview, People & group, and SEO & media tabs. Overview is the default and keeps the company overview in the main editing workflow.
- **Writing space:** Removed the duplicated large document-preview heading from article and company forms. Added the built-in Portable Text full-screen shortcut guidance (`Ctrl+Enter`) directly beside both rich-text editors.
- **Preserved:** No Sanity fields, document values, importer mappings, public queries, or URLs were changed. Field groups affect only the Studio editing interface.
- **Reason:** Rahul wants article and company content to occupy most of the editor while secondary relationships and SEO fields remain available without making the primary writing screen long and cluttered.
- **Theme behaviour:** MisterStory now explicitly declares a light colour scheme instead of changing only the global canvas in device dark mode and leaving light components mismatched.
- **Reason:** Company information must remain structured and readable, editing controls must be discoverable, and device preferences must not make navigation or headings disappear.

### 2026-09-30 — Standardized generated article thumbnails for discovery

- **Status:** Implemented
- **Change:** System-generated article thumbnails now render at `1200×675`, a true 16:9 ratio, and their cache version was increased so existing articles receive the new output automatically.
- **Display:** Generated images retain 16:9 on article cards and article hero sections instead of being cropped back to the former ratio. Article-card image slots now use a consistent 16:9 presentation.
- **Crawling:** The generated-thumbnail endpoint is no longer hidden by the general `/api/` robots rule. Search and newsletter API routes remain blocked from crawling.
- **Scope:** Custom images uploaded through Sanity are not regenerated or modified.
- **Reason:** Large, crawlable 16:9 images provide a stronger fallback for Google Discover, social previews and article browsing while preserving editorial overrides.

### 2026-09-30 — Improved homepage image loading

- **Status:** Implemented
- **Change:** The four article thumbnails visible in the homepage hero are now preloaded so the browser starts downloading them immediately. Images farther down the page remain lazy-loaded.
- **Data caching:** Homepage company and article queries now reuse published Sanity results for up to 60 seconds instead of waiting for fresh network requests on every visit.
- **Publishing impact:** Newly published or edited content can take up to approximately one minute to appear on the homepage; individual content pages retain their existing update behaviour.
- **Reason:** Live measurements showed generated images were already small, while request timing and late browser discovery were the larger causes of visible loading delay.
# 1 October 2026 - Clear article publication states in Sanity

- Replaced the default Articles list with a searchable article manager.
- Split articles into mutually exclusive views: Draft only, Live + unpublished changes, and Published/current.
- Added plain-language status labels so a live article with pending edits is not mistaken for a duplicate article.
- Confirmed the current dataset contains 104 articles: 0 draft-only, 102 live articles with unpublished changes, and 2 published/current articles.
- No drafts were published or discarded during this change.
# 5 October 2026 - Sitemap index for content-type monitoring

- Replaced the single combined sitemap with a sitemap index at the existing `/sitemap.xml` address.
- Added separate sitemaps for static pages, companies, articles, people, and authors/topics.
- Kept Search Console and `robots.txt` pointed at `/sitemap.xml`, so the existing submission remains valid.
- Child sitemaps include only published Sanity documents with valid slugs and retain Sanity update dates.
- Added temporary-error responses for Sanity outages so crawlers do not mistake a failed fetch for an intentionally empty sitemap.
# 5 October 2026 - RSS feed for recent articles

- Added an RSS 2.0 feed at `/feed.xml` containing the 50 most recently published or meaningfully updated live articles.
- Included article URLs, first-published dates, update dates, summaries, authors, categories and custom or generated thumbnails.
- Excluded Sanity drafts by using the published content perspective.
- Added automatic RSS discovery metadata, a footer link and a second Sitemap directive in `robots.txt`.
- Kept the RSS feed separate from the complete XML sitemap index; the feed represents recent changes rather than the complete URL inventory.

# 5 October 2026 - Search results excluded from indexing

- Added `noindex, follow` metadata to `/search` and every query variation such as `/search?q=zomato`.
- Search engines can continue following company, people, author and article links shown in results, but the result pages themselves should not appear in Google.
- Kept public company, people, author and article pages indexable.

# 6 October 2026 - Patched Next.js security vulnerabilities

- Upgraded `next` and `eslint-config-next` together from `16.3.2` to `16.3.8`.
- Removed the critical Next.js findings reported by the dependency security audit, including the issue affecting generated images.
- Confirmed the production build and TypeScript checks pass on the patched version.
- Lint continues to pass with the two previously known non-blocking inline-image performance warnings.
- Did not run `npm audit fix --force`; remaining dependency findings are being handled separately to avoid unsafe or breaking Sanity changes.

# 6 October 2026 - Canonical URLs for primary directories

- Added explicit canonical metadata for the homepage, Companies, People and Articles directories.
- Confirmed the Authors directory already had its canonical URL and preserved it.
- Filtered and searched directory URLs now point search engines to their clean directory URL without changing the visible page or navigation.
- Reason: consolidate ranking signals and reduce the chance that query-parameter variations are treated as duplicate standalone pages.

# 6 October 2026 - Companies heading and homepage navigation

- Changed the existing Companies directory title from an H2 to the page's single H1 without adding or repeating visible copy.
- Preserved the existing People, Authors and Articles headings because those directories already use an H1.
- Added Home as the first item in the shared desktop and mobile navigation; the MisterStory logo continues to link home as a second shortcut.
- Reason: give the Companies directory a clear primary heading for visitors and search engines while making homepage navigation explicit.

# 6 October 2026 - Merged duplicate Jamsetji Tata profiles

- Retained `jamsetji-tata` as the single person profile and linked it to both Tata Power and Tata Sons.
- Preserved the stronger biography and added the official Tata source URL to the retained spreadsheet profile.
- Removed the obsolete `jamsetji-nusserwanji-tata` Sanity profile and its superseded Tata Power relationship only after verifying the replacement relationships.
- Added a permanent redirect from `/people/jamsetji-nusserwanji-tata` to `/people/jamsetji-tata` so old links and search signals reach the retained page.

# 6 October 2026 - Improved remaining article image rendering

- Replaced the two remaining ordinary HTML image elements with Next.js Image components on article pages and company-page article cards.
- Preserved manually uploaded Sanity images as the first choice and automatic generated thumbnails as the fallback.
- Added explicit responsive sizes and stable aspect-ratio containers to reduce layout movement and avoid downloading unnecessarily large display images.
- Kept Next.js image proxy optimization disabled, so Sanity images continue loading directly from its CDN without restoring the earlier private-IP proxy error.

# 6 October 2026 - Visible breadcrumbs on detail pages

- Added compact, mobile-scrollable breadcrumbs to company, people, author, article and topic detail pages.
- Matched visible breadcrumb links to the existing structured breadcrumb data used by search engines.
- Added missing BreadcrumbList structured data to topic pages.
- Kept directory pages uncluttered because their location is already clear from the page heading and global navigation.

# 6 October 2026 - Limited company-page people previews

- Limited the initially visible "People behind the company" section to four profiles on every company page.
- Added a "View all" control whenever a company has more than four linked people, with an option to collapse the expanded list again.
- Preserved every person and company relationship in Sanity; the limit changes only the initial page presentation.
- Reason: keep company pages concise while retaining access to complete leadership and founder information.

# 7 October 2026 - Article image crop and compression tool

- Added an optional image optimizer inside the Sanity Hero Image and Social Image fields.
- The tool centre-crops by default, supports left/centre/right and top/centre/bottom focal choices, resizes to 1200×675, and compresses the result as a JPG before uploading it to Sanity.
- Preserved Sanity's standard image selector and hotspot controls so editors can continue using the normal workflow when required.
- Existing images are unchanged; the optimizer applies only when an editor chooses a new file through the new control.
- Status: Implemented.

# 9 October 2026 - Prevented identical article drafts

- Audited every published article with an unpublished Sanity draft before changing any content.
- Found 101 drafts identical to their live articles, three with only internal metadata differences, and one genuine thumbnail-title update.
- Updated the spreadsheet importer so an unchanged published article is skipped instead of receiving an identical draft when `--publish` is omitted.
- Prevented query-only and Sanity system fields such as `slugValue` and `_system` from being copied back into article documents.
- Publishing or retaining genuine editorial drafts remains unchanged.
- Status: Implemented.

# 2026-10-09 — Generated thumbnails can be stored permanently in Sanity

- **Status:** Implemented
- Added an idempotent thumbnail-materialization command that renders the existing generated article design once, uploads the resulting `1200×675` image to Sanity, and attaches it as the article's main image.
- Existing manual main images are always preserved and skipped. If an article has an unpublished draft, the same image reference is applied to both the published document and its draft so a later publish cannot accidentally remove it.
- The dynamic thumbnail route remains available only as a fallback for new articles until the materialization command is run.
- **Reason:** Direct Sanity CDN images avoid regenerating thumbnails during page requests and should provide faster, simpler image delivery.

# 2026-10-09 — Corrected a malformed Quanfluence article URL

- **Status:** Implemented
- Corrected the published Quanfluence article slug from `quanfluence-quantum-computer-funding   Copy` to `quanfluence-quantum-computer-funding` without publishing its other draft changes.
- Added a permanent redirect from the malformed encoded URL to the corrected article URL so previously shared links remain usable after deployment.

# 2026-10-09 — Enforced article slug validation at publishing boundaries

- **Status:** Implemented
- Shared strict slug validation between the article schema, custom Studio Publish action, Excel importer, and audit. Invalid raw input is rejected rather than trimmed; final newlines are rejected too.
- The custom Publish action now waits for validation and blocks schema errors before changing dates or publishing. Imports validate all selected rows before writes and recheck the final document slug.
- **Reason:** The user requested prevention of malformed published article URLs, including the Quanfluence Copy suffix.
- Confirmed live Quanfluence already uses `quanfluence-quantum-computer-funding`; no content mutation was needed. Preserved the pending permanent redirect and existing config. No direct Google Sheets publisher or publishing API exists in this checkout.
- Website/Studio deployment is still required for these guards and the pending redirect. No unrelated changes were published.
# 2026-10-09 — Article tables can be pasted directly into Sanity

- **Status:** Implemented
- The Sanity article-body editor now detects tables copied from Excel, Google Sheets, Word and Google Docs and converts them into structured table blocks on paste.
- Editors do not need to create rows or cells manually. The first pasted row is treated as the table header, while captions and the header-row setting remain editable in Sanity.
- Article pages render these tables responsively with horizontal scrolling on small screens.
- The spreadsheet article importer has not yet been changed to detect Markdown tables; this phase covers direct manual pasting in Sanity only.
- **Reason:** Rahul wants a low-friction workflow where a complete table can be copied and pasted into an article without using table-building controls.

# 2026-10-09 — Added AI-readable site and company directories

- **Status:** Implemented.
- Added `/company-directory.txt`, an automatically generated list of every published company, its canonical MisterStory URL, and its industry when available.
- Added `/llms.txt`, a concise Markdown guide to MisterStory's primary directories, machine-readable resources, editorial standards, and policies.
- The company directory reads published Sanity records and refreshes automatically, so new published company pages do not require manual maintenance.
- Kept the existing XML sitemaps unchanged for search engines. The plain-text directory primarily supports editorial AI workflows, while `llms.txt` is an experimental aid for compatible AI agents and does not promise rankings or citations.
- **Reason:** AI writing tools sometimes fail to parse XML sitemaps. These routes provide simpler verified URLs without misrepresenting an emerging convention as a guaranteed discovery signal.

# 2026-10-09 — Tightened article publishing requirements

- **Status:** Implemented.
- Company references are now optional because some useful articles discuss markets, policies, technologies, or concepts without substantially covering a specific company.
- New manually created articles default to the published Rahul Asati author record. The spreadsheet importer also uses the `rahul` author slug when `author_slug` is blank.
- The Studio Publish action remains hidden until the article has a title, valid slug, meaningful body, category, author, and SEO meta description, with schema validation providing the field-level explanation.
- Added an optional comma-separated SEO Keywords field with duplicate and excessive-keyword warnings. Keywords are exposed in page metadata and Article structured data, while the article title remains the fallback when no separate SEO title is supplied.
- Updated the spreadsheet importer to accept optional `seo_keywords` (or `keywords`) and to permit a blank `company_slug`. Updated the audit so company-free articles are no longer treated as publishing failures.
- **Reason:** Publishing controls should prevent incomplete public articles without forcing irrelevant company relationships or unnecessary SEO fields.

# 2026-10-09 — Faster published-content discovery and cache refresh

- **Status:** Implemented and active in production.
- Published-content sitemaps, the company directory and the RSS feed now read the current published Sanity dataset on every request instead of retaining one-hour or longer cached copies.
- Added a signed `/api/revalidate` endpoint that can refresh public pages and indexes immediately after Sanity publishes or changes a company, person, article, author or category.
- Configured the matching production-only Vercel secret and enabled Sanity webhook. Ordinary publishing and unpublishing now trigger the refresh automatically, so a separate Postman cache-clear request is not needed.
- Drafts remain excluded from public pages and machine-readable discovery files.
- **Reason:** Newly published and updated content should become visible to visitors and crawlers quickly without sacrificing the site's normal cached page speed.
