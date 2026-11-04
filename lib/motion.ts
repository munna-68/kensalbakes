"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";
import type Lenis from "lenis";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip, useGSAP);
  gsap.defaults({ ease: "power3.out", duration: 0.9 });
}

export { gsap, ScrollTrigger, SplitText, Flip, useGSAP };

export const EASE = {
  silk: "expo.out",
  soft: "power3.out",
  inOut: "power3.inOut",
};

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ── Page-ready signal ────────────────────────────────────────────────────────
// Entrance animations wait until the preloader or route curtain has started
// to reveal the page, so nothing animates unseen behind a cover.
let ready = false;
const subscribers = new Set<() => void>();

export function markReady() {
  ready = true;
  subscribers.forEach((fn) => fn());
  subscribers.clear();
}

export function markBusy() {
  ready = false;
}

export function whenReady(fn: () => void) {
  if (ready) {
    fn();
    return () => {};
  }
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

// ── Lenis instance (set by SmoothScroll) ─────────────────────────────────────
let lenis: Lenis | null = null;
export const setLenis = (l: Lenis | null) => (lenis = l);
export const getLenis = () => lenis;

export function scrollToTop(immediate = true) {
  if (lenis) lenis.scrollTo(0, { immediate, force: true });
  else window.scrollTo({ top: 0, behavior: immediate ? "auto" : "smooth" });
}

/** Fade + rise every [data-reveal] inside `scope` as it scrolls into view. */
export function revealOnScroll(scope: Element) {
  const els = gsap.utils.toArray<HTMLElement>(scope.querySelectorAll("[data-reveal]"));
  if (prefersReducedMotion()) {
    gsap.set(els, { opacity: 1 });
    return;
  }
  ScrollTrigger.batch(els, {
    start: "top 88%",
    once: true,
    onEnter: (batch) =>
      gsap.fromTo(
        batch,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 1.1, ease: EASE.silk, stagger: 0.08, overwrite: true },
      ),
  });
}
