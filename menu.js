/*
 * HÀ DHE HESHT – MENU CATALOG  (this is the file to edit when the menu changes)
 * ---------------------------------------------------------------------------
 * The content below is plain JSON assigned to window.HDH_MENU. Keep the commas and quotes valid.
 * After editing, run   node tools/check-menu.js   (optional) or just open the site: invalid items are skipped and reported in the browser console.
 *
 * PRODUCT FIELDS
 *   id            unique, never reuse (also used in customers' saved carts)
 *   category      one of the ids in "categories"
 *   name          {"sq":"…","en":"…"}          source_name = exact name found in the research (keep for audit)
 *   description   {"sq":"…","en":"…"}          leave "" if unknown – do NOT guess ingredients or allergens
 *   price         whole number in ALL (lek).   null = price unknown -> item is shown as "ask for price" and cannot be ordered
 *   image         "assets/menu/file.jpg" or "" (an illustration is used when empty)
 *   sizes         [] or [{"id":"m","label":{"sq":"Mesatare","en":"Medium"},"price":900}]   price = full price of that size
 *   extras        [] or [{"id":"cheese","label":{"sq":"Djathë shtesë","en":"Extra cheese"},"price":100}]   price = amount ADDED
 *   customization {"enabled":true,"prompt":{"sq":"…","en":"…"}}   per-item note box in the cart (prompt optional)
 *   status        "available" | "sold_out" (shown, cannot be ordered) | "hidden" (not shown)
 *   confidence    "listed" (found on public listings) | "single_source" | "conflicting" | "unverified" (never displayed)
 *   spicy / abv / featured   optional flags; "notes" = internal remarks, never shown to customers
 * Which confidence levels are shown is controlled by settings.displayConfidence.
 */
window.HDH_MENU = {
  "meta": {
    "schema": 1,
    "currency": "ALL",
    "status": "draft_from_public_listings",
    "researchChecked": "2026-10-14",
    "expectedProductCount": 62,
    "sources": [
      "https://www.instagram.com/hadhehesht/",
      "https://wolt.com/sq/alb/vlora/restaurant/pizzeria-ha-dhe-hesht",
      "https://wolt.com/en/alb/vlora/restaurant/pizzeria-ha-dhe-hesht",
      "https://www.meny.semeny.no/public/al/sted/pizzeriahadhehesht"
    ],
    "notes": [
      "Names, prices and categories come from public listings (Wolt, SE MENY) and must be confirmed by the business before launch.",
      "No sizes, extras, allergens or discounts were found in the research, so none are listed. Add them only when confirmed.",
      "Albanian ingredient texts (description.sq) were translated by the assistant from the English listing text; have a native speaker review them.",
      "Drinks have no ingredient description in the listings (left empty on purpose)."
    ]
  },
  "settings": {
    "displayConfidence": [
      "listed",
      "single_source",
      "conflicting"
    ],
    "showSoldOut": true
  },
  "categories": [
    {
      "id": "pizza",
      "order": 1,
      "label": {
        "sq": "Pica",
        "en": "Pizza"
      }
    },
    {
      "id": "sandwich",
      "order": 2,
      "label": {
        "sq": "Sanduiçe",
        "en": "Sandwiches"
      }
    },
    {
      "id": "soft_drink",
      "order": 3,
      "label": {
        "sq": "Pije jo-alkoolike",
        "en": "Non-alcoholic drinks"
      }
    },
    {
      "id": "beer",
      "order": 4,
      "label": {
        "sq": "Birra",
        "en": "Beer"
      },
      "ageRestricted": true,
      "notice": {
        "sq": "Vetëm për persona mbi 18 vjeç.",
        "en": "For adults only (18+)."
      }
    }
  ],
  "products": [
    {"id": "p-margherita", "category": "pizza", "name": {"sq": "Pizza Margerita", "en": "Margherita"}, "source_name": "Pizza Margerita / Margherita", "description": {"sq": "Salcë, mozzarella", "en": "Sauce, mozzarella"}, "price": 500, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "p-pizza-napoli", "category": "pizza", "name": {"sq": "Pizza Napoli", "en": "Pizza Napoli"}, "source_name": "Pizza Napoli", "description": {"sq": "Salcë, mozzarella, açuge, kapare", "en": "Sauce, mozzarella, anchovies, capers"}, "price": 700, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "p-tuna-pizza", "category": "pizza", "name": {"sq": "Pizza Tonno", "en": "Tuna Pizza"}, "source_name": "Pizza Tonno / Tuna Pizza", "description": {"sq": "Salcë, mozzarella, ton, qepë, ullinj", "en": "Sauce, mozzarella, tuna, onion, olives"}, "price": 700, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "p-omonia-pizza", "category": "pizza", "name": {"sq": "Omonia Pizza", "en": "Omonia Pizza"}, "source_name": "Omonia Pizza", "description": {"sq": "Salcë, mozzarella, proshutë, kërpudha", "en": "Sauce, mozzarella, ham, mushrooms"}, "price": 700, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "p-pizza-primo-amore", "category": "pizza", "name": {"sq": "Pizza Primo Amore", "en": "Pizza Primo Amore"}, "source_name": "Pizza Primo Amore", "description": {"sq": "Salcë, mozzarella, rukola, domate qershi, grana", "en": "Sauce, mozzarella, arugula, pomodorini (cherry tomatoes), grana"}, "price": 650, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed", "featured": true},
    {"id": "p-pizza-italy", "category": "pizza", "name": {"sq": "Pizza Italia", "en": "Pizza Italy"}, "source_name": "Pizza Italia / Pizza Italy", "description": {"sq": "Salcë, mozzarella, proshutë krudo, rukola, domate qershi, grana", "en": "Sauce, mozzarella, prosciutto crudo, arugula, pomodorini, grana"}, "price": 850, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed", "featured": true},
    {"id": "p-pizza-with-ham", "category": "pizza", "name": {"sq": "Pizza me Proshutë", "en": "Pizza with Ham"}, "source_name": "Pizza me Proshutë / Pizza with Ham", "description": {"sq": "Salcë, mozzarella, proshutë", "en": "Sauce, mozzarella, ham"}, "price": 650, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "p-milanese-pizza", "category": "pizza", "name": {"sq": "Milanez Pizza", "en": "Milanese Pizza"}, "source_name": "Milanez Pizza / Milanese Pizza", "description": {"sq": "Salcë, mozzarella, sallam milanez", "en": "Sauce, mozzarella, Milanese sausage"}, "price": 650, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "p-pizza-chef", "category": "pizza", "name": {"sq": "Pizza Shef", "en": "Pizza Chef"}, "source_name": "Pizza Shef / Pizza Chef", "description": {"sq": "Salcë, mozzarella, rukola, domate qershi / domate", "en": "Sauce, mozzarella, arugula, pomodorini / tomatoes"}, "price": 550, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "p-special-pizza", "category": "pizza", "name": {"sq": "Pizza Speciale", "en": "Special Pizza"}, "source_name": "Pizza Speciale / Special Pizza", "description": {"sq": "Salcë, mozzarella, proshutë, pancetë, speca, ullinj, sallam", "en": "Sauce, mozzarella, ham, pancetta, peppers, olives, salami"}, "price": 750, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "p-pizza-eat-shut-up", "category": "pizza", "name": {"sq": "Pizza Ha & Hesht", "en": "Pizza Eat & Shut Up"}, "source_name": "Pizza Ha & Hesht / Pizza Eat & Shut Up", "description": {"sq": "Salcë, mozzarella, sallam pikant, gorgonzola, pancetë", "en": "Sauce, mozzarella, spicy salami, gorgonzola, pancetta"}, "price": 800, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed", "featured": true},
    {"id": "p-4-seasons", "category": "pizza", "name": {"sq": "Pizza 4 Stinet", "en": "4 Seasons"}, "source_name": "Pizza 4 Stinet / 4 Seasons", "description": {"sq": "Salcë, mozzarella, proshutë, kërpudha, sallam, ton", "en": "Sauce, mozzarella, ham, mushrooms, salami, tuna"}, "price": 750, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "p-1-drras-manget", "category": "pizza", "name": {"sq": "Pizza 1 Drras Mangët", "en": "1 Drras Manget"}, "source_name": "Pizza 1 Drras Mangët / 1 Drras Manget", "description": {"sq": "Salcë, mozzarella, brezaola, burrata", "en": "Sauce, mozzarella, bresaola, burrata"}, "price": 900, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed", "featured": true},
    {"id": "p-capricciosa", "category": "pizza", "name": {"sq": "Pizza Kapricoza", "en": "Capricciosa"}, "source_name": "Pizza Kapricoza / Capricciosa", "description": {"sq": "Salcë, mozzarella, proshutë, kërpudha, speca", "en": "Sauce, mozzarella, ham, mushrooms, peppers"}, "price": 750, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "conflicting", "notes": "Research: olives on Wolt listing, onions on SE MENY listing"},
    {"id": "p-pizza-lover", "category": "pizza", "name": {"sq": "Pizza Dashnorja", "en": "Pizza Lover"}, "source_name": "Pizza Dashnorja / Pizza Lover", "description": {"sq": "Salcë, mozzarella, sallam pikant, kërpudha, domate qershi", "en": "Sauce, mozzarella, spicy salami, mushrooms, pomodorini"}, "price": 750, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "p-calzone", "category": "pizza", "name": {"sq": "Calzone", "en": "Calzone"}, "source_name": "Calzone", "description": {"sq": "Salcë, mozzarella, proshutë, kërpudha, speca", "en": "Sauce, mozzarella, ham, mushrooms, peppers"}, "price": 650, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "p-mexican-pizza", "category": "pizza", "name": {"sq": "Mexican Pizza", "en": "Mexican Pizza"}, "source_name": "Mexican Pizza", "description": {"sq": "Salcë, mozzarella, ton, misër", "en": "Sauce, mozzarella, tuna, corn"}, "price": 650, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "single_source", "notes": "Research: shown on SE MENY listing, not in Wolt snapshot"},
    {"id": "s-tuna-sandwich", "category": "sandwich", "name": {"sq": "Sanduiç Tonno", "en": "Tuna Sandwich"}, "source_name": "Sanduiç Tonno / Tuna Sandwich", "description": {"sq": "Salcë, mozzarella, ton, qepë, domate, kastravec, ullinj", "en": "Sauce, mozzarella, tuna, onion, tomato, cucumber, olives"}, "price": 250, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "s-chicken-ham-sandwich", "category": "sandwich", "name": {"sq": "Sanduiç Proshut Pule", "en": "Chicken Ham Sandwich"}, "source_name": "Sanduiç Proshut Pule / Chicken Ham Sandwich", "description": {"sq": "Salcë, mozzarella, proshutë pule, sallatë jeshile, domate, kastravec", "en": "Sauce, mozzarella, chicken ham, green salad, tomato, cucumber"}, "price": 250, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "s-homemade-sandwich", "category": "sandwich", "name": {"sq": "Sanduiç Shtepie", "en": "Homemade Sandwich"}, "source_name": "Sanduiç Shtepie / Homemade Sandwich", "description": {"sq": "Salcë, mozzarella, sallam shtëpie, sallatë jeshile, domate, kastravec", "en": "Sauce, mozzarella, homemade sausage, green salad, tomato, cucumber"}, "price": 250, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "s-spicy-sandwich", "category": "sandwich", "name": {"sq": "Sanduiç Pikant", "en": "Spicy Sandwich"}, "source_name": "Sanduiç Pikant / Spicy Sandwich 🌶️", "description": {"sq": "Salcë, mozzarella, sallam pikant, rukola, domate", "en": "Sauce, mozzarella, spicy salami, arugula, tomatoes"}, "price": 250, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed", "spicy": true},
    {"id": "s-vegetarian-sandwich", "category": "sandwich", "name": {"sq": "Sanduiç Vegjetarian", "en": "Vegetarian Sandwich"}, "source_name": "Sanduiç Vegjetarian / Vegetarian Sandwich", "description": {"sq": "Salcë, mozzarella, djathë i bardhë, qepë, speca, ullinj, domate, kastravec", "en": "Sauce, mozzarella, white cheese, onion, peppers, olives, tomatoes, cucumber"}, "price": 250, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "s-sausage-sandwich", "category": "sandwich", "name": {"sq": "Sanduiç me Salçiçe", "en": "Sausage Sandwich"}, "source_name": "Sanduiç me Salçiçe / Sausage Sandwich", "description": {"sq": "Salcë, mozzarella, salsiçe pule, rukola, sallatë jeshile, domate", "en": "Sauce, mozzarella, chicken sausage, arugula, green salad, tomatoes"}, "price": 300, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "s-milanese-salami-sandwich", "category": "sandwich", "name": {"sq": "Sanduiç me Sallam Milanez", "en": "Milanese Salami Sandwich"}, "source_name": "Sanduiç me Sallam Milanez / Milanese Salami Sandwich", "description": {"sq": "Salcë, mozzarella, sallam milanez, rukola, domate", "en": "Sauce, mozzarella, Milanese sausage, arugula, tomatoes"}, "price": 300, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "s-crudo-sandwich", "category": "sandwich", "name": {"sq": "Sanduiç Krudo", "en": "Crudo Sandwich"}, "source_name": "Sanduiç Krudo / Crudo Sandwich", "description": {"sq": "Salcë, mozzarella, proshutë krudo, grana, rukola, domate / domate qershi", "en": "Sauce, mozzarella, prosciutto crudo, grana, arugula, tomatoes / pomodorini"}, "price": 330, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "s-bacon-pancetta-sandwich", "category": "sandwich", "name": {"sq": "Sanduiç Pançet", "en": "Bacon-Pancetta Sandwich"}, "source_name": "Sanduiç Pançet / Bacon-Pancetta Sandwich", "description": {"sq": "Salcë, mozzarella, pancetë, sallatë jeshile, domate, kastravec", "en": "Sauce, mozzarella, pancetta, green salad, tomato, cucumber"}, "price": 300, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "s-eat-shut-up-sandwich", "category": "sandwich", "name": {"sq": "Sanduiç Ha & Hesht", "en": "Eat & Shut Up Sandwich"}, "source_name": "Sanduiç Ha & Hesht / Eat & Shut Up Sandwich 🌶️", "description": {"sq": "Salcë, mozzarella, gorgonzola, sallam pikant, rukola, domate / domate qershi", "en": "Sauce, mozzarella, gorgonzola, spicy salami, arugula, tomatoes / pomodorini"}, "price": 350, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed", "spicy": true, "featured": true},
    {"id": "s-signorita-sandwich", "category": "sandwich", "name": {"sq": "Sanduiç Sinjorita", "en": "Signorita Sandwich"}, "source_name": "Sanduiç Sinjorita / Signorita Sandwich", "description": {"sq": "Salcë, mozzarella, tartuf, sardele, qepë", "en": "Sauce, mozzarella, truffle, sardines, onions"}, "price": 350, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "s-love-sandwich", "category": "sandwich", "name": {"sq": "Sanduiç Dashnoria", "en": "Love Sandwich"}, "source_name": "Sanduiç Dashnoria / Love Sandwich 🌶️", "description": {"sq": "Salcë, mozzarella, sallam pikant, kërpudha, domate qershi", "en": "Sauce, mozzarella, spicy salami, mushrooms, pomodorini"}, "price": 350, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed", "spicy": true},
    {"id": "s-german-sandwich", "category": "sandwich", "name": {"sq": "Sanduiç Gjerman", "en": "German Sandwich"}, "source_name": "Sanduiç Gjerman / German Sandwich", "description": {"sq": "Salcë, mozzarella, pancetë, proshutë Parma", "en": "Sauce, mozzarella, pancetta, Parma ham"}, "price": 350, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "s-devil-s-sandwich", "category": "sandwich", "name": {"sq": "Sanduiç i Djallit", "en": "Devil’s Sandwich"}, "source_name": "Sanduiç i Djallit / Devil’s Sandwich", "description": {"sq": "Mozzarella, pesto, salsiçe e tymosur, domate qershi", "en": "Mozzarella, pesto, smoked sausage, pomodorini"}, "price": 350, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "s-istanbul-sandwich", "category": "sandwich", "name": {"sq": "Sanduiç Instambull", "en": "Istanbul Sandwich"}, "source_name": "Sanduiç Instambull / Istanbul Sandwich", "description": {"sq": "Salcë, mozzarella, proshutë pule, kastravec turshi, ullinj", "en": "Sauce, mozzarella, chicken ham, pickled cucumber, olives"}, "price": 350, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "s-sandwich-1-drras-mango", "category": "sandwich", "name": {"sq": "Sanduiç 1 Drras Mangét", "en": "Sandwich 1 Drras Mango"}, "source_name": "Sanduiç 1 Drras Mangét / Sandwich 1 Drras Mango", "description": {"sq": "Salcë, mozzarella, brezaola, parmixhano, domate qershi", "en": "Sauce, mozzarella, bresaola, parmigiano, pomodorini"}, "price": 350, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "s-vlora-sandwich", "category": "sandwich", "name": {"sq": "Sanduiç Vlora", "en": "Vlora Sandwich"}, "source_name": "Sanduiç Vlora 🌶️ / Vlora Sandwich", "description": {"sq": "Salcë, mozzarella, proshutë viçi, sallam pikant, salsiçe, ullinj, domate qershi", "en": "Sauce, mozzarella, beef ham, spicy salami, sausage, olives, pomodorini"}, "price": 450, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed", "spicy": true, "featured": true},
    {"id": "s-sandwich-eat-shut-up-2", "category": "sandwich", "name": {"sq": "Sanduiç Ha & Hesht 2", "en": "Sandwich Eat & Shut Up 2"}, "source_name": "Sanduiç Ha & Hesht 2 / Sandwich Eat & Shut Up 2", "description": {"sq": "Salcë, top mozzarella, sallam milanez, capa, gorgonzola, domate qershi, rukola", "en": "Sauce, mozzarella ball, Milanese salami, capa, gorgonzola, pomodorini, arugula"}, "price": 450, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "conflicting", "notes": "Research: \"capa\" (as rendered on listing) – meaning unclear."},
    {"id": "d-spring-water", "category": "soft_drink", "name": {"sq": "Ujë Spring", "en": "Spring Water"}, "source_name": "Ujë Spring / Spring Water", "description": {"sq": "", "en": ""}, "price": 100, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "d-glina-water", "category": "soft_drink", "name": {"sq": "Ujë Glina", "en": "Glina Water"}, "source_name": "Ujë Glina / Glina Water", "description": {"sq": "", "en": ""}, "price": 100, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "d-tonic-water", "category": "soft_drink", "name": {"sq": "Ujë Tonic", "en": "Tonic Water"}, "source_name": "Ujë Tonic / Tonic Water", "description": {"sq": "", "en": ""}, "price": 180, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "d-buttermilk", "category": "soft_drink", "name": {"sq": "Dhallë", "en": "Buttermilk"}, "source_name": "Dhallë / Buttermilk", "description": {"sq": "", "en": ""}, "price": 100, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "d-fanta-orange", "category": "soft_drink", "name": {"sq": "Fanta Portokall", "en": "Fanta Orange"}, "source_name": "Fanta Portokall / Fanta Orange", "description": {"sq": "", "en": ""}, "price": 180, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "d-fanta-exotic", "category": "soft_drink", "name": {"sq": "Fanta Exotic", "en": "Fanta Exotic"}, "source_name": "Fanta Exotic", "description": {"sq": "", "en": ""}, "price": 180, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "d-coca-cola", "category": "soft_drink", "name": {"sq": "Coca-Cola", "en": "Coca-Cola"}, "source_name": "Coca-Cola", "description": {"sq": "", "en": ""}, "price": 180, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "d-pepsi-max", "category": "soft_drink", "name": {"sq": "Pepsi Max", "en": "Pepsi Max"}, "source_name": "Pepsi Max", "description": {"sq": "", "en": ""}, "price": 180, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "d-ivi-apricot", "category": "soft_drink", "name": {"sq": "Ivi Kajsi", "en": "Ivi Apricot"}, "source_name": "Ivi Kajsi / Ivi Apricot", "description": {"sq": "", "en": ""}, "price": 180, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "d-ivi-lemon", "category": "soft_drink", "name": {"sq": "Ivi Limon", "en": "Ivi Lemon"}, "source_name": "Ivi Limon / Ivi Lemon", "description": {"sq": "", "en": ""}, "price": 180, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "d-lemon-soda", "category": "soft_drink", "name": {"sq": "Lemon Soda", "en": "Lemon Soda"}, "source_name": "Lemon Soda", "description": {"sq": "", "en": ""}, "price": 180, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "d-orange-soda", "category": "soft_drink", "name": {"sq": "Orange Soda", "en": "Orange Soda"}, "source_name": "Orange Soda", "description": {"sq": "", "en": ""}, "price": 180, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "d-lipton-lemon", "category": "soft_drink", "name": {"sq": "Lipton Lemon", "en": "Lipton Lemon"}, "source_name": "Lipton Lemon", "description": {"sq": "", "en": ""}, "price": 180, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "d-bravo-apple", "category": "soft_drink", "name": {"sq": "Bravo Mollë", "en": "Bravo Apple"}, "source_name": "Bravo Mollë / Bravo Apple", "description": {"sq": "", "en": ""}, "price": 180, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "d-bravo-strawberry", "category": "soft_drink", "name": {"sq": "Bravo Luleshtrydhe", "en": "Bravo Strawberry"}, "source_name": "Bravo Luleshtrydhe / Bravo Strawberry", "description": {"sq": "", "en": ""}, "price": 180, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "d-bravo-grape", "category": "soft_drink", "name": {"sq": "Bravo Rrushi", "en": "Bravo Grape"}, "source_name": "Bravo Rrushi / Bravo Grape", "description": {"sq": "", "en": ""}, "price": 180, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "d-bravo-peach", "category": "soft_drink", "name": {"sq": "Bravo Pjeshkë", "en": "Bravo Peach"}, "source_name": "Bravo Pjeshkë / Bravo Peach", "description": {"sq": "", "en": ""}, "price": 180, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "d-dragon-energy-drink", "category": "soft_drink", "name": {"sq": "Dragon energy drink", "en": "Dragon energy drink"}, "source_name": "Dragon energy drink", "description": {"sq": "", "en": ""}, "price": 200, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "d-golden-eagle-energy-drink", "category": "soft_drink", "name": {"sq": "Golden Eagle energy drink", "en": "Golden Eagle energy drink"}, "source_name": "Golden Eagle energy drink", "description": {"sq": "", "en": ""}, "price": 200, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "d-red-bull", "category": "soft_drink", "name": {"sq": "Red Bull", "en": "Red Bull"}, "source_name": "Red Bull", "description": {"sq": "", "en": ""}, "price": 300, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed"},
    {"id": "b-kaon-lager", "category": "beer", "name": {"sq": "Kaon Lager", "en": "Kaon Lager"}, "source_name": "Kaon Lager", "description": {"sq": "", "en": ""}, "price": 200, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed", "abv": 5},
    {"id": "b-korca", "category": "beer", "name": {"sq": "Korça", "en": "Korça"}, "source_name": "Korça", "description": {"sq": "", "en": ""}, "price": 200, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed", "abv": 5},
    {"id": "b-bavaria", "category": "beer", "name": {"sq": "Bavaria", "en": "Bavaria"}, "source_name": "Bavaria", "description": {"sq": "", "en": ""}, "price": 200, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed", "abv": 5},
    {"id": "b-moretti", "category": "beer", "name": {"sq": "Moretti", "en": "Moretti"}, "source_name": "Moretti", "description": {"sq": "", "en": ""}, "price": 250, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed", "abv": 5},
    {"id": "b-heineken", "category": "beer", "name": {"sq": "Heineken", "en": "Heineken"}, "source_name": "Heineken", "description": {"sq": "", "en": ""}, "price": 300, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed", "abv": 5},
    {"id": "b-elbar", "category": "beer", "name": {"sq": "Elbar", "en": "Elbar"}, "source_name": "Elbar", "description": {"sq": "", "en": ""}, "price": 200, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed", "abv": 5},
    {"id": "b-amstel", "category": "beer", "name": {"sq": "Amstel", "en": "Amstel"}, "source_name": "Amstel", "description": {"sq": "", "en": ""}, "price": 250, "image": "", "sizes": [], "extras": [], "customization": {"enabled": true}, "status": "available", "confidence": "listed", "abv": 5}
  ]
};
