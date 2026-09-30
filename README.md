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
