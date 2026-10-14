# Hà dhe Hesht – ordering website

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
7. If details change, also update the JSON-LD block in `index.html` (it contains only verified facts: name, city, country, phone, Instagram; add street address, hours or geo only after the owner confirms them).

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
`sh tests/run_all.sh` runs the menu audit, JavaScript syntax checks and the 5 browser test suites (set `PORT=…` if 8766 is taken). It needs Node and Python with Playwright (`pip install playwright && playwright install chromium`). There is no linter or bundler in this project.

## Privacy summary (also shown on the site, footer → "Njoftim privatësie")
Collected: name, phone, address (delivery only), optional location and notes, cart. Not collected: payment data, email, accounts, analytics. Stored only in the visitor's browser (localStorage keys `hdh_cart_v1`, `hdh_customer_v1`, `hdh_last_order_v1`, `hdh_lang`); a button in the notice erases the saved details. The order text goes to WhatsApp only when the customer presses Send there. The owner is responsible for how the received WhatsApp messages are kept; have a lawyer review the notice if required for your business.

See `TEST_REPORT.md` for what was tested and what remains open.
