"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, useGSAP, Flip, whenReady, prefersReducedMotion, getLenis } from "@/lib/motion";
import { gallery, type GalleryItem } from "@/lib/mock-data";
import { Placeholder } from "./art";
import { Btn, PageHeader } from "./ui";

const FILTERS = ["All", "Cakes", "Cupcakes", "Cookies", "Bakes", "Gifting"] as const;
type Filter = (typeof FILTERS)[number];

const SHAPE: Record<GalleryItem["shape"], string> = {
  tall: "row-span-3",
  square: "row-span-2",
  wide: "col-span-2 row-span-2",
};

export default function Gallery() {
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [open, setOpen] = useState<number | null>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const { contextSafe } = useGSAP({ scope: root });

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      return whenReady(() => {
        gsap.fromTo(
          ".gal-tile",
          { opacity: 0, y: 50, clipPath: "inset(12% 0% 0% 0% round 14px)" },
          { opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0% round 14px)", duration: 1.2, ease: "expo.out", stagger: { each: 0.05, from: "start" }, delay: 0.45, clearProps: "clipPath" },
        );
      });
    },
    { scope: root },
  );

  const choose = contextSafe((f: Filter) => {
    if (f === filter) return;
    if (!prefersReducedMotion()) flipState.current = Flip.getState(".gal-tile");
    setFilter(f);
  });

  // Animate the reflow after React re-renders the filtered grid
  useGSAP(
    () => {
      if (!flipState.current) return;
      Flip.from(flipState.current, {
        duration: 0.75,
        ease: "expo.inOut",
        absolute: true,
        scale: true,
        stagger: 0.02,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.9, duration: 0.4 }),
      });
      flipState.current = null;
    },
    { scope: root, dependencies: [filter] },
  );

  const visible = gallery.filter((g) => filter === "All" || g.category === filter);

  return (
    <div ref={root} className="relative pb-24 sm:pb-32">
      <PageHeader
        word="Gallery"
        line="A little sweetness, boxed and tied"
        body="Cakes, cupcakes, cookies and gift boxes from the Kensal Rise kitchen. Tap any bake to see it bigger."
        image="/images/donut-cutout.png"
        fact={<span className="mega whitespace-nowrap text-[3.4rem] text-butter">{gallery.length} bakes</span>}
      />
      <div className="mx-auto mt-12 flex max-w-[1320px] flex-wrap justify-center gap-2 px-5" role="tablist" aria-label="Filter gallery">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => choose(f)}
            className={`ui rounded-[4px] px-5 py-3 text-[12px] transition-colors duration-300 ${
              filter === f ? "bg-crimson text-butter" : "bg-ivory text-cocoa hover:bg-oat hover:text-ink"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div
        ref={grid}
        className="relative mx-auto mt-10 grid max-w-[1320px] auto-rows-[96px] grid-flow-dense grid-cols-2 gap-3 px-4 sm:auto-rows-[110px] sm:gap-5 sm:px-8 md:grid-cols-3 lg:grid-cols-4"
      >
        {visible.map((g) => (
          <button
            key={g.id}
            data-flip-id={g.id}
            onClick={() => setOpen(gallery.indexOf(g))}
            className={`gal-tile group relative overflow-hidden rounded-[14px] bg-ivory text-left ${SHAPE[g.shape]}`}
            aria-label={`Open ${g.title}`}
          >
            <Placeholder
              art={g.art}
              tone={g.tone}
              image={g.image}
              alt={g.title}
              className="absolute inset-0"
              artClassName="transition-transform duration-[1.2s] ease-[var(--ease-silk)] group-hover:scale-[1.08]"
            />
            <span className="absolute inset-x-2 bottom-2 flex translate-y-2 items-center justify-between gap-3 rounded-[8px] bg-[#fbf3dd] px-3 py-2.5 opacity-0 transition-[opacity,translate] duration-500 ease-[var(--ease-silk)] group-hover:translate-y-0 group-hover:opacity-100">
              <span className="font-display text-[1.15rem] font-[600] leading-tight text-ink">{g.title}</span>
              <span className="ui shrink-0 text-[10px] text-crimson">{g.category}</span>
            </span>
          </button>
        ))}
      </div>

      {open !== null && <Lightbox index={open} setIndex={setOpen} grid={grid} />}
    </div>
  );
}

function Lightbox({ index, setIndex, grid }: { index: number; setIndex: (i: number | null) => void; grid: React.RefObject<HTMLDivElement | null> }) {
  const overlay = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(index);
  const item = gallery[i];
  const closing = useRef(false);

  const tileRect = (id: string) => grid.current?.querySelector<HTMLElement>(`[data-flip-id="${id}"]`)?.getBoundingClientRect();

  // grow from the clicked tile
  useGSAP(() => {
    getLenis()?.stop();
    const from = tileRect(item.id);
    const to = frame.current!.getBoundingClientRect();
    gsap.fromTo(overlay.current, { backgroundColor: "rgba(43,31,26,0)" }, { backgroundColor: "rgba(43,31,26,0.86)", duration: 0.6 });
    gsap.fromTo(".lb-ui", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.35, stagger: 0.05 });
    if (from && !prefersReducedMotion()) {
      gsap.fromTo(
        frame.current,
        { x: from.left - to.left, y: from.top - to.top, scaleX: from.width / to.width, scaleY: from.height / to.height, transformOrigin: "0 0", borderRadius: 24 },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: 16, duration: 0.8, ease: "expo.inOut" },
      );
    }
    return () => getLenis()?.start();
  });

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const from = frame.current!.getBoundingClientRect();
    const to = tileRect(item.id);
    gsap.to(".lb-ui", { opacity: 0, duration: 0.2 });
    gsap.to(overlay.current, { backgroundColor: "rgba(43,31,26,0)", duration: 0.55 });
    if (to && !prefersReducedMotion()) {
      gsap.to(frame.current, {
        x: to.left - from.left,
        y: to.top - from.top,
        scaleX: to.width / from.width,
        scaleY: to.height / from.height,
        transformOrigin: "0 0",
        duration: 0.6,
        ease: "expo.inOut",
        onComplete: () => setIndex(null),
      });
    } else setIndex(null);
  }, [item.id, setIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const step = useCallback(
    (n: number) => {
      const next = (i + n + gallery.length) % gallery.length;
      gsap.to(".lb-art", {
        opacity: 0,
        x: -30 * n,
        duration: 0.2,
        onComplete: () => {
          setI(next);
          requestAnimationFrame(() => gsap.fromTo(".lb-art", { opacity: 0, x: 30 * n }, { opacity: 1, x: 0, duration: 0.5, ease: "expo.out" }));
        },
      });
    },
    [i],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, step]);

  return (
    <div ref={overlay} className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-10" onClick={close} role="dialog" aria-modal aria-label={item.title}>
      <div className="flex w-full max-w-5xl flex-col items-center gap-5 lg:flex-row lg:items-end" onClick={(e) => e.stopPropagation()}>
        <div ref={frame} className="relative aspect-square w-full max-w-[min(78vh,640px)] overflow-hidden rounded-[16px]">
          <div className="lb-art absolute inset-0">
            <Placeholder art={item.art} tone={item.tone} image={item.image} alt={item.title} className="absolute inset-0" />
          </div>
        </div>
        <div className="w-full max-w-[min(78vh,640px)] text-cream lg:max-w-xs lg:pb-2">
          <p className="lb-ui ui text-[11px] text-ribbon">{item.category}</p>
          <h2 className="lb-ui heading mt-3 text-[3rem] text-butter">{item.title}</h2>
          <p className="lb-ui copy mt-2 text-butter/60">{item.image ? "Photo from the Kensal Bakes kitchen" : "Illustrated placeholder: a real photo drops in here"}</p>
          <div className="lb-ui mt-6 flex items-center gap-2">
            <button onClick={() => step(-1)} className="grid h-11 w-11 place-items-center rounded-[4px] border border-butter/30 text-butter hover:bg-butter/10" aria-label="Previous">
              ←
            </button>
            <button onClick={() => step(1)} className="grid h-11 w-11 place-items-center rounded-[4px] border border-butter/30 text-butter hover:bg-butter/10" aria-label="Next">
              →
            </button>
            <span className="ml-2 font-mono text-[12px] tabular-nums text-butter/60">
              {i + 1} / {gallery.length}
            </span>
          </div>
          <div className="lb-ui mt-6">
            <Btn href="/order" variant="butter">
              Order something similar
            </Btn>
          </div>
        </div>
      </div>
      <button onClick={close} className="lb-ui absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-[4px] bg-butter/15 text-butter hover:bg-butter/25 sm:right-8 sm:top-8" aria-label="Close">
        ✕
      </button>
    </div>
  );
}
