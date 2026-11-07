"use client";

// Preloader: "out of the oven".
// The bark-brown field is already the hero's colour. Cut-out bakes flick
// through the centre like a flipbook while a big counter runs 000 → 100 and
// the name of each bake ticks past. The last bake is the hero product: it
// glides from the centre into its exact spot in the hero while the panel
// dissolves into the identical brown underneath, so the loader *becomes* the
// page. On pages without that hero product, the panel lifts away instead.
// Plays once per browser session and never under reduced motion.

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP, markReady, getLenis, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";
import { HERO_PRODUCTS } from "@/lib/hero-products";
import { Wordmark } from "./ui";

const KEY = "kb-preloaded";

const SEQUENCE = [
  { src: "/images/biscoff-cookie-cutout.png", name: "Biscoff cookie" },
  { src: "/images/vanilla-strawberry-cutout.png", name: "Swirl cupcake" },
  { src: "/images/croissant-cutout.png", name: "Butter croissant" },
  { src: "/images/heart-cake-cutout.png", name: "Vintage heart cake" },
  { src: "/images/kinder-bueno-cutout.png", name: "Kinder Bueno cookie" },
  { src: "/images/waffle-drink-cutout.png", name: "Iced waffle latte" },
  // the last frame is the hero's default product
  { src: HERO_PRODUCTS[0].src, name: HERO_PRODUCTS[0].name },
];

export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const skip =
        document.documentElement.classList.contains("no-preloader") ||
        prefersReducedMotion() ||
        location.pathname.startsWith("/dashboard");

      if (skip) {
        el.style.display = "none";
        markReady();
        return;
      }

      try {
        sessionStorage.setItem(KEY, "1");
      } catch {}

      const html = document.documentElement;
      html.dataset.preloading = "true";
      html.dataset.preloaderPlayed = "true";
      getLenis()?.stop();

      const q = gsap.utils.selector(el);
      const items = q(".pl-item") as HTMLElement[];
      const count = q(".pl-count")[0] as HTMLElement;
      const nameEl = q(".pl-name")[0] as HTMLElement;
      const stage = q(".pl-stage")[0] as HTMLElement;
      const counter = { v: 0 };
      const setCount = () => void (count.textContent = String(Math.round(counter.v)).padStart(3, "0"));

      gsap.set(items, { opacity: 0, scale: 0.45, rotate: -24, yPercent: 8 });

      const STEP = 0.3;
      const tl = gsap.timeline({ paused: true });
      tl.to(".pl-plate", { scale: 1, opacity: 1, duration: 0.7, ease: "expo.out" }, 0);
      tl.to(".pl-bar", { scaleX: 1, duration: STEP * (items.length - 1) + 0.5, ease: "power2.inOut" }, 0.1);
      tl.to(counter, { v: 100, duration: STEP * (items.length - 1) + 0.5, ease: "power2.inOut", onUpdate: setCount }, 0.1);

      items.forEach((item, i) => {
        const at = 0.15 + i * STEP;
        const last = i === items.length - 1;
        tl.to(item, { opacity: 1, scale: 1, rotate: 0, yPercent: 0, duration: last ? 0.7 : 0.42, ease: last ? "back.out(1.5)" : "back.out(2)" }, at);
        tl.call(() => {
          nameEl.textContent = SEQUENCE[i].name;
          gsap.fromTo(nameEl, { yPercent: 100 }, { yPercent: 0, duration: 0.35, ease: "expo.out" });
        }, [], at);
        if (!last) tl.to(item, { opacity: 0, scale: 1.18, rotate: 18, yPercent: -6, duration: 0.24, ease: "power2.in" }, at + STEP);
      });

      tl.addLabel("out", "+=0.2");
      tl.call(() => {
        const target = document.querySelector<HTMLElement>("#hero-product");
        const out = gsap.timeline({
          onComplete: () => {
            el.style.display = "none";
            delete html.dataset.preloading;
            getLenis()?.start();
            ScrollTrigger.refresh();
          },
        });

        // chrome slides away in every case
        out.to(q(".pl-chrome"), { yPercent: 110, duration: 0.6, ease: "expo.in", stagger: 0.04 }, 0);
        out.to(q(".pl-top"), { opacity: 0, duration: 0.4 }, 0.1);
        out.to(".pl-plate", { scale: 1.6, opacity: 0, duration: 0.8, ease: "power2.in" }, 0);

        const r = target?.getBoundingClientRect();
        if (target && r && r.width > 0 && r.top < window.innerHeight) {
          // hand the product to the hero
          const s = stage.getBoundingClientRect();
          out.to(
            stage,
            {
              x: r.left + r.width / 2 - (s.left + s.width / 2),
              y: r.top + r.height / 2 - (s.top + s.height / 2),
              scale: r.width / s.width,
              duration: 1.05,
              ease: "expo.inOut",
            },
            0.15,
          );
          out.call(() => markReady(), [], 0.55);
          out.to(q(".pl-bg"), { opacity: 0, duration: 0.5, ease: "power1.inOut" }, 0.6);
          out.call(() => void gsap.set(target, { visibility: "visible" }), [], 1.2);
          out.set(stage, { opacity: 0 }, 1.22);
        } else {
          out.to(stage, { scale: 0.7, opacity: 0, duration: 0.6, ease: "power2.in" }, 0.1);
          out.to(el, { yPercent: -100, duration: 0.95, ease: "expo.inOut" }, 0.35);
          out.call(() => markReady(), [], 0.65);
        }
      }, [], "out");

      // wait for fonts and the cut-outs, but never longer than ~1.6s
      const imgs = q(".pl-item img") as HTMLImageElement[];
      const decoded = Promise.all(imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve())));
      const timeout = new Promise((res) => setTimeout(res, 1600));
      Promise.race([Promise.all([document.fonts.ready, decoded]), timeout]).then(() => gsap.delayedCall(0.05, () => tl.play()));
    },
    { scope: root },
  );

  return (
    <div id="preloader" ref={root} className="fixed inset-0 z-[100] text-butter" aria-hidden>
      <div className="pl-bg doodles absolute inset-0 bg-bark" />

      {/* top: wordmark + place, sitting exactly where the header will be */}
      <div className="pl-top absolute inset-x-0 top-0">
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-5 sm:h-20 sm:px-8">
          <Wordmark />
          <span className="ui hidden text-butter/70 sm:inline">Kensal Rise, London</span>
        </div>
      </div>

      {/* the stage */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="pl-plate absolute aspect-square w-[min(62vh,78vw)] scale-50 rounded-full bg-butter/[0.06] opacity-0" />
        <div className="pl-stage relative aspect-square w-[min(56vh,74vw)]">
          {SEQUENCE.map((s, i) => (
            <div key={s.src + i} className="pl-item absolute inset-0 opacity-0">
              <Image
                src={s.src}
                alt=""
                fill
                priority
                sizes="(max-width: 768px) 80vw, 560px"
                className="object-contain drop-shadow-[0_30px_35px_rgba(0,0,0,0.28)]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* bottom: counter left, bake name right, progress bar */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto flex max-w-[1320px] items-end justify-between gap-6 px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="overflow-hidden">
            <p className="pl-chrome pl-count mega text-[30vw] tabular-nums text-butter sm:text-[19vw] lg:text-[15rem]">000</p>
          </div>
          <div className="min-w-0 pb-2 text-right sm:pb-5">
            <div className="overflow-hidden">
              <p className="pl-chrome ui text-butter/60">Out of the oven</p>
            </div>
            <div className="mt-2 overflow-hidden">
              <p className="pl-chrome">
                <span className="pl-name block pb-1 font-display text-[1.6rem] font-[600] leading-[1.1] sm:text-[2.4rem]">&nbsp;</span>
              </p>
            </div>
          </div>
        </div>
        <div className="pl-chrome h-[3px] w-full bg-butter/15">
          <div className="pl-bar h-full origin-left scale-x-0 bg-butter" />
        </div>
      </div>
    </div>
  );
}
