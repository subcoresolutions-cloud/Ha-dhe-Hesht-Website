# Design refresh – QA addendum (15 Oct 2026)

New suite `tests/test_design.py` (Chromium, 360 / 390 / 768 / 1024 / 1280 / 1920 px): **48/48 pass**, stable over repeated runs. Together with the existing suites: 13/13 business, 35/35 checkout, 15/15 WhatsApp, 70/70 QA, 53/53 journey; menu audit 0 errors.
Checked per viewport: no horizontal scroll and nothing outside the viewport; every button, tab, stepper and input ≥ 44 px; layout shift (CLS) ≤ 0.1 (measured 0); no console errors; text contrast ≥ WCAG AA (4.5:1, 3:1 for large text; worst case taken over gradient stops). Also: alt text and image dimensions, illustrations hidden from assistive tech, skip link first, visible focus ring on key controls, landmarks and heading order, `prefers-reduced-motion` (no running animations, no smooth scroll), mobile menu rows, cart drawer fits a 390 px screen.
Layout shift problems found and fixed during this pass: hero illustration, featured row, category tiles and the hero phone button were filled in by JavaScript after first paint and pushed content down (CLS 0.12–0.56 at tablet/desktop widths).
Still not tested: real phones and Safari/Firefox, screen readers, Lighthouse, real WhatsApp delivery.

---
# Ha dhe Hesht – QA report (14 Oct 2026)

Environment: headless Chromium (Playwright), site served locally with the production CSP from `_headers`. Test scripts are in `tests/` (`sh tests/run_all.sh`). Last run: **menu audit OK; 35/35 checkout, 15/15 WhatsApp-message, 13/13 business-section, 70/70 QA-suite and 53/53 end-to-end journey checks passed (186 total); all JS files pass `node --check`.** There is no build step and no linter in the project, so those do not apply.

## Final integration (end-to-end journey, `tests/test_journey.py`, mobile 390 px and desktop 1280 px)
Homepage featured item → category tile → menu → 5 different pizza/sandwich/soft-drink/beer lines → reload (cart kept) → cart with item note → checkout (delivery) → review → WhatsApp. Verified: every menu card and cart line is a product from `data/menu.js`; message lines, quantities, unit prices and totals equal the independently computed catalog values (3.250 ALL); every checkout field appears in the message; screen total = message total; the URL actually opened equals the prefilled link to `355693812566`; delivery fee not invented; cart and details kept after WhatsApp opens; no console errors. Link audit: no placeholder links, all anchors resolve, external links limited to WhatsApp (correct number), Instagram, Wolt and Google Maps with `rel=noopener`; `tel:` links use the business number; nav links scroll to their sections; language toggle and privacy dialog work.
Fixed in this pass: menu intro text still said prices were in "(L)" (now "ALL"); contact cards left an orphan row on desktop (now 3 × 2).

## Completed and passing
**Responsive** (360, 390, 768, 1024, 1280, 1920 px): no horizontal overflow on the page, cart, checkout form or review step; cart drawer fits the viewport; WhatsApp button ≥ 44 px high and on screen; Escape closes the drawer; navigation reachable (burger on ≤ 900 px).
**Catalog & search:** 62 items shown; category tabs give 17 / 18 / 20 / 7; search is accent-insensitive and also matches category names ("pica", "heineken"); no-results state shown. Menu data re-audited against the research file (0 errors).
**Cart & totals:** mixed pizzas, sandwiches, drinks and beer; quantity up/down/remove; per-item notes; sizes and extras; cart survives reload and other tabs; subtotal, verified delivery fee (+200 in test config) and total are identical on screen and in the WhatsApp message; delivery minimum blocks ordering when verified.
**Checkout validation:** required name/phone/address, flexible international phone formats, junk rejected, 18+ confirmation for beer, duplicate-order warning.
**WhatsApp:** destination `355693812566` normalized from the single config value; message follows the requested template; decoded link checked with several products, drinks, Albanian characters, `& % # + ? "`, emoji, line breaks and long notes; the "sent" state never claims the order was sent, and cart/details are kept.
**Edge cases:** empty cart (message + back to menu); unavailable item cannot be added; item with no price shows "ask for price" and is not orderable; catalog load failure shows error + retry; `data.js` missing → clear banner, no crash; WhatsApp number missing → sending disabled with explanation and no `wa.me` link anywhere; no services enabled → clear message; missing `currencyLabel` → falls back to ALL.
**Security/privacy:** zero third-party requests; no CSP violations or console errors under the strict CSP; no personal data in the console; only the 4 expected localStorage keys; no payment fields; no secrets or API keys exist in the code; privacy notice added (footer and checkout) with an "erase saved details" button.
**SEO/accessibility (automated checks):** title, meta description, Open Graph and Twitter tags; single h1; header/nav/main/footer landmarks; no duplicate ids; all form fields labelled; all buttons/links named; all images have alt text; decorative SVG hidden from assistive tech; `lang` switches with the language toggle. JSON-LD contains only verified facts (no street address, hours, price range, postal code or geo).
**Performance:** no external fonts, scripts or images; whole site ≈ 174 KB uncompressed (app.js ≈ 21 KB gzipped); logo 14 KB; below-the-fold images lazy-loaded.

## Not done / remaining issues (manual)
1. **Opening hours, delivery fee, delivery area and minimum order are unconfirmed.** The site says they are confirmed on WhatsApp/phone. Fill them in `js/data.js` once the owner confirms.
2. **No real food photos.** Product images are original illustrations, not the restaurant's food. Add photos via the `image` field in `data/menu.js` and provide descriptive alt text conventions (alt = product name is applied automatically).
3. **Logo file is only 150×150 px**; it looks soft on large/high-density screens and makes a weak social-sharing image. Supply a larger file (≥ 1200×630 for sharing).
4. **Domain-dependent SEO** (canonical URL, absolute og:image, sitemap) must be added after the domain is known (see README).
5. **Prices and ingredients come from public listings** (Wolt/SE MENY/Instagram) and must be confirmed by the owner; Albanian ingredient translations are machine-made and need a native review.
6. **Not tested:** real WhatsApp (mobile app / WhatsApp Web) receiving the message — only the generated link was verified; real phones and Safari/Firefox (only Chromium); screen readers; a formal accessibility audit (axe could not be installed in this environment) and colour-contrast measurement; Lighthouse scores. A legal review of the privacy notice was not performed.
7. Minor: the footer "privacy notice" text link is 24 px high (meets the 24 px WCAG 2.2 minimum, below the 44 px used for main buttons).
8. The JSON-LD phone and the `<noscript>` text are typed by hand; update them if the number changes.


## Data & business-info addendum (15 Oct 2026)
Owner answers applied: spelling "Ha dhe Hesht", hours 11:00–23:00, delivery minimum 400 ALL, WhatsApp number confirmed.
- Menu audit: all 62 products match the research file on name, category and price; ingredient lists match the source text (3 flagged items unchanged). Wolt page re-read: hours, phone, Plus Code and the 15 pizza prices it lists match.
- Delivery rules are now split: `minOrderVerified` and `feeVerified` (fallback `verified`). The minimum is enforced; the fee is still "confirmed on WhatsApp".
- New `tests/test_menu_data.py` (29 checks): all four category filters, search (case, accents, English/Albanian, no result), card price format, food + drinks in one cart, cart/checkout/WhatsApp totals equal catalog prices, 400 ALL minimum blocks small delivery orders but not pickup.
- Full suite: 263 checks, all passing (business 13, checkout 35, design 48, journey 53, menu data 29, QA 70, WhatsApp 15).
- Open items: see NEEDS_CONFIRMATION.md.

## Cart & checkout reliability addendum (15 Oct 2026)
Audit result: the cart was already driven by one array (`cart`) with every amount computed from the catalog (`lineInfo` → `orderTotals`), used by the cart, review, badges and WhatsApp text. Fixes made:
- **Corrupted or hand-edited saved data** (cart or customer record in localStorage) could make the whole menu fail to load. Saved carts are now rebuilt line by line with plain types: bad lines dropped, duplicates merged, quantity capped at 99, notes capped at 200, any stored price ignored.
- **Two tabs** no longer overwrite each other: a change to the saved cart in one tab is adopted by the other.
- **Half an emoji** (a lone surrogate) in a note or address could make the WhatsApp link throw; such characters are now removed from the message.
- **Delivery minimum:** checkout now says how much to add (e.g. "Add 220 ALL more") instead of only failing on submit.
- New `tests/test_cart_reliability.py` (45 checks): the eight requested cases, sizes/extras, double submit, duplicate-order warning, minimum, hostile storage, sold-out item in a saved cart, two tabs. Full suite: 308 checks passing.
Known limits: no real phone/Safari/Firefox/WhatsApp-delivery testing; the order is never stored server-side (WhatsApp is the only channel), so the pizzeria sees it only when the customer presses Send in WhatsApp.

## WhatsApp ordering addendum (15 Oct 2026)
The message now follows the owner's template: `NEW ORDER — HA DHE HESHT` (spelled "Ha", per the owner's answer), Customer, Phone, Order type, Address, Location details, `ORDER ITEMS` with `Name × qty / Unit price / Item total / Options/notes` per item, Subtotal, Delivery fee, TOTAL, Additional notes, and "Please confirm availability and the estimated preparation or delivery time."
`tests/test_whatsapp_exact.py` (33 checks) builds the expected text independently and compares it character for character; it also checks percent-encoding, UTF-8 for Ë/Ç/ë/ç/emoji, number normalisation, same-tab fallback when pop-ups are blocked, the copy fallback, an invalid configured number, and a 40-line order (URL 52,667 chars: the send button is disabled with a warning and Copy is offered; the message is never cut). Full suite 341 checks, all passing.
The site cannot know whether the customer pressed Send in WhatsApp; it never says the order is confirmed.

## Independent QA sign-off (15 Oct 2026, commit after 7c699cb)
Project suite 366 checks + independent audit `tests/qa_audit.py` 132 checks (12 viewports from 320x568 to 1920x1080 and 844x390 landscape, keyboard-only use, reduced motion, error states, SEO/JSON-LD, privacy) – all passing after fixes. Live checks (GitHub Pages URL, built-in browser): all 6 resources 200, 62 items, repaired corrupted storage, mixed order total and WhatsApp text verified, no cookies, one h1, canonical/OG absolute, footer tap target 44px.
Defects found and fixed: footer "Privacy notice" tap target 24px → 44px; checkout footer took ~50% of a 320x568 screen → compacted on short screens; no-JS notice clarified.
Not tested: real phones, Safari/Firefox, screen readers, axe-core/Lighthouse (package registries unreachable from the test environment), a real WhatsApp delivery, availability of external links (Instagram, Wolt, Google Maps).
Launch blockers (owner side) are listed in NEEDS_CONFIRMATION.md and in the final QA report.
