"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { gsap, useGSAP, whenReady, prefersReducedMotion, scrollToTop, getLenis } from "@/lib/motion";
import {
  categoryInfo,
  collectionSlots,
  menu,
  occasions,
  orderOptions,
  TODAY,
  type Category,
  type Enquiry,
} from "@/lib/mock-data";
import { addDays, formatLong, fromISO, startOfWeek, toISO, weekKey } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { DemoTag, Heart, Placeholder, Sparkle } from "./art";
import { TLink } from "./providers";

// ── Draft model ──────────────────────────────────────────────────────────────
interface Draft {
  category: Category | null;
  sizeId: string | null;
  flavours: Record<string, number>;
  cakeFlavour: string | null;
  favourType: string | null;
  favourQty: number;
  date: string | null;
  slot: string | null;
  name: string;
  contact: string;
  occasion: string | null;
  cakeMessage: string;
  note: string;
  allergies: string;
  blueLight: boolean;
}

const EMPTY: Draft = {
  category: null,
  sizeId: null,
  flavours: {},
  cakeFlavour: null,
  favourType: null,
  favourQty: 30,
  date: null,
  slot: null,
  name: "",
  contact: "",
  occasion: null,
  cakeMessage: "",
  note: "",
  allergies: "",
  blueLight: false,
};

const STEPS = [
  { id: "treat", label: "Treats", title: "What are you ordering?", sub: "Pick one to start. You can mention anything extra in your note." },
  { id: "flavours", label: "Quantity", title: "Quantity & flavours", sub: "Choose your size, then mix your flavours." },
  { id: "date", label: "Date", title: "When do you need it?", sub: "Pick a collection day. Busy weeks fill up, so earlier is better." },
  { id: "collection", label: "Collection", title: "Collection details", sub: "Choose a time slot and how Kensal Bakes can reach you." },
  { id: "note", label: "Note", title: "Add a little note", sub: "The occasion, a message for the cake or tag, and any allergies." },
  { id: "discount", label: "Discount", title: "Blue light discount", sub: "A thank you to those who look after us." },
  { id: "review", label: "Review", title: "Review your enquiry", sub: "Check everything looks right, then send it over." },
] as const;

const cakeFlavours = menu.filter((m) => m.category === "cakes" && m.id !== "bento");

function sizeOf(d: Draft) {
  if (d.category === "cookies" || d.category === "cupcakes") return orderOptions[d.category].sizes.find((s) => s.id === d.sizeId);
  return undefined;
}

function chosenCount(d: Draft) {
  return Object.values(d.flavours).reduce((a, b) => a + b, 0);
}

function estimate(d: Draft, pct: number) {
  let subtotal = 0;
  if (d.category === "cookies" || d.category === "cupcakes") subtotal = sizeOf(d)?.price ?? 0;
  if (d.category === "cakes") {
    const size = orderOptions.cakes.sizes.find((s) => s.id === d.sizeId);
    const flavour = cakeFlavours.find((f) => f.id === d.cakeFlavour);
    subtotal = (size?.price ?? 0) + (size && flavour ? Math.max(0, flavour.price - 45) : 0);
  }
  if (d.category === "favours") {
    const type = orderOptions.favours.types.find((t) => t.id === d.favourType);
    subtotal = type ? type.unit * d.favourQty : 0;
  }
  const discount = d.blueLight ? Math.round(subtotal * pct) / 100 : 0;
  return { subtotal, discount, total: subtotal - discount };
}

const money = (n: number) => `£${n % 1 ? n.toFixed(2) : n}`;

function describe(d: Draft) {
  const items: { name: string; qty: number; cutout?: string }[] = [];
  let title = "";
  if (d.category === "cookies" || d.category === "cupcakes") {
    for (const [id, qty] of Object.entries(d.flavours)) {
      if (qty > 0) {
        const m = menu.find((item) => item.id === id);
        if (m) items.push({ name: m.name, qty, cutout: m.cutout });
      }
    }
    const size = sizeOf(d);
    const festive = Object.keys(d.flavours).some((id) => d.flavours[id] > 0 && menu.find((m) => m.id === id)?.christmas);
    title = d.category === "cookies" ? `${festive ? "Christmas cookie box" : "Filled cookies"}, ${size?.label.toLowerCase()}` : `${size?.label} cupcakes`;
  }
  if (d.category === "cakes") {
    const size = orderOptions.cakes.sizes.find((s) => s.id === d.sizeId);
    const flavour = cakeFlavours.find((f) => f.id === d.cakeFlavour);
    title = `${size?.label ?? ""} ${flavour?.name.toLowerCase() ?? ""} cake`.trim();
    if (flavour) items.push({ name: flavour.name, qty: 1, cutout: flavour.cutout });
  }
  if (d.category === "favours") {
    const type = orderOptions.favours.types.find((t) => t.id === d.favourType);
    title = `${d.favourQty} ${type?.label.toLowerCase() ?? "favours"}`;
    if (type) {
      const favCutout = type.id === "mini-cookie" ? "/images/biscoff-cookie-cutout.png" : type.id === "mini-cupcake" ? "/images/vanilla-strawberry-cutout.png" : "/images/favour-cutout.png";
      items.push({ name: type.label, qty: d.favourQty, cutout: favCutout });
    }
  }
  return { title, items };
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Order() {
  const params = useSearchParams();
  const store = useStore();
  const { settings, available } = store;

  const [draft, setDraft] = useState<Draft>(() => prefill(params.get("type"), params.get("flavour")));
  const [step, setStep] = useState(() => (draft.category ? 1 : 0));
  const [sent, setSent] = useState<Enquiry | null>(null);
  const [sending, setSending] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const dir = useRef(1);
  const animating = useRef(false);
  const { contextSafe } = useGSAP({ scope: root });

  const update = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setHint(null);
  };

  const est = estimate(draft, settings.blueLightPct);
  const validation = validate(draft, step);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      return whenReady(() => {
        gsap.fromTo(".order-head > *", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.07 });
        gsap.fromTo(".order-card, .order-summary", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.1, delay: 0.15 });
        gsap.fromTo("[data-step-item]", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.05, delay: 0.35 });
      });
    },
    { scope: root },
  );

  const goTo = contextSafe((next: number) => {
    if (next === step || animating.current) return;
    dir.current = next > step ? 1 : -1;
    setHint(null);
    setSheetOpen(false);
    const el = stage.current!;
    bringIntoView(el.closest(".order-card") as HTMLElement);
    if (prefersReducedMotion()) {
      setStep(next);
      return;
    }
    animating.current = true;
    const h0 = el.offsetHeight;
    gsap.to(el.firstElementChild, {
      x: -36 * dir.current,
      opacity: 0,
      duration: 0.32,
      ease: "power2.in",
      onComplete: () => {
        setStep(next);
        requestAnimationFrame(() => {
          const panel = el.firstElementChild as HTMLElement;
          const h1 = el.offsetHeight;
          gsap.fromTo(el, { height: h0 }, { height: h1, duration: 0.6, ease: "expo.out", clearProps: "height" });
          gsap.fromTo(panel, { x: 48 * dir.current, opacity: 0 }, { x: 0, opacity: 1, duration: 0.75, ease: "expo.out" });
          gsap.fromTo(
            panel.querySelectorAll("[data-step-item]"),
            { y: 18, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: "expo.out", stagger: 0.045, delay: 0.08, onComplete: () => void (animating.current = false) },
          );
        });
      },
    });
  });

  const next = contextSafe(() => {
    if (!validation.ok) {
      setHint(validation.hint);
      gsap.fromTo(".order-continue", { x: 0 }, { keyframes: { x: [-6, 6, -4, 4, 0] }, duration: 0.4, ease: "power1.out" });
      return;
    }
    if (step < STEPS.length - 1) goTo(step + 1);
  });

  const back = () => step > 0 && goTo(step - 1);

  const send = () => {
    if (sending) return;
    setSending(true);
    setTimeout(() => {
      const { title, items } = describe(draft);
      const extra = [draft.cakeMessage && `Message: "${draft.cakeMessage}"`, draft.note].filter(Boolean).join(" · ");
      const e = store.addEnquiry({
        customer: draft.name.trim(),
        contact: draft.contact.trim(),
        category: draft.category!,
        title: title.charAt(0).toUpperCase() + title.slice(1),
        items,
        date: draft.date!,
        slot: collectionSlots.find((s) => s.id === draft.slot)?.label ?? "",
        occasion: draft.occasion ?? undefined,
        message: extra || undefined,
        allergies: draft.allergies || undefined,
        blueLight: draft.blueLight,
        estimate: est.total,
      });
      setSending(false);
      setSent(e);
      scrollToTop(false);
    }, 1300);
  };

  const reset = () => {
    setDraft(EMPTY);
    setStep(0);
    setSent(null);
  };

  if (sent) return <Success enquiry={sent} onReset={reset} />;

  const current = STEPS[step];
  const progress = (step + 1) / STEPS.length;

  return (
    <div ref={root} className="relative pb-36 pt-28 sm:pt-36 md:pb-28">
      <div className="doodles pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-bark sm:h-[520px]" />
      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-8">
        <header className="order-head flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="mega text-[22vw] text-butter sm:text-[9.5rem]">Order</h1>
            <p className="mt-3 font-display text-[2rem] font-[620] leading-none text-butter sm:text-[2.6rem]">Your enquiry, simply done</p>
          </div>
          <p className="copy max-w-xs text-butter/75">
            About two minutes. No payment now: you&apos;ll get a confirmed quote by DM.
          </p>
        </header>

        <Stepper step={step} onJump={(i) => i < step && goTo(i)} />

        <div className="mt-6 grid items-start gap-6 md:mt-8 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_380px] lg:gap-10">
          <section className="order-card relative overflow-hidden rounded-[16px] border border-line bg-paper shadow-[0_30px_60px_-40px_rgba(43,31,26,0.35)]">
            <div className="h-[3px] bg-ivory">
              <div
                className="h-full origin-left bg-gradient-to-r from-ribbon to-rose transition-transform duration-700 ease-[var(--ease-silk)]"
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>
            <div ref={stage} className="relative">
              <div key={step} className="p-5 sm:p-10">
                <div data-step-item>
                  <p className="eyebrow text-[10px] text-mocha">
                    Step {step + 1} of {STEPS.length}
                  </p>
                  <h2 className="mt-3 font-display text-[2rem] leading-tight sm:text-[2.6rem]">{current.title}</h2>
                  <p className="mt-2 text-[14.5px] text-cocoa">{current.sub}</p>
                </div>
                <div className="mt-8">
                  {step === 0 && (
                    <StepTreat
                      value={draft.category}
                      onPick={(c) => {
                        update(c === draft.category ? {} : { ...EMPTY, name: draft.name, contact: draft.contact, category: c, ...defaultsFor(c) });
                        setTimeout(() => goTo(1), 380);
                      }}
                    />
                  )}
                  {step === 1 && <StepFlavours draft={draft} update={update} available={available} />}
                  {step === 2 && <StepDate draft={draft} update={update} />}
                  {step === 3 && <StepCollection draft={draft} update={update} />}
                  {step === 4 && <StepNote draft={draft} update={update} />}
                  {step === 5 && <StepDiscount draft={draft} update={update} pct={settings.blueLightPct} />}
                  {step === 6 && <StepReview draft={draft} est={est} pct={settings.blueLightPct} onEdit={goTo} />}
                </div>
              </div>
            </div>

            {/* desktop controls */}
            <div className="hidden items-center justify-between gap-4 border-t border-line px-10 py-6 md:flex">
              <button
                onClick={back}
                className={`text-sm tracking-[0.05em] text-cocoa transition-opacity hover:text-choc ${step === 0 ? "pointer-events-none opacity-0" : ""}`}
              >
                ← Back
              </button>
              <div className="flex items-center gap-4">
                {hint && <p className="text-sm text-rose">{hint}</p>}
                {step < STEPS.length - 1 ? (
                  <ContinueButton onClick={next} disabled={!validation.ok} />
                ) : (
                  <SendButton onClick={send} sending={sending} />
                )}
              </div>
            </div>
          </section>

          <Summary draft={draft} est={est} progress={progress} className="order-summary hidden md:block md:sticky md:top-28" />
        </div>
      </div>

      {/* mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-md md:hidden">
        {hint && <p className="mb-2 text-center text-[13px] text-rose">{hint}</p>}
        <div className="flex items-center gap-2">
          <button
            onClick={back}
            aria-label="Back"
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line text-choc ${step === 0 ? "opacity-30" : ""}`}
          >
            ←
          </button>
          <button
            onClick={() => setSheetOpen((o) => !o)}
            className="flex h-12 flex-1 flex-col items-start justify-center rounded-full bg-paper px-4 text-left"
            aria-expanded={sheetOpen}
          >
            <span className="text-[10px] uppercase tracking-[0.16em] text-mocha">Est. total {sheetOpen ? "▾" : "▴"}</span>
            <span className="text-sm text-choc">{est.total ? money(est.total) : "—"}</span>
          </button>
          {step < STEPS.length - 1 ? (
            <ContinueButton onClick={next} disabled={!validation.ok} compact />
          ) : (
            <SendButton onClick={send} sending={sending} compact />
          )}
        </div>
      </div>
      <MobileSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <Summary draft={draft} est={est} progress={progress} />
      </MobileSheet>
    </div>
  );
}

function bringIntoView(card: HTMLElement) {
  const top = card.getBoundingClientRect().top;
  if (top > 70 && top < window.innerHeight * 0.4) return;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(card, { offset: -100, duration: 0.9 });
  else window.scrollTo({ top: window.scrollY + top - 100, behavior: "smooth" });
}

function prefill(type: string | null, flavour: string | null): Draft {
  if (!type || !(type in categoryInfo)) return EMPTY;
  const category = type as Category;
  const d: Draft = { ...EMPTY, category, ...defaultsFor(category) };
  const item = menu.find((m) => m.id === flavour && m.category === category);
  if (item && (category === "cookies" || category === "cupcakes")) {
    const size = orderOptions[category].sizes.find((s) => s.id === d.sizeId)!;
    d.flavours = { [item.id]: size.count };
  }
  if (item && category === "cakes") d.cakeFlavour = item.id === "bento" ? null : item.id;
  if (item?.id === "bento") d.sizeId = "bento";
  return d;
}

function defaultsFor(c: Category): Partial<Draft> {
  if (c === "cookies") return { sizeId: "12" };
  if (c === "cupcakes") return { sizeId: "6" };
  if (c === "cakes") return { sizeId: "6" };
  return { favourType: "mini-cookie", favourQty: 30 };
}

function validate(d: Draft, step: number): { ok: boolean; hint: string } {
  const fail = (hint: string) => ({ ok: false, hint });
  if (step === 0 && !d.category) return fail("Pick a treat to continue");
  if (step === 1) {
    if (d.category === "cookies" || d.category === "cupcakes") {
      const size = sizeOf(d);
      if (!size) return fail("Choose a box size");
      const n = chosenCount(d);
      if (n !== size.count) return fail(n < size.count ? `Add ${size.count - n} more to fill your box` : `Remove ${n - size.count} to fit your box`);
    }
    if (d.category === "cakes" && (!d.sizeId || !d.cakeFlavour)) return fail("Choose a size and a sponge");
    if (d.category === "favours" && !d.favourType) return fail("Choose a favour type");
  }
  if (step === 2 && !d.date) return fail("Pick a collection date");
  if (step === 3) {
    if (!d.slot) return fail("Choose a collection slot");
    if (d.name.trim().length < 2) return fail("Add your name");
    if (d.contact.trim().length < 3) return fail("Add an Instagram handle or mobile");
  }
  return { ok: true, hint: "" };
}

// ── Chrome ───────────────────────────────────────────────────────────────────
function Stepper({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <ol className="no-scrollbar mt-10 hidden gap-2 overflow-x-auto md:flex" aria-label="Progress">
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={s.id} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => onJump(i)}
              disabled={!done}
              className={`ui group flex items-center gap-2.5 whitespace-nowrap text-[11.5px] transition-colors duration-500 ${
                active ? "text-butter" : done ? "text-butter/80 hover:text-butter" : "text-butter/45"
              }`}
            >
              <span
                className={`grid h-7 w-7 place-items-center rounded-[4px] font-mono text-[11px] transition-all duration-500 ${
                  active ? "bg-butter text-ink" : done ? "bg-crimson text-butter" : "border border-butter/30"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <span className="relative h-px flex-1 bg-butter/20">
                <span className={`absolute inset-0 origin-left bg-butter transition-transform duration-700 ${done ? "scale-x-100" : "scale-x-0"}`} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ContinueButton({ onClick, disabled, compact }: { onClick: () => void; disabled: boolean; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-disabled={disabled}
      className={`order-continue group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full text-sm tracking-[0.06em] transition-all duration-500 ${
        compact ? "h-12 px-6" : "px-7 py-3.5"
      } ${disabled ? "bg-choc/35 text-cream" : "bg-choc text-cream hover:-translate-y-0.5"}`}
    >
      <span className="absolute inset-0 translate-y-full rounded-full bg-cocoa transition-transform duration-500 group-hover:translate-y-0" />
      <span className="relative">Continue</span>
      <span className="relative transition-transform duration-500 group-hover:translate-x-0.5">→</span>
    </button>
  );
}

function SendButton({ onClick, sending, compact }: { onClick: () => void; sending: boolean; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={sending}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-rose text-sm tracking-[0.06em] text-cream shadow-[0_16px_30px_-16px_rgba(185,103,111,0.9)] transition-all duration-500 hover:-translate-y-0.5 ${
        compact ? "h-12 px-6" : "px-8 py-4"
      }`}
    >
      <span className="absolute inset-0 translate-y-full rounded-full bg-choc transition-transform duration-500 group-hover:translate-y-0" />
      {sending ? (
        <span className="relative flex items-center gap-2">
          <Heart size={12} className="animate-pulse" /> Sending…
        </span>
      ) : (
        <span className="relative flex items-center gap-2">
          Send enquiry <Heart size={11} className="transition-transform duration-500 group-hover:scale-125" />
        </span>
      )}
    </button>
  );
}

function MobileSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className={`fixed inset-0 z-30 md:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-choc/30 transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} />
      <div
        data-lenis-prevent
        className={`absolute inset-x-0 bottom-0 max-h-[78vh] overflow-y-auto rounded-t-[28px] bg-cream px-4 pb-28 pt-3 transition-transform duration-500 ease-[var(--ease-silk)] ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        {children}
      </div>
    </div>
  );
}

// ── Summary ("your box") ─────────────────────────────────────────────────────
function Summary({ draft, est, progress, className = "" }: { draft: Draft; est: ReturnType<typeof estimate>; progress: number; className?: string }) {
  const { title, items } = describe(draft);
  const slot = collectionSlots.find((s) => s.id === draft.slot);
  const rows: [string, React.ReactNode][] = [];
  if (draft.category) rows.push(["Treat", categoryInfo[draft.category].label]);
  if (title && (items.length || draft.sizeId)) rows.push(["Order", title.charAt(0).toUpperCase() + title.slice(1)]);
  if (draft.date) rows.push(["Collection", formatLong(draft.date)]);
  if (slot) rows.push(["Slot", `${slot.label}, ${slot.time}`]);
  if (draft.occasion) rows.push(["Occasion", draft.occasion]);
  if (draft.blueLight) rows.push(["Discount", "Blue light"]);

  return (
    <aside className={`rounded-[28px] border border-line bg-ivory/80 p-6 ${className}`}>
      <div className="flex items-center gap-4">
        <MiniBox progress={progress} />
        <div>
          <p className="eyebrow text-[10px] text-gold">Your enquiry</p>
          <p className="mt-1 font-display text-2xl leading-tight">{draft.category ? categoryInfo[draft.category].label : "Nothing yet"}</p>
        </div>
      </div>
      <dl className="mt-6 space-y-3 border-t border-dashed border-gold/40 pt-5 text-sm">
        {rows.length === 0 && <p className="text-mocha">Your choices will gather here as you go.</p>}
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-mocha">{k}</dt>
            <dd className="text-right text-choc">{v}</dd>
          </div>
        ))}
        {items.length > 0 && (
          <ul className="space-y-1.5 rounded-2xl bg-paper/70 p-3 text-[13px]">
            {items.map((i) => (
              <li key={i.name} className="flex items-center justify-between gap-3 text-cocoa">
                <span className="flex min-w-0 items-center gap-2">
                  {i.cutout && (
                    <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-[#eedfc3]">
                      <Image src={i.cutout} alt="" fill sizes="24px" className="object-contain p-0.5" />
                    </span>
                  )}
                  <span className="truncate">{i.name}</span>
                </span>
                <span className="tabular-nums font-mono text-choc">× {i.qty}</span>
              </li>
            ))}
          </ul>
        )}
      </dl>
      <div className="mt-6 flex items-end justify-between border-t border-line pt-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-mocha">Estimated total</p>
          {est.discount > 0 && <p className="mt-1 text-xs text-rose">incl. blue light −{money(est.discount)}</p>}
        </div>
        <p className="font-display text-3xl tabular-nums">{est.total ? money(est.total) : "—"}</p>
      </div>
      <DemoTag className="mt-4">Demo pricing · final quote by DM</DemoTag>
    </aside>
  );
}

function MiniBox({ progress }: { progress: number }) {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0" aria-hidden>
      <rect x="10" y="26" width="44" height="30" fill="#fcf9ea" stroke="#6b554c" strokeWidth="1.2" />
      <rect x="7" y="19" width="50" height="9" rx="1" fill="#fcf9ea" stroke="#6b554c" strokeWidth="1.2" />
      <rect
        x="29"
        y="19"
        width="6"
        height="37"
        fill="#931c1f"
        style={{ transform: `scaleY(${progress})`, transformOrigin: "50% 0%", transition: "transform .8s cubic-bezier(.22,1,.36,1)" }}
      />
      <g style={{ opacity: progress >= 1 ? 1 : 0.15, transition: "opacity .6s" }}>
        <path d="M32 19C26 10 17 12 18 17C19 21 27 21 32 19Z" fill="#c7473d" stroke="#7a1518" strokeWidth="1" />
        <path d="M32 19C38 10 47 12 46 17C45 21 37 21 32 19Z" fill="#c7473d" stroke="#7a1518" strokeWidth="1" />
        <circle cx="32" cy="19" r="2.6" fill="#931c1f" stroke="#7a1518" strokeWidth="1" />
      </g>
    </svg>
  );
}

// ── Steps ────────────────────────────────────────────────────────────────────
type StepProps = { draft: Draft; update: (p: Partial<Draft>) => void };

function Choice({
  selected,
  onClick,
  children,
  className = "",
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      data-step-item
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`group relative rounded-[20px] border text-left transition-all duration-500 ease-[var(--ease-silk)] ${
        selected
          ? "border-choc bg-paper shadow-[0_0_0_3px_rgba(220,162,164,0.35)]"
          : "border-line bg-paper hover:-translate-y-0.5 hover:border-cocoa/40"
      } ${disabled ? "cursor-not-allowed opacity-45 hover:translate-y-0" : ""} ${className}`}
    >
      {children}
      <span
        className={`absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full border transition-all duration-500 ${
          selected ? "scale-100 border-choc bg-choc text-cream" : "scale-90 border-line bg-paper text-transparent"
        }`}
      >
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M2.5 6.2L5 8.5L9.5 3.5" />
        </svg>
      </span>
    </button>
  );
}

const CUTOUT: Partial<Record<Category, string>> = {
  cookies: "/images/biscoff-cookie-cutout.png",
  cakes: "/images/heart-cake-cutout.png",
  cupcakes: "/images/vanilla-strawberry-cutout.png",
  favours: "/images/favour-cutout.png",
};

function StepTreat({ value, onPick }: { value: Category | null; onPick: (c: Category) => void }) {
  const from: Record<Category, string> = { cookies: "from £20 a box", cupcakes: "from £16 a box", cakes: "from £28", favours: "from £2.20 each" };
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {(Object.keys(categoryInfo) as Category[]).map((c) => {
        const info = categoryInfo[c];
        return (
          <Choice key={c} selected={value === c} onClick={() => onPick(c)} className="overflow-hidden p-2.5">
            {CUTOUT[c] ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-[#eedfc3]">
                <Image src={CUTOUT[c]!} alt={info.label} fill sizes="240px" className="object-contain p-3 transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-3" />
              </div>
            ) : (
              <Placeholder
                art={info.art}
                tone={info.tone}
                alt={info.label}
                className="aspect-[4/3] rounded-[10px]"
                artClassName="transition-transform duration-700 group-hover:scale-105"
              />
            )}
            <div className="px-2 pb-2 pt-4">
              <p className="font-display text-[1.45rem] font-[600] leading-none sm:text-2xl">{info.label}</p>
              <p className="mt-2 hidden text-[13px] text-cocoa sm:block">{info.blurb}</p>
              <p className="mt-1.5 text-[12px] text-mocha">{from[c]}</p>
            </div>
          </Choice>
        );
      })}
    </div>
  );
}

function StepFlavours({ draft, update, available }: StepProps & { available: Record<string, boolean> }) {
  if (draft.category === "cakes") return <CakeOptions draft={draft} update={update} available={available} />;
  if (draft.category === "favours") return <FavourOptions draft={draft} update={update} />;
  const cat = draft.category as "cookies" | "cupcakes";
  const sizes = orderOptions[cat].sizes;
  const size = sizeOf(draft);
  const flavours = menu.filter((m) => m.category === cat);
  const n = chosenCount(draft);
  const target = size?.count ?? 0;

  const setQty = (id: string, qty: number) => update({ flavours: { ...draft.flavours, [id]: Math.max(0, qty) } });
  const fillEvenly = () => {
    const pool = flavours.filter((f) => available[f.id]);
    const picked = pool.filter((f) => (draft.flavours[f.id] ?? 0) > 0);
    const use = picked.length ? picked : pool.slice(0, Math.min(3, pool.length));
    const out: Record<string, number> = {};
    use.forEach((f, i) => (out[f.id] = Math.floor(target / use.length) + (i < target % use.length ? 1 : 0)));
    update({ flavours: out });
  };

  return (
    <div>
      <p className="eyebrow text-[10px] text-mocha" data-step-item>
        Box size
      </p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {sizes.map((s) => (
          <Choice key={s.id} selected={draft.sizeId === s.id} onClick={() => update({ sizeId: s.id })} className="py-4 pl-4 pr-9">
            <p className="font-display text-xl leading-tight sm:text-2xl">{s.label}</p>
            <p className="mt-1 text-[13px] text-cocoa">{money(s.price)}</p>
          </Choice>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4" data-step-item>
        <p className="eyebrow text-[10px] text-mocha">Flavours</p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={fillEvenly} className="text-[12.5px] text-rose underline-offset-4 hover:underline">
            Mix evenly
          </button>
          <span className={`rounded-full px-3 py-1 text-[12px] tabular-nums transition-colors ${n === target ? "bg-sage/20 text-[#4f6a4b]" : "bg-ivory text-cocoa"}`}>
            {n} of {target} chosen
          </span>
        </div>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-ivory" data-step-item>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-[var(--ease-silk)] ${n > target ? "bg-rose" : "bg-ribbon"}`}
          style={{ width: `${Math.min(100, (n / Math.max(target, 1)) * 100)}%` }}
        />
      </div>

      <ul className="mt-4 divide-y divide-line">
        {flavours.map((f) => {
          const qty = draft.flavours[f.id] ?? 0;
          const off = !available[f.id];
          return (
            <li key={f.id} data-step-item className={`group flex items-center gap-4 py-3 ${off ? "opacity-45" : ""}`}>
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-line/60 bg-[#eedfc3] shadow-sm">
                {f.cutout || f.image ? (
                  <Image
                    src={f.cutout || f.image!}
                    alt={f.name}
                    fill
                    sizes="56px"
                    className="object-contain p-1 transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <Placeholder art={f.art} tone={f.tone} festive={f.christmas} className="h-full w-full" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-choc">{f.name}</p>
                <p className="text-[12px] text-mocha">{off ? "Sold out for now" : f.christmas ? "Christmas special · limited time" : f.seasonal ? "Limited time only" : f.priceNote}</p>
              </div>
              <Stepper2 value={qty} disabled={off} onChange={(v) => setQty(f.id, v)} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stepper2({ value, onChange, disabled, step = 1, min = 0 }: { value: number; onChange: (v: number) => void; disabled?: boolean; step?: number; min?: number }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-cream p-1">
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - step)}
        className="grid h-8 w-8 place-items-center rounded-full text-lg text-choc transition-colors hover:bg-blush disabled:opacity-30"
        aria-label="Decrease"
      >
        −
      </button>
      <span key={value} className="w-8 text-center text-sm tabular-nums">
        {value}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(value + step)}
        className="grid h-8 w-8 place-items-center rounded-full text-lg text-choc transition-colors hover:bg-blush disabled:opacity-30"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}

function CakeOptions({ draft, update, available }: StepProps & { available: Record<string, boolean> }) {
  return (
    <div>
      <p className="eyebrow text-[10px] text-mocha" data-step-item>
        Size
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {orderOptions.cakes.sizes.map((s) => (
          <Choice key={s.id} selected={draft.sizeId === s.id} onClick={() => update({ sizeId: s.id })} className="py-4 pl-4 pr-9">
            <p className="font-display text-xl leading-tight">{s.label}</p>
            <p className="mt-1 text-[12.5px] text-cocoa">{s.serves}</p>
            <p className="mt-2 text-[12.5px] text-mocha">from {money(s.price)}</p>
          </Choice>
        ))}
      </div>
      <p className="eyebrow mt-8 text-[10px] text-mocha" data-step-item>
        Sponge &amp; style
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {cakeFlavours.map((f) => (
          <Choice
            key={f.id}
            selected={draft.cakeFlavour === f.id}
            onClick={() => update({ cakeFlavour: f.id })}
            disabled={!available[f.id]}
            className="flex items-center gap-3 p-2.5 pr-10"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[12px] border border-line/50 bg-[#eedfc3] shadow-sm">
              {f.cutout || f.image ? (
                <Image
                  src={f.cutout || f.image!}
                  alt={f.name}
                  fill
                  sizes="56px"
                  className="object-contain p-1 transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <Placeholder art={f.art} tone={f.tone} festive={f.christmas} className="h-full w-full" />
              )}
            </div>
            <span>
              <span className="block text-[15px] font-medium text-choc">{f.name}</span>
              <span className="block text-[12px] text-mocha">
                {!available[f.id] ? "Sold out for now" : f.christmas ? "Christmas special" : f.price > 45 ? `+${money(f.price - 45)}` : "Included"}
              </span>
            </span>
          </Choice>
        ))}
      </div>
    </div>
  );
}

const FAVOUR_IMAGES: Record<string, string> = {
  "mini-cookie": "/images/biscoff-cookie-cutout.png",
  "iced-biscuit": "/images/favour-cutout.png",
  "mini-cupcake": "/images/vanilla-strawberry-cutout.png",
};

function FavourOptions({ draft, update }: StepProps) {
  const { min, step, types } = orderOptions.favours;
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        {types.map((t) => (
          <Choice key={t.id} selected={draft.favourType === t.id} onClick={() => update({ favourType: t.id })} className="overflow-hidden p-2.5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-[#eedfc3]">
              <Image
                src={FAVOUR_IMAGES[t.id] ?? "/images/favour-cutout.png"}
                alt={t.label}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-contain p-3 transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <p className="px-2 pt-3 text-[15px] font-medium text-choc">{t.label}</p>
            <p className="px-2 pb-2 text-[12.5px] text-mocha">{money(t.unit)} each</p>
          </Choice>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-line bg-cream p-5" data-step-item>
        <div>
          <p className="text-[15px] text-choc">How many guests?</p>
          <p className="text-[12.5px] text-mocha">
            Minimum {min}, in fives. Each favour comes with a personalised tag.
          </p>
        </div>
        <Stepper2 value={draft.favourQty} min={min} step={step} onChange={(v) => update({ favourQty: v })} />
      </div>
    </div>
  );
}

// ── Date picker ──────────────────────────────────────────────────────────────
type DayState = "past" | "closed" | "break" | "xmas-closed" | "notice" | "paused" | "full" | "few" | "open";

function useDayState(category: Category | null) {
  const { settings, bookedByWeek, isWeekFull } = useStore();
  const earliest = addDays(TODAY, settings.noticeDays[category ?? "cookies"]);
  return (d: Date): DayState => {
    const iso = toISO(d);
    if (d < TODAY) return "past";
    if (iso >= settings.closedFrom && iso <= settings.closedTo) return "break";
    if (!settings.collectionDays.includes(d.getDay())) return "closed";
    if (iso > settings.christmasCutoff && iso <= settings.lastChristmasCollection && toISO(TODAY) > settings.christmasCutoff) return "xmas-closed";
    if (d < earliest) return "notice";
    if (!settings.acceptingOrders && d < addDays(TODAY, 14)) return "paused";
    if (isWeekFull(iso)) return "full";
    if ((bookedByWeek[weekKey(iso)] ?? 0) >= settings.weeklyCap - 2) return "few";
    return "open";
  };
}

const DAY_LABEL: Record<DayState, string> = {
  past: "",
  closed: "No collection",
  break: "Christmas break",
  "xmas-closed": "Christmas orders closed",
  notice: "Too soon to bake",
  paused: "Enquiries paused",
  full: "Fully booked",
  few: "Few slots left",
  open: "Available",
};

function StepDate({ draft, update }: StepProps) {
  const { settings } = useStore();
  const stateOf = useDayState(draft.category);
  const firstOpen = useMemo(() => {
    for (let i = 0; i < 120; i++) {
      const d = addDays(TODAY, i);
      const s = stateOf(d);
      if (s === "open" || s === "few") return d;
    }
    return TODAY;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const initial = draft.date ? fromISO(draft.date) : firstOpen;
  const [month, setMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const grid = useRef<HTMLDivElement>(null);

  const shift = (n: number) => {
    const el = grid.current;
    const go = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
    if (!el || prefersReducedMotion()) return go();
    gsap.to(el, {
      x: -24 * n,
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        go();
        requestAnimationFrame(() => gsap.fromTo(el, { x: 24 * n, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "expo.out" }));
      },
    });
  };

  const start = startOfWeek(month);
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const minMonth = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(month);

  return (
    <div>
      <div data-step-item className="flex items-start gap-3 rounded-[18px] border border-ribbon/40 bg-blush/40 p-4 text-[13.5px] leading-relaxed text-choc">
        <Sparkle size={12} className="mt-1 shrink-0 text-rose" />
        <p>
          <strong className="font-medium">Christmas orders close {formatLong(settings.christmasCutoff)}</strong>, for collection up to{" "}
          {formatLong(settings.lastChristmasCollection)}. Closed {formatLong(settings.closedFrom).replace(/^\w+ /, "")} to{" "}
          {formatLong(settings.closedTo).replace(/^\w+ /, "")}.
        </p>
      </div>

      <div data-step-item className="mt-6 flex items-center justify-between">
        <p className="font-display text-2xl">{monthLabel}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            disabled={month <= minMonth}
            className="grid h-10 w-10 place-items-center rounded-full border border-line transition-colors hover:bg-blush disabled:opacity-30"
            aria-label="Previous month"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            className="grid h-10 w-10 place-items-center rounded-full border border-line transition-colors hover:bg-blush"
            aria-label="Next month"
          >
            →
          </button>
        </div>
      </div>

      <div data-step-item className="mt-4 grid grid-cols-7 text-center text-[11px] uppercase tracking-[0.14em] text-mocha">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <span key={d} className="py-2">
            {d}
          </span>
        ))}
      </div>
      <div ref={grid} data-step-item className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {days.map((d) => {
          const iso = toISO(d);
          const inMonth = d.getMonth() === month.getMonth();
          const state = stateOf(d);
          const pickable = state === "open" || state === "few";
          const selected = draft.date === iso;
          const xmas = iso > settings.christmasCutoff && iso <= settings.lastChristmasCollection;
          return (
            <button
              key={iso}
              type="button"
              disabled={!pickable || !inMonth}
              title={DAY_LABEL[state]}
              onClick={(e) => {
                update({ date: iso });
                if (!prefersReducedMotion()) gsap.fromTo(e.currentTarget, { scale: 0.86 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" });
              }}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-full text-[14px] tabular-nums transition-colors duration-300 sm:text-[15px] ${
                !inMonth
                  ? "invisible"
                  : selected
                    ? "bg-choc text-cream"
                    : pickable
                      ? "text-choc hover:bg-blush/70"
                      : state === "full"
                        ? "text-mocha/50 line-through decoration-rose/60"
                        : "text-mocha/35"
              }`}
            >
              {d.getDate()}
              {inMonth && state === "few" && !selected && <span className="absolute bottom-[18%] h-1 w-1 rounded-full bg-rose" />}
              {inMonth && xmas && pickable && !selected && <Sparkle size={7} className="absolute right-[14%] top-[14%] text-gold" />}
            </button>
          );
        })}
      </div>

      <div data-step-item className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-cocoa">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full border border-choc" /> Available
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-rose" /> Few slots left
        </span>
        <span className="flex items-center gap-2">
          <span className="text-mocha/60 line-through decoration-rose/60">12</span> Fully booked
        </span>
        <span className="flex items-center gap-2">
          <Sparkle size={8} className="text-gold" /> Christmas week
        </span>
      </div>

      <p data-step-item className="mt-6 min-h-[1.5rem] text-[15px] text-choc">
        {draft.date ? (
          <>
            Collection on <span className="font-display text-xl">{formatLong(draft.date)}</span>
          </>
        ) : (
          <span className="text-mocha">
            {draft.category && `${categoryInfo[draft.category].label} need ${settings.noticeDays[draft.category]} days' notice.`}
          </span>
        )}
      </p>
    </div>
  );
}

function StepCollection({ draft, update }: StepProps) {
  const { settings } = useStore();
  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {collectionSlots.map((s) => {
          const off = !settings.slots[s.id];
          return (
            <Choice key={s.id} selected={draft.slot === s.id} onClick={() => update({ slot: s.id })} disabled={off} className="py-4 pl-4 pr-9">
              <p className="font-display text-xl">{s.label}</p>
              <p className="mt-1 text-[12.5px] text-cocoa">{off ? "Unavailable" : s.time}</p>
            </Choice>
          );
        })}
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Field label="Your name" data-step-item>
          <input
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g. Sophie"
            autoComplete="off"
            className={inputCls}
          />
        </Field>
        <Field label="Instagram handle or mobile" data-step-item>
          <input
            value={draft.contact}
            onChange={(e) => update({ contact: e.target.value })}
            placeholder="@yourhandle"
            autoComplete="off"
            className={inputCls}
          />
        </Field>
      </div>
      <div data-step-item className="mt-6 flex items-start gap-3 rounded-[18px] bg-ivory p-4 text-[13.5px] leading-relaxed text-cocoa">
        <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </svg>
        <p>Collection from Kensal Rise, London. The exact address is shared once your order is confirmed.</p>
      </div>
    </div>
  );
}

const inputCls =
  "mt-2 w-full rounded-2xl border border-line bg-cream px-4 py-3.5 text-[15px] text-choc outline-none transition-all duration-300 placeholder:text-mocha/60 focus:border-ribbon focus:bg-paper focus:shadow-[0_0_0_4px_rgba(220,162,164,0.25)]";

function Field({ label, children, hint, ...rest }: { label: string; children: React.ReactNode; hint?: string } & React.HTMLAttributes<HTMLLabelElement>) {
  return (
    <label className="block" {...rest}>
      <span className="flex items-baseline justify-between text-[13px] text-cocoa">
        {label}
        {hint && <span className="text-[11.5px] text-mocha">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function StepNote({ draft, update }: StepProps) {
  const isCake = draft.category === "cakes";
  return (
    <div>
      <p className="eyebrow text-[10px] text-mocha" data-step-item>
        What&apos;s the occasion?
      </p>
      <div className="mt-3 flex flex-wrap gap-2" data-step-item>
        {occasions.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => update({ occasion: draft.occasion === o ? null : o })}
            className={`rounded-full border px-4 py-2 text-[13.5px] transition-all duration-300 ${
              draft.occasion === o ? "border-choc bg-choc text-cream" : "border-line bg-paper text-choc hover:border-cocoa/40"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      <div className="mt-7 grid gap-5">
        <Field label={isCake ? "Message on the cake" : "Message for the gift tag"} hint={`${draft.cakeMessage.length}/40 · optional`} data-step-item>
          <input
            value={draft.cakeMessage}
            maxLength={40}
            onChange={(e) => update({ cakeMessage: e.target.value })}
            placeholder={isCake ? "Happy birthday, Mum" : "Merry Christmas, love S x"}
            className={inputCls}
          />
        </Field>
        <Field label="Anything else?" hint="optional" data-step-item>
          <textarea
            value={draft.note}
            onChange={(e) => update({ note: e.target.value })}
            rows={3}
            placeholder="Colours, inspiration, a theme… anything that helps."
            className={`${inputCls} resize-none`}
          />
        </Field>
        <Field label="Allergies or dietary needs" hint="optional" data-step-item>
          <input
            value={draft.allergies}
            onChange={(e) => update({ allergies: e.target.value })}
            placeholder="e.g. one guest is nut-free"
            className={inputCls}
          />
        </Field>
      </div>
    </div>
  );
}

function StepDiscount({ draft, update, pct }: StepProps & { pct: number }) {
  const tick = useRef<SVGPathElement>(null);
  const toggle = () => {
    const on = !draft.blueLight;
    update({ blueLight: on });
    if (on && tick.current && !prefersReducedMotion()) {
      gsap.fromTo(tick.current, { strokeDashoffset: 20 }, { strokeDashoffset: 0, duration: 0.5, ease: "power2.out" });
    }
  };
  return (
    <div>
      <button
        type="button"
        role="checkbox"
        aria-checked={draft.blueLight}
        onClick={toggle}
        data-step-item
        className={`flex w-full items-start gap-5 rounded-[24px] border p-6 text-left transition-all duration-500 sm:p-7 ${
          draft.blueLight ? "border-rose bg-blush/50 shadow-[0_0_0_4px_rgba(220,162,164,0.25)]" : "border-line bg-paper hover:border-cocoa/40"
        }`}
      >
        <span
          className={`mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg border-[1.5px] transition-colors duration-300 ${
            draft.blueLight ? "border-rose bg-rose text-cream" : "border-cocoa/40 bg-cream"
          }`}
        >
          <svg viewBox="0 0 14 14" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path ref={tick} d="M3 7.4L5.8 10L11 4.2" strokeDasharray="20" strokeDashoffset={draft.blueLight ? 0 : 20} />
          </svg>
        </span>
        <span>
          <span className="block font-display text-2xl leading-tight">I&apos;m a blue light card holder</span>
          <span className="mt-2 block text-[14px] leading-relaxed text-cocoa">
            {pct}% off your order. Please bring your card or ID when you collect.
          </span>
        </span>
      </button>
      <div data-step-item className="mt-6 flex flex-wrap gap-2 text-[12.5px] text-cocoa">
        {["NHS staff", "Emergency services", "Social care", "Armed forces"].map((t) => (
          <span key={t} className="rounded-full bg-ivory px-3 py-1.5">
            {t}
          </span>
        ))}
      </div>
      <p data-step-item className="mt-6 text-[13.5px] text-mocha">
        Not a card holder? No problem, just continue.
      </p>
    </div>
  );
}

function StepReview({ draft, est, pct, onEdit }: { draft: Draft; est: ReturnType<typeof estimate>; pct: number; onEdit: (i: number) => void }) {
  const { title, items } = describe(draft);
  const slot = collectionSlots.find((s) => s.id === draft.slot);
  const block = (label: string, step: number, body: React.ReactNode) => (
    <div data-step-item className="flex items-start justify-between gap-6 border-b border-line py-5 first:pt-0">
      <div className="min-w-0">
        <p className="eyebrow text-[10px] text-mocha">{label}</p>
        <div className="mt-2 text-[15px] leading-relaxed text-choc">{body}</div>
      </div>
      <button type="button" onClick={() => onEdit(step)} className="shrink-0 text-[13px] text-rose underline-offset-4 hover:underline">
        Edit
      </button>
    </div>
  );
  return (
    <div>
      {block(
        "Your order",
        1,
        <>
          <p className="font-display text-xl">{title.charAt(0).toUpperCase() + title.slice(1)}</p>
          {items.length > 0 && (
            <div className="mt-3 space-y-2">
              {items.map((i) => (
                <div key={i.name} className="flex items-center gap-2.5 text-[14px] text-cocoa">
                  {i.cutout && (
                    <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-line/50 bg-[#eedfc3]">
                      <Image src={i.cutout} alt="" fill sizes="28px" className="object-contain p-0.5" />
                    </span>
                  )}
                  <span className="font-medium text-choc">{i.qty} × {i.name}</span>
                </div>
              ))}
            </div>
          )}
        </>,
      )}
      {block("Collection", 2, `${draft.date ? formatLong(draft.date) : ""} · ${slot?.label}, ${slot?.time}`)}
      {block("Your details", 3, `${draft.name} · ${draft.contact}`)}
      {(draft.occasion || draft.cakeMessage || draft.note || draft.allergies) &&
        block(
          "Your note",
          4,
          <div className="space-y-1 text-[14px] text-cocoa">
            {draft.occasion && <p>Occasion: {draft.occasion}</p>}
            {draft.cakeMessage && <p>Message: “{draft.cakeMessage}”</p>}
            {draft.note && <p>{draft.note}</p>}
            {draft.allergies && <p>Allergies: {draft.allergies}</p>}
          </div>,
        )}
      <div data-step-item className="mt-6 rounded-[22px] bg-ivory p-5">
        <div className="flex justify-between text-sm text-cocoa">
          <span>Estimate</span>
          <span className="tabular-nums">{money(est.subtotal)}</span>
        </div>
        {draft.blueLight && (
          <div className="mt-2 flex justify-between text-sm text-rose">
            <span>Blue light discount ({pct}%)</span>
            <span className="tabular-nums">−{money(est.discount)}</span>
          </div>
        )}
        <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
          <span className="text-sm text-choc">Estimated total</span>
          <span className="font-display text-3xl tabular-nums">{money(est.total)}</span>
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-mocha">
          No payment now. Kensal Bakes will confirm availability and your final price by DM. Demo pricing.
        </p>
      </div>
    </div>
  );
}

// ── Success ──────────────────────────────────────────────────────────────────
function Success({ enquiry, onReset }: { enquiry: Enquiry; onReset: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(ref);
      if (prefersReducedMotion()) return;
      q(".s-draw").forEach((p) => {
        const len = (p as unknown as SVGGeometryElement).getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      gsap.set(".s-band-v", { scaleY: 0, transformOrigin: "50% 0%" });
      gsap.set(".s-band-h", { scaleX: 0, transformOrigin: "50% 50%" });
      gsap.set(".s-bow", { scale: 0, transformOrigin: "50% 100%" });
      gsap.set(".s-fill", { opacity: 0 });

      const tl = gsap.timeline({ delay: 0.2 });
      tl.to(".s-draw", { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut", stagger: 0.05 })
        .to(".s-fill", { opacity: 1, duration: 0.3 }, "-=0.3")
        .to(".s-band-v", { scaleY: 1, duration: 0.45, ease: "power3.inOut" }, "-=0.1")
        .to(".s-band-h", { scaleX: 1, duration: 0.45, ease: "power3.inOut" }, "<0.1")
        .to(".s-bow", { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.5)" }, "-=0.1")
        .add(() => burst(q(".s-burst")[0] as HTMLElement), "-=0.55")
        .to(".s-box", { y: -6, duration: 0.25, ease: "power2.out", yoyo: true, repeat: 1 }, "<")
        .fromTo(".s-text > *", { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.07 }, "-=0.5");
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="relative overflow-hidden pb-24 pt-32 sm:pt-40">
      <div className="paper-grain pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center px-5 text-center">
        <div className="relative">
          <div className="s-burst pointer-events-none absolute left-1/2 top-[30%]" />
          <svg viewBox="0 0 200 170" className="s-box w-44 overflow-visible sm:w-52" aria-hidden>
            <rect className="s-fill" x="40" y="70" width="120" height="86" fill="#fcf9ea" />
            <rect className="s-draw" x="40" y="70" width="120" height="86" fill="none" stroke="#6b554c" strokeWidth="1.5" />
            <rect className="s-fill" x="32" y="50" width="136" height="24" rx="2" fill="#fcf9ea" />
            <rect className="s-draw" x="32" y="50" width="136" height="24" rx="2" fill="none" stroke="#6b554c" strokeWidth="1.5" />
            <rect className="s-band-v" x="92" y="50" width="16" height="106" fill="#931c1f" />
            <rect className="s-band-h" x="32" y="56" width="136" height="12" fill="#931c1f" />
            <g className="s-bow">
              <path d="M100 50C82 26 56 30 60 46C63 58 86 55 100 50Z" fill="#c7473d" stroke="#7a1518" strokeWidth="1.4" />
              <path d="M100 50C118 26 144 30 140 46C137 58 114 55 100 50Z" fill="#c7473d" stroke="#7a1518" strokeWidth="1.4" />
              <path d="M97 54L86 80M103 54L114 80" stroke="#931c1f" strokeWidth="7" strokeLinecap="round" />
              <circle cx="100" cy="51" r="7" fill="#931c1f" stroke="#7a1518" strokeWidth="1.4" />
            </g>
          </svg>
        </div>

        <div className="s-text mt-8 flex flex-col items-center">
          <p className="mega text-[5.5rem] text-crimson sm:text-[8rem]">Thank you!</p>
          <h1 className="mt-4 font-display text-[clamp(2rem,4.4vw,3.2rem)] leading-tight">Your enquiry is on its way</h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-cocoa">
            Kensal Bakes has everything needed to quote you: {enquiry.title.toLowerCase()} for {formatLong(enquiry.date)}. Expect a reply
            by DM, usually the same day.
          </p>
          <p className="mt-6 rounded-full border border-dashed border-gold/60 px-4 py-2 text-[13px] tracking-[0.1em] text-cocoa">
            Reference <span className="font-medium text-choc">{enquiry.ref}</span>
          </p>

          <ol className="mt-10 grid w-full gap-3 text-left sm:grid-cols-3">
            {[
              ["Reviewed", "Your enquiry lands in her inbox with every detail."],
              ["Quoted", "You get a confirmed price and slot by DM."],
              ["Collected", "Pick up your ribbon-tied box in Kensal Rise."],
            ].map(([t, b], i) => (
              <li key={t} className="rounded-[20px] border border-line bg-paper p-4">
                <span className="mega text-[3rem] text-crimson">{i + 1}</span>
                <p className="mt-2 font-display text-xl">{t}</p>
                <p className="mt-1 text-[13px] leading-snug text-cocoa">{b}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <TLink
              href="/"
              className="rounded-full bg-choc px-6 py-3.5 text-sm tracking-[0.06em] text-cream transition-transform duration-500 hover:-translate-y-0.5"
            >
              Back to home
            </TLink>
            <button
              onClick={onReset}
              className="rounded-full border border-choc/25 px-6 py-3.5 text-sm tracking-[0.06em] text-choc transition-colors hover:border-choc"
            >
              Start another enquiry
            </button>
          </div>
          <TLink
            href={`/dashboard?new=${enquiry.ref}`}
            className="group mt-8 inline-flex items-center gap-2 rounded-full border border-dashed border-mocha/50 px-4 py-2 text-[12.5px] text-mocha transition-colors hover:border-choc hover:text-choc"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage" />
            Demo: see it arrive in her dashboard
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </TLink>
        </div>
      </div>
    </div>
  );
}

/** Hearts and sparkles that pop out of the bow. */
function burst(origin: HTMLElement) {
  if (!origin) return;
  const colours = ["#931c1f", "#7a1518", "#6b554c", "#f4eec6", "#e8b24a"];
  for (let i = 0; i < 26; i++) {
    const el = document.createElement("span");
    const heart = i % 3 !== 0;
    el.innerHTML = heart
      ? `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 21C5 16 1 12.5 1 8C1 4.7 3.6 2.5 6.5 2.5C8.8 2.5 10.8 3.9 12 6C13.2 3.9 15.2 2.5 17.5 2.5C20.4 2.5 23 4.7 23 8C23 12.5 19 16 12 21Z" fill="currentColor"/></svg>`
      : `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 0C12.8 7 17 11.2 24 12C17 12.8 12.8 17 12 24C11.2 17 7 12.8 0 12C7 11.2 11.2 7 12 0Z" fill="currentColor"/></svg>`;
    const size = gsap.utils.random(8, 18);
    Object.assign(el.style, { position: "absolute", width: `${size}px`, height: `${size}px`, left: "0", top: "0", color: colours[i % colours.length], willChange: "transform, opacity" });
    origin.appendChild(el);
    const angle = gsap.utils.random(-Math.PI * 0.95, -Math.PI * 0.05);
    const dist = gsap.utils.random(80, 200);
    gsap
      .timeline({ onComplete: () => el.remove() })
      .fromTo(el, { x: 0, y: 0, scale: 0, rotate: 0 }, { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, scale: 1, rotate: gsap.utils.random(-120, 120), duration: 0.9, ease: "expo.out" })
      .to(el, { y: `+=${gsap.utils.random(40, 90)}`, opacity: 0, duration: 1, ease: "power1.in" }, "-=0.25");
  }
}
