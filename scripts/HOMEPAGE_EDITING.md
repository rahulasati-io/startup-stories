# Homepage editing

Deploy the homepage code before publishing the initialized Homepage Settings draft. The initializer preserves existing story references and does not change the published document.

Open `/studio` → **Homepage Settings**:

- **SEO & sharing**: homepage title, meta description, social sharing image. Canonical and indexing stay managed by the website.
- **Heading & search**: the main H1, introduction, search visibility, search placeholder and popular company shortcuts.
- **Page sections**: drag to reorder; open a section to edit its title, label, description, link and visibility. Add article collections, explore cards, topic links, company preview, newsletter signup or plain-text introductions. All section headings are H2.
- **Featured stories**: the existing two highlights and four supporting selections. Their references are preserved and spreadsheet imports do not change them.

Article collections support an automatic category, optional funding exclusion, manual published-article selections and a 1–12 item limit. Selected unpublished articles remain hidden rather than being replaced by unrelated stories. Visible featured stories reserve their slots; other collections claim remaining articles in page order so stories do not repeat.

Empty collections and unmatched topic links stay hidden. Clear both category fields for all articles. Custom links must be same-site paths beginning with `/`. Explore cards support an optional category restriction; topic links need a category slug or matching search phrase. Add existing default cards manually only if replacing their default list.

The shared header/footer, newsletter consent/privacy statement, H1/H2 levels and layout styling are deliberately not freeform controls. This protects navigation, signup consent and semantic structure. Changes remain drafts until **Publish**; the published page refreshes through the existing cache/revalidation flow (60-second fallback). No redeployment is needed for later content edits.

Developer initialization (idempotent, only missing fields, draft-only):

```powershell
node --experimental-strip-types --env-file=.env.local scripts/initialize-homepage.mjs
node --experimental-strip-types --env-file=.env.local scripts/initialize-homepage.mjs --apply
```

Tests:

```powershell
node --experimental-strip-types --test scripts/homepage-config.test.mjs
```
