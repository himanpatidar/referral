# referral

My personal referral links and codes for apps I use, served as a static page on
GitHub Pages.

**Live:** https://himanpatidar.github.io/referral/

## Adding a referral

Edit `links.json` — it's the only file you need to touch. Append an entry to the
`links` array:

```json
{
  "app": "Swiggy",
  "category": "Food",
  "tagline": "Food delivery",
  "reward": "₹150 off your first order",
  "url": "https://www.swiggy.com/r/XXXXXX",
  "code": "HIMAN123",
  "note": "Apply the code at signup",
  "logo": "assets/logos/swiggy.png",
  "accent": "#fc8019"
}
```

| Field      | Required | What it does |
|------------|----------|--------------|
| `app`      | yes      | Card title. |
| `category` | yes      | Section heading. Sections appear in the order categories first show up in the array. |
| `tagline`  | no       | Small grey line under the app name. |
| `reward`   | no       | What the visitor gets. Also searchable. |
| `url`      | no       | Renders the "Open link" button. |
| `code`     | no       | Renders a copy-to-clipboard code chip. |
| `note`     | no       | Small print under the reward — caveats, expiry, etc. |
| `logo`     | no       | Path to an image in `assets/logos/`. Falls back to a letter monogram if missing or broken. |
| `accent`   | no       | Hex color for that card's button and monogram. |

Every optional field can be omitted or left as `""` — the card renders only what's
present. An entry with neither `url` nor `code` shows a muted "Link coming soon".

Bump `updated` at the top of the file when you change things; it shows in the footer.

### The demo banner

`links.json` currently has a top-level `note` field, which renders as a "Heads up"
banner above the cards. **Delete that field once the data is real** and the banner
disappears on its own — there's nothing to change in the code.

## Current state: placeholder data

Every `url` and `code` in `links.json` today is a dummy: links all point at
`example.com` and codes all contain `DEMO`. They exist so the layout can be reviewed
with a full page of cards. Replace them with real values before merging to `main`.

## Logos

Brand marks live in `assets/logos/` as SVGs from [Simple Icons](https://simpleicons.org)
(the icon set is CC0), recolored white to sit on each card's brand-colored tile. Each
card's `accent` is the brand's official hex, taken from the same source.

They're self-hosted rather than loaded from a CDN, so the live page makes no
third-party requests and keeps working if the CDN goes away. A card whose `logo` is
missing or fails to load falls back to a letter monogram, so a broken path degrades
quietly.

Trademarks belong to their respective owners; the logos are used here only to identify
which app each referral is for. Simple Icons doesn't carry every brand (Amazon,
Flipkart, Myntra, CRED and Groww are all absent), so those would need a logo sourced
another way, or they'll show the monogram fallback.

## Running locally

The page loads `links.json` with `fetch()`, which browsers block on `file://`. Serve
the folder over HTTP instead:

```sh
python3 -m json.tool links.json > /dev/null   # check the JSON parses
python3 -m http.server 8000
# open http://localhost:8000
```

## Files

```
index.html    directory page
submit.html   submission form
styles.css    shared styles for both pages
card.js       shared card renderer (window.ReferralCard)
app.js        directory: fetch, group, search
submit.js     form: validation + live preview
links.json    the data
```

`card.js` is shared deliberately — the submit page's live preview renders through the
same `buildCard()` the directory uses, so a submitter sees exactly the card they'd get.
Pass `{ inert: true }` to skip wiring the copy button.

## Submissions

**Status: form only.** `submit.html` validates and previews, but `sendSubmission()` in
`submit.js` is stubbed and rejects with `NO_BACKEND` — nothing is sent or stored. The
page says so plainly.

Two rules the design holds to:

1. **Nothing auto-publishes.** A user-submitted URL is an untrusted URL. Published
   without review it becomes a phishing link sitting next to a real brand logo. Every
   submission goes to a queue for manual approval.
2. **Only https links.** `javascript:`, `data:`, `http:` and malformed URLs are
   rejected client-side, and must be rejected server-side too when the backend lands
   — client validation is a UX convenience, never a security boundary.

### Placement model

The owner's own code stays the primary card for each app. Community submissions render
underneath as secondary entries, carrying a `submittedBy` credit line. Submissions don't
displace the owner's placement.

### Planned backend: Cloudflare Worker + D1

Chosen for what breaks first at scale, which is not submission volume:

- **`links.json` hand-editing.** At dozens of apps with several codes each, a single
  JSON file is a bad fit — the whole dataset ships to every visitor and each approval is
  a git commit. This wants a table.
- **Moderation throughput.** Approval has to be one click against a database, not
  read-email-then-edit-JSON-then-push.

Sketch:

```
POST /api/submissions   → validate, Turnstile check, insert status='pending'
GET  /api/links         → approved rows only, cached at the edge
POST /api/admin/:id     → approve / reject (authenticated)
```

D1 free tier (5GB, 100k Worker requests/day) is far beyond what this needs, Turnstile
handles spam at no cost, and reads stay CDN-cached so the public page is as fast as it
is today. The form's field names already match the intended row shape, so wiring it up
shouldn't need a rewrite.

Rejected alternatives: prefilled **GitHub Issues** (walls out every non-developer
submitter, and approval still means hand-editing JSON); **Formspree** (~50
submissions/month free, and email-based moderation doesn't scale past dozens).

## Branches

- `main` — what GitHub Pages serves. Treat it as production.
- `develop` — where work happens. Merge into `main` to release.

```sh
git checkout main && git merge --ff-only develop && git push
```

Pages redeploys on push to `main`, usually within a minute or two.
