"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { gsap, useGSAP, SplitText, ScrollTrigger, whenReady, revealOnScroll, prefersReducedMotion } from "@/lib/motion";
import { menu } from "@/lib/mock-data";
import { HERO_PRODUCTS } from "@/lib/hero-products";
import { formatLong } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { DemoTag } from "./art";
import { scrollToHow } from "./site-chrome";
import { Btn, ProductCard, fitToWidth, money } from "./ui";

export default function Home() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      revealOnScroll(root.current!);
      // Arriving from another page via "How to order"
      return whenReady(() => {
        if (sessionStorage.getItem("kb-scroll-how")) {
          sessionStorage.removeItem("kb-scroll-how");
          setTimeout(scrollToHow, 350);
        }
      });
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      <Hero />
      <SignatureBand />
      <HeartCakeFeature />
      <ChristmasCookies />
      <Marquee />
      <HowItWorks />
      <GoodToKnow />
    </div>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const { contextSafe } = useGSAP({ scope: ref });

  useGSAP(
    () => {
      const q = gsap.utils.selector(ref);
      const word = q(".hero-word")[0] as HTMLElement;
      const product = q("#hero-product")[0] as HTMLElement;
      const fit = () => fitToWidth(word);
      fit();
      document.fonts.ready.then(fit);
      const onResize = () => {
        fit();
        ScrollTrigger.refresh();
      };
      window.addEventListener("resize", onResize);

      if (prefersReducedMotion()) {
        return () => window.removeEventListener("resize", onResize);
      }

      let split: SplitText | null = null;
      let sub: SplitText | null = null;
      const unsub = whenReady(() => {
        const played = document.documentElement.dataset.preloaderPlayed === "true";
        document.fonts.ready.then(() => {
          fit();
          split = SplitText.create(word, { type: "chars", mask: "chars" });
          sub = SplitText.create(q(".hero-sub")[0], { type: "words", mask: "words" });
          gsap.set(q("[data-hero-hide]"), { visibility: "visible" });
          const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
          tl.from(split.chars, { yPercent: 105, duration: 1.25, stagger: 0.045 }, 0)
            .from(sub.words, { yPercent: 105, duration: 1.1, stagger: 0.035 }, 0.35)
            .from(q(".hero-fade"), { opacity: 0, y: 22, duration: 1, stagger: 0.07 }, 0.5)
            .from(q(".hero-thumb"), { opacity: 0, y: 26, scale: 0.8, duration: 0.9, stagger: 0.06, ease: "back.out(1.8)" }, 0.7);
          if (!played) {
            gsap.set(product, { visibility: "visible" });
            tl.from(product, { yPercent: 35, rotate: 8, opacity: 0, duration: 1.5 }, 0.15);
          } else {
            // safety net: the preloader normally reveals it during the handoff
            gsap.delayedCall(0.9, () => void gsap.set(product, { visibility: "visible" }));
          }
        });
      });

      // scroll away: the bake rises and tilts, the word sinks slower
      const st = { trigger: ref.current, start: "top top", end: "bottom top", scrub: true };
      gsap.to(product, { yPercent: -14, rotate: 5, ease: "none", scrollTrigger: st });
      gsap.to(word, { yPercent: 28, ease: "none", scrollTrigger: st });

      return () => {
        unsub();
        split?.revert();
        sub?.revert();
        window.removeEventListener("resize", onResize);
      };
    },
    { scope: ref },
  );

  const choose = contextSafe((i: number) => {
    const prev = activeRef.current;
    if (i === prev) return;
    activeRef.current = i;
    setActive(i);
    const imgs = gsap.utils.toArray<HTMLElement>(".hp-img", ref.current);
    if (prefersReducedMotion()) {
      gsap.set(imgs, { opacity: 0 });
      gsap.set(imgs[i], { opacity: 1 });
      return;
    }
    gsap.killTweensOf(imgs);
    gsap.to(imgs[prev], { yPercent: 16, rotate: 12, scale: 0.86, opacity: 0, duration: 0.45, ease: "power2.in" });
    gsap.fromTo(
      imgs[i],
      { yPercent: -12, rotate: -12, scale: 0.86, opacity: 0 },
      { yPercent: 0, rotate: 0, scale: 1, opacity: 1, duration: 1, ease: "expo.out", delay: 0.18 },
    );
  });

  return (
    <section ref={ref} className="relative flex min-h-[100svh] flex-col overflow-hidden bg-bark text-butter">
      <div className="doodles pointer-events-none absolute inset-0" />

      <div className="relative mx-auto flex w-full max-w-[1320px] flex-1 flex-col px-5 pt-[92px] sm:px-8 sm:pt-[104px]">
        {/* the giant word, fitted to the container width */}
        <div className="fit-box min-w-0">
          <h1 className="text-butter">
            <span className="sr-only">Kensal Bakes: </span>
            <span className="hero-word mega block w-max whitespace-nowrap text-[15vw] md:text-[13vw]" data-hero-hide>
              Cakes &amp; Cookies
            </span>
          </h1>
        </div>

        <div className="relative grid flex-1 grid-cols-1 gap-6 pt-6 sm:gap-8 md:grid-cols-[1fr_minmax(0,1.15fr)_1fr] md:gap-6 md:pb-0 md:pt-10">
          {/* left: tagline + button */}
          <div className="relative z-10 flex min-w-0 flex-col md:justify-center md:pb-24">
            <p className="hero-sub font-display text-[2.6rem] font-[620] leading-[0.98] tracking-[-0.015em] sm:text-[3.4rem] md:text-[2.9rem] lg:text-[3.6rem] xl:text-[4.1rem]" data-hero-hide>
              Made with love, for life&apos;s sweetest moments
            </p>
            <div className="hero-fade mt-7 flex flex-wrap gap-2.5 sm:mt-8 sm:gap-3" data-hero-hide>
              <Btn href="/menu" variant="butter" chevrons={false} className="max-sm:px-4">
                See the menu
              </Btn>
              <Btn href="/order" variant="line" className="text-butter max-sm:px-4">
                Start an order
              </Btn>
            </div>
          </div>

          {/* centre: the bake (bleeds off the bottom like the reference) */}
          <div className="relative order-last -mx-5 flex min-h-[78vw] items-end justify-center sm:min-h-[60vw] md:order-none md:mx-0 md:min-h-0">
            <div id="hero-product" className="relative -mb-[14%] aspect-square w-[min(108vw,560px)] md:absolute md:bottom-0 md:mb-[-16%] md:w-[min(54vw,82vh,780px)]">
              <div className="absolute inset-0 animate-[bob_6s_ease-in-out_infinite]">
                {HERO_PRODUCTS.map((p, i) => (
                  <div key={p.id} className="hp-img absolute inset-0" style={{ opacity: i === 0 ? 1 : 0 }}>
                    <Image
                      src={p.src}
                      alt={i === active ? p.name : ""}
                      fill
                      priority={i === 0}
                      sizes="(max-width: 768px) 80vw, 560px"
                      className="object-contain drop-shadow-[0_30px_35px_rgba(0,0,0,0.28)]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* right: note + thumbnails */}
          <div className="relative z-10 flex min-w-0 flex-col justify-between gap-8 md:pb-8 md:pt-16">
            <div className="hidden max-w-[300px] md:block">
              <div className="hero-fade inline-flex items-center gap-3 rounded-full bg-butter/12 py-1.5 pl-1.5 pr-4" data-hero-hide>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-butter text-bark">
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="m5 10.5 3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="leading-tight">
                  <span className="block text-[12px] font-semibold">Level 2 Food Hygiene</span>
                  <span className="block text-[11px] text-butter/70">Certified home kitchen</span>
                </span>
              </div>
              <p className="hero-fade copy mt-5 text-[12.5px] text-butter/75" data-hero-hide>
                Filled cookies, cupcakes and celebration cakes, baked to order in a little Kensal Rise kitchen and tied with a ribbon for collection.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:flex-nowrap md:justify-end" role="group" aria-label="Show a different bake">
              {HERO_PRODUCTS.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => choose(i)}
                  aria-pressed={i === active}
                  aria-label={`Show ${p.name}`}
                  className={`hero-thumb relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-[#f3e6cb] transition-[box-shadow,translate] duration-300 hover:-translate-y-0.5 md:h-12 md:w-12 lg:h-[58px] lg:w-[58px] ${
                    i === active ? "shadow-[0_0_0_2.5px_#f4eec6]" : "shadow-[0_0_0_1px_rgba(244,238,198,0.35)]"
                  }`}
                  data-hero-hide
                >
                  <Image src={p.thumb} alt="" fill sizes="64px" className="object-contain p-1.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Red band: the signature bakes ────────────────────────────────────────────
function SignatureBand() {
  const ref = useRef<HTMLElement>(null);
  const { available } = useStore();
  const picks = ["biscoff", "kinder-bueno", "pistachio", "vintage-heart"].map((id) => menu.find((m) => m.id === id)!);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // cards deal onto the table, alternating tilt
        gsap.fromTo(
          ".product-card",
          { yPercent: 40, rotate: (i) => (i % 2 ? 5 : -5), opacity: 0 },
          {
            yPercent: 0,
            rotate: 0,
            opacity: 1,
            duration: 1.2,
            ease: "expo.out",
            stagger: 0.09,
            scrollTrigger: { trigger: ".sig-grid", start: "top 82%", once: true },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="relative bg-crimson text-butter">
      <div className="relative mx-auto max-w-[1320px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6" data-reveal>
          <h2 className="heading text-[3.3rem] sm:text-[4.6rem] lg:text-[5.4rem]">Our signature bakes</h2>
          <Btn href="/menu" variant="paper">
            View the whole menu
          </Btn>
        </div>
        <div className="sig-grid mt-12 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {picks.map((item, i) => {
            const off = !available[item.id];
            return (
              <ProductCard
                key={item.id}
                item={item}
                off={off}
                accent={i === 1}
                href={`/order?type=${item.category}&flavour=${item.id}`}
                cta={item.category === "cakes" ? "Enquire" : "Add to box"}
              />
            );
          })}
        </div>
        <div className="mt-8 flex justify-end">
          <DemoTag className="border-butter/50 text-butter/85">Demo prices</DemoTag>
        </div>
      </div>
    </section>
  );
}

// ── Feature: the heart cake ──────────────────────────────────────────────────
function HeartCakeFeature() {
  const ref = useRef<HTMLElement>(null);
  const cake = menu.find((m) => m.id === "vintage-heart")!;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".hf-rail",
          { xPercent: 6 },
          { xPercent: -14, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true } },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const frames = [
    { src: "/images/heart-cake-cutout.png", alt: "Vintage heart cake with pink piping and bows", cut: true },
    { src: "/images/vintage-heart-cake.jpg", alt: "Vintage heart cake from above", cut: false },
    { src: "/images/heart-cake.jpg", alt: "Heart cake, piped by hand", cut: false },
  ];

  return (
    <section ref={ref} className="relative overflow-hidden bg-cream">
      <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-5 py-24 sm:px-8 sm:py-32 md:grid-cols-[0.9fr_1.1fr]">
        <div className="min-w-0 md:pr-6" data-reveal>
          <h2 className="heading text-[3.1rem] text-ink sm:text-[4.4rem]">Vintage heart cakes, piped by hand</h2>
          <p className="mt-6 flex items-baseline gap-3">
            <span className="font-mono text-[1.7rem] font-medium text-crimson">from {money(cake.price)}</span>
            <span className="copy text-mocha">order 7 days ahead</span>
          </p>
          <p className="copy mt-6 max-w-[52ch] text-cocoa">
            Lambeth-style piping, little ribbon bows and your message across the top. Choose the sponge, the colours and the size, from a
            4-inch bento for two up to two tiers for a party.
          </p>
          <p className="copy mt-4 max-w-[52ch] text-cocoa">Every cake is baked for its own order, so nothing sits on a shelf.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Btn href={`/order?type=cakes&flavour=${cake.id}`} variant="crimson" chevrons={false}>
              Start a cake enquiry
            </Btn>
          </div>
        </div>

        <div className="relative min-w-0">
          <div className="hf-rail flex w-max gap-5">
            {frames.map((f, i) => (
              <div
                key={f.src}
                className={`relative aspect-[4/5] w-[68vw] shrink-0 overflow-hidden rounded-[16px] border-[1.5px] border-crimson/70 bg-[#efdfc3] sm:w-[340px] lg:w-[380px] ${i === 1 ? "md:mt-16" : ""}`}
              >
                <Image src={f.src} alt={f.alt} fill sizes="(max-width: 768px) 68vw, 380px" className={f.cut ? "object-contain p-8" : "object-cover"} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── The Christmas cookie menu (brown tile with vertical words) ──────────────
function ChristmasCookies() {
  const ref = useRef<HTMLElement>(null);
  const { settings, available } = useStore();
  const cookies = menu.filter((m) => m.category === "cookies");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const st = { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true };
        gsap.fromTo(".xm-left", { yPercent: 30 }, { yPercent: -30, ease: "none", scrollTrigger: st });
        gsap.fromTo(".xm-right", { yPercent: -30 }, { yPercent: 30, ease: "none", scrollTrigger: st });
        gsap.fromTo(".xm-cookie", { rotate: -25, scale: 0.9 }, { rotate: 20, scale: 1.05, ease: "none", scrollTrigger: st });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="relative bg-cream">
      <div className="mx-auto grid max-w-[1320px] items-center gap-10 px-5 pb-24 sm:px-8 sm:pb-32 md:grid-cols-[1fr_1fr] lg:gap-16">
        <div className="relative aspect-square overflow-hidden rounded-[14px] bg-bark sm:aspect-[5/4]" data-reveal>
          <div className="doodles absolute inset-0" />
          <div className="absolute inset-y-0 left-[4%] flex items-center">
            <span className="xm-left heading block text-[clamp(4.5rem,11vw,9.5rem)] text-butter [writing-mode:vertical-rl]" style={{ rotate: "180deg" }}>
              Filled
            </span>
          </div>
          <div className="absolute inset-y-0 right-[4%] flex items-center">
            <span className="xm-right heading block text-[clamp(4.5rem,11vw,9.5rem)] text-butter [writing-mode:vertical-rl]">Gooey</span>
          </div>
          <div className="absolute inset-[12%]">
            <div className="xm-cookie relative h-full w-full">
              <Image src="/images/kinder-bueno-cutout.png" alt="Kinder Bueno filled cookie broken open" fill sizes="(max-width: 768px) 60vw, 380px" className="object-contain drop-shadow-[0_24px_24px_rgba(0,0,0,0.35)]" />
            </div>
          </div>
        </div>

        <div className="min-w-0" data-reveal>
          <p className="ui inline-block rounded-[3px] bg-crimson px-2.5 py-1.5 text-[11px] text-butter">Limited time only</p>
          <h2 className="heading mt-5 text-[3.1rem] text-ink sm:text-[4.4rem]">The Christmas cookie menu is here</h2>
          <p className="copy mt-6 max-w-[50ch] text-cocoa">
            Six filled cookies, boxed in sixes, twelves and twenty-fours. Christmas orders close {formatLong(settings.christmasCutoff)}.
          </p>
          <ul className="mt-8 border-t border-line">
            {cookies.map((c) => {
              const off = !available[c.id];
              return (
                <li key={c.id} className="flex items-baseline justify-between gap-4 border-b border-line py-3">
                  <span className={`font-display text-[1.35rem] font-[560] leading-none ${off ? "text-mocha line-through" : "text-ink"}`}>
                    {c.name}
                    {c.christmas && !off && <span className="ui ml-3 align-middle text-[10px] text-crimson">Christmas</span>}
                  </span>
                  <span className="shrink-0 font-mono text-[13.5px] text-cocoa">{off ? "Sold out" : money(c.price)}</span>
                </li>
              );
            })}
          </ul>
          <Btn href="/order?type=cookies" variant="crimson" className="mt-8">
            Order a Christmas box
          </Btn>
        </div>
      </div>
    </section>
  );
}

// ── Marquee (red band, condensed caps) ───────────────────────────────────────
function Marquee() {
  const words = ["Cookies", "Cupcakes", "Cakes", "Favours", "Gift boxes", "Made to order"];
  const row = (
    <div className="flex shrink-0 items-center">
      {words.map((w) => (
        <span key={w} className="flex items-center">
          <span className="heading px-6 text-[3rem] text-butter sm:text-[4.2rem]">{w}</span>
          <span className="h-3 w-3 rounded-full bg-butter sm:h-4 sm:w-4" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="relative overflow-hidden bg-crimson py-4 sm:py-5" aria-hidden>
      <div className="flex w-max animate-[marquee_34s_linear_infinite]">
        {row}
        {row}
        {row}
        {row}
      </div>
    </div>
  );
}

// ── How to order ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const steps = [
    { title: "Choose your treats", body: "Browse the menu and pick your flavours. Seasonal specials are marked, so you know what's only here for a little while." },
    { title: "Send one enquiry", body: "Date, quantities, collection time, allergies and your message, all in one go. No more back-and-forth in the DMs." },
    { title: "Confirm and collect", body: "You'll get a confirmed quote by DM. Then collect your ribbon-tied box in Kensal Rise." },
  ];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".how-num", {
          yPercent: 100,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.12,
          scrollTrigger: { trigger: ".how-panel", start: "top 75%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section id="how" ref={ref} className="relative scroll-mt-20 bg-ivory">
      <div className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 sm:py-32">
        <h2 className="heading mx-auto max-w-[14ch] text-center text-[3.1rem] text-ink sm:text-[4.4rem]" data-reveal>
          Three steps, one message
        </h2>
        <div className="how-panel relative mt-12 overflow-hidden rounded-[18px] bg-bark px-6 py-10 text-butter sm:px-12 sm:py-14" data-reveal>
          <div className="doodles pointer-events-none absolute inset-0" />
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-butter/15">
            {steps.map((s, i) => (
              <li key={s.title} className="md:px-10 md:first:pl-0 md:last:pr-0">
                <span className="block overflow-hidden">
                  <span className="how-num mega block text-[6.5rem] text-butter/90">{i + 1}</span>
                </span>
                <h3 className="mt-3 font-display text-[1.9rem] font-[620] leading-none">{s.title}</h3>
                <p className="copy mt-3 text-butter/75">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="relative mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-butter/15 pt-8">
            <p className="copy max-w-md text-butter/75">Everything needed to quote you, gathered in one tidy enquiry instead of a long DM thread.</p>
            <Btn href="/order" variant="butter">
              Start an order
            </Btn>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Collection + blue light + closing call ──────────────────────────────────
function GoodToKnow() {
  const ref = useRef<HTMLElement>(null);
  const { settings } = useStore();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1280px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".gk-croissant",
          { yPercent: 40, rotate: -20 },
          { yPercent: -10, rotate: 6, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom bottom", scrub: true } },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="relative overflow-hidden bg-cream">
      <div className="relative mx-auto max-w-[1320px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-3xl text-center" data-reveal>
          <h2 className="heading text-[3.3rem] text-ink sm:text-[5rem]">Something sweet in mind?</h2>
          <p className="copy mx-auto mt-5 max-w-md text-cocoa">Tell us what you&apos;re celebrating. It takes about two minutes, and you&apos;ll hear back by DM.</p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-2">
          <div className="rounded-[14px] border border-line bg-paper p-7 sm:p-8" data-reveal>
            <h3 className="font-display text-[2rem] font-[620] leading-none text-ink">Collect in Kensal Rise</h3>
            <div className="mt-6 border-t border-line">
              <Row label="Days" value="Tuesday to Saturday" />
              <Row label="Slots" value="Morning, afternoon, evening" />
              <Row label="Address" value="Shared once confirmed" />
            </div>
          </div>
          <div className="rounded-[14px] bg-crimson p-7 text-butter sm:p-8" data-reveal>
            <h3 className="font-display text-[2rem] font-[620] leading-none">Blue light discount</h3>
            <p className="copy mt-6 text-butter/80">
              For NHS staff, emergency services, social care workers and the armed forces. Tick the box when you enquire and bring your card to collection.
            </p>
            <p className="mt-6 flex items-center gap-3">
              <span className="mega text-[3.6rem]">{settings.blueLightPct}% off</span>
              <DemoTag className="border-butter/50 text-butter/85">Demo figure</DemoTag>
            </p>
          </div>
        </div>

        <div className="mt-12 flex justify-center" data-reveal>
          <Btn href="/order" variant="crimson">
            Start an order
          </Btn>
        </div>
      </div>
      <div className="gk-croissant pointer-events-none absolute -bottom-12 -right-20 hidden w-[320px] xl:block 2xl:w-[400px]">
        <Image src="/images/croissant-cutout.png" alt="" width={760} height={760} className="h-auto w-full drop-shadow-[0_30px_30px_rgba(43,31,26,0.3)]" />
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-3">
      <span className="ui text-[11px] text-mocha">{label}</span>
      <span className="text-right font-mono text-[13px] text-ink">{value}</span>
    </div>
  );
}
