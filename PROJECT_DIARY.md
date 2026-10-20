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

# 2026-10-09 — Meaningful article sitemap modification dates

- **Status:** Implemented.
- Article sitemap entries now use `contentUpdatedAt` for meaningful editorial revisions, fall back to `publishedAt` for the initial publication, and use Sanity's `_updatedAt` only when neither editorial date exists.
- Company, people, author and topic sitemap entries continue using their Sanity modification time because those document types do not have a separate editorial-update field.
- **Reason:** Sitemap `lastmod` should communicate substantive article publication or revision dates instead of changing for insignificant CMS metadata activity.

# 2026-10-10 — Prevented stretched company-facts cards

- **Status:** Implemented locally.
- Top-aligned the company overview grid so the shorter Company facts card no longer stretches to match a long company overview.
- Made the compact facts card sticky on desktop so useful company information remains visible while a reader moves through a long overview; mobile pages retain the normal stacked layout.
- Applied the change in the shared company template, so it covers Swara Baby Products and every other company page without content-specific editing.
- **Reason:** Long company overviews previously produced a tall, mostly empty facts card that looked unfinished and wasted the right-hand column.

# 2026-10-10 — Prevented stretched person-profile sidebars

- **Status:** Implemented locally.
- Top-aligned the person biography grid so Associated companies remains a compact card instead of stretching to the height of a long biography.
- Made the connections card sticky on desktop and allowed biographies with no associated companies to use the full content grid instead of reserving an empty sidebar column.
- Applied the change in the shared person-profile template, so all current and future people pages inherit it automatically.

# 2026-10-10 — Blocked incomplete people imports before Sanity writes

- **Status:** Implemented locally.
- The company importer now requires every selected person in the People sheet to have a matching `person_slug` row in Person Profiles.
- Validation runs before any Sanity read or write. If profiles are missing, the importer stops, lists every missing person name and slug, and confirms that no Sanity records were written.
- Filtered company or person imports validate the selected import scope, while an unfiltered bulk import validates everyone in the workbook.
- **Reason:** A People relationship row should not silently create a public person page when its corresponding profile record has not been prepared.

# 2026-10-10 — Brought article content higher on the page

- **Status:** Implemented locally.
- Removed the visible article-category eyebrow from individual article pages while retaining category data for cards, filters, related content, topic pages and structured metadata.
- Reduced top padding, title size and the gaps around article metadata and the hero image.
- Shortened the desktop hero presentation to a 2:1 frame while retaining the mobile 16:9 frame.
- Tightened the collapsed What's covered card and the gap before the article body so readers reach the first paragraph substantially earlier.
- Preserved breadcrumbs, the article H1, author, reading time and publication/update time.

# 2026-10-10 — Compacted company and person page introductions

- **Status:** Implemented locally.
- Removed the decorative Company Deep Dive and Person profile eyebrow labels while retaining breadcrumbs and the primary H1 headings.
- Reduced hero padding, desktop title sizes and the gaps around descriptions, role details, profile links and company facts.
- Tightened the company section-navigation offset, person navigation height and spacing before each page's main overview content.
- Preserved company industry/founded badges, person role and external profile links, and all existing SEO and structured data.

# 2026-10-11 — Created a scalable financial-data entry workbook

- **Status:** Created; no website importer or database connection has been added yet.
- Added a separate `financial-data.xlsx` workbook so company financial observations do not make the existing company and people workbook harder to manage.
- Uses one row for one company, metric, reporting period and accounting basis instead of creating separate company or year sheets.
- Added company and metric dropdowns, standard choices for periods, currencies, scales, accounting basis, data type and review status.
- Added automatic conversion from reported units such as lakhs and crores into base units, stable record keys, required-field checks and duplicate warnings.
- Included the current company-slug list from `companies.xlsx`, a reusable metric list, filters, frozen identifying columns and a concise entry guide.
- **Reason:** Rahul needs a manageable interim workflow for collecting financial data across many companies before PostgreSQL becomes the permanent structured-data store.

# 2026-10-11 — Simplified company and people overview headings

- **Status:** Implemented locally.
- Replaced the repeated `{company name} at a glance` heading and its separate eyebrow with one consistent `Company overview` H2 on every company page.
- Replaced `About {person name}` and the separate `Background` eyebrow with one consistent `Biography` H2 on every people page.
- Updated the first people-page section-navigation label from `About` to `Biography` while preserving its existing anchor.
- **Reason:** The company or person name already appears as the page H1, so repeating it immediately below added visual noise without improving navigation or meaning.

# 2026-10-12 — Strengthened Google favicon compatibility

- **Status:** Implemented locally.
- Kept the established black-and-white MisterStory icon and its stable root URLs.
- Rebuilt `favicon.ico` as a multi-size icon containing 48, 16, 32, 96 and 192 pixel variants, with the Google-recommended 48-pixel version listed first.
- Retained the existing 512×512 PNG icon and 180×180 Apple touch icon used by modern browsers and devices.
- Added a repeatable favicon-generation script so future brand changes can rebuild the browser icon from the canonical 512×512 source without manual conversion.
- **Reason:** Google had already discovered the MisterStory icon, but the first favicon offered by the site contained only a 32×32 image. The multi-size file removes that remaining technical weakness while preserving the approved design.

# 2026-10-12 — Added immediate feedback when opening articles

- **Status:** Implemented locally.
- Added a lightweight loading view for individual article routes, including a clear screen-reader status and a layout-shaped skeleton for the title, hero image, article body and sidebar.
- The loading boundary allows Next.js to partially prefetch dynamic article routes and display feedback immediately while Sanity-backed article data finishes loading.
- **Reason:** Article-card clicks from company pages could take several seconds without changing the screen, making a working navigation look unresponsive.

# 2026-10-12 — Centred article layouts across desktop sizes

- **Status:** Implemented locally.
- Added the same centred `max-w-7xl` boundary used by the site header and supporting article sections to the main article header, hero, body and sidebar layout.
- Replaced the fixed 880-pixel article column with a flexible main column and a stable 320-pixel sidebar at extra-large widths.
- Preserved the existing single-column tablet and mobile layout.
- **Reason:** On wide desktops and at reduced browser zoom, the fixed columns stayed attached to the left edge and left a disproportionately large empty area on the right. The shared article template now distributes spare space evenly without requiring visitors to change device settings.

# 2026-10-13 — Standardised links inside rich text

- **Status:** Implemented locally.
- MisterStory links inside article bodies, company overviews and person biographies now use dark underlined text and remain in the same browser tab.
- External links remain amber and open in a new tab with safe relationship attributes.
- Absolute `https://misterstory.in/...` links imported from spreadsheets are converted to internal Next.js navigation at render time.
- **Reason:** Imported internal links looked like red warning text on person and company pages and behaved like external links, even though they led to another MisterStory page.

# 2026-10-14 — Improved Sanity article-editor responsiveness and writing space

- **Status:** Implemented locally.
- Stopped the custom Articles directory from downloading and rebuilding its complete list after every article mutation or autosave.
- Added an explicit `Refresh list` control, loading feedback and a recoverable error state to the Articles directory.
- Added a prominent `Focus writing` control above the article body. It opens Sanity's full-screen Portable Text editor while preserving headings, links, lists and the existing mixed text-and-table paste support.
- Increased the normal article-body workspace height so longer content remains easier to read even outside full-screen mode.
- **Reason:** Editing could feel unresponsive because every keystroke-triggered autosave caused an unrelated full-list request, while the main writing area offered too little visible space for reviewing long articles.

# 2026-10-14 — Bulk-linked companies inside people biographies

- **Status:** Applied to the main `companies.xlsx` workbook; a recoverable pre-change backup is stored under `outputs/people-linking`.
- Scanned every biography in `Person Profiles` against the canonical company names and slugs in the `Companies` sheet.
- Added 248 internal MisterStory company links across 214 people profiles, linking only the first exact mention of each company and applying no more than five internal company links per biography.
- Preserved existing Markdown links, skipped headings, processed longer company names before shorter names and avoided partial-word matches.
- Added `internal_links_added` and `internal_link_notes` audit columns to `Person Profiles` so each automatic change can be reviewed in Excel.
- Confirmed that all generated company slugs exist in the workbook and that the current people importer can convert these absolute Markdown links into Sanity Portable Text links.
- **Reason:** Company references in people biographies should lead readers directly to the relevant company profile, while Excel remains the source of truth so future imports do not remove those links.

# 2026-10-14 — Added a temporary draft-article staging workflow

- **Status:** Implemented locally.
- Created `outputs/article-importers/temporary-draft-articles.xlsx`, a focused 100-row staging workbook with the established article fields, category dropdowns, Rahul Asati as the default author, a locked draft status and simple readiness checks.
- Added `npm run import:draft-articles:check` for a no-write preview and `npm run import:draft-articles` for creating or updating drafts.
- Added a guarded `--draft-only` importer mode that cannot be combined with `--publish` and always treats workbook rows as drafts regardless of the status cell.
- Documented the handoff rule inside the workbook: after confirming the Sanity draft, remove its Excel row before making manual Sanity edits. Removing a row never deletes the Sanity document; it only stops future spreadsheet updates.
- Added Results and Economy aliases to the article importer so those category names resolve to their lowercase category slugs.
- **Reason:** Rahul needs a disposable intake queue for draft articles without allowing later bulk spreadsheet runs to overwrite editorial changes made directly in Sanity.

# 2026-10-14 — Made temporary draft imports slug-safe

- **Status:** Implemented locally.
- Made `import_id` optional only in the temporary `--draft-only` workflow; the regular long-term article importer still requires it.
- Added a full preflight check against both published articles and Sanity drafts. If any staging row uses an existing article slug, the entire import stops before writing anything and identifies the row, slug and existing document state.
- Simplified the temporary workbook at `outputs/article-importers/temporary-draft-articles-safe.xlsx` by removing `import_id` and updating its readiness formulas and instructions around the one-time Sanity handoff workflow. The npm draft commands now use this revised file because the original workbook was open and locked during the replacement.
- Preserved the existing staged article and created a recoverable backup before rebuilding the workbook.
- **Reason:** Temporary rows are deleted after their drafts reach Sanity, so a separate spreadsheet identity is unnecessary. A strict duplicate-slug error is safer than silently updating an existing article.

# 2026-10-15 — Added a read-only company import check

- **Status:** Implemented locally.
- Added `npm run import:companies:check` to validate `companies.xlsx` and compare company, person and related records with Sanity without creating, patching or replacing any document.
- The check reports how many companies and people would be created, updated or left unchanged, plus changes to company roles, funding rounds, timeline events and metrics.
- Added `npm run import:companies` as the matching full-import command after the check succeeds.
- The first full check correctly blocked the batch because one company row references the missing parent slug `infibeam-avenues`.
- **Reason:** Large company batches need a safe preview that catches workbook and relationship problems before any partial Sanity update can occur.

# 2026-10-15 — Prevented oversized company-role document IDs

- **Status:** Implemented locally.
- Updated the company importer to keep existing short related-record IDs unchanged while shortening any ID longer than Sanity's 128-character limit.
- Oversized IDs now retain a readable prefix and receive a stable hash suffix, so rerunning the same Excel import addresses the same Sanity record instead of creating duplicates.
- Verified the previously failing Fractal Analytics role in dry-run mode; its generated ID is now valid and exactly 128 characters.
- **Reason:** Long combinations of company slug, person slug, relationship and job title could exceed Sanity's document-ID limit and stop the import after company and person records had already been processed.

# 2026-10-15 — Separated homepage editorial placement from article imports

- **Status:** Implemented locally.
- Added a dedicated Homepage Settings singleton in Sanity for selecting one main Featured Story and up to three supporting featured stories.
- Rebuilt the homepage article flow into Featured Story, How Companies Make Money, Funding & Deals and Latest Stories sections.
- Business-model and funding sections are populated automatically by article category, while Latest Stories excludes anything already shown above it.
- Added cross-section deduplication so one article does not occupy several homepage sections at the same time.
- Added `Funding News`, `funding-news` and `Funding & Deals` importer aliases for the new funding category workflow.
- Kept all homepage placement fields outside the article spreadsheet importer, so large article imports cannot displace the manually selected Featured Story.
- **Reason:** Publishing many similar articles should expand the relevant category shelf without disrupting the homepage's main editorial choice.
- Placed Funding & Deals before How Companies Make Money so timely capital news appears before the larger evergreen business-model library.
- Excluded the complete Funding News category from Latest Stories so funding coverage remains contained in the dedicated Funding & Deals section.

# 2026-10-17 — Strengthened navigation between people and articles

- **Status:** Implemented locally.
- Replaced the generic people recommendations on person profiles with up to six founders and leaders connected through the same company-role records.
- Related-person cards now identify the company connection that caused each recommendation.
- Replaced the single heuristic Read Next card with chronological Previous Article and Next Article navigation across published stories.
- Both features use existing Sanity references and published article ordering, so no spreadsheet fields or manual relationships were added.
- **Reason:** Internal links should guide readers through genuinely connected people and provide predictable movement between neighbouring articles.

# 2026-10-17 — Expanded article-page discovery lists

- **Status:** Implemented locally.
- Increased the Recent Articles sidebar limit from five to ten published stories.
- Increased the Popular Articles sidebar limit from three to ten stories marked popular in Sanity.
- The current article remains excluded from both lists.
- **Reason:** Longer discovery lists create more useful internal navigation from every article page.

# 2026-10-17 — Added industry discovery and smarter related stories

- **Status:** Implemented locally.
- Company pages now show up to six other companies from the same industry, excluding the current company and companies already displayed in its group section.
- Article-card data now includes lightweight company, person and concept identifiers for relationship scoring.
- Replaced separate company-only and category-only article recommendations with one ranked Related Stories section containing up to six articles.
- Recommendation weights prioritise shared companies, followed by shared people, shared concepts and finally the same article category; publication order breaks equal scores.
- **Reason:** Internal recommendations should favour meaningful entity relationships while still providing useful category-based discovery when richer references are unavailable.

# 2026-10-17 — Completed the first website and Studio performance pass

- **Status:** Implemented locally and verified with a production build.
- Enabled Sanity's CDN for public published-content reads; importers, audits and sitemap generation continue using the uncached API where immediate consistency matters.
- Replaced the full 131-article catalogue request on every article page with targeted requests for ten recent stories, ten popular stories, up to forty relevant candidates for ranking, and the neighbouring articles.
- Preserved the existing Related Stories scoring, Previous/Next navigation, server-rendered article content, canonical URLs and crawlable internal links.
- Replaced `no-store` on the main Articles, Companies, People, Authors and Topic directory queries with a 60-second cache fallback. The signed Sanity webhook still invalidates the site immediately after content changes.
- Added published-content caching to company, person and author profile queries.
- Removed the Company Manager's mutation subscription, which previously reloaded every company whenever Sanity autosaved an edit. Added an explicit Refresh List button and visible error handling instead.
- Kept sitemap queries on Sanity's uncached API so newly published canonical URLs remain immediately available to crawlers.
- Verified linting, the Next.js production build, article navigation sections, primary H1s, canonical tags, indexability and the 131-article XML sitemap.
- **Reason:** Public pages should reuse fast cached content and fetch only the records they display, while publishing, sitemap discovery and Studio editing remain reliable.

# 2026-10-17 — Verified production cache refresh and completed webhook coverage

- **Status:** Implemented in the live Sanity project; no deployment required for the webhook setting.
- Verified that the enabled production webhook targets `https://misterstory.in/api/revalidate` and excludes drafts and release versions.
- Sent a signed, content-free test using the webhook's existing secret; production returned HTTP 200 and confirmed cache revalidation. An unsigned request returned HTTP 401. Secrets were not printed, rotated or saved in the repository.
- Inspected Sanity's actual delivery history and confirmed recent article, company and person changes successfully returned HTTP 200 from production.
- Extended the existing webhook filter to also cover industries, concepts, company-person roles, funding, timelines, metrics, Homepage Settings and SEO Settings. These referenced records also affect cached public pages.
- **Reason:** The user requested verification of the complete CDN/publication refresh connection, including the deployed secret and enabled Sanity webhook, so published changes refresh automatically without manually clearing cache.

# 2026-10-17 — Added responsive image delivery through Sanity's CDN

- **Status:** Implemented locally; deployment pending.
- Verified that all 131 published articles already have permanent Sanity main-image assets. The thumbnail materialisation dry run found no missing images, so no assets or article documents needed rewriting.
- Replaced globally disabled Next.js image optimisation with a custom Sanity CDN loader. Browsers now receive width-specific image variants, automatic supported formats and quality 75 directly from Sanity, avoiding the server image proxy that previously encountered DNS/NAT64 errors.
- Preserved existing crop rectangles and aspect ratios when resizing; local branding and dynamic-thumbnail fallbacks continue using their original URLs.
- Added responsive size hints to article cards, featured images, people-page article images and profile portraits, and prioritised the article hero image.
- Hardened the existing thumbnail-saving script with revision checks and draft-image protection so it cannot overwrite a concurrently uploaded custom image or an existing custom draft image.
- In three live image samples, original PNG assets were approximately 1.76–1.96 MB; 480-pixel card variants were 13–22 KB and 1080-pixel hero variants were 35–53 KB. URLs, canonical tags, full-size metadata images and editorial dates were not changed.
- Passed ESLint, loader checks, the production build and production-server checks of the homepage, article directory, an article, a company and a person page. Rendered Sanity images have direct CDN `srcset` URLs; H1s, canonical tags and indexability remain present.
- **Reason:** The user approved the image-performance phase to make thumbnails and article images load faster while reusing existing assets and protecting custom uploads. Future image-less publications can still be saved permanently using the existing `materialize:thumbnails:write` command; this change does not add a publication automation service.

# 2026-10-17 — Changed Featured Stories to two highlights and four supporting stories

- **Status:** Implemented locally; deployment pending.
- Replaced the single oversized homepage feature with two equal highlight cards side by side on desktop, followed by up to four smaller supporting cards. Cards stack on mobile; supporting cards use two columns on tablets and four on desktop.
- Kept the existing first-feature reference and supporting selections, added a Second Highlighted Story selector, and increased the supporting-story limit from three to four in Homepage Settings.
- Added validation against selecting the same article in both highlight slots or repeating a highlight in the supporting row. The frontend also deduplicates selections and excludes all six featured stories from the other homepage shelves.
- Editors can choose two highlights and four supporting stories in Sanity. Existing configured stories remain in their existing order until the new second highlight is selected; the page does not fill manually configured slots with newly published articles. The unconfigured fallback now displays up to six stories.
- Retained responsive Sanity CDN image variants, with image-size hints matched to the two-card and four-card rows.
- Verified the production build, linting of the changed files and component rendering with six stories, confirming the two/four split, editorial order, six-story cap and empty-state handling.
- **Reason:** The user felt one large highlighted story dominated the homepage and requested two highlighted stories above four smaller stories, while preserving editorial control independent of imports.

# 2026-10-17 — Paginated public directories and Studio management lists

- **Status:** Implemented locally; deployment pending.
- Articles, Companies and People directories now fetch and render 24 records per page, with result totals, numbered links and Previous/Next navigation. Searches and category/company/industry filters query the full published library, reset to page one, and retain the selected filters while paging.
- Public search uses Enter or the Search button; changing a dropdown submits the selected filters automatically. Existing homepage company previews and topic-page displays retain their previous behaviour.
- Each unfiltered directory page has its own canonical URL, such as `/articles?page=2`; page-one links omit `page=1`. Pagination is rendered as normal crawlable anchors and invalid/out-of-range pages return 404. Search/filter combinations use `noindex, follow` to avoid indexing large numbers of low-value combinations. Individual content URLs and sitemap membership are unchanged.
- Directory cards disable speculative detail-page prefetching to reduce background CMS requests while browsing large lists. Image delivery remains responsive through Sanity's CDN.
- Replaced the two full-list Studio managers with a shared manager that fetches 50 canonical document rows per page, performs debounced full-library search, cancels superseded requests and preserves Edit/Create/Refresh actions.
- Draft and published copies are grouped in GROQ before counting and pagination; each document appears exactly once, with All, Draft Only, Live + Changes and Published/Current counts and filters. This avoids splitting a document's versions across pages or showing counts based only on the loaded page.
- Verified live read-only queries for the 132 articles, 228 companies and 486 people available during testing, including adjacent pages without overlap and full-library searches. In-memory Studio fixtures verified draft-only, unpublished-change and published states, release-version exclusion and deduplication.
- Passed TypeScript, the production build, changed-file lint checks and production-server checks: all three directories return 24 cards, canonical URLs and crawlable pagination; filtered pages are noindex and invalid page numbers are 404. Articles-directory HTML decreased from approximately 334 KB to 143 KB.
- **Reason:** The user approved pagination as the next performance step so growing libraries do not require downloading and rendering every record in the browser or Studio.

# 2026-10-17 — Excluded empty article topics from search discovery

- **Status:** Implemented locally and verified; deployment pending.
- Following the Search Console audit, the user approved excluding empty article categories while preserving individual people profiles.
- Added a shared published-article eligibility filter for category counts: drafts and posts without titles or slugs cannot make a category appear populated.
- Category URLs are now included in the author/topic sitemap only when they contain at least one eligible published article. Authors, companies, people and article sitemap membership are otherwise unchanged.
- Empty topic pages remain accessible but send `noindex, follow`; populated topics remain indexable with their existing canonical URLs. Counts use the existing publication webhook and a 60-second cache fallback.
- Footer topic links and the homepage Strategy discovery card are conditional on available content. Existing homepage topic chips already hide empty results and retain that behaviour. No category documents, articles or people profiles were deleted.
- Read-only content checks confirmed Industry, Startup and People & Leadership have zero eligible posts; the revised author/topic sitemap has eight entries instead of eleven. Categories return automatically after their first eligible article is published, without an Excel change or code update.
- Verified draft-only/incomplete/published query fixtures, TypeScript, changed-file ESLint, production build and local production HTTP responses for three empty topics, three populated topics and an unchanged person profile.
- **Reason:** Avoid promoting empty article collections to search engines or readers. People & Leadership is an article collection, not the individual People profile directory.
- **Separate audit finding, not changed:** Eight pairs of people URLs share SEO titles/descriptions. Matching names are not proof of duplicate identities; title disambiguation or verified profile consolidation requires a separate review. No people records were merged or deleted.

# 2026-10-17 — Distinguished six same-name people profiles in SEO metadata

- **Status:** Implemented in the live Sanity dataset; no website deployment required for these content changes.
- The user approved distinguishing the separate Shashank Kumar, Anirudh Sharma and Harsh Jain profiles. Updated only `seoTitle` and `seoDescription` on the six existing published records.
- Titles now distinguish Shashank Kumar at DeHaat versus Razorpay, Anirudh Sharma at Digantara versus Third Wave Coffee, and Harsh Jain at Dream11 versus Groww. Each profile also has a distinct description based on its existing biography.
- Preserved every slug, document ID, biography, role, company relationship and other content field. No profiles were merged, deleted, renamed or newly published from a draft. The raw preflight found no draft copies for these six records.
- Saved previous metadata values and revision IDs outside the website repository at `C:\Users\rahul\Documents\Codex\outputs\seo-audits\2026-10-17-people-seo-backup.json`; used a revision-checked transaction and verified that every unrelated document field remained unchanged.
- The company importer currently patches person identity/bio fields without setting or clearing person SEO overrides, so these overrides are preserved by the existing importer.
- Verified all six live pages return HTTP 200 with their distinct titles/descriptions. Digantara initially retained cached metadata after the CMS update; a signed call to the existing revalidation endpoint returned HTTP 200 and the live page then showed the new metadata. No webhook settings or secrets were changed.
- **Reason:** Different people with matching names need distinct search-result metadata without changing their permanent URLs. This does not resolve the separate five duplicate-person pairs, which remain untouched.

# 2026-10-17 — Deferred backlog and handoff for the next session

- **Status:** Deferred at the user's request. Do not carry out the remaining tasks for at least the next two to three days; resume only when the user asks. No automatic reminder, deployment or scheduled mutation was requested.
- **Reason:** The user wants today's unfinished work recorded so it can be resumed after a short break without losing decisions or repeating completed tasks.

## Ready locally, not yet deployed

- Commit and deploy the empty-topic discovery changes, then verify production: omit Industry, Startup and People & Leadership from the sitemap while empty, hide empty topic discovery links, and serve `noindex, follow` on empty topic pages. Preserve all people profiles and automatically restore category eligibility when published content exists.
- At handoff, the uncommitted files are `PROJECT_DIARY.md`, `app/page.tsx`, `app/topics/[slug]/page.tsx`, `components/Footer.tsx`, `components/IntentCards.tsx`, `lib/sitemap-data.ts` and new `lib/topic-visibility.ts`. TypeScript, changed-file ESLint, the production build, GROQ fixtures and local production HTTP checks passed. Recheck the working tree before any later commit; do not assume unrelated future changes belong to this task.

## People identity cleanup — not performed

- Consolidate five verified duplicate-person pairs: Mukesh Bansal (`mukesh-bansal`, `mukesh-bansal-cult`); Amitava Saha (`amitava-saha`, `amitava-saha-xpressbees`); Sumatichandra H. Mehta (`sumatichandra-h-mehta`, `sumatichandra-mehta`); Rahul Sharma (`rahul-sharma`, `rahul-sharma-zetwerk`); Vishal Chaudhary (`vishal-chaudhary`, `vishal-chaudhary-zetwerk`).
- Before consolidating: back up records, inspect drafts and incoming references, choose the retained URL using content completeness and available indexing evidence, preserve the best biography and every valid company relationship, and redirect the obsolete URL. Update spreadsheet person slugs/relationships so later imports cannot recreate the duplicate. No merge or deletion is authorised merely by this backlog entry.
- Rahul Sharma's and Vishal Chaudhary's suffix profiles have identical biographies to their generic-slug profiles but no incoming company-role references; the generic profiles have the Zetwerk role. Mukesh Bansal's and Amitava Saha's roles are split between their two company-oriented profiles. Both Mehta records refer to Safari's same founder/promoter.
- Review overlapping role entries found for Shashank Kumar at Razorpay, Harsh Jain at Dream11 and Sumatichandra Mehta at Safari; distinguish genuinely separate historical roles from redundant entries before removing anything.
- Preserve stable person IDs and URLs across employer changes. One person can have multiple company-role records. Do not merge different individuals solely because they have the same name.

## Importer overwrite protection — design deferred, not implemented

- Decide and implement clear field ownership rather than relying on silent overwrites: recommended Sanity ownership for article bodies, company overviews, people biographies and SEO; recommended spreadsheet ownership for financial records and company-person relationships.
- Recommended normal mode: create new editorial records from Excel, but do not overwrite existing Sanity-managed editorial fields. Provide an explicit, narrowly scoped content-update mode for selected slugs when the user intentionally wants Excel to replace editorial content.
- The alternative discussed was last-import baselines/field-level conflict detection with visible skip warnings and an explicit override. This was not selected for implementation; compare complexity with the simpler ownership approach before building. Existing records need careful handling because reliable historical import baselines are unavailable.
- Add duplicate-identity safeguards to the people-import workflow: show useful matching-name/company warnings, reuse the existing person's slug/identity for another role, and never automatically merge same-name people. The current importer matches people by slug, so another slug can create another record.
- Verify article, company and people paths separately before claiming all imports are protected. The current importer already preserves the six custom people SEO overrides because it does not set those fields; biography/overview overwrite protection is still pending.

## Crawl, reliability and performance follow-up

- Investigate temporary failures on Chargebee, Waaree Energies, Pixxel and KreditBee using Vercel runtime logs and Sanity query timings. All four succeeded on retry; the audit did not establish a persistent server error or that Google experienced these failures.
- Review the remaining company-page query/performance optimisation phase without undoing the completed CDN, responsive image and pagination work.
- Investigate why the Digantara metadata update remained cached despite the existing publication refresh setup; a signed manual call to the existing endpoint fixed it. Do not assume this one observation proves the webhook is broken or that editors must routinely clear caches.
- Clean up secondary `Explore More Companies` headings on company/people pages and the secondary homepage heading to H2, keeping the main title H1. This is document-structure cleanup, not a demonstrated crawling block.
- Remove unnecessary `utm_source=chatgpt.com` parameters from internal links, preserving destination URLs and legitimate external attribution as appropriate.
- Review the full Search Console Page indexing and Crawl stats reports through authorised UI access or user-provided exports/screenshots. The API connection does not expose those aggregate reports. Do not infer site-wide exclusion counts or historical Googlebot failures from the sampled inspection results.
- Track a small priority set of company/people profiles over time, improve substantive unique content and contextual incoming links where needed, and compare new URL inspections after changes. Do not mass-request indexing, repeatedly submit unchanged sitemaps, or equate cache refresh with guaranteed indexing.

## Database direction — exploratory only

- Revisit PostgreSQL/Supabase only when structured financial data, comparisons and calculations justify it. No database migration was approved or started.
- Proposed long-term separation: Sanity for editorial content; a database for structured financial/funding data; Excel as an optional ingestion tool. Preserve permanent IDs across systems. A database by itself does not prevent conflicting edits or overwrite rules.

## Already complete — do not redo

- Local read-only Search Console MCP is installed, authenticated and verified for `sc-domain:misterstory.in`; it can read search performance, submitted sitemaps and individual stored URL inspections. Credentials are outside the website repository. An OAuth app left in Google's Testing mode may require reauthentication later; diagnose if needed without exposing credentials.
- Read-only crawl audit completed: 867 sitemap URLs, 67 Google URL inspections, and all directory pagination pages. Reports are outside the website repository at `C:\Users\rahul\Documents\Codex\outputs\seo-audits\2026-10-17-misterstory-crawl-audit.md`. All sitemap URLs ultimately loaded; no site-wide crawl block was found. Inspection counts are a selected sample, not site-wide totals.
- Six separate same-name people profiles have distinct live SEO titles/descriptions: Shashank Kumar at DeHaat/Razorpay, Anirudh Sharma at Digantara/Third Wave Coffee, and Harsh Jain at Dream11/Groww. Their IDs, slugs, biographies and relationships are unchanged. These CMS updates require no Git deployment and must not be confused with the five outstanding duplicate-person merges.

# 2026-10-17 — Added annual financial groups directly to the Companies sheet

- **Status:** Implemented locally, workbook updated in place and verified; code deployment pending. No real financial observations were entered or published.
- **Reason:** The user explicitly prefers one company per row, with additional year groups extending horizontally, rather than the earlier separate long-form financial-data workbook.
- Updated the existing `companies.xlsx`, Companies tab: preserved the original ten columns, appended FY25 in K:Q and FY26 in R:X. Each group has separate currency and unit columns, followed by revenue, EBITDA, net profit/loss, reporting basis and source URL. The existing financial-data workbook was not changed or migrated.
- Currency dropdowns contain INR, USD, EUR, GBP, AED, SGD, AUD, CAD, JPY, CNY, CHF and HKD. Unit dropdowns contain Units, Thousand, Lakh, Million, Crore and Billion. Basis dropdowns contain Consolidated and Standalone. Validation is prepared through row 1001; copy validation cells when extending further. Header row and the first two company-identification columns are frozen; the Companies table has filter controls.
- Added instructions to the existing Instructions sheet without removing or replacing previous instructions. Existing sheet names/order, seven worksheets, all 228 company rows and all 8,238 previously populated cells were preserved exactly. A mechanical preservation pass restored the original CRLF encodings after the spreadsheet tool normalised existing multiline text, avoiding spurious later biography/overview import changes.
- Backed up the original workbook at `C:\Users\rahul\Documents\Codex\outputs\company-financials-20261017\backup\companies-before-financials.xlsx` before replacing it. The source file's hash was rechecked before replacement and an exclusive file-open check confirmed it was not being edited. `companies.xlsx` remains excluded from Git by the existing ignore rules.
- Added annual financial parsing to the company importer and a separate `--financials-only` mode. Short commands are `npm run import:financials:check` and `npm run import:financials`; the latter writes only financial metric documents, not company/person editorial content, SEO, relationships, funding or timelines. The company must already be published for financials-only mode. Existing broader company import behaviour is otherwise retained.
- Year groups use exact headers such as `fy25_currency`, `fy25_unit`, `fy25_revenue`, `fy25_ebitda`, `fy25_net_profit_loss`, `fy25_reporting_basis` and `fy25_source_url`. FY25 means the fiscal year ending in 2025, using the company's actual fiscal calendar. Additional FY27/FY28/etc. column groups are recognised without a code update.
- Amounts remain numeric in their original currency/unit; there is no FX conversion. Blank amounts create no observations and never erase saved figures. Zero and negative values are preserved. Currency, unit, basis, source URL, numeric input and Excel error cells are validated before writes. Reported EBITDA must not be silently replaced with adjusted EBITDA.
- Persisted numeric amount, currency, unit, fiscal year, accounting basis, metric code and a stable import-source key on existing `companyMetric` documents, alongside the readable value used by the existing public Key Metrics section. New records receive Sanity-generated IDs; existing matching observations are patched with revision checks and unchanged data is skipped. Imported monetary values are read-only in Studio and managed through the financial columns.
- Duplicate observations across Companies and the legacy Metrics sheet are blocked rather than silently competing. Ambiguous existing metrics, unknown legacy accounting basis and existing metric drafts are also blocked for review. Changing a year's unit/currency while omitting saved figures is blocked to prevent reinterpreting partial data. General/sector metrics can continue using the existing Metrics sheet for now.
- Verification: ten automated tests passed, including zero/negative/missing values, context validation, future years, legacy conflicts, drafts, idempotent updates, mutation-free dry runs, revision guards and a 6,000-company planning fixture. Passed TypeScript, changed-file ESLint and production build. Inspected/rendered the new year groups and instruction area; validated all exported XML, native table headers, dropdown rules and freeze panes. The actual workbook financial dry run returned zero observations and zero writes. A non-empty synthetic future-year test performed a read-only live-company lookup and dry-run planning; no test values were saved to Excel or Sanity.
- Detailed importer instructions are in `scripts/COMPANY_FINANCIALS.md`. This does not implement the separately deferred blanket editorial-overwrite protection, duplicate-person consolidation or a PostgreSQL migration.

# 2026-10-17 — Moved the yearly financial grid into Metrics instead

- **Status:** Implemented locally and verified; replaces the workbook placement in the preceding entry. No financial data was published and no code was pushed.
- **Reason:** The user corrected the intended location: use the existing Metrics sub-sheet for the new one-company-per-row yearly grid, not the Companies profile sheet.
- Restored Companies to its original ten profile columns (A:J), removing the added annual headers, cells, table and financial dropdowns. The original founding-year validation remains intact.
- Replaced the old Metrics layout with 228 company rows: company slug/name in A:B, FY25 Currency/Unit/Revenue/EBITDA/Net profit-loss/Basis/Source in C:I and FY26 in J:P. Dropdowns, financial number formats, filters and frozen identifiers remain available.
- Preserved the workbook's existing Safari FY2026 revenue (2047.02 INR crore) and net profit (167.76 INR crore), consolidated, with their existing report URL, by placing them in the new annual grid. No figures were invented or fetched from the internet for this change.
- Preserved the existing Safari company-owned outlet-count record, including its original ID, value, notes and source, in Other Metrics. This extra tab is needed to retain a usable home for the existing non-financial observation; it does not introduce new sector metrics.
- The importer now prefers annual figures from the wide Metrics tab and reads legacy/non-financial rows from Other Metrics. Older workbooks with long-form Metrics and annual fields in Companies remain supported as a fallback. Financial observations present in both sources are blocked rather than silently ignored.
- The `import:financials:check` and `import:financials` commands are unchanged. The financials-only mode still avoids all company/person editorial updates. Existing metric identity/revision, blank-cell and currency/unit protections are unchanged.
- Updated workbook instructions, importer guidance and Studio field descriptions to refer to Metrics. Backup before relocation: `C:\Users\rahul\Documents\Codex\outputs\company-financials-20261017\backup\companies-before-metrics-layout.xlsx`.
- Verified 8,232 unchanged cells outside the explicitly moved/updated areas, 228 metric company rows, the two migrated monetary values, exact preservation of the outlet-count row, XML dropdown placement, rendered layout, ten automated tests, ESLint and TypeScript. The relocated workbook dry run identifies exactly two annual observations to update and makes zero writes. Preserved existing biography/overview line endings during export.

# 2026-10-18 — Sanity homepage content controls and single H1

- **Status:** Implemented locally; production build, TypeScript, changed-file lint and five configuration tests passed. Not committed, pushed or deployed.
- **Reason:** The user requested full homepage editing control in Sanity and correction of the duplicate H1, rather than only editing featured story references.
- Expanded Homepage Settings into SEO & sharing, Heading & search, Page sections and Featured stories groups. Supports homepage metadata/social image, main heading/intro, search visibility/placeholder/company shortcuts, repeatable reorderable sections with visibility, heading/description/link controls, article category/manual selection/count, explore cards/topic links, company preview, newsletter text and plain-text sections.
- Existing content remains the fallback when controls are unset. Initialized only missing fields on a new draft copied from the published singleton, preserving both highlight and supporting story references. Published settings were not changed; deploy the new Studio/frontend code before publishing this draft.
- Kept homepage canonical/indexing, shared header/footer, signup consent and design styles protected. Main homepage heading is the only H1; CompanyRow previews use H2 while the main Companies directory keeps H1. Verified generated production HTML has exactly one H1 and correct homepage title.
- Preserve featured reservations during reordering and avoid repeated shelf stories. Funding remains excluded from the default Latest Stories section. Explicit article references now retain their identity when unpublished, preventing automatic substitution of unrelated recent articles. Empty story shelves/topics stay hidden; unsafe link destinations fall back to same-site paths.
- Homepage metadata and body share one cached published-settings read; existing webhook revalidation and 60-second fallback remain in place. Added draft-only idempotent initialization script, regression tests and `scripts/HOMEPAGE_EDITING.md` guidance. No article/company/person content or importer settings were modified by this work; earlier financial-workbook changes remain separate and untouched.

# 2026-10-18 — Editable L1 directory pages in Sanity

- **Status:** Implemented locally, not committed/pushed/deployed. Initialized four unpublished settings drafts; no published page settings or company/person/article/author content changed.
- **Reason:** The user requested the same editing control as the homepage across L1 pages. Scoped L1 to the top-level Companies, People, Articles and Authors directories, in addition to the already-built homepage. Individual profiles and About/Contact/policy pages are not part of this change.
- Added Directory Page Settings in Studio with one fixed-ID settings document per directory. SEO & sharing controls metadata/image, Heading & search controls H1/label/intro/search wording, and Page sections supports reordering the directory, text blocks, shortcut cards, manually selected published articles and newsletter signup.
- Kept exactly one directory block and H1 mandatory in both Studio validation and frontend normalization, including protection against API-written hidden/missing/duplicate directory blocks. Auxiliary headings are H2. Kept directory search/filter functionality, pagination, canonical URLs, filtered-result noindex, author ranking and newsletter consent protected.
- Existing page text/layout remains the default until published settings exist; optional supporting article data is fetched only when selected-article sections are configured. Shared header/footer unchanged. Generic singleton creation is excluded from the global New menu.
- Draft-only idempotent initializer preserves existing settings and never publishes. Added editor guidance and five regression tests (ten passing with homepage tests). TypeScript, targeted ESLint, production build and whitespace checks passed. Tested eight production-build responses locally: homepage plus all four directories and people page 2 each have exactly one H1, valid canonicals and no unwanted noindex; filtered People/Articles retain noindex, follow and page-2 canonical remains self-referencing.
- Directory settings retain a 60-second revalidation fallback. Immediate publish-triggered refresh additionally needs `directoryPageSettings` included in the existing Sanity webhook filter; the project token returned 401 from the webhook-management API, so this external configuration was not changed/verified. No secrets were printed. This is documented as a follow-up rather than claiming instant refresh is configured.
- All previous homepage and financial-workbook/importer work remains preserved in the working tree, separate from this addition.

# 2026-10-18 — Fixed Metrics paste boundary for newly added companies

- **Status:** Implemented in the existing local `companies.xlsx`; no content imported or published.
- **Reason:** Google Sheets paste worked for existing rows but Excel displayed a table-row insertion warning for new company rows. The user requested a fix after closing the workbook.
- Confirmed AnnualFinancials covered A1:P230, with the filter ending at row 229 and row 230 marked as a totals row even though it contained Snabbit. Pronto and YesMadam were outside the table on rows 231–232. Companies itself has no native table.
- Extended the Metrics table/filter to A1:P1001 (1,000 company rows) and disabled the unused totals-row setting. No worksheet rows/cells were inserted, deleted or shifted; the new companies are included as ordinary data rows. Existing dropdowns already cover the reserved rows.
- Authored and rendered the table change with the spreadsheet runtime, then applied only its table boundary/totals settings to the original XLSX package to avoid normalizing unrelated content. Verified exactly one ZIP part changed: `xl/tables/table1.xml`. All eight sheets' cell values/formulas and all original sheet/style/validation/freeze-pane bytes remain unchanged; XML/package validation passed.
- Preserved the original at `C:\Users\rahul\Documents\Codex\outputs\metrics-paste-fix-20261018\companies-before.xlsx`. Verified the saved final layout and a financial-only dry run (two existing observations would change, zero writes). Native Google Sheets → Excel clipboard behavior still needs the user's paste test; reserved capacity does not eliminate errors from pasting beyond row 1001 or pasting mismatched columns.

# 2026-10-18 — Financial Editor with explicit Excel overwrite permission

- **Status:** Implemented locally; not committed, pushed or deployed. No real financial values or permissions were changed during implementation/testing.
- **Reason:** The user requested a Sanity portal to edit annual financial figures and prevent later spreadsheet imports from overwriting those edits until explicitly permitted.
- Added Financial Editor at the top of Studio navigation. Search all published companies (50 results per search, slug shown for disambiguation), choose FY2000–FY2099 and Consolidated/Standalone, then edit revenue, EBITDA, net profit/loss, currency, unit and internal source URL together. Existing values/context load first. Blank amounts preserve data; zero/negative amounts are supported; no currency conversion is performed. Legacy nonnumeric records require explicit numeric re-entry, and ambiguous basis/drafts/duplicates block the relevant edits.
- Save & publish figures asks for confirmation, commits the figures and a whole-company/year/basis Excel lock atomically, and publishes directly (not autosave/drafts). Existing observations keep their IDs; new metrics/control documents use generated IDs. Read-only raw annual fields point editors to the portal.
- Protection lives in a separate companyFinancialControl document linked to the company, rather than company-profile draft fields. Thus publishing an older company profile cannot erase locks. Company/control/metric revision guards serialize editor/import writes and reject stale or concurrent saves. Failed saves retain typed inputs; selection switches warn about unsaved edits. Existing profile text/SEO remain unchanged.
- Both normal company and financials-only imports now detect and report protected observations and re-read protection/current metrics immediately before writing. Legacy Metrics/Other Metrics writes also honour locks, including different incoming IDs and attempts to rename an existing protected observation. Nonfinancial metrics and other years remain independently importable. Legacy rows cannot corrupt structured annual metadata; use the wide grid for those records.
- Allow Excel updates for this year requires separate confirmation and releases only the selected year/basis, without changing figures or company-profile timestamps. Permission persists until another editor save re-locks that group. No bulk force flag was added. Older importer copies predating this protection must not be used; safeguards cover the provided workflows, not arbitrary external API clients with write permissions.
- Added editor/import guidance and 18 passing tests covering permission release/re-locking, skipped protected/new metrics, post-preflight locking, stale/concurrent atomic failures, legacy-path protection, profile-draft independence, invalid inputs and original annual-import behavior. TypeScript, targeted ESLint and production build passed. Read-only checks against the real workbook showed 11 unchanged annual observations; normal Safari dry run wrote nothing, and its two saved annual figures load into an unchanged valid editor plan. Existing publication webhooks/cache refresh are reused through metric/company writes; no new secret or spreadsheet change is required.

# 2026-10-18 — Markdown tables in Excel article imports

- **Status:** Implemented locally, not committed/pushed. No workbook content or Sanity articles were changed/published.
- **Reason:** The user requested the same table capability in Excel article imports that already existed when pasting directly into Sanity's body editor.
- Added opt-in Markdown pipe-table parsing to the shared Markdown converter, enabled by the article importer for regular and temporary draft workflows. Produces the existing articleTable/articleTableRow structure with headerRow and stable unique keys, so the deployed Studio/frontend table handling needs no new schema/renderer.
- Supports mixed paragraphs, headings, lists, links and multiple tables in original order, optional outer pipes, empty cells, negative/zero/numeric text, escaped literal pipes and colon alignment separators. Alignment remains controlled by the existing renderer. Table cells remain plain text (not rich inline Markdown/HTML/merged cells).
- Requires at least two columns, a three-or-more-hyphen separator and at least one data row. Recognized tables with inconsistent widths or no data stop article preparation with a slug/line error before writes. Fenced examples and ordinary pipe text do not become tables. The company-overview caller retains table conversion disabled to preserve its existing behavior.
- Updated the article audit to project/count table-cell text as well as ordinary text, and documented the exact article_body format in ARTICLE_IMPORT_GUIDE.md. Existing articles are not converted until intentionally re-imported; temporary drafts still reject already-used slugs. No publishing, matching, thumbnail or date logic changed.
- Verified 11 parser/audit tests, including mixed content, stable keys, malformed tables, code fences, empty/escaped cells, table-word counts and company-parser isolation; six non-table fixtures exactly match the previous converter's keys/content/marks. Targeted ESLint and TypeScript passed. No real import was run for this change.

# 2026-10-19 — Conservative article company/person interlinks

- **Status:** Implemented locally and applied to the 106 published articles listed in the bulk article workbook. Code is not yet committed/pushed. Workbook cells were not edited.
- **Reason:** The user requested links to existing company/person profiles only where already mentioned, then specified a maximum of 2–3 internal links per article, no added wording and no repeated destinations.
- Shared importer helper links up to three unique destinations in normal paragraphs/quotes, counting existing internal links toward the total. It uses published profiles, exact case-sensitive names and a small reviewed set of display variants. Duplicate person names are skipped. Ordinary-word/product names require an explicit company association (the preview caught Jupiter scooters incorrectly matching the finance company; this was blocked before any write).
- Preserves existing annotations, bold/italic formatting, text, headings, tables and inline code. Supports names spanning bold/plain spans. Links are stable/idempotent, and repeated mentions are left plain. Existing manually authored excess/repeated links are preserved rather than silently deleted; the automatic rule adds no more when the budget is exhausted.
- Regular and temporary draft Excel article imports now use this rule automatically. No new columns or sheet edits are needed. This does not resolve the separate deferred stale-sheet-vs-Sanity wording overwrite issue, and does not run on articles entered directly in Studio.
- Added a dry-run-first workbook-scoped link-only backfill. It matches existing articles by slug/import ID, blocks conflicting identities, backs up original bodies, checks wording before writes, uses revision-guarded body-only transactions, and verifies saved bodies. Drafts are handled separately and never published. Explicit publication/editorial dates, article metadata, company selections and slugs are not patched; normal Sanity system timestamps necessarily change.
- Applied 145 links to 106 published bodies (142 across 103 initial articles, then 3 reviewed, company-scoped short names: Skyroot, Digit and Dixon). Of these, 139 initial company links plus 3 short-name company links and 3 people links. No draft bodies existed in this workbook selection and no drafts were created. Original bodies/plans/applied journals are under ignored outputs/article-interlinks-2026-10-18T18-38-23-514Z and outputs/article-interlinks-2026-10-18T18-40-24-359Z.
- Verified 25 link/table regression tests, targeted ESLint and TypeScript. Initial 104 unique destination checks had 102 HTTP 200 results and two transient fetch errors; both passed GET retries, as did the three added company destinations. Confirmed published HTML contains in-body company and person anchors on the Ola rights-issue article. Existing webhooks/cache refresh handle content-only updates without a frontend deployment. Importer code still needs to be committed/pushed for repository continuity.

# 2026-10-19 — One-decimal financial display

- **Status:** Implemented locally; not committed, pushed or deployed. No workbook/CMS records were written.
- **Reason:** The user requested financial figures with at most one decimal place. Applied this as display rounding, preserving original precision for calculations and future editing.
- Company metric queries now include numericValue/currency/unit, and the server-rendered financial formatter uses these structured fields with Indian digit grouping and a maximum of one decimal, without forced trailing .0. Existing annual figures update their presentation after deployment without re-imports. Zero/losses remain supported; negative zero is normalized for display.
- Recognizable legacy financial values containing one unambiguous amount are also formatted. Percentages, ranges, mixed prose and nonfinancial KPIs retain their entered values. Currency and unit are not converted. Funding-round currency amounts now also allow at most one decimal instead of always rounding to an integer.
- This rule does not rewrite article prose/tables, Excel source cells, Studio input values, importer payloads, financial locks, metadata or source evidence. Updated the existing company-page metric type/projection rather than changing stored schemas.
- Verified 22 display/import/editor tests (4 new display tests plus existing financial regressions) and TypeScript. Read-only checks of actual saved financial observations confirm e.g. INR 1,294.063 crore displays as INR 1,294.1 crore while the saved amount is unchanged. Local browser preview was unavailable because no server was listening at localhost:3000. ESLint did not complete in the allotted check time and was stopped; no successful lint result is claimed.

# 2026-10-19 — Consistent IST date displays

- **Status:** Implemented locally; not committed, pushed or deployed. No saved timestamps or CMS content were modified.
- **Reason:** The user identified homepage dates differing from article pages and requested fixing unintended UTC/local-time displays throughout the site.
- Added a shared browser-safe IST formatter (Asia/Kolkata) for dates, date/time labels and the current calendar year. Article cards now use it, covering shared card displays across homepage, directories, topic/author pages and related articles. People-page custom article lists and custom Studio records tables now use the same formatter. Article detail timestamps retain their existing explicit IST behavior through the shared helper. The Financial Editor's default calendar year also follows IST across New Year boundaries.
- The reported Shamrock timestamp 2026-10-15T19:14:15.345Z now displays as 16 Oct 2026 on cards and 16 Oct 2026, 12:44 am IST inside the article. Banaraswala's update timestamp now displays as 17 Oct rather than 16 Oct.
- Preserved UTC storage, machine-readable time attributes/JSON-LD, ISO sitemap dates and correctly labelled RSS/GMT timestamps. Date-only funding/timeline events remain calendar dates. No blanket offset was applied to stored values. Blank/invalid/ambiguous unzoned date-time inputs do not crash or fall back to host-local interpretation.
- Kept publication ordering, manual homepage article selections, and Updated-vs-Published label selection unchanged. Updated dates can still appear out of chronological order in lists sorted by original publication date; that is a separate editorial choice, not a timezone bug.
- Eight date regressions, TypeScript, targeted ESLint and the complete production build passed, including midnight/year rollovers, explicit offsets, date-only inputs, missing/invalid values and identical output under UTC, America/Los_Angeles and Pacific/Kiritimati host timezones. Source audit found no remaining ambient-timezone date formatting in app/components/lib/custom Studio code.

# 2026-10-19 — Latest Stories can repeat non-Business-Model articles

- **Status:** Implemented locally; not committed/pushed/deployed. No CMS records, workbook cells or featured selections were modified.
- **Reason:** The user requested that Latest Stories remain relevant by showing articles even if they appeared elsewhere on the homepage, excluding Business Model articles. Interpreted and announced "all articles except Business Model" as including Funding & Deals, superseding the earlier funding exclusion.
- Extracted tested homepage article selection into a shared helper. The built-in Latest Stories section (stable key latest) ignores the global already-shown set, filters out business-model, and deduplicates its own cards. It does not reserve stories from category sections placed below it, so reorderings work consistently. Other shelves retain their existing cross-shelf deduplication and featured reservations; an article can appear once in those shelves plus once in Latest Stories.
- Latest automatic selection retains publication-time ordering and the existing configurable limit. Manual latest selections preserve editorial order while still excluding Business Model and duplicate cards. Old stored excludeFunding on latest is intentionally ignored; no migration or settings publish is needed. Generic category shelves still honour their filters.
- Updated Studio descriptions and hid inapplicable category/funding filters on the built-in Latest Stories section without removing stored fields. Updated homepage editing guidance. No new content queries or schema fields were introduced.
- Eleven homepage regressions, TypeScript, targeted ESLint and the full production build passed, including featured/category repetition, Business Model exclusion, funding inclusion with legacy settings, local deduplication, manual picks, limits and moving Latest Stories ahead of category sections.

# 2026-10-20 — Standardized company industries and sub-industries

- **Status:** Implemented in the company workbook and code. Classification-only CMS migration applied; deployment verification recorded below.
- **Reason:** The user requested cleanup of inconsistent industry labels, which mixed sectors, business models and narrow activities across 232 companies.
- Introduced a shared controlled taxonomy of 25 broad industries and 97 sub-industries. Classified all 232 workbook companies. Companies column C remains `industry`; appended `sub_industry` at K without moving existing profile columns. Added an Industry Categories reference tab and dependent dropdowns through row 1001. Importer validation covers every selected row, including pasted values and rows outside the dropdown range.
- Workbook authored with Artifact Tool, then transferred only the changed classification cells and dropdown support into the native package. All other original sheets, financial table, styles and unrelated package parts were preserved. Original backup: ignored outputs/industry-standardization-20261020/companies-before.xlsx. Re-imported final output, verified all pairs and named ranges, scanned for formula errors, and visually reviewed affected ranges. Interactive Excel dropdown selection was not tested.
- Sanity now uses a controlled Industry reference and matching Sub-industry dropdown. Invalid pairs prevent publication; free-form industry creation is disabled. Legacy industry documents and the legacy company text field remain stored rather than deleted. New companies require a valid pair. Classification does not change company URL slugs.
- Applied a dedicated revision-guarded migration, not the general importer: updated only industryCategory/subIndustry in 232 published company documents and one existing draft. No articles, people, financial figures, profile wording, SEO or publication state were changed. Original documents and an applied journal are backed up under ignored outputs/industry-migration-2026-10-20T14-44-29-169Z.
- Company facts display Sub-industry; directory search includes it. Similar-company suggestions prefer matching sub-industry within the broad industry. Industry filters read the standardized primary classifications. Existing canonical company URLs, sitemap paths and internal links are unchanged.
- Five taxonomy/workbook tests, 22 financial-protection/display regressions, TypeScript, targeted ESLint, full production build, full company-import dry run and financials-only dry run passed. Local production HTTP checks passed for a company profile, industry filtering and sub-industry search. The general importer still proposes other profile updates from existing sheet content; it was deliberately not run in write mode. No full re-import is required for these category changes.

# 2026-10-20 — Hide empty company article sections

- **Status:** Implemented and verified locally; not committed, pushed or deployed.
- **Reason:** The user requested removing the empty Articles section instead of showing a no-articles message on company profiles.
- The Articles-about-company heading, section container and Articles navigation shortcut render only when the existing published-only article query returns at least one linked article. Drafts remain excluded. The section appears automatically after an eligible linked article is published, through the existing refresh/cache workflow. Other company sections, article matching and publication rules are unchanged; no CMS or workbook updates are needed.
- TypeScript and targeted ESLint passed. Local rendered HTTP checks passed for YesMadam (zero articles: no section or shortcut) and Shamrock AI (one published article: both retained). Both pages returned HTTP 200.

# 2026-10-20 — Directory page settings included in production refresh webhook

- **Status:** Implemented and read-back verified in the live Sanity project. No website deployment required. Local documentation changes remain uncommitted.
- **Reason:** After a read-only check confirmed directoryPageSettings was missing, the user approved adding it so publishing Companies, People, Articles or Authors directory settings refreshes the public website without relying solely on timed revalidation.
- The project write token could not access webhook management (401), but the existing authenticated Sanity CLI session could. Patched only the existing production webhook rule, appending directoryPageSettings to its type allowlist. Verified every other original webhook setting was preserved, including URL, signing secret, enabled state, create/update/delete events, projection and draft/release-version exclusions. No secrets were printed or persisted in backups.
- Saved a non-secret snapshot of the previous rule under ignored outputs/directory-webhook-before-20261020.json and updated directory editing guidance. Verified the saved filter by fetching the webhook again; did not publish or alter any content for an end-to-end delivery test. Existing 60-second cache fallback remains unchanged. This resolves the earlier documented webhook-coverage follow-up; the separate locally implemented empty-company-Articles change still requires its own push/deployment.
