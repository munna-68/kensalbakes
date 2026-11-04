# KensalBakes demo: design notes

## 1. The problem, in three sentences
Every KensalBakes order today starts as an Instagram DM and turns into a long back-and-forth: which flavours, how many, what date, when to collect, any allergies. Customers can't see a menu, prices, availability or how ordering works without asking. This demo gives her a proper website that collects the whole order in one tidy enquiry and drops it into a dashboard, so she stops chasing details in DMs.

## 2. What the research found (and what it couldn't)
- **Found (public Instagram profile, logged out):** the name "KensalBakes | Cakes & Treats"; the bio lines "Cakes • Cupcakes • Cookies", "Kensal Rise, London", "Level 2 Food Hygiene Certified" and "DM to order & enquire"; a truncated "🚨Blue light" line; the highlights "How to order", "Cakes" and "Cookies"; and about 226 followers.
- **Couldn't access:** post captions, highlight contents, the rest of the bio, prices, collection details and the exact blue light terms. Instagram blocked anything beyond the profile header, and imginn returned a 403. A picuki link redirected to an unrelated domain, so we didn't follow it.
- **Nothing else online:** no website, TikTok, Facebook, Google listing or FSA hygiene listing. Several similarly named businesses turned up and were excluded.
- **No screenshot came through** with the brief, so the palette, tagline, seasonal flavours and blue light detail all come from the written brief. Raw notes are in `/research`.

## 3. Design decisions
*Redesigned in November 2026 from a reference the client supplied: a "bake shop poster" look.*
- **Palette:** bark brown (#6B554C) for the hero, headers, how-to panel and footer; crimson (#931C1F) for the product band and marquee; pale butter (#F4EEC6) for type on dark; cream (#F7F2D9) and beige cards on the light sections. *Why:* it is the reference's colour field system, and big flat fields make the cut-out bakes pop.
- **Typography:** one variable grotesque, Archivo, used condensed (wdth 62–68, weight 800, all caps) for the giant poster words and section headings, condensed mixed case for sub-heads and product names, and normal width for small UI caps (nav, buttons). DM Mono is the typewriter body copy and prices. The dashboard uses a wider, lighter cut so number cards stay readable. *Why:* the reference's whole personality is that heavy condensed type set huge; one family keeps it consistent.
- **Layout:** the home hero mirrors the reference: nav, a giant word fitted to the page width ("Cakes & Cookies"; the h1 also carries the name for screen readers), the tagline and two buttons on the left, the bake in the centre bleeding off the bottom, a hygiene pill, a short note and clickable thumbnails on the right that swap the bake. Inner pages open with the same giant-word header on brown. Product cards copy the reference: cream card, beige well, cut-out, condensed name, mono price, full-width button. *Why:* viewers learn the pattern once.
- **Imagery:** the client's own transparent cut-outs and photos in `/public/images`. The hero bakes and their order are in `lib/hero-products.ts`; menu cards use `cutout` in `lib/mock-data.ts`. Items without a photo still fall back to the illustrated placeholders.
- **Preloader concept:** "out of the oven". The brown field is already the hero's colour. Cut-out bakes flick through the centre like a flipbook while a big counter runs 000 to 100 and each bake's name ticks past. The last bake is the hero product: it glides from the centre into its exact spot in the hero while the panel dissolves into the identical brown underneath, so the loader becomes the page. On other pages the panel lifts away instead. About 3 seconds, once per session, skipped for reduced motion.
- **Motion language:** one move per section. Giant words rise letter by letter out of masks; product cards deal onto the red band with alternating tilts; the heart-cake rail drifts sideways as you scroll; the "Filled / Gooey" words slide in opposite directions while the cookie turns; the footer wordmark rises. Buttons fill from below with a rolling label. Page changes use a brown curtain with the giant wordmark. Transform and opacity only, all off under `prefers-reduced-motion`.
- **The order flow:** seven short steps (treat, quantity and flavours, date, collection, note, discount, review), a live "your box" summary whose ribbon fills as you progress, and a sticky thumb bar on mobile. The date picker enforces her rules: notice per product, Tuesday to Saturday collection, the Christmas cutoff and break, and fully booked weeks. *Why:* each step mirrors a question she would otherwise ask in DMs, and the rules stop impossible orders before they reach her.
- **The dashboard:** an inbox with statuses (new, quoted, confirmed, ready), a week view, a weekly capacity gauge with a cap she controls, seasonal menu toggles, and small count-up stats. *Why:* it covers exactly what she juggles today. It is also live: lowering the cap closes weeks on the order form, and switching off a flavour shows it as sold out on the site.

## 4. Why a website and enquiry flow beats DM-only ordering (her side)
- One message has everything: date, quantities, flavours, slot, allergies, message and discount. No more chasing.
- Customers self-serve the menu, the prices and the Christmas cutoff, so she gets fewer "how much / are you free?" DMs.
- Capacity is enforced for her, so she can't be talked into a fifth order in a full week.
- Allergies are captured up front and flagged in red, which is safer than a detail buried in a chat.
- Instagram stays the shop window, and the link in her bio does the admin.

## 5. Five talking points for the video
1. "From DM chaos to one tidy enquiry: every detail, first time."
2. "Watch the order land: hit send, and it slides into her inbox."
3. "Her rules, built in: lead times, Christmas cutoff and fully booked weeks."
4. "One tap to cap a busy week or pull a sold-out flavour, and the site updates instantly."
5. "It feels like opening one of her boxes, right down to the ribbon."

## 6. What's fake, and what a real version would need
- **Fake:** all prices, customers, orders and stats; the illustrated images; "send quote", "reply on Instagram" and the reminders (they show confirmations only); and the data, which lives in memory and resets on refresh. Nothing is sent anywhere.
- **A real version needs:** a database and a small API (for example Supabase), a login for her dashboard, email or SMS confirmations (or a pre-filled Instagram DM), her real photos and prices, optional deposits through Stripe, spam protection on the form, a privacy notice for customer details, and a confirmed blue light policy and Christmas dates from her.
