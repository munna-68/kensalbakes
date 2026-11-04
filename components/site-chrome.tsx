"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP, ScrollTrigger, getLenis, whenReady, prefersReducedMotion } from "@/lib/motion";
import { TLink, useNavigate } from "./providers";
import { Btn, Wordmark } from "./ui";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/gallery", label: "Gallery" },
  { href: "/#how", label: "How to order" },
];

export function scrollToHow() {
  const target = document.getElementById("how");
  if (!target) return false;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(target, { offset: -80, duration: 1.4 });
  else target.scrollIntoView({ behavior: "smooth" });
  return true;
}

export function Header() {
  const pathname = usePathname();
  const navigate = useNavigate();
  const bar = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useGSAP(
    () => {
      const show = gsap.quickTo(bar.current, "yPercent", { duration: 0.5, ease: "power3.out" });
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          setScrolled(self.scroll() > 40);
          if (self.scroll() < 120) show(0);
          else show(self.direction === 1 ? -110 : 0);
        },
      });
      if (prefersReducedMotion()) return;
      // first arrival: the bar's pieces drop in once the page is revealed
      return whenReady(() => {
        gsap.fromTo(
          bar.current!.querySelectorAll(".hdr-in"),
          { yPercent: -140, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 1, ease: "expo.out", stagger: 0.05, clearProps: "transform,opacity" },
        );
      });
    },
    { scope: bar },
  );

  useEffect(() => setOpen(false), [pathname]);

  const onHow = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    if (pathname === "/") scrollToHow();
    else {
      sessionStorage.setItem("kb-scroll-how", "1");
      navigate("/");
    }
  };

  return (
    <>
      <header
        ref={bar}
        className={`fixed inset-x-0 top-0 z-50 text-butter transition-[background-color,box-shadow] duration-500 ${
          scrolled || open ? "bg-bark/95 shadow-[0_1px_0_rgba(244,238,198,0.12)] backdrop-blur-md" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-5 sm:h-20 sm:px-8">
          <TLink href="/" aria-label="Kensal Bakes home" className="hdr-in relative z-10">
            <Wordmark />
          </TLink>

          <nav className="hidden items-center gap-9 md:flex" aria-label="Main">
            {NAV.map((item) => {
              const active = item.href === pathname;
              const isHow = item.href === "/#how";
              return (
                <TLink
                  key={item.href}
                  href={item.href}
                  onClick={isHow ? onHow : undefined}
                  className="hdr-in group ui relative py-2 text-[12.5px] text-butter/85 transition-colors hover:text-butter"
                  aria-current={active ? "page" : undefined}
                >
                  <span className="roll">
                    <span>
                      <span>{item.label}</span>
                      <span aria-hidden>{item.label}</span>
                    </span>
                  </span>
                  <span
                    className={`absolute inset-x-0 bottom-0 h-[2px] origin-left bg-butter transition-transform duration-500 ease-[var(--ease-silk)] ${
                      active ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </TLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Btn href="/order" variant="butter" size="sm" className="hdr-in hidden sm:inline-flex">
              Start an order
            </Btn>
            <button
              className="hdr-in relative z-10 grid h-11 w-11 place-items-center rounded-[4px] bg-butter/10 md:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <span className="relative block h-3 w-5">
                <span className={`absolute left-0 h-[2px] w-5 bg-butter transition-all duration-500 ${open ? "top-1.5 rotate-45" : "top-0"}`} />
                <span className={`absolute left-0 h-[2px] w-5 bg-butter transition-all duration-500 ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
              </span>
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={open} onHow={onHow} />
    </>
  );
}

function MobileMenu({ open, onHow }: { open: boolean; onHow: (e: React.MouseEvent) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: ref });

  const animate = contextSafe((isOpen: boolean) => {
    const el = ref.current!;
    if (isOpen) {
      getLenis()?.stop();
      gsap.set(el, { display: "flex" });
      gsap.fromTo(el, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "expo.inOut" });
      gsap.fromTo(".mm-item", { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: "expo.out", stagger: 0.06, delay: 0.25 });
    } else if (el.style.display === "flex") {
      getLenis()?.start();
      gsap.to(el, { clipPath: "inset(0 0 100% 0)", duration: 0.5, ease: "expo.inOut", onComplete: () => void gsap.set(el, { display: "none" }) });
    }
  });

  useEffect(() => animate(open), [open, animate]);

  return (
    <div ref={ref} className="fixed inset-0 z-40 hidden flex-col justify-between bg-bark px-5 pb-10 pt-28 text-butter md:hidden">
      <div className="doodles pointer-events-none absolute inset-0" />
      <nav className="relative flex flex-col" aria-label="Mobile">
        {[...NAV, { href: "/order", label: "Start an order" }].map((item) => (
          <div key={item.href} className="overflow-hidden border-b border-butter/15">
            <TLink
              href={item.href}
              onClick={item.href === "/#how" ? onHow : undefined}
              className="mm-item heading block py-3 text-[3.4rem] leading-[0.95]"
            >
              {item.label}
            </TLink>
          </div>
        ))}
      </nav>
      <p className="relative copy text-butter/70">Collection in Kensal Rise. Blue light discount for key workers.</p>
    </div>
  );
}

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".ft-word",
          { yPercent: 60 },
          { yPercent: 0, ease: "none", scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom bottom", scrub: true } },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <footer ref={ref} className="relative overflow-hidden bg-bark text-butter">
      <div className="doodles pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-[1320px] px-5 pt-20 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-[2.4rem] font-[620] leading-[0.95] sm:text-[2.8rem]">
              Made with love, for life&apos;s sweetest moments.
            </p>
            <Btn href="/order" variant="butter" className="mt-8">
              Start an order
            </Btn>
          </div>
          <FooterCol title="Visit">
            <TLink href="/menu">The menu</TLink>
            <TLink href="/gallery">Gallery</TLink>
            <TLink href="/order">Order &amp; enquire</TLink>
          </FooterCol>
          <FooterCol title="Good to know">
            <span>Collection in Kensal Rise</span>
            <span>Blue light discount</span>
            <span>Level 2 Food Hygiene certified</span>
          </FooterCol>
          <FooterCol title="Say hello">
            <a href="https://www.instagram.com/kensalbakes/" target="_blank" rel="noreferrer">
              Instagram @kensalbakes
            </a>
            <span className="text-butter/60">Questions welcome by DM</span>
          </FooterCol>
        </div>

        <div className="mt-20 flex flex-col items-start justify-between gap-4 border-t border-butter/15 py-6 font-mono text-[11.5px] text-butter/60 sm:flex-row sm:items-center">
          <p>© Kensal Bakes. Demo website: all prices, orders and customer details are placeholders.</p>
          <TLink href="/dashboard" className="group inline-flex items-center gap-2 text-butter/80 hover:text-butter">
            <span className="h-1.5 w-1.5 rounded-full bg-sage" /> Baker dashboard (demo)
          </TLink>
        </div>
      </div>
      <div className="relative -mb-[1.5vw] select-none overflow-hidden px-3 text-center" aria-hidden>
        <p className="ft-word mega whitespace-nowrap text-[16.2vw] leading-[0.8] text-butter">Kensal Bakes</p>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="ui text-butter/55">{title}</p>
      <div className="mt-5 flex flex-col gap-3 font-mono text-[13px] text-butter [&_a:hover]:underline [&_a]:underline-offset-4">{children}</div>
    </div>
  );
}
