// ─────────────────────────────────────────────────────────────────────────────
// KensalBakes demo — ALL mock data lives in this file.
// Every price, customer and order here is placeholder demo data, not real.
//
// Swapping in real photos: drop a file in /public/images and set `image`
// on any menu item or gallery tile, e.g. image: "/images/nutella-cookie.jpg".
// When `image` is set, the illustrated placeholder is replaced by the photo.
// ─────────────────────────────────────────────────────────────────────────────

import { addDays, startOfDay, startOfWeek, toISO } from "./dates";

export type Category = "cookies" | "cupcakes" | "cakes" | "favours";
export type MenuCategory = Exclude<Category, "favours">;
export type Art = "cookie" | "cupcake" | "cake" | "heart-cake" | "bento" | "box" | "favour" | "stack";
export type Status = "new" | "quoted" | "confirmed" | "ready";

/** Placeholder palettes: background gradient + illustration colours. */
export const tones = {
  biscoff: { bg: ["#f3dcc0", "#d9a46f"], base: "#c98a52", accent: "#8a5130", detail: "#4a2a1b" },
  bueno: { bg: ["#f7e9d6", "#e2c29a"], base: "#d9a46a", accent: "#f6efe4", detail: "#5a3522" },
  pistachio: { bg: ["#eef0dc", "#c6cf9f"], base: "#d8b27c", accent: "#a6b56f", detail: "#f8f3e8" },
  nutella: { bg: ["#ecd5c3", "#a8735a"], base: "#7a4a33", accent: "#4a2a1b", detail: "#f2e6d6" },
  reindeer: { bg: ["#f4d9d4", "#c88a7f"], base: "#9a6347", accent: "#c4433f", detail: "#3a2218" },
  orange: { bg: ["#f8e0c4", "#e3a065"], base: "#8c5a3c", accent: "#e8873a", detail: "#3a2218" },
  vanilla: { bg: ["#fbefe6", "#efc9c4"], base: "#f1dcb8", accent: "#f2bfc0", detail: "#d0586a" },
  caramel: { bg: ["#f6e2c8", "#d6a676"], base: "#d6b48a", accent: "#c9884c", detail: "#fbf6ef" },
  chocolate: { bg: ["#ead7c8", "#9c6b52"], base: "#5c3424", accent: "#3a2218", detail: "#e8c9a0" },
  velvet: { bg: ["#f6dcd8", "#c97f7c"], base: "#a8403f", accent: "#fbf3ea", detail: "#a8403f" },
  lemon: { bg: ["#faf1d4", "#e8d48b"], base: "#f2dc9a", accent: "#fdf8e8", detail: "#c6d39a" },
  ginger: { bg: ["#f2dcc4", "#c08a5c"], base: "#b77a48", accent: "#fbf3ea", detail: "#c4433f" },
  mint: { bg: ["#e2eee6", "#9ebfac"], base: "#6a3e2c", accent: "#d6ecdf", detail: "#3a2218" },
  blush: { bg: ["#fbece9", "#ebbfbd"], base: "#fbf3ea", accent: "#e7a9ab", detail: "#b9676f" },
  ivory: { bg: ["#fbf6ef", "#e9dccb"], base: "#fffaf3", accent: "#dca2a4", detail: "#b08a58" },
  rose: { bg: ["#f7e3e0", "#d9a2a0"], base: "#f6efe4", accent: "#c98f9a", detail: "#a6b56f" },
} as const;
export type Tone = keyof typeof tones;

export interface MenuItem {
  id: string;
  category: MenuCategory;
  name: string;
  description: string;
  price: number;
  priceNote: string;
  seasonal?: boolean;
  christmas?: boolean;
  tone: Tone;
  art: Art;
  image?: string;
  /** transparent cut-out PNG, shown on the product cards */
  cutout?: string;
}

export const menu: MenuItem[] = [
  // Cookies — her seasonal filled cookie menu
  { id: "biscoff", category: "cookies", name: "Biscoff & chocolate", description: "Brown butter dough with a Lotus Biscoff centre and milk chocolate chunks.", price: 3.5, priceNote: "each", seasonal: true, tone: "biscoff", art: "cookie", image: "/images/biscoff-cookie.jpg", cutout: "/images/biscoff-cookie-cutout.png" },
  { id: "kinder-bueno", category: "cookies", name: "Kinder Bueno", description: "Hazelnut cream centre, milk and white chocolate, a shard of Bueno on top.", price: 3.5, priceNote: "each", seasonal: true, tone: "bueno", art: "cookie", image: "/images/kinder-bueno-cookie.jpg", cutout: "/images/kinder-bueno-cutout.png" },
  { id: "pistachio", category: "cookies", name: "Pistachio & white chocolate", description: "Pistachio cream filling, white chocolate and crushed pistachios.", price: 3.75, priceNote: "each", seasonal: true, tone: "pistachio", art: "cookie", image: "/images/pistachio-cookie.jpg", cutout: "/images/pistachio-cookie-cutout.png" },
  { id: "nutella", category: "cookies", name: "Nutella", description: "A gooey Nutella core in dark cocoa dough, finished with flaky sea salt.", price: 3.5, priceNote: "each", seasonal: true, tone: "nutella", art: "cookie" },
  { id: "maltesers-reindeer", category: "cookies", name: "Maltesers reindeer", description: "Malted chocolate dough with a Maltesers centre, dressed as a little reindeer.", price: 3.75, priceNote: "each", seasonal: true, christmas: true, tone: "reindeer", art: "cookie" },
  { id: "chocolate-orange", category: "cookies", name: "Terry's chocolate orange", description: "Orange-zest dough, a melting Terry's segment inside, dark chocolate drizzle.", price: 3.75, priceNote: "each", seasonal: true, christmas: true, tone: "orange", art: "cookie" },

  // Cupcakes — invented for the demo
  { id: "vanilla-strawberry", category: "cupcakes", name: "Vanilla bean & strawberry", description: "Vanilla sponge, strawberry jam centre, soft pink buttercream swirl.", price: 16, priceNote: "box of 6", tone: "vanilla", art: "cupcake" },
  { id: "salted-caramel", category: "cupcakes", name: "Salted caramel", description: "Brown sugar sponge, salted caramel core, caramel drizzle.", price: 16, priceNote: "box of 6", tone: "caramel", art: "cupcake" },
  { id: "double-chocolate", category: "cupcakes", name: "Double chocolate", description: "Rich cocoa sponge with silky chocolate fudge buttercream.", price: 16, priceNote: "box of 6", tone: "chocolate", art: "cupcake" },
  { id: "red-velvet", category: "cupcakes", name: "Red velvet", description: "Classic red velvet with vanilla cream cheese frosting.", price: 17, priceNote: "box of 6", tone: "velvet", art: "cupcake" },
  { id: "lemon-elderflower", category: "cupcakes", name: "Lemon & elderflower", description: "Zesty lemon sponge, elderflower buttercream, sugared petals.", price: 17, priceNote: "box of 6", tone: "lemon", art: "cupcake" },
  { id: "gingerbread", category: "cupcakes", name: "Gingerbread spice", description: "Spiced sponge, cinnamon cream cheese frosting and a mini gingerbread star.", price: 18, priceNote: "box of 6", seasonal: true, christmas: true, tone: "ginger", art: "cupcake" },
  { id: "mint-hot-chocolate", category: "cupcakes", name: "Mint hot chocolate", description: "Cocoa sponge, peppermint buttercream, a tiny marshmallow on top.", price: 18, priceNote: "box of 6", seasonal: true, christmas: true, tone: "mint", art: "cupcake" },

  // Cakes — invented for the demo
  { id: "vintage-heart", category: "cakes", name: "Vintage heart cake", description: "Piped Lambeth-style heart with ribbon details. Your message on top.", price: 55, priceNote: "from", tone: "blush", art: "heart-cake", image: "/images/vintage-heart-cake.jpg", cutout: "/images/heart-cake-cutout.png" },
  { id: "victoria", category: "cakes", name: "Classic Victoria sponge", description: "Vanilla sponge, raspberry jam and vanilla buttercream. 6-inch serves 10–12.", price: 45, priceNote: "from", tone: "ivory", art: "cake" },
  { id: "chocolate-fudge", category: "cakes", name: "Chocolate fudge", description: "Three layers of cocoa sponge with chocolate fudge frosting and a ganache drip.", price: 48, priceNote: "from", tone: "chocolate", art: "cake" },
  { id: "lemon-raspberry", category: "cakes", name: "Lemon & raspberry", description: "Lemon drizzle sponge, raspberry compote, lemon buttercream.", price: 48, priceNote: "from", tone: "lemon", art: "cake" },
  { id: "pistachio-rose", category: "cakes", name: "Pistachio & rose", description: "Pistachio sponge, rose buttercream, crushed pistachios and dried petals.", price: 52, priceNote: "from", tone: "rose", art: "cake" },
  { id: "bento", category: "cakes", name: "Bento cake", description: "A 4-inch mini cake in a little box, made for two. Simple piped message.", price: 28, priceNote: "from", tone: "vanilla", art: "bento" },
  { id: "spiced-orange-cake", category: "cakes", name: "Spiced orange & cranberry", description: "Orange and mixed-spice sponge, cranberry compote, cream cheese frosting.", price: 50, priceNote: "from", seasonal: true, christmas: true, tone: "orange", art: "cake" },
];

export const categoryInfo: Record<Category, { label: string; blurb: string; art: Art; tone: Tone }> = {
  cookies: { label: "Cookies", blurb: "Filled, gooey and boxed to gift.", art: "cookie", tone: "biscoff" },
  cupcakes: { label: "Cupcakes", blurb: "Soft sponge, swirled buttercream.", art: "cupcake", tone: "vanilla" },
  cakes: { label: "Cakes", blurb: "Celebration cakes, piped by hand.", art: "heart-cake", tone: "blush" },
  favours: { label: "Favours", blurb: "Mini treats with personalised tags.", art: "favour", tone: "ivory" },
};

// ── Order flow options (demo prices) ─────────────────────────────────────────
export const orderOptions = {
  cookies: {
    sizes: [
      { id: "6", label: "Box of 6", count: 6, price: 20 },
      { id: "12", label: "Box of 12", count: 12, price: 38 },
      { id: "24", label: "Box of 24", count: 24, price: 72 },
    ],
  },
  cupcakes: {
    sizes: [
      { id: "6", label: "Box of 6", count: 6, price: 16 },
      { id: "12", label: "Box of 12", count: 12, price: 30 },
    ],
  },
  cakes: {
    sizes: [
      { id: "bento", label: "4-inch bento", serves: "Serves 2", price: 28 },
      { id: "6", label: "6-inch", serves: "Serves 10–12", price: 45 },
      { id: "8", label: "8-inch", serves: "Serves 16–20", price: 60 },
      { id: "tier", label: "Two-tier", serves: "Serves 30–35", price: 110 },
    ],
  },
  favours: {
    types: [
      { id: "mini-cookie", label: "Mini cookie favours", unit: 2.5, tone: "biscoff" as Tone },
      { id: "iced-biscuit", label: "Iced biscuit favours", unit: 3, tone: "blush" as Tone },
      { id: "mini-cupcake", label: "Mini cupcake favours", unit: 2.2, tone: "vanilla" as Tone },
    ],
    min: 20,
    step: 5,
  },
};

export const occasions = ["Birthday", "Christmas gift", "Thank you", "Baby shower", "Wedding favours", "Just because"];

export const collectionSlots = [
  { id: "morning", label: "Morning", time: "10am – 12pm" },
  { id: "afternoon", label: "Afternoon", time: "2pm – 4pm" },
  { id: "evening", label: "Evening", time: "5pm – 7pm" },
];

// ── Dates the demo is built around ───────────────────────────────────────────
export const TODAY = startOfDay(new Date());
const XMAS_YEAR = TODAY.getMonth() === 11 && TODAY.getDate() > 23 ? TODAY.getFullYear() + 1 : TODAY.getFullYear();
const xmas = (day: number) => toISO(new Date(XMAS_YEAR, 11, day));
const CHRISTMAS_WEEK = startOfWeek(new Date(XMAS_YEAR, 11, 16));

/** Collection runs Tuesday to Saturday. Shift a date forward onto the next collection day. */
function collectionDay(offset: number) {
  let d = addDays(TODAY, offset);
  while (d.getDay() === 0 || d.getDay() === 1) d = addDays(d, 1);
  return toISO(d);
}
const xmasWeekDay = (i: number) => toISO(addDays(CHRISTMAS_WEEK, i));
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

export const defaultSettings = {
  acceptingOrders: true,
  weeklyCap: 6,
  noticeDays: { cookies: 3, cupcakes: 4, cakes: 7, favours: 10 } as Record<Category, number>,
  christmasCutoff: xmas(13),
  lastChristmasCollection: xmas(23),
  closedFrom: xmas(24),
  closedTo: toISO(new Date(XMAS_YEAR + 1, 0, 2)),
  collectionDays: [2, 3, 4, 5, 6],
  blueLightPct: 10,
  slots: { morning: true, afternoon: true, evening: true } as Record<string, boolean>,
};
export type Settings = typeof defaultSettings;

// ── Enquiries (demo customers — invented names) ──────────────────────────────
export interface Enquiry {
  id: string;
  ref: string;
  customer: string;
  contact: string;
  category: Category;
  title: string;
  items: { name: string; qty: number }[];
  date: string;
  slot: string;
  occasion?: string;
  message?: string;
  allergies?: string;
  blueLight: boolean;
  estimate: number;
  quote?: number;
  status: Status;
  receivedAt: string;
  fresh?: boolean;
}

export const enquiries: Enquiry[] = [
  { id: "e15", ref: "KB-1043", customer: "Priya S.", contact: "@priya.demo", category: "cookies", title: "Christmas cookie box of 12", items: [{ name: "Maltesers reindeer", qty: 4 }, { name: "Terry's chocolate orange", qty: 4 }, { name: "Biscoff & chocolate", qty: 4 }], date: collectionDay(16), slot: "Afternoon", occasion: "Christmas gift", message: "For my team, could the tag say 'Merry Christmas from P'?", blueLight: false, estimate: 38, status: "new", receivedAt: hoursAgo(2) },
  { id: "e14", ref: "KB-1042", customer: "Tom W.", contact: "@tom.demo", category: "cakes", title: "6-inch chocolate fudge cake", items: [{ name: "Chocolate fudge", qty: 1 }], date: collectionDay(10), slot: "Morning", occasion: "Birthday", message: "Piped 'Happy 30th Jess' please, gold sprinkles if possible.", blueLight: true, estimate: 43, status: "new", receivedAt: hoursAgo(5) },
  { id: "e13", ref: "KB-1041", customer: "Hannah K.", contact: "@hannah.demo", category: "favours", title: "40 mini cookie favours", items: [{ name: "Mini cookie favours", qty: 40 }], date: collectionDay(24), slot: "Afternoon", occasion: "Baby shower", message: "Tags with 'Little one on the way' in sage if you can.", allergies: "One guest is nut-free", blueLight: false, estimate: 100, status: "new", receivedAt: hoursAgo(22) },
  { id: "e12", ref: "KB-1040", customer: "Chloe B.", contact: "@chloe.demo", category: "cupcakes", title: "Box of 12 cupcakes", items: [{ name: "Salted caramel", qty: 6 }, { name: "Red velvet", qty: 6 }], date: collectionDay(5), slot: "Evening", occasion: "Thank you", blueLight: false, estimate: 30, quote: 30, status: "quoted", receivedAt: hoursAgo(30) },
  { id: "e11", ref: "KB-1039", customer: "Olu A.", contact: "@olu.demo", category: "cakes", title: "Bento cake", items: [{ name: "Bento cake", qty: 1 }], date: collectionDay(8), slot: "Morning", occasion: "Just because", message: "'Happy retirement Dad' in brown piping.", blueLight: false, estimate: 28, quote: 28, status: "quoted", receivedAt: hoursAgo(44) },
  { id: "e10", ref: "KB-1038", customer: "Grace T.", contact: "@grace.demo", category: "cookies", title: "Box of 6 filled cookies", items: [{ name: "Nutella", qty: 3 }, { name: "Kinder Bueno", qty: 3 }], date: collectionDay(1), slot: "Afternoon", blueLight: false, estimate: 20, quote: 20, status: "confirmed", receivedAt: hoursAgo(70) },
  { id: "e9", ref: "KB-1037", customer: "Sam P.", contact: "@sam.demo", category: "cakes", title: "8-inch Victoria sponge", items: [{ name: "Classic Victoria sponge", qty: 1 }], date: collectionDay(2), slot: "Morning", occasion: "Birthday", blueLight: false, estimate: 60, quote: 60, status: "confirmed", receivedAt: hoursAgo(96) },
  { id: "e8", ref: "KB-1036", customer: "Ella C.", contact: "@ella.demo", category: "cupcakes", title: "Box of 6 cupcakes", items: [{ name: "Vanilla bean & strawberry", qty: 6 }], date: collectionDay(3), slot: "Evening", blueLight: true, estimate: 14.4, quote: 14.4, status: "confirmed", receivedAt: hoursAgo(120) },
  { id: "e7", ref: "KB-1035", customer: "Leah D.", contact: "@leah.demo", category: "cookies", title: "Box of 12 filled cookies", items: [{ name: "Pistachio & white chocolate", qty: 6 }, { name: "Biscoff & chocolate", qty: 6 }], date: collectionDay(0), slot: "Afternoon", blueLight: false, estimate: 38, quote: 38, status: "ready", receivedAt: hoursAgo(150) },
  // Christmas week: booked up to the weekly cap
  { id: "e6", ref: "KB-1034", customer: "Ruby F.", contact: "@ruby.demo", category: "cookies", title: "Christmas cookie box of 24", items: [{ name: "Maltesers reindeer", qty: 12 }, { name: "Terry's chocolate orange", qty: 12 }], date: xmasWeekDay(1), slot: "Morning", occasion: "Christmas gift", blueLight: false, estimate: 72, quote: 72, status: "confirmed", receivedAt: hoursAgo(200) },
  { id: "e5", ref: "KB-1033", customer: "Marcus L.", contact: "@marcus.demo", category: "cakes", title: "8-inch spiced orange cake", items: [{ name: "Spiced orange & cranberry", qty: 1 }], date: xmasWeekDay(2), slot: "Afternoon", blueLight: true, estimate: 54, quote: 54, status: "confirmed", receivedAt: hoursAgo(230) },
  { id: "e4", ref: "KB-1032", customer: "Noor H.", contact: "@noor.demo", category: "cookies", title: "Christmas cookie box of 12", items: [{ name: "Terry's chocolate orange", qty: 6 }, { name: "Nutella", qty: 6 }], date: xmasWeekDay(3), slot: "Evening", occasion: "Christmas gift", blueLight: false, estimate: 38, quote: 38, status: "confirmed", receivedAt: hoursAgo(260) },
  { id: "e3", ref: "KB-1031", customer: "Jess M.", contact: "@jess.demo", category: "cakes", title: "Two-tier Christmas party cake", items: [{ name: "Chocolate fudge", qty: 1 }], date: xmasWeekDay(4), slot: "Morning", blueLight: false, estimate: 110, quote: 110, status: "confirmed", receivedAt: hoursAgo(300) },
  { id: "e2", ref: "KB-1030", customer: "Daniel O.", contact: "@daniel.demo", category: "cupcakes", title: "Box of 12 cupcakes", items: [{ name: "Mint hot chocolate", qty: 12 }], date: xmasWeekDay(5), slot: "Afternoon", blueLight: false, estimate: 34, quote: 34, status: "confirmed", receivedAt: hoursAgo(320) },
  { id: "e1", ref: "KB-1029", customer: "Amelia R.", contact: "@amelia.demo", category: "favours", title: "30 iced biscuit favours", items: [{ name: "Iced biscuit favours", qty: 30 }], date: xmasWeekDay(5), slot: "Evening", occasion: "Christmas gift", message: "Office party, tags with company initials.", blueLight: false, estimate: 90, quote: 90, status: "confirmed", receivedAt: hoursAgo(340) },
];

export const stats = {
  avgReply: "1h 45m",
  repeatCustomers: 3,
};

// ── Gallery (placeholder tiles) ──────────────────────────────────────────────
export interface GalleryItem {
  id: string;
  title: string;
  category: "Cakes" | "Cupcakes" | "Cookies" | "Bakes" | "Gifting";
  art: Art;
  tone: Tone;
  shape: "tall" | "square" | "wide";
  image?: string;
}

export const gallery: GalleryItem[] = [
  { id: "g1", title: "Vintage heart with bows", category: "Cakes", art: "heart-cake", tone: "blush", shape: "tall", image: "/images/vintage-heart-cake.jpg" },
  { id: "g2", title: "Christmas cookie box", category: "Gifting", art: "box", tone: "reindeer", shape: "square" },
  { id: "g3", title: "Biscoff & chocolate", category: "Cookies", art: "cookie", tone: "biscoff", shape: "square", image: "/images/biscoff-cookie.jpg" },
  { id: "g4", title: "Strawberry swirl cupcakes", category: "Cupcakes", art: "cupcake", tone: "vanilla", shape: "tall" },
  { id: "g5", title: "Chocolate fudge drip", category: "Cakes", art: "cake", tone: "chocolate", shape: "square" },
  { id: "g6", title: "Ribbon-tied favour bags", category: "Gifting", art: "favour", tone: "ivory", shape: "tall" },
  { id: "g7", title: "Pistachio filled cookies", category: "Cookies", art: "stack", tone: "pistachio", shape: "wide", image: "/images/pistachio-cookie.jpg" },
  { id: "g8", title: "Bento for two", category: "Cakes", art: "bento", tone: "rose", shape: "square" },
  { id: "g9", title: "Salted caramel dozen", category: "Cupcakes", art: "cupcake", tone: "caramel", shape: "square" },
  { id: "g10", title: "Kinder Bueno stuffed cookie", category: "Cookies", art: "cookie", tone: "bueno", shape: "tall", image: "/images/kinder-bueno-cookie.jpg" },
  { id: "g11", title: "Birthday gift box", category: "Gifting", art: "box", tone: "blush", shape: "square" },
  { id: "g12", title: "Lemon & raspberry layers", category: "Cakes", art: "cake", tone: "lemon", shape: "tall" },
  { id: "g13", title: "Gingerbread spice", category: "Cupcakes", art: "cupcake", tone: "ginger", shape: "square" },
  { id: "g14", title: "Iced waffle latte", category: "Bakes", art: "stack", tone: "caramel", shape: "wide", image: "/images/bistey-waffle-coffee.jpg" },
  { id: "g15", title: "Sprinkle doughnut", category: "Bakes", art: "cookie", tone: "vanilla", shape: "square", image: "/images/donut-decorated.jpg" },
  { id: "g16", title: "Butter croissant", category: "Bakes", art: "stack", tone: "caramel", shape: "tall", image: "/images/croissant-pastry.jpg" },
  { id: "g17", title: "Heart cake, piped by hand", category: "Cakes", art: "heart-cake", tone: "blush", shape: "square", image: "/images/heart-cake.jpg" },
];
