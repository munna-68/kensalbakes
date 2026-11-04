// The bakes the home hero can show. The first one is the default (and the
// preloader's final frame). Swap or reorder freely: each is a transparent PNG
// in /public/images plus a small thumbnail.
export const HERO_PRODUCTS = [
  { id: "pouch", src: "/images/hero-pouch-cutout.png", thumb: "/images/hero-pouch-cutout.png", name: "Hand-cooked crisps" },
  { id: "croissant", src: "/images/croissant-cutout.png", thumb: "/images/thumb-croissant.png", name: "Butter croissant" },
  { id: "donut", src: "/images/donut-cutout.png", thumb: "/images/thumb-donut.png", name: "Sprinkle doughnut" },
  { id: "cookie", src: "/images/biscoff-cookie-cutout.png", thumb: "/images/thumb-cookie.png", name: "Biscoff cookie" },
  { id: "cake", src: "/images/heart-cake-cutout.png", thumb: "/images/thumb-cake.png", name: "Vintage heart cake" },
] as const;
