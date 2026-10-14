# Ha dhe Hesht – details that still need the owner's confirmation

Last updated 15 Oct 2026. Nothing below blocks the site; each item stays hidden or labelled "confirmed on WhatsApp" until it is answered.
Where to change each one is in brackets.

## Confirmed by the owner (15 Oct 2026)
| Detail | Value | Where |
|---|---|---|
| Name spelling | **Ha dhe Hesht** (no accent) | whole site |
| WhatsApp / phone | 069 381 2566 (+355 69 381 2566) is on WhatsApp | `js/data.js` → `whatsappNumber` |
| Opening hours | 11:00–23:00 (Wolt also lists Mon–Sun 11:00–23:00, so the site says "every day") | `js/data.js` → `hours_sq/en` |
| Minimum order | 400 ALL, applied to **delivery** orders only (see question 1) | `js/data.js` → `order.delivery.minOrder` |

## Still open
1. **Does the 400 ALL minimum apply to delivery only, or to pickup too?** The site enforces it for delivery only.
2. **Delivery fee and delivery area.** Not shown and not charged. Set `feeVerified`, `fee`, `verified` and `area_sq/en` in `js/data.js` once known.
3. **Payment methods.** Not shown (`payment_sq/en`).
4. **Exact street address.** Only landmarks and the Plus Code FF9P+W6 Vlorë (from Wolt) are used. The "Merr udhëzimet" button searches that Plus Code. No embedded map until the owner confirms (`mapEmbedUrl`).
5. **Menu items flagged in the research** (still orderable, shown as confirmed-needed in `tools/check-menu.js`):
   - Capricciosa (750): Wolt lists olives, SE MENY lists onions. The site lists neither.
   - Mexican Pizza (650): only on the SE MENY listing, not on Wolt.
   - Sandwich "Ha & Hesht 2" (450): one ingredient is written "capa" on the listing and its meaning is unclear.
6. **Prices on Wolt vs in the restaurant.** Prices come from public delivery listings and can differ from in-house prices. Confirm they are the prices to charge.
7. **Sizes, extras, allergens, portion sizes, discounts.** None were found, so none are shown (`sizes`, `extras` in `data/menu.js`).
8. **Beer details.** Wolt shows "5% vol / 18+" for all seven beers; only the 18+ rule is used. Volume and bottle size are not shown.
9. **Real food photos.** None verified, so labelled illustrations are used. Add `"image":"assets/menu/<item>.jpg"` per item only for photos the pizzeria owns.
10. **Logo.** `assets/logo.jpg` is 150×150 px (identical size to the supplied file). A larger PNG or SVG would look sharper on big screens.
11. **Albanian ingredient texts** were translated from the English listing text and should be read by a native speaker.
12. **Public URL.** Canonical and share-image URLs need to know whether the site stays on github.io or moves to a custom domain.
13. **Customer ratings** found in research (Wolt 8.2, Google 4.6, SE MENY 4.5) are intentionally not shown.
