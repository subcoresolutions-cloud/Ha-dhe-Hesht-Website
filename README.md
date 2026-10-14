# Ha dhe Hesht – ordering website

Plain HTML/CSS/JS. No build step, no dependencies. Open `index.html`, or upload the folder to any static host (Netlify, Cloudflare Pages, GitHub Pages, cPanel).

## Files
`index.html` structure · `css/styles.css` design system · `js/app.js` menu, cart, checkout · `js/art.js` illustrations ·
`js/data.js` business info & ordering rules · **`data/menu.js` the menu catalog** · `tools/check-menu.js` menu audit

## Updating the menu (data/menu.js)
Open `data/menu.js` in any text editor. Each product is one line; field guide is at the top of the file. Typical changes:
- change a price: edit `"price"` (whole lek). Unknown price: `null` (shown as "ask for price", cannot be ordered – never guess)
- hide an item: `"status":"hidden"` · mark sold out (still shown, not orderable): `"status":"sold_out"`
- sizes: `"sizes":[{"id":"m","label":{"sq":"Mesatare","en":"Medium"},"price":900}]` (price = full price of that size; customer must pick one)
- extras: `"extras":[{"id":"cheese","label":{"sq":"Djathë shtesë","en":"Extra cheese"},"price":100}]` (price is added)
- photo: `"image":"assets/menu/margherita.jpg"` · note box per item: `"customization":{"enabled":true,"prompt":{"sq":"…","en":"…"}}`
- new item: copy a line, give it a NEW unique `id`. Home "Featured" row: `"featured":true`
`"confidence"` records how reliable the data is ("listed", "single_source", "conflicting", "unverified"). Items marked "unverified" are never shown; `settings.displayConfidence` controls the rest.
Bad entries (duplicate id, unknown category, invalid price…) are skipped and reported in the browser console, so one typo never breaks the whole menu. Run `node tools/check-menu.js` (needs Node.js) to audit the file and compare it with the research JSON.
If the file cannot be loaded, customers see an error with Retry / call / WhatsApp buttons; an empty catalog shows "menu is being updated".

## Design system (css/styles.css)
- **Tokens** at the top of the file: brand colours (tomato red, Italian green, cream, charcoal – taken from the logo), type scale, spacing, radii, shadows. Change a value there and the whole site follows.
- **Brand line:** the green/white/red `--stripe` (from the logo) appears under the header, above the footer, in section labels and in the cart header. No external fonts, scripts or images are used.
- **Components:** `.btn`, `.chip`, `.badge`, `.card`, `.tab`, `.stepper`, `.field`, `.choice`, `.item` (product card), `.tile` (category). Product cards are grid cards on tablet/desktop and compact rows (picture left, price + add button right) on phones.
- **Loading states:** the featured row ships with skeleton cards in `index.html` and the menu shows skeletons while `data/menu.js` loads; the space is reserved so nothing jumps when the content arrives (measured layout shift: 0).
- **Photos:** the site uses original illustrations (labelled as such). To use real food photos, add `"image":"assets/menu/<item>.jpg"` to the item in `data/menu.js` – photos are shown instead of the illustration, with the product name as alt text. Use only photos the pizzeria owns or has permission for; recommended 800×600 px JPG/WebP, under ~120 KB each. Do not use stock photos of food that is not theirs.

## Ordering rules (js/data.js → order)
- `pickup` / `delivery` `enabled`: only enabled services can be chosen at checkout (none enabled = "call us" message).
- Delivery `fee`, `minOrder` and `requireLocation`: the fee and minimum are applied **only when `verified: true`**. While `false` the site never adds a fee or enforces a minimum; the total is labelled "excl. delivery" and the fee is "confirmed on WhatsApp".
- Checkout: name and phone required (any phone format, 7–15 digits); delivery address required for delivery; location/map link optional (or required with `requireLocation`); order note optional; 18+ confirmation when beer is in the cart.
- The cart and the customer's details are saved in the browser and are never cleared automatically. The customer must press Send in WhatsApp; the order is only placed then. Re-opening an identical order shows a duplicate warning and reuses the same order number.

## Other settings (js/data.js)
- phone / WhatsApp number, address, links, opening hours (`hours_sq` / `hours_en`), About text (`about_sq` / `about_en`)
- pickup / delivery on-off, delivery fee, minimum order

## Before launch – confirm with the owner
1. All 62 items, names, prices and ingredients come from public listings (Wolt, SE MENY) and need the owner's confirmation. Review flags: Capricciosa (olives vs onions), Mexican Pizza (only on SE MENY), Sandwich Ha & Hesht 2 ("capa" unclear).
2. No sizes, extras, allergens or discounts were found, so none are shown. Add them only when confirmed.
3. Opening hours: Wolt says 11:00–23:00, SE MENY says 09:00–21:00. The site says "contact us" until `hours_*` is filled.
4. Delivery fee, area and minimum order are unknown (shown as "confirmed on WhatsApp").
5. Albanian ingredient texts were machine-translated – have a native speaker review them.
6. Photos: none included (no confirmed usage rights). The pictures are original illustrations (`js/art.js`), labelled as such on the menu. Real photos replace them via `image`. The logo file is only 150×150 px – send a larger PNG/SVG.
7. If the phone number changes, also update `index.html`: the number shown on the hero button (`data-bind="phoneDisplay"` default text), the JSON-LD block and the `<noscript>` text. If other details change, also update the JSON-LD block in `index.html` (it contains only verified facts: name, city, country, phone, Instagram; add street address, hours or geo only after the owner confirms them).

## How ordering works
Cart (saved in the browser) → details (pickup/delivery, name, phone, address; 18+ confirmation if beer) → review → opens WhatsApp (wa.me) with the order text pre-filled. The customer must press Send in WhatsApp. The order message is always in Albanian.

## WhatsApp order message
- The destination number lives in ONE place: `whatsappNumber` in `js/data.js` (any format works: `+355 69 381 2566`, `00355…`, `069…`; it is normalized to `355693812566` for `wa.me`). The phone links are derived from the same value.
- Still to update by hand if the number changes: `index.html` JSON-LD `"telephone"`, the `<noscript>` text, and the displayed `phoneDisplay`.
- Prices in the site and in the message use `ALL` (`currencyLabel` in `js/data.js`).
- Message layout (English, as specified) is built by `buildMessage()` in `js/app.js` from the real cart/checkout state. Pickup orders omit address and delivery fee; while the delivery fee is not verified it says "to be confirmed by the pizzeria" and the total is marked "excluding delivery fee".
- Opening WhatsApp never marks the order as sent: the customer must press Send in WhatsApp. If it does not open, the customer can reopen it, copy the message, or call.
- Very long orders (link > 7000 characters) show a warning and a "copy message" button instead of a broken link.

## Business information section (Contact)
Rendered by `renderBusiness()` in `js/app.js` from `js/data.js`. Everything is configurable there:
- `phoneDisplay`, `phoneInternational`, `whatsappNumber`, `mapsUrl`, `instagramUrl/Handle`, `woltUrl`, `city`, `landmarks`, `plusCode`, `about_*` (first paragraph is the intro).
- Hidden until you fill them in (nothing is guessed): `hoursList` / `hours_sq|en` (opening hours — public sources conflict, so confirm first), `email`, `streetAddress_sq|en`, `payment_sq|en`, `order.delivery.area_sq|en`, and `mapEmbedUrl` (paste a Google Maps *Embed a map* URL starting `https://www.google.com/maps/embed` only once the location is verified).
- Delivery fee/minimum/area show only when `order.delivery.verified` is `true`.
- Category chips come from the live catalog (`data/menu.js`) and filter the menu on click.

---
# Deployment, configuration and QA

## Configuration reference (there are NO environment variables, API keys or secrets)
The site is static: nothing is read from the environment and nothing secret exists. All settings are plain values in `js/data.js` (business, ordering rules) and `data/menu.js` (catalog).

| Setting | File | Required? | Notes |
|---|---|---|---|
| `business.whatsappNumber` | js/data.js | **Yes** | Order destination, any format; if missing/invalid, ordering is disabled with a clear message (no broken link). |
| `business.phoneDisplay`, `phoneInternational` | js/data.js | Yes | Shown text and `tel:` links. |
| `business.mapsUrl`, `plusCode`, `city_*`, `landmarks_*` | js/data.js | Yes | Location; no street address is invented. |
| `business.hoursList` / `hours_sq|en` | js/data.js | **Manual** | Empty = "hours being confirmed". Sources conflict (Wolt 11:00–23:00 vs SE MENY 09:00–21:00); the owner must confirm. |
| `business.email`, `streetAddress_*`, `payment_*`, `mapEmbedUrl` | js/data.js | Optional | Hidden until filled in. |
| `order.pickup.enabled`, `order.delivery.enabled` | js/data.js | Yes | Services offered. |
| `order.delivery.verified / fee / minOrder / area_*` | js/data.js | **Manual** | Fee and minimum are applied only when `verified: true`. |
| Products, prices, sizes, extras, photos | data/menu.js | Yes | See "Updating the menu" above. |

## Run locally
No build step. Open `index.html` directly, or serve the folder: `python3 -m http.server 8000` and visit http://localhost:8000.

## Deploy
Upload the whole folder to any static host (Netlify, Cloudflare Pages, GitHub Pages, Vercel static, or a normal web host over FTP). Use HTTPS.
1. Netlify / Cloudflare Pages: drag the folder in; `_headers` (CSP and security headers) is picked up automatically. GitHub Pages cannot apply custom headers: skip `_headers` there (the site works without it).
2. nginx / Apache: copy the headers from `_headers` into the server config (`add_header …` / `Header set …`).
3. **After you know the domain**, edit `index.html`: add `<link rel="canonical" href="https://YOUR-DOMAIN/">`, `<meta property="og:url" content="https://YOUR-DOMAIN/">`, and change `og:image` / `twitter:image` to absolute URLs (`https://YOUR-DOMAIN/assets/logo.jpg`); add `Sitemap: https://YOUR-DOMAIN/sitemap.xml` to `robots.txt` if you create one. Social previews will not work reliably until the image URLs are absolute.
4. If the Google Maps embed is used, `_headers` already allows `https://www.google.com` in `frame-src`.

## Run the checks
`sh tests/run_all.sh` runs the menu audit, JavaScript syntax checks and the 6 browser test suites (checkout, WhatsApp message, business section, full QA, end-to-end journey, and `test_design.py` for layout, tap targets, layout shift, contrast, focus, reduced motion) (set `PORT=…` if 8766 is taken). It needs Node and Python with Playwright (`pip install playwright && playwright install chromium`). There is no linter or bundler in this project.

## Privacy summary (also shown on the site, footer → "Njoftim privatësie")
Collected: name, phone, address (delivery only), optional location and notes, cart. Not collected: payment data, email, accounts, analytics. Stored only in the visitor's browser (localStorage keys `hdh_cart_v1`, `hdh_customer_v1`, `hdh_last_order_v1`, `hdh_lang`); a button in the notice erases the saved details. The order text goes to WhatsApp only when the customer presses Send there. The owner is responsible for how the received WhatsApp messages are kept; have a lawyer review the notice if required for your business.

See `TEST_REPORT.md` for what was tested and what remains open.


## Open questions
Details that still need the owner's confirmation are listed in `NEEDS_CONFIRMATION.md`. Delivery fee/minimum use `feeVerified` / `minOrderVerified` in `js/data.js`.

## Publishing changes (cache busting)
GitHub Pages lets browsers cache files for about 10 minutes, which can leave a visitor with a new page and an old script. After editing anything in `css/`, `js/` or `data/`, run `sh tools/bump-version.sh` before committing. It updates the `?v=` tag on every asset link; `tests/run_all.sh` fails if the tags disagree.


## Deployment (GitHub Pages)
- **Type:** plain static site (HTML, CSS, vanilla JS). No `package.json`, no framework, no build step: the repository root *is* the build output.
- **Published from:** branch `main`, folder `/ (root)`, by GitHub's built-in "pages build and deployment" workflow. There is no workflow file in the repo and none is needed. (`.nojekyll` makes GitHub serve the files as they are.)
- **Production URL:** https://subcoresolutions-cloud.github.io/Ha-dhe-Hesht-Website/ (repository `subcoresolutions-cloud/Ha-dhe-Hesht-Website`).
- **Paths:** every link in `index.html`, the CSS and the JS is relative (`css/…`, `js/…`, `assets/…`), so the site works under the `/Ha-dhe-Hesht-Website/` base path and would also work on a custom domain. The page is one screen with `#anchors`, so there is no client-side router to configure. Unknown addresses show `404.html`.
- **Checklist before pushing:** `sh tools/bump-version.sh` (cache busting), then `sh tests/run_all.sh`. `tests/test_production.py` copies the files git would publish into a `/Ha-dhe-Hesht-Website/` folder, serves them like Pages (no custom headers, 404 page), and tests the home page, assets, MIME types, direct links, refresh, 404 page, CSP and WhatsApp ordering there.
- **Security headers:** GitHub Pages ignores `_headers`, so the same Content-Security-Policy is also set with a `<meta>` tag in `index.html`. `tools/check-assets.js` fails if the two differ. (`frame-ancestors`, clickjacking protection, cannot be set from a meta tag on GitHub Pages.)
- **If you add a custom domain:** (1) GitHub → Settings → Pages → Custom domain, and enable Enforce HTTPS; (2) replace the production URL in `index.html` (canonical, `og:url`, `og:image`, `twitter:image`, JSON-LD), `sitemap.xml`, `robots.txt`; (3) change `<base href>` in `404.html` to `/`; (4) run `node tools/check-assets.js`.
- Everything in the repository root is public, including `tests/`, `tools/` and the research JSON; none of it contains secrets.
