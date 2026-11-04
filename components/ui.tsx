"use client";

// Shared building blocks for the poster-style system: buttons with a rising
// fill and rolling label, the wordmark, product cards and the inner-page header.

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP, SplitText, whenReady, prefersReducedMotion } from "@/lib/motion";
import type { MenuItem } from "@/lib/mock-data";
import { Placeholder } from "./art";
import { TLink } from "./providers";

// ── Fit a single line of type to the width of its `.fit-box` ancestor ──────
export function fitToWidth(el: HTMLElement, maxVw = Infinity) {
  const box = el.closest(".fit-box") as HTMLElement | null;
  if (!box) return;
  el.style.fontSize = "100px";
  const w = el.scrollWidth;
  if (w > 0) el.style.fontSize = `${Math.min((100 * box.clientWidth) / w, (maxVw / 100) * window.innerWidth)}px`;
}

// ── Icons ────────────────────────────────────────────────────────────────────
export function Chevrons({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 12" className={`chev h-[0.8em] w-[1em] ${className}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M2 1.5 6.5 6 2 10.5M8.5 1.5 13 6l-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden>
      <path d="m10 1.6 2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.5l-5.1 2.8L6 11.6l-4.3-4 5.8-.7z" />
    </svg>
  );
}

// ── Buttons ──────────────────────────────────────────────────────────────────
type Variant = "butter" | "paper" | "bark" | "crimson" | "ink" | "line";

function Roll({ children }: { children: React.ReactNode }) {
  return (
    <span className="roll">
      <span>
        <span>{children}</span>
        <span aria-hidden>{children}</span>
      </span>
    </span>
  );
}

export function Btn({
  href,
  onClick,
  variant = "butter",
  size,
  chevrons = true,
  className = "",
  children,
  type = "button",
  disabled,
  ...rest
}: {
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  variant?: Variant;
  size?: "sm";
  chevrons?: boolean;
  className?: string;
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
} & Omit<React.HTMLAttributes<HTMLElement>, "onClick">) {
  const cls = `btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${disabled ? "pointer-events-none opacity-40" : ""} ${className}`;
  const inner = (
    <>
      <Roll>{children}</Roll>
      {chevrons && <Chevrons />}
    </>
  );
  if (href)
    return (
      <TLink href={href} onClick={onClick} className={cls} {...rest}>
        {inner}
      </TLink>
    );
  return (
    <button type={type} onClick={onClick} className={cls} disabled={disabled} {...rest}>
      {inner}
    </button>
  );
}

// ── Wordmark ─────────────────────────────────────────────────────────────────
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`block whitespace-nowrap text-[1.7rem] leading-none tracking-[-0.02em] sm:text-[1.95rem] ${className}`}
      style={{ fontFamily: "var(--font-archivo)", fontVariationSettings: '"wdth" 88', fontWeight: 900 }}
    >
      KENSAL BAKES
    </span>
  );
}

// ── Product card (the reference's cream card with a beige well) ─────────────
export function money(n: number) {
  return `£${n.toFixed(2).padStart(5, "0")}`;
}

export function ProductCard({
  item,
  accent = false,
  off = false,
  href,
  cta = "Add to box",
  showDescription = false,
  className = "",
}: {
  item: MenuItem;
  accent?: boolean;
  off?: boolean;
  href: string;
  cta?: string;
  showDescription?: boolean;
  className?: string;
}) {
  return (
    <article className={`product-card group relative flex flex-col rounded-[14px] bg-[#fbf3dd] p-2 shadow-[0_24px_40px_-30px_rgba(43,31,26,0.55)] ${className}`}>
      <div className="relative aspect-square overflow-hidden rounded-[10px] bg-[#eedfc3]">
        {item.cutout ? (
          <Image
            src={item.cutout}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 80vw, 320px"
            className={`object-contain p-[9%] transition-transform duration-700 ease-[var(--ease-silk)] group-hover:-translate-y-1.5 group-hover:rotate-[-4deg] group-hover:scale-[1.06] ${off ? "grayscale-[0.8]" : ""}`}
          />
        ) : (
          <Placeholder
            art={item.art}
            tone={item.tone}
            festive={item.christmas}
            image={item.image}
            alt={item.name}
            className={`absolute inset-0 ${off ? "grayscale-[0.8]" : ""}`}
            artClassName="transition-transform duration-700 ease-[var(--ease-silk)] group-hover:scale-[1.06] group-hover:-rotate-3"
          />
        )}
        {(item.christmas || item.seasonal) && (
          <span className="ui absolute left-2.5 top-2.5 rounded-[3px] bg-crimson px-2 py-1.5 text-[10px] text-butter">
            {item.christmas ? "Christmas" : "Seasonal"}
          </span>
        )}
        {off && (
          <span className="absolute inset-0 grid place-items-center bg-ink/40 font-display text-3xl text-butter">Sold out for now</span>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-3 px-2 pb-3 pt-4">
        <h3 className="font-display text-[1.45rem] font-[560] leading-[1.02] tracking-[-0.015em] text-ink">{item.name}</h3>
        <span className="shrink-0 font-mono text-[15px] font-medium text-ink">
          {item.priceNote === "from" && <span className="mr-1 text-[11px] font-normal text-mocha">from</span>}
          {money(item.price)}
        </span>
      </div>
      {item.priceNote !== "from" && <p className="-mt-2 px-2 pb-3 font-mono text-[11.5px] text-mocha">{item.priceNote}</p>}
      {showDescription && <p className="copy -mt-1 px-2 pb-4 text-[12.5px] text-cocoa">{item.description}</p>}
      <div className="mt-auto px-2 pb-2">
        {off ? (
          <span className="ui block rounded-[4px] bg-oat py-3 text-center text-mocha">Back soon</span>
        ) : (
          <Btn href={href} variant={accent ? "crimson" : "bark"} size="sm" chevrons={false} className="w-full">
            {cta}
          </Btn>
        )}
      </div>
    </article>
  );
}

// ── Inner page header: giant word on the bark field ─────────────────────────
export function PageHeader({
  word,
  line,
  body,
  fact,
  image,
  imageAlt = "",
  children,
}: {
  word: string;
  line: string;
  body: string;
  fact?: React.ReactNode;
  image?: string;
  imageAlt?: string;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(ref);
      const wordEl = q(".ph-word")[0] as HTMLElement;
      const fit = () => fitToWidth(wordEl, 26);
      fit();
      document.fonts.ready.then(fit);
      window.addEventListener("resize", fit);
      if (prefersReducedMotion()) return () => window.removeEventListener("resize", fit);
      let split: SplitText | null = null;
      const unsub = whenReady(() => {
        document.fonts.ready.then(() => {
          fit();
          split = SplitText.create(q(".ph-word")[0], { type: "chars", mask: "chars" });
          gsap.set(q("[data-hero-hide]"), { visibility: "visible" });
          const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
          tl.from(split.chars, { yPercent: 105, duration: 1.2, stagger: 0.04 }, 0)
            .from(q(".ph-line"), { yPercent: 100, duration: 1.1 }, 0.25)
            .from(q(".ph-fade"), { opacity: 0, y: 18, duration: 1, stagger: 0.08 }, 0.35)
            .from(q(".ph-img"), { yPercent: 30, rotate: 10, opacity: 0, duration: 1.4 }, 0.15);
        });
      });
      // the word drifts up as you scroll away
      gsap.to(q(".ph-word"), {
        yPercent: -18,
        ease: "none",
        scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: true },
      });
      return () => {
        unsub();
        split?.revert();
        window.removeEventListener("resize", fit);
      };
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="relative overflow-hidden bg-bark text-butter">
      <div className="doodles pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-[1320px] px-5 pb-12 pt-28 sm:px-8 sm:pb-16 sm:pt-36">
        <h1 className="sr-only">
          {word}: {line}
        </h1>
        <div className="fit-box min-w-0">
          <p className="ph-word mega w-max whitespace-nowrap text-[22vw] text-butter" aria-hidden data-hero-hide>
            {word}
          </p>
        </div>
        <div className="mt-6 grid min-w-0 gap-8 md:mt-10 md:grid-cols-[1.2fr_1fr] md:items-end">
          <div className="min-w-0">
            <p className="overflow-hidden" aria-hidden>
              <span className="ph-line block font-display text-[2.3rem] font-[620] leading-[0.95] sm:text-[3.4rem]" data-hero-hide>
                {line}
              </span>
            </p>
            <p className="ph-fade copy mt-5 max-w-md text-butter/75" data-hero-hide>
              {body}
            </p>
            {children && (
              <div className="ph-fade mt-7" data-hero-hide>
                {children}
              </div>
            )}
          </div>
          {(fact || image) && (
            <div className="flex min-w-0 items-end gap-6 md:justify-self-end">
              {fact && (
                <div className="ph-fade min-w-0 md:text-right" data-hero-hide>
                  {fact}
                </div>
              )}
              {image && (
                <div className="ph-img pointer-events-none relative -mb-24 hidden w-[22vw] max-w-[330px] shrink-0 lg:block" data-hero-hide>
                  <Image src={image} alt={imageAlt} width={500} height={500} className="h-auto w-full drop-shadow-[0_30px_30px_rgba(0,0,0,0.3)]" priority />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
