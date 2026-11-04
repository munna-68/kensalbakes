"use client";

import Link from "next/link";
import Lenis from "lenis";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import {
  gsap,
  useGSAP,
  ScrollTrigger,
  markBusy,
  markReady,
  prefersReducedMotion,
  scrollToTop,
  setLenis,
} from "@/lib/motion";
import { useStore } from "@/lib/store";

// ── Smooth scroll (Lenis driven by the GSAP ticker) ──────────────────────────
export function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95 });
    setLenis(lenis);
    if (document.documentElement.dataset.preloading === "true") lenis.stop();
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);
  return null;
}

// ── Route transitions: a bark-brown curtain with the giant wordmark ─────────────────────
const NavContext = createContext<(href: string) => void>(() => {});
export const useNavigate = () => useContext(NavContext);

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const curtain = useRef<HTMLDivElement>(null);
  const covering = useRef(false);
  const firstRender = useRef(true);

  const navigate = useCallback(
    (href: string) => {
      const url = new URL(href, window.location.href);
      if (url.pathname === window.location.pathname) {
        if (url.search !== window.location.search || url.hash) router.push(href, { scroll: false });
        else scrollToTop(false);
        return;
      }
      if (covering.current) return;
      if (prefersReducedMotion()) {
        router.push(href);
        return;
      }
      covering.current = true;
      markBusy();
      const el = curtain.current!;
      gsap
        .timeline()
        .set(el, { display: "flex", yPercent: 100 })
        .set(".curtain-mark", { yPercent: 105 })
        .set(".curtain-sub", { opacity: 0 })
        .to(el, { yPercent: 0, duration: 0.62, ease: "expo.inOut" })
        .to(".curtain-mark", { yPercent: 0, duration: 0.5, ease: "expo.out" }, "-=0.28")
        .to(".curtain-sub", { opacity: 1, duration: 0.3 }, "<0.1")
        .call(() => router.push(href, { scroll: false }));
    },
    [router],
  );

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    scrollToTop(true);
    requestAnimationFrame(() => ScrollTrigger.refresh());
    if (!covering.current) {
      markReady();
      return;
    }
    const el = curtain.current!;
    gsap
      .timeline({ delay: 0.08 })
      .to(".curtain-mark", { yPercent: -105, duration: 0.35, ease: "power2.in" })
      .to(".curtain-sub", { opacity: 0, duration: 0.2 }, "<")
      .to(el, { yPercent: -100, duration: 0.8, ease: "expo.inOut" }, "-=0.05")
      .call(() => markReady(), [], "<0.3")
      .set(el, { display: "none" })
      .call(() => {
        covering.current = false;
      });
  }, [pathname]);

  return (
    <NavContext.Provider value={navigate}>
      {children}
      <div
        ref={curtain}
        className="fixed inset-0 z-[90] hidden flex-col items-center justify-center bg-bark text-butter"
        aria-hidden
      >
        <div className="doodles absolute inset-0" />
        <div className="relative flex flex-col items-center">
          <div className="overflow-hidden px-2">
            <span className="curtain-mark mega block text-[17vw] sm:text-[11vw]">Kensal Bakes</span>
          </div>
          <span className="curtain-sub ui mt-4 text-butter/60">Fresh from the oven</span>
        </div>
      </div>
    </NavContext.Provider>
  );
}

/** Drop-in for next/link that plays the curtain transition. */
export function TLink({
  href,
  onClick,
  ...props
}: React.ComponentProps<typeof Link> & { href: string }) {
  const navigate = useNavigate();
  return (
    <Link
      href={href}
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(href);
      }}
    />
  );
}

// ── Toasts ───────────────────────────────────────────────────────────────────
export function Toaster() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[95] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:items-end">
      {toasts.map((t) => (
        <ToastCard key={t.id} title={t.title} body={t.body} />
      ))}
    </div>
  );
}

function ToastCard({ title, body }: { title: string; body?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.fromTo(ref.current, { y: 18, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" });
  });
  return (
    <div
      ref={ref}
      role="status"
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[10px] bg-ink px-4 py-3.5 text-butter shadow-[0_18px_40px_-18px_rgba(43,31,26,0.6)]"
    >
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ribbon" />
      <div>
        <p className="font-display text-lg font-[620] leading-tight">{title}</p>
        {body && <p className="mt-1 font-mono text-[12px] leading-snug text-butter/70">{body}</p>}
      </div>
    </div>
  );
}
