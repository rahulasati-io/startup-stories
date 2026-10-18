# Editing L1 directory pages

The homepage has its separate Homepage Settings document. Companies, People, Articles and Authors now each have a singleton under **Sanity → Directory Page Settings**. This does not change individual company, person, article or author profiles, nor the About/Contact/policy pages.

Deploy the Studio and frontend code before publishing the initialized settings drafts. Existing published pages retain the current layout until their settings are published.

Each page offers:

- **SEO & sharing**: SEO title, meta description and social sharing image.
- **Heading & search**: the one main H1, small label, introductory text and search placeholder. Essential empty headings/metadata fall back safely.
- **Page sections**: drag to reorder the main directory, supporting text, shortcut link cards, manually selected article collections and newsletter signup. Edit or hide optional sections; section headings are H2.

Exactly one Directory section is required. It contains the main heading, existing search/filters and full paginated results. Neither duplicate H1s nor hiding the directory is allowed, even if invalid settings are submitted through an API. Directory pagination, canonical URLs, filtered-page noindex, shared header/footer, author sorting and signup consent are not editable here.

Only published settings/content are displayed. Draft article selections remain hidden rather than falling back to unrelated articles. Internal links must begin with one `/`. Page sections appear on paginated/filtered directory views as well as the main page. Blank optional section lists do not remove the main directory. Settings use the existing 60-second revalidation interval (a stale response can precede regeneration). For immediate webhook-triggered refresh, add `directoryPageSettings` to the existing Sanity revalidation webhook's allowed document types while preserving draft/version exclusions. Management API access was not available with the project token, so this webhook change has not been made or verified.

Draft-only initializer (idempotent; leaves existing values and all published documents untouched):

```powershell
node --experimental-strip-types --env-file=.env.local scripts/initialize-directory-pages.mjs
node --experimental-strip-types --env-file=.env.local scripts/initialize-directory-pages.mjs --apply
```

Tests:

```powershell
node --experimental-strip-types --test scripts/directory-page-config.test.mjs scripts/homepage-config.test.mjs
```
