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

## Branches

- `main` — what GitHub Pages serves. Treat it as production.
- `develop` — where work happens. Merge into `main` to release.

```sh
git checkout main && git merge --ff-only develop && git push
```

Pages redeploys on push to `main`, usually within a minute or two.
