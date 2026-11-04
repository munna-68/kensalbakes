"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { gsap, useGSAP, whenReady, revealOnScroll, prefersReducedMotion } from "@/lib/motion";
import { menu, type MenuCategory } from "@/lib/mock-data";
import { formatLong } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { DemoTag } from "./art";
import { Btn, PageHeader, ProductCard } from "./ui";

const TABS: { id: MenuCategory; label: string }[] = [
  { id: "cookies", label: "Cookies" },
  { id: "cupcakes", label: "Cupcakes" },
  { id: "cakes", label: "Cakes" },
];

export default function Menu() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = (TABS.find((t) => t.id === params.get("tab"))?.id ?? "cookies") as MenuCategory;
  const [tab, setTab] = useState<MenuCategory>(initial);
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const tabBar = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const switching = useRef(false);
  const { contextSafe } = useGSAP({ scope: root });

  // header entrance
  useGSAP(
    () => {
      revealOnScroll(root.current!);
      if (prefersReducedMotion()) return;
      return whenReady(() => {
        gsap.fromTo(".menu-card", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.5 });
      });
    },
    { scope: root },
  );

  // slide the pill indicator under the active tab
  const moveIndicator = (id: MenuCategory, instant = false) => {
    const btn = tabBar.current?.querySelector<HTMLElement>(`[data-tab="${id}"]`);
    if (!btn || !indicator.current) return;
    gsap.to(indicator.current, {
      x: btn.offsetLeft,
      width: btn.offsetWidth,
      duration: instant ? 0 : 0.7,
      ease: "expo.out",
    });
  };
  useLayoutEffect(() => moveIndicator(tab, true), []); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = contextSafe((id: MenuCategory) => {
    if (id === tab || switching.current) return;
    moveIndicator(id);
    router.replace(`/menu?tab=${id}`, { scroll: false });
    if (prefersReducedMotion()) {
      setTab(id);
      return;
    }
    switching.current = true;
    gsap.to(".menu-card, .menu-intro", {
      opacity: 0,
      y: -14,
      duration: 0.3,
      ease: "power2.in",
      stagger: 0.025,
      onComplete: () => {
        setTab(id);
        requestAnimationFrame(() => {
          gsap.fromTo(".menu-intro", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, ease: "expo.out" });
          gsap.fromTo(
            ".menu-card",
            { opacity: 0, y: 34 },
            { opacity: 1, y: 0, duration: 0.95, ease: "expo.out", stagger: 0.06, onComplete: () => void (switching.current = false) },
          );
        });
      },
    });
  });

  const items = menu.filter((m) => m.category === tab);

  return (
    <div ref={root} className="relative">
      <PageHeader
        word="Menu"
        line="Baked to order, boxed with love"
        body="Pick a favourite or mix a box. Seasonal flavours are only here for a little while."
        image="/images/biscoff-cookie-cutout.png"
        fact={
          <div className="flex flex-col gap-2 md:items-end">
            <span className="mega whitespace-nowrap text-[3.4rem] text-butter">{menu.length} bakes</span>
            <DemoTag className="border-butter/50 text-butter/85">All prices are demo placeholders</DemoTag>
          </div>
        }
      />

      {/* tabs */}
      <div className="mt-12 flex justify-center px-5">
        <div ref={tabBar} role="tablist" aria-label="Menu categories" className="relative flex rounded-[6px] bg-ivory p-1">
          <span ref={indicator} className="absolute bottom-1 left-0 top-1 rounded-[4px] bg-crimson" aria-hidden />
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              data-tab={t.id}
              aria-selected={tab === t.id}
              onClick={() => choose(t.id)}
              className={`ui relative z-10 rounded-[4px] px-5 py-3.5 text-[12.5px] transition-colors duration-500 sm:px-10 ${
                tab === t.id ? "text-butter" : "text-cocoa hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <section className="relative mx-auto max-w-[1320px] px-5 pb-24 pt-12 sm:px-8 sm:pb-32">
        <TabIntro tab={tab} />
        <div ref={grid} className="mt-10 grid grid-cols-1 gap-5 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, i) => (
            <MenuCard key={item.id} item={item} accent={i % 4 === 1} />
          ))}
        </div>

        <div className="mt-24 overflow-hidden rounded-[18px] bg-crimson px-6 py-14 text-center text-butter sm:px-12" data-reveal>
          <h2 className="heading text-[2.8rem] sm:text-[4rem]">Can&apos;t see what you&apos;re after?</h2>
          <p className="copy mx-auto mt-4 max-w-md text-butter/80">
            Custom flavours, colours and messages are welcome. Just add a note to your enquiry.
          </p>
          <Btn href="/order" variant="butter" className="mt-8">
            Start an order
          </Btn>
        </div>
      </section>
    </div>
  );
}

function TabIntro({ tab }: { tab: MenuCategory }) {
  const { settings } = useStore();
  if (tab === "cookies") {
    return (
      <div className="menu-intro flex flex-col items-start justify-between gap-4 rounded-[14px] bg-bark px-6 py-5 text-butter sm:flex-row sm:items-center">
        <div>
          <p className="ui inline-block rounded-[3px] bg-crimson px-2 py-1.5 text-[10px]">Limited time only</p>
          <p className="mt-3 font-display text-[1.6rem] font-[600] leading-tight">
            Christmas specials are in. Orders for Christmas close {formatLong(settings.christmasCutoff)}.
          </p>
        </div>
        <span className="copy shrink-0 text-butter/75">Boxes of 6, 12 or 24, mix any flavours</span>
      </div>
    );
  }
  const copy =
    tab === "cupcakes"
      ? ["Boxes of 6 or 12", "Mix up to three flavours in a box. Christmas flavours are here until 23 December."]
      : ["From a 4-inch bento to two tiers", "A 6-inch cake serves 10 to 12. Choose your size, sponge and message when you enquire."];
  return (
    <div className="menu-intro flex flex-col items-start justify-between gap-2 border-b border-line pb-6 sm:flex-row sm:items-end">
      <p className="font-display text-[1.9rem] font-[620] leading-none">{copy[0]}</p>
      <p className="copy max-w-md text-cocoa sm:text-right">{copy[1]}</p>
    </div>
  );
}

function MenuCard({ item, accent }: { item: (typeof menu)[number]; accent?: boolean }) {
  const { available } = useStore();
  return (
    <ProductCard
      item={item}
      off={!available[item.id]}
      accent={accent}
      showDescription
      href={`/order?type=${item.category}&flavour=${item.id}`}
      cta="Enquire"
      className="menu-card"
    />
  );
}
