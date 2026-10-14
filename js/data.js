/*
 * HA DHE HESHT — SITE SETTINGS  (business info, services, ordering rules)
 * The MENU is NOT here any more: edit data/menu.js (products, prices, sizes, extras, availability).
 * Source of initial data: public listings (Wolt, SE MENY, Instagram), checked 14 Oct 2026. Confirm everything before launch.
 */
window.HDH = {
  business: {
    name: "Ha dhe Hesht",
    tagline_sq: "Pica pa fjalë, shije me zë!",
    tagline_en: "Speechless pizza, flavor that speaks!",
    phoneDisplay: "069 381 2566",
    phoneInternational: "+355 69 381 2566",
    whatsappNumber: "355693812566",          // THE one place to change the order number (any format works; normalized for wa.me)
    city_sq: "Vlorë, Shqipëri",
    city_en: "Vlorë, Albania",
    landmarks_sq: "Pranë kryqëzimit të Omonias, ngjitur me Diambe Market, te këndi i shkollës private Internacional.",
    landmarks_en: "Near the Omonia intersection, next to Diambe Market, at the corner by the private International school.",
    plusCode: "FF9P+W6 Vlorë",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=FF9P%2BW6%20Vlor%C3%AB",
    instagramUrl: "https://www.instagram.com/hadhehesht/",
    instagramHandle: "@hadhehesht",
    woltUrl: "https://wolt.com/sq/alb/vlora/restaurant/pizzeria-ha-dhe-hesht",
    // Opening hours: confirmed by the owner on 15 Oct 2026 as 11:00–23:00 (days of the week not stated, so none are claimed).
    // Older public listings disagreed (SE MENY showed 09:00–21:00); the owner's answer wins.
    hours_sq: "Çdo ditë nga ora 11:00 deri në 23:00",
    hours_en: "11:00–23:00",
    // Or a day-by-day list once confirmed, e.g. [{ days_sq:"E hënë – E diel", days_en:"Monday – Sunday", time:"11:00–23:00" }]. Overrides hours_sq/en when set.
    hoursList: null,
    // Optional contact details: leave null to hide them. Never add one that is not the business's own.
    email: null,
    // Optional exact street address (only once the owner confirms it).
    streetAddress_sq: null,
    streetAddress_en: null,
    // Embedded map: paste a Google Maps "Embed a map" URL (https://www.google.com/maps/embed?pb=…) ONLY once the location is verified. null = no embed, just the directions button.
    mapEmbedUrl: null,
    // Payment methods: leave null until confirmed (nothing is shown).
    payment_sq: null,
    payment_en: null,
    // About-us text (editable). Only state things you can stand behind; add a real story/photos when you have them.
    about_sq: [
      "Ha dhe Hesht është pizzeri dhe bar në Vlorë, pranë kryqëzimit të Omonias. Në menu gjen pica, sanduiçe, pije freskuese dhe birra.",
      "Emri e thotë vetë: kur pica është e mirë, fjalët teprojnë. Prandaj thënia jonë: “Pica pa fjalë, shije me zë!”. Disa nga artikujt e menusë mbajnë emrin e shtëpisë, si Pizza Ha & Hesht dhe Sanduiçi Ha & Hesht."
    ],
    about_en: [
      "Ha dhe Hesht is a pizzeria and bar in Vlorë, near the Omonia intersection. The menu has pizza, sandwiches, soft drinks and beer.",
      "The name says it all: when the pizza is good, words are too much. Hence our line: “Speechless pizza, flavor that speaks!”. A few menu items carry the house name, like the Ha & Hesht pizza and sandwich."
    ]
  },
  order: {
    currencyLabel: "ALL",                    // shown after amounts, e.g. 1.200 ALL
    orderPrefix: "HH",
    // Set "enabled" to false for a service the pizzeria does not offer.
    pickup:   { enabled: true },
    delivery: {
      enabled: true,
      // Each rule is applied ONLY once its own flag is true (a flag left out falls back to "verified").
      // Until the business confirms a value keep its flag false: the site then never adds it and shows "confirmed on WhatsApp".
      verified: false,
      feeVerified: false,
      fee: null,                             // number (lek) added to delivery orders, or null = "confirmed on WhatsApp"
      minOrderVerified: true,                // owner confirmed a 400 ALL minimum on 15 Oct 2026
      minOrder: 400,                         // number (lek) minimum for delivery orders, or null = none
      requireLocation: false,                // true = customers must also give location details / a map link for delivery
      area_sq: null,                         // delivery area text once confirmed, e.g. "Vlorë qendër"
      area_en: null,
      note_sq: "Tarifa dhe zona e dërgesës konfirmohen nga pizzeria në WhatsApp.",
      note_en: "Delivery fee and area are confirmed by the pizzeria on WhatsApp."
    }
  }
};
