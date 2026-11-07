"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/motion";
import { menu, stats, TODAY, tones, type Enquiry, type MenuCategory, type Status, type Tone } from "@/lib/mock-data";
import { addDays, formatDayMonth, formatLong, formatShort, fromISO, startOfWeek, timeAgo, toISO, weekKey } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { DemoTag, Heart, Placeholder, Sparkle } from "./art";
import { TLink } from "./providers";

type View = "overview" | "enquiries" | "calendar" | "menu" | "settings";

const NAV: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Icon d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" /> },
  { id: "enquiries", label: "Enquiries", icon: <Icon d="M3 13l3-8h12l3 8v6H3zM3 13h5l1 2h6l1-2h5" /> },
  { id: "calendar", label: "Calendar", icon: <Icon d="M4 6h16v14H4zM4 10h16M8 3v5M16 3v5" /> },
  { id: "menu", label: "Menu", icon: <Icon d="M5 20h14M6 20V12h12v8M8 12V9h8v3M12 9V5M10.5 5.5c0-1 1.5-2.5 1.5-2.5s1.5 1.5 1.5 2.5a1.5 1.5 0 0 1-3 0z" /> },
  { id: "settings", label: "Settings", icon: <Icon d="M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6" /> },
];

function Icon({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const STATUS: Record<Status, { label: string; cls: string; dot: string }> = {
  new: { label: "New", cls: "bg-blush text-rose", dot: "bg-rose" },
  quoted: { label: "Quoted", cls: "bg-[#f5e6cc] text-[#8f6125]", dot: "bg-gold" },
  confirmed: { label: "Confirmed", cls: "bg-choc text-cream", dot: "bg-choc" },
  ready: { label: "Ready", cls: "bg-sage/25 text-[#4b6447]", dot: "bg-sage" },
};
const ORDER: Status[] = ["new", "quoted", "confirmed", "ready"];

const money = (n: number) => `£${n % 1 ? n.toFixed(2) : n}`;
const avatarTones: Tone[] = ["blush", "biscoff", "pistachio", "lemon", "rose", "caramel", "mint", "vanilla"];
const toneFor = (name: string) => tones[avatarTones[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % avatarTones.length]];
const announced = new Set<string>();

// ── Shell ────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const params = useSearchParams();
  const { enquiries, toast, markSeen } = useStore();
  const [view, setView] = useState<View>("overview");
  const [selected, setSelected] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLDivElement>(null);

  // The arrival moment: a fresh enquiry from the order form slides into the inbox.
  const fresh = enquiries.find((e) => e.fresh && !announced.has(e.id));
  const [arrived, setArrived] = useState(!fresh);
  useEffect(() => {
    if (!fresh) return;
    const t = setTimeout(
      () => {
        announced.add(fresh.id);
        setArrived(true);
        toast(`New enquiry from ${fresh.customer}`, `${fresh.title} · ${formatShort(fresh.date)}`);
      },
      prefersReducedMotion() ? 0 : 1500,
    );
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = arrived || !fresh ? enquiries : enquiries.filter((e) => e.id !== fresh.id);
  const newCount = visible.filter((e) => e.status === "new").length;

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(".dash-side > *", { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.9, ease: "expo.out", stagger: 0.05 });
    },
    { scope: root },
  );

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo("[data-card]", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.06, delay: 0.05 });
    },
    { scope: main, dependencies: [view], revertOnUpdate: false },
  );

  const open = (id: string) => {
    setSelected(id);
    markSeen(id);
    setView("enquiries");
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (params.get("new") && fresh) setSelected(fresh.id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={root} className="dash min-h-screen bg-cream text-choc lg:grid lg:grid-cols-[256px_1fr]">
      <Sidebar view={view} setView={setView} newCount={newCount} />
      <div className="min-w-0">
        <TopBar view={view} setView={setView} newCount={newCount} />
        <main ref={main} className="mx-auto max-w-[1280px] px-4 pb-16 pt-4 sm:px-8 lg:pt-8">
          {view === "overview" && <Overview enquiries={visible} arrivedId={arrived ? fresh?.id : undefined} onOpen={open} goTo={setView} />}
          {view === "enquiries" && <Enquiries enquiries={visible} selected={selected} setSelected={(id) => (setSelected(id), id && markSeen(id))} />}
          {view === "calendar" && <CalendarView enquiries={visible} onOpen={open} />}
          {view === "menu" && <MenuView />}
          {view === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ view, setView, newCount }: { view: View; setView: (v: View) => void; newCount: number }) {
  const list = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const btn = list.current?.querySelector<HTMLElement>(`[data-nav="${view}"]`);
    if (btn && pill.current) gsap.to(pill.current, { y: btn.offsetTop, height: btn.offsetHeight, duration: 0.6, ease: "expo.out" });
  }, [view]);

  return (
    <aside className="sticky top-0 hidden h-screen flex-col justify-between border-r border-line bg-ivory/70 px-5 py-7 lg:flex">
      <div className="paper-grain pointer-events-none absolute inset-0" />
      <div className="dash-side relative flex flex-col">
        <TLink href="/" className="px-2">
          <span className="mega block text-[2.3rem] leading-none">Kensal Bakes</span>
          <span className="caps mt-1 block text-[9px] text-cocoa">Baker dashboard</span>
        </TLink>
        <div ref={list} className="relative mt-10 flex flex-col gap-1">
          <span ref={pill} className="absolute inset-x-0 top-0 rounded-xl bg-paper shadow-[0_6px_18px_-10px_rgba(43,31,26,0.3)]" aria-hidden />
          {NAV.map((n) => (
            <button
              key={n.id}
              data-nav={n.id}
              onClick={() => setView(n.id)}
              className={`relative z-10 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] transition-colors duration-300 ${
                view === n.id ? "text-choc" : "text-cocoa hover:text-choc"
              }`}
            >
              {n.icon}
              {n.label}
              {n.id === "enquiries" && newCount > 0 && (
                <span key={newCount} className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1.5 text-[11px] text-cream">
                  {newCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="dash-side relative flex flex-col gap-3">
        <div className="rounded-2xl border border-dashed border-mocha/40 p-4 text-[12.5px] leading-relaxed text-cocoa">
          <p className="flex items-center gap-2 font-medium text-choc">
            <Sparkle size={10} className="text-ribbon" /> Demo data
          </p>
          <p className="mt-1">Every name, order and number here is a placeholder.</p>
        </div>
        <TLink href="/" className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-[13.5px] text-cocoa hover:bg-paper hover:text-choc">
          View website <span className="transition-transform group-hover:translate-x-0.5">↗</span>
        </TLink>
      </div>
    </aside>
  );
}

function TopBar({ view, setView, newCount }: { view: View; setView: (v: View) => void; newCount: number }) {
  const { toast } = useStore();
  const bell = useRef<HTMLButtonElement>(null);
  const prev = useRef(newCount);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    if (newCount > prev.current && bell.current && !prefersReducedMotion()) {
      gsap.fromTo(bell.current, { rotate: 0 }, { keyframes: { rotate: [-16, 14, -10, 6, 0] }, duration: 0.8, ease: "power1.out", transformOrigin: "50% 10%" });
    }
    prev.current = newCount;
  }, [newCount]);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/menu`);
    } catch {}
    toast("Menu link copied", "Paste it into your Instagram bio or a DM reply.");
  };

  return (
    <div className="sticky top-0 z-30 border-b border-line bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <div className="min-w-0">
          <TLink href="/" className="mega text-[2rem] leading-none lg:hidden">
            Kensal Bakes
          </TLink>
          <p className="hidden font-display text-[1.9rem] leading-none lg:block">
            {greeting}, <span className="text-crimson">Kensal Bakes</span>
          </p>
          <p className="mt-1 hidden text-[13px] text-mocha sm:block">{formatLong(toISO(TODAY))} · here&apos;s your bakery at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <DemoTag className="hidden sm:inline-flex">Demo data</DemoTag>
          <button
            onClick={share}
            className="hidden items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-[13px] text-choc transition-colors hover:border-cocoa/40 md:flex"
          >
            <Icon d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" className="h-4 w-4" />
            Share menu link
          </button>
          <button
            ref={bell}
            onClick={() => setView("enquiries")}
            aria-label={`${newCount} new enquiries`}
            className="relative grid h-10 w-10 place-items-center rounded-full border border-line bg-paper text-choc transition-colors hover:border-cocoa/40"
          >
            <Icon d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" />
            {newCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose px-1 text-[10px] text-cream">
                {newCount}
              </span>
            )}
          </button>
        </div>
      </div>
      {/* mobile nav */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] transition-colors ${
              view === n.id ? "bg-choc text-cream" : "border border-line bg-paper text-cocoa"
            }`}
          >
            {n.label}
            {n.id === "enquiries" && newCount > 0 && <span className="rounded-full bg-rose px-1.5 text-[10px] text-cream">{newCount}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Shared bits ──────────────────────────────────────────────────────────────
function Card({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section data-card className={`rounded-[22px] border border-line bg-paper p-5 shadow-[0_18px_40px_-34px_rgba(43,31,26,0.4)] sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-[1.45rem] leading-none">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function CountUp({ value, prefix = "", decimals = 0 }: { value: number; prefix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);
  useGSAP(
    () => {
      const el = ref.current!;
      const render = (v: number) => (el.textContent = `${prefix}${v.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`);
      if (prefersReducedMotion()) {
        render(value);
        shown.current = value;
        return;
      }
      const from = shown.current;
      const o = { v: from };
      gsap.to(o, { v: value, duration: from === 0 ? 1.6 : 0.8, ease: "power3.out", delay: from === 0 ? 0.25 : 0, onUpdate: () => void render(o.v) });
      if (from !== 0 && value > from) gsap.fromTo(el, { scale: 1.25, color: "#7a1518" }, { scale: 1, color: "#2b1f1a", duration: 0.9, ease: "elastic.out(1,0.5)" });
      shown.current = value;
    },
    { dependencies: [value] },
  );
  return (
    <span ref={ref} className="inline-block origin-left lining-nums tabular-nums">
      {prefix}0
    </span>
  );
}

function StatusPill({ status }: { status: Status }) {
  const s = STATUS[status];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] ${s.cls}`}>{s.label}</span>;
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const c = toneFor(name);
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-display text-choc"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${c.bg[0]}, ${c.bg[1]})`, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-500 ${on ? "bg-choc" : "bg-oat"}`}
    >
      <span
        className={`absolute left-0 top-1 h-5 w-5 rounded-full bg-paper shadow transition-transform duration-500 ease-[var(--ease-silk)] ${on ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

function NumberStepper({ value, onChange, min = 0, max = 99, step = 1, suffix = "" }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-cream p-1">
      <button onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min} className="grid h-8 w-8 place-items-center rounded-full hover:bg-blush disabled:opacity-30" aria-label="Decrease">
        −
      </button>
      <span className="min-w-12 text-center text-sm tabular-nums">
        {value}
        {suffix}
      </span>
      <button onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max} className="grid h-8 w-8 place-items-center rounded-full hover:bg-blush disabled:opacity-30" aria-label="Increase">
        +
      </button>
    </div>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────
function Overview({ enquiries, arrivedId, onOpen, goTo }: { enquiries: Enquiry[]; arrivedId?: string; onOpen: (id: string) => void; goTo: (v: View) => void }) {
  const { bookedByWeek, settings } = useStore();
  const thisWeek = toISO(startOfWeek(TODAY));
  const booked = bookedByWeek[thisWeek] ?? 0;
  const newOnes = enquiries.filter((e) => e.status === "new");
  const today = newOnes.filter((e) => Date.now() - new Date(e.receivedAt).getTime() < 24 * 3600_000).length;
  const month = toISO(TODAY).slice(0, 7);
  const revenue = enquiries
    .filter((e) => (e.status === "confirmed" || e.status === "ready") && e.date.startsWith(month))
    .reduce((a, e) => a + (e.quote ?? e.estimate), 0);
  const monthName = new Intl.DateTimeFormat("en-GB", { month: "long" }).format(TODAY);

  return (
    <div className="grid gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-4">
        <Stat label="New enquiries" value={newOnes.length} foot={`${today} in the last 24 hours`} accent />
        <Stat label="Orders this week" value={booked} suffix={` / ${settings.weeklyCap}`} foot="Confirmed or ready" />
        <Stat label={`Booked in ${monthName}`} value={Math.round(revenue)} prefix="£" foot="From confirmed orders" />
        <Stat label="Avg. reply time" text={stats.avgReply} foot={`${stats.repeatCustomers} repeat customers`} />
      </div>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card
          title="Latest enquiries"
          action={
            <button onClick={() => goTo("enquiries")} className="text-[13px] text-rose underline-offset-4 hover:underline">
              View all
            </button>
          }
        >
          <ul className="-mx-2">
            {enquiries.slice(0, 5).map((e) => (
              <InboxRow key={e.id} e={e} arriving={e.id === arrivedId} onClick={() => onOpen(e.id)} />
            ))}
          </ul>
        </Card>
        <Capacity />
      </div>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1.6fr_1fr]">
        <WeekView enquiries={enquiries} onOpen={onOpen} />
        <SeasonalToggles />
      </div>
    </div>
  );
}

function Stat({ label, value, text, prefix, suffix, foot, accent }: { label: string; value?: number; text?: string; prefix?: string; suffix?: string; foot: string; accent?: boolean }) {
  return (
    <section data-card className={`relative overflow-hidden rounded-[22px] border p-5 sm:p-6 ${accent ? "border-ribbon/40 bg-blush/45" : "border-line bg-paper"}`}>
      <p className="text-[12.5px] text-cocoa">{label}</p>
      <p className="mt-3 font-display text-[2.6rem] leading-none lining-nums sm:text-[3rem]">
        {text ?? <CountUp value={value ?? 0} prefix={prefix} />}
        {suffix && <span className="text-[0.5em] text-mocha">{suffix}</span>}
      </p>
      <p className="mt-3 text-[12px] text-mocha">{foot}</p>
      {accent && <Heart size={56} className="absolute -bottom-3 -right-2 text-ribbon/25" />}
    </section>
  );
}

function InboxRow({ e, arriving, onClick }: { e: Enquiry; arriving?: boolean; onClick: () => void }) {
  const ref = useRef<HTMLLIElement>(null);
  useGSAP(() => {
    if (!arriving || prefersReducedMotion()) return;
    const el = ref.current!;
    gsap
      .timeline()
      .fromTo(el, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.7, ease: "expo.out" })
      .fromTo(el.querySelector(".row-inner"), { x: -30, backgroundColor: "rgba(241,211,209,1)" }, { x: 0, duration: 0.9, ease: "expo.out" }, 0)
      .to(el.querySelector(".row-inner"), { backgroundColor: "rgba(241,211,209,0.45)", duration: 1.6, ease: "power2.out" }, 0.5);
  });
  return (
    <li ref={ref} className="overflow-hidden">
      <button
        onClick={onClick}
        className={`row-inner flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition-colors hover:bg-ivory ${e.fresh ? "bg-blush/45" : ""}`}
      >
        <span className="relative">
          <Avatar name={e.customer} />
          {e.fresh && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-paper bg-rose [animation:pulse-ring_1.6s_ease-out_infinite]" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[14.5px] text-choc">{e.customer}</span>
            {e.fresh && <span className="rounded-full bg-rose px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-cream">Just in</span>}
          </span>
          <span className="block truncate text-[12.5px] text-mocha">
            {e.title} · for {formatShort(e.date)}
          </span>
        </span>
        <span className="hidden text-right text-[12px] text-mocha sm:block">{timeAgo(e.receivedAt)}</span>
        <StatusPill status={e.status} />
      </button>
    </li>
  );
}

function Capacity() {
  const { bookedByWeek, settings, updateSettings, toast, enquiries } = useStore();
  const weeks = Array.from({ length: 6 }, (_, i) => toISO(addDays(startOfWeek(TODAY), i * 7)));
  const current = bookedByWeek[weeks[0]] ?? 0;
  const pct = Math.min(1, current / settings.weeklyCap);
  const arc = useRef<SVGPathElement>(null);
  const R = 70;
  const LEN = Math.PI * R;

  useGSAP(
    () => {
      gsap.to(arc.current, { strokeDashoffset: LEN * (1 - pct), duration: prefersReducedMotion() ? 0 : 1.4, ease: "power3.out", delay: 0.2 });
    },
    { dependencies: [pct] },
  );

  const pendingFor = (wk: string) => enquiries.filter((e) => (e.status === "new" || e.status === "quoted") && weekKey(e.date) === wk).length;

  return (
    <Card title="Weekly capacity" action={<span className="text-[12px] text-mocha">w/c {formatDayMonth(weeks[0])}</span>}>
      <div className="relative mx-auto w-full max-w-[240px]">
        <svg viewBox="0 0 180 100" className="w-full overflow-visible">
          <path d={`M20 90A${R} ${R} 0 0 1 160 90`} fill="none" stroke="#e7d6b6" strokeWidth="12" strokeLinecap="round" />
          <path
            ref={arc}
            d={`M20 90A${R} ${R} 0 0 1 160 90`}
            fill="none"
            stroke={pct >= 1 ? "#7a1518" : "#2b1f1a"}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={LEN}
            strokeDashoffset={LEN}
            style={{ transition: "stroke .5s" }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <p className="font-display text-4xl leading-none">
            {current}
            <span className="text-xl text-mocha"> / {settings.weeklyCap}</span>
          </p>
          <p className="mt-1 text-[12px] text-mocha">{pct >= 1 ? "Fully booked: new dates closed" : `${settings.weeklyCap - current} slots left this week`}</p>
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between gap-2">
        {weeks.map((wk) => {
          const b = bookedByWeek[wk] ?? 0;
          const p = pendingFor(wk);
          const full = b >= settings.weeklyCap;
          return (
            <div key={wk} className="flex flex-1 flex-col items-center gap-1.5" title={`${b} booked, ${p} pending`}>
              <div className="relative flex h-20 w-full max-w-[26px] flex-col-reverse overflow-hidden rounded-full bg-ivory">
                <div className={`w-full transition-all duration-700 ${full ? "bg-rose" : "bg-choc"}`} style={{ height: `${Math.min(100, (b / settings.weeklyCap) * 100)}%` }} />
                <div className="w-full bg-ribbon/50 transition-all duration-700" style={{ height: `${Math.min(100 - (b / settings.weeklyCap) * 100, (p / settings.weeklyCap) * 100)}%` }} />
              </div>
              <span className="text-[10.5px] text-mocha">{formatDayMonth(wk).replace(" ", " ")}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 text-[11px] text-mocha">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-choc" /> Booked</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ribbon/60" /> Pending</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose" /> Full</span>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-5">
        <div>
          <p className="text-[13.5px] text-choc">Orders per week</p>
          <p className="text-[12px] text-mocha">Full weeks close on the website</p>
        </div>
        <NumberStepper
          value={settings.weeklyCap}
          min={1}
          max={15}
          onChange={(v) => {
            updateSettings({ weeklyCap: v });
            toast(`Weekly cap set to ${v}`, "The order form updates its calendar straight away.");
          }}
        />
      </div>
    </Card>
  );
}

function WeekView({ enquiries, onOpen, large }: { enquiries: Enquiry[]; onOpen: (id: string) => void; large?: boolean }) {
  const { settings } = useStore();
  const [offset, setOffset] = useState(0);
  const start = addDays(startOfWeek(TODAY), offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const grid = useRef<HTMLDivElement>(null);

  const shift = (n: number) => {
    const el = grid.current;
    if (!el || prefersReducedMotion()) return setOffset((o) => o + n);
    gsap.to(el, {
      opacity: 0,
      x: -20 * n,
      duration: 0.18,
      onComplete: () => {
        setOffset((o) => o + n);
        requestAnimationFrame(() => gsap.fromTo(el, { opacity: 0, x: 20 * n }, { opacity: 1, x: 0, duration: 0.5, ease: "expo.out" }));
      },
    });
  };

  return (
    <Card
      title={large ? undefined : "This week"}
      action={
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] text-mocha">
            {formatDayMonth(toISO(start))} – {formatDayMonth(toISO(addDays(start, 6)))}
          </span>
          <button onClick={() => shift(-1)} className="grid h-8 w-8 place-items-center rounded-full border border-line hover:bg-blush" aria-label="Previous week">
            ←
          </button>
          <button onClick={() => shift(1)} className="grid h-8 w-8 place-items-center rounded-full border border-line hover:bg-blush" aria-label="Next week">
            →
          </button>
          {offset !== 0 && (
            <button onClick={() => shift(-offset)} className="ml-1 text-[12.5px] text-rose hover:underline">
              Today
            </button>
          )}
        </div>
      }
    >
      <div className="no-scrollbar -mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
        <div ref={grid} className={`grid min-w-[640px] grid-cols-7 gap-2 ${large ? "min-h-[420px]" : "min-h-[220px]"}`}>
          {days.map((d) => {
            const iso = toISO(d);
            const isToday = iso === toISO(TODAY);
            const off = !settings.collectionDays.includes(d.getDay()) || (iso >= settings.closedFrom && iso <= settings.closedTo);
            const items = enquiries.filter((e) => e.date === iso);
            return (
              <div
                key={iso}
                className={`flex flex-col rounded-2xl border p-2 ${isToday ? "border-ribbon bg-blush/30" : "border-line"} ${
                  off ? "bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,rgba(234,223,206,0.6)_6px,rgba(234,223,206,0.6)_7px)]" : ""
                }`}
              >
                <div className="flex items-baseline justify-between px-1">
                  <span className="text-[11px] uppercase tracking-[0.12em] text-mocha">{new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(d)}</span>
                  <span className={`font-display text-lg ${isToday ? "text-rose" : ""}`}>{d.getDate()}</span>
                </div>
                <div className="mt-2 flex flex-col gap-1.5">
                  {off && items.length === 0 && <span className="px-1 text-[11px] text-mocha/70">No collection</span>}
                  {items.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => onOpen(e.id)}
                      className={`rounded-xl px-2 py-1.5 text-left text-[11.5px] leading-tight transition-transform hover:-translate-y-0.5 ${
                        e.status === "confirmed"
                          ? "bg-choc text-cream"
                          : e.status === "ready"
                            ? "bg-sage/30 text-[#3f573b]"
                            : e.status === "quoted"
                              ? "border border-gold/50 bg-[#f5e6cc]/60 text-[#7a5220]"
                              : "border border-dashed border-rose/60 bg-blush/40 text-rose"
                      }`}
                    >
                      <span className="block truncate font-medium">{e.customer}</span>
                      <span className="block truncate opacity-80">{e.title}</span>
                      {large && <span className="mt-1 block opacity-70">{e.slot}</span>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-mocha">
        {ORDER.map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS[s].dot}`} /> {STATUS[s].label}
          </span>
        ))}
      </div>
    </Card>
  );
}

function SeasonalToggles() {
  const { available, toggleItem, toast } = useStore();
  const seasonal = menu.filter((m) => m.seasonal);
  return (
    <Card title="Seasonal menu" action={<span className="text-[12px] text-mocha">Shown on site</span>}>
      <ul className="-mx-1 max-h-[340px] divide-y divide-line overflow-y-auto pr-1" data-lenis-prevent>
        {seasonal.map((m) => (
          <li key={m.id} className="flex items-center gap-3 px-1 py-2.5">
            <div className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-line/60 bg-[#eedfc3] transition-[filter] ${available[m.id] ? "" : "grayscale"}`}>
              {m.cutout || m.image ? (
                <Image src={m.cutout || m.image!} alt={m.name} fill sizes="40px" className="object-contain p-0.5" />
              ) : (
                <Placeholder art={m.art} tone={m.tone} festive={m.christmas} className="h-full w-full" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-[14px] ${available[m.id] ? "text-choc" : "text-mocha line-through"}`}>{m.name}</p>
              <p className="text-[11.5px] text-mocha">{m.christmas ? "Christmas special" : "Limited time"} · {m.category}</p>
            </div>
            <Toggle
              on={available[m.id]}
              label={`Show ${m.name}`}
              onChange={() => {
                toggleItem(m.id);
                toast(available[m.id] ? `${m.name} hidden` : `${m.name} is back on the menu`, available[m.id] ? "Shows as sold out on the website." : "Customers can order it again.");
              }}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ── Enquiries ────────────────────────────────────────────────────────────────
function Enquiries({ enquiries, selected, setSelected }: { enquiries: Enquiry[]; selected: string | null; setSelected: (id: string | null) => void }) {
  const [filter, setFilter] = useState<Status | "all">("all");
  const list = filter === "all" ? enquiries : enquiries.filter((e) => e.status === filter);
  const current = enquiries.find((e) => e.id === selected) ?? null;

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <Card className={current ? "hidden xl:block" : ""}>
        <div className="no-scrollbar -mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1">
          {(["all", ...ORDER] as const).map((f) => {
            const n = f === "all" ? enquiries.length : enquiries.filter((e) => e.status === f).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors ${filter === f ? "bg-choc text-cream" : "bg-ivory text-cocoa hover:text-choc"}`}
              >
                {f === "all" ? "All" : STATUS[f].label} <span className="opacity-60">{n}</span>
              </button>
            );
          })}
        </div>
        <ul className="-mx-2">
          {list.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => setSelected(e.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition-colors ${
                  e.id === selected ? "bg-ivory" : e.fresh ? "bg-blush/45" : "hover:bg-ivory/70"
                }`}
              >
                <Avatar name={e.customer} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[14.5px] text-choc">
                    {e.customer}
                    {e.fresh && <span className="rounded-full bg-rose px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-cream">Just in</span>}
                  </span>
                  <span className="block truncate text-[12.5px] text-mocha">{e.title}</span>
                </span>
                <span className="hidden text-right text-[12px] text-mocha sm:block">
                  {formatShort(e.date)}
                  <br />
                  <span className="opacity-70">{timeAgo(e.receivedAt)}</span>
                </span>
                <StatusPill status={e.status} />
              </button>
            </li>
          ))}
          {list.length === 0 && <p className="px-2 py-8 text-center text-sm text-mocha">Nothing here right now.</p>}
        </ul>
      </Card>

      {current ? (
        <Detail key={current.id} e={current} onBack={() => setSelected(null)} />
      ) : (
        <Card className="hidden min-h-[420px] place-items-center text-center xl:grid">
          <div>
            <Heart size={22} className="mx-auto text-ribbon" />
            <p className="mt-4 font-display text-2xl">Pick an enquiry</p>
            <p className="mt-1 text-sm text-mocha">Every detail arrives in one place: no more scrolling through DMs.</p>
          </div>
        </Card>
      )}
    </div>
  );
}

function Detail({ e, onBack }: { e: Enquiry; onBack: () => void }) {
  const { setStatus, toast, isWeekFull, bookedByWeek, settings } = useStore();
  const [quote, setQuote] = useState(String(e.quote ?? e.estimate));
  const idx = ORDER.indexOf(e.status);
  const weekBooked = bookedByWeek[weekKey(e.date)] ?? 0;

  const copy = async () => {
    const text = `${e.ref} · ${e.customer} (${e.contact})\n${e.title}\n${e.items.map((i) => `${i.qty} × ${i.name}`).join(", ")}\nCollection: ${formatLong(e.date)}, ${e.slot}${e.allergies ? `\nAllergies: ${e.allergies}` : ""}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
    toast("Order details copied", "Ready to paste into your notes or a DM.");
  };

  const advance = () => {
    if (e.status === "new") {
      const q = Number(quote) || e.estimate;
      setStatus(e.id, "quoted", q);
      toast(`Quote of ${money(q)} sent to ${e.customer}`, "Demo: in a real version this would send a DM template.");
    } else if (e.status === "quoted") {
      setStatus(e.id, "confirmed");
      toast(`${e.customer}'s order is confirmed`, `Added to ${formatShort(e.date)} on your calendar.`);
    } else if (e.status === "confirmed") {
      setStatus(e.id, "ready");
      toast(`${e.customer} told it's ready`, "Demo: collection message sent.");
    } else {
      toast(`Reminder sent to ${e.customer}`, `Collection ${formatShort(e.date)}, ${e.slot.toLowerCase()}.`);
    }
  };
  const actionLabel = { new: "Send quote", quoted: "Mark as confirmed", confirmed: "Mark ready for collection", ready: "Send collection reminder" }[e.status];

  return (
    <Card>
      <button onClick={onBack} className="mb-4 text-[13px] text-cocoa hover:text-choc xl:hidden">
        ← All enquiries
      </button>
      <div className="flex items-start gap-4">
        <Avatar name={e.customer} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-3xl leading-none">{e.customer}</h2>
            <StatusPill status={e.status} />
          </div>
          <p className="mt-1.5 text-[13px] text-mocha">
            {e.ref} · {e.contact} · received {timeAgo(e.receivedAt).toLowerCase()}
          </p>
        </div>
      </div>

      {/* pipeline */}
      <ol className="mt-6 grid grid-cols-4 gap-1.5">
        {ORDER.map((s, i) => (
          <li key={s}>
            <div className="h-1.5 overflow-hidden rounded-full bg-ivory">
              <div className={`h-full rounded-full bg-ribbon transition-transform duration-700 ease-[var(--ease-silk)] origin-left ${i <= idx ? "scale-x-100" : "scale-x-0"}`} />
            </div>
            <p className={`mt-2 text-[11.5px] ${i <= idx ? "text-choc" : "text-mocha/60"}`}>{STATUS[s].label}</p>
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-[18px] bg-ivory/70 p-4">
        <p className="font-display text-xl">{e.title}</p>
        <ul className="mt-2 space-y-1 text-[13.5px] text-cocoa">
          {e.items.map((i) => (
            <li key={i.name} className="flex justify-between">
              <span>{i.name}</span>
              <span className="tabular-nums">× {i.qty}</span>
            </li>
          ))}
        </ul>
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-4 text-[13.5px] sm:grid-cols-2">
        <Info label="Collection">{formatLong(e.date)} · {e.slot}</Info>
        <Info label="Occasion">{e.occasion ?? "Not given"}</Info>
        <Info label="Blue light">{e.blueLight ? `Yes · ${settings.blueLightPct}% off` : "No"}</Info>
        <Info label="Estimate">{money(e.estimate)}{e.quote && e.status !== "new" ? ` · quoted ${money(e.quote)}` : ""}</Info>
        {e.message && <Info label="Message" wide>{e.message}</Info>}
        {e.allergies && (
          <Info label="Allergies" wide>
            <span className="inline-flex items-center gap-2 rounded-full bg-blush px-3 py-1 text-rose">⚠ {e.allergies}</span>
          </Info>
        )}
      </dl>

      {(e.status === "new" || e.status === "quoted") && isWeekFull(e.date) && (
        <p className="mt-5 rounded-2xl border border-rose/30 bg-blush/40 px-4 py-3 text-[13px] text-rose">
          That week is already at capacity ({weekBooked}/{settings.weeklyCap}). You can still accept it, or suggest another date.
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-5">
        {e.status === "new" && (
          <label className="flex items-center gap-1 rounded-full border border-line bg-cream py-1 pl-4 pr-1 text-sm">
            £
            <input
              value={quote}
              onChange={(ev) => setQuote(ev.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              className="w-16 bg-transparent py-1.5 outline-none"
              aria-label="Quote amount"
            />
          </label>
        )}
        <button
          onClick={advance}
          className="rounded-full bg-choc px-5 py-2.5 text-[13.5px] tracking-[0.03em] text-cream transition-transform duration-500 hover:-translate-y-0.5"
        >
          {actionLabel}
        </button>
        <button
          onClick={() => toast("Demo: opens the Instagram DM", `This would jump straight to your thread with ${e.contact}.`)}
          className="rounded-full border border-line px-4 py-2.5 text-[13.5px] text-choc transition-colors hover:border-cocoa/40"
        >
          Reply on Instagram
        </button>
        <button onClick={copy} className="rounded-full px-3 py-2.5 text-[13.5px] text-cocoa hover:text-choc">
          Copy details
        </button>
      </div>
    </Card>
  );
}

function Info({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-mocha">{label}</dt>
      <dd className="mt-1 text-choc">{children}</dd>
    </div>
  );
}

// ── Calendar ─────────────────────────────────────────────────────────────────
function CalendarView({ enquiries, onOpen }: { enquiries: Enquiry[]; onOpen: (id: string) => void }) {
  const upcoming = useMemo(
    () =>
      enquiries
        .filter((e) => (e.status === "confirmed" || e.status === "ready") && fromISO(e.date) >= TODAY)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 8),
    [enquiries],
  );
  return (
    <div className="grid gap-5">
      <div data-card>
        <h1 className="font-display text-4xl">Calendar</h1>
        <p className="mt-1 text-sm text-mocha">Collections by day. Click an order to open it.</p>
      </div>
      <WeekView enquiries={enquiries} onOpen={onOpen} large />
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Upcoming collections">
          <ul className="divide-y divide-line">
            {upcoming.map((e) => (
              <li key={e.id}>
                <button onClick={() => onOpen(e.id)} className="flex w-full items-center gap-4 py-3 text-left hover:bg-ivory/50">
                  <span className="w-16 shrink-0 text-center">
                    <span className="block text-[11px] uppercase tracking-[0.12em] text-mocha">{new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(fromISO(e.date))}</span>
                    <span className="block font-display text-2xl leading-none">{fromISO(e.date).getDate()}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] text-choc">{e.title}</span>
                    <span className="block text-[12.5px] text-mocha">
                      {e.customer} · {e.slot}
                    </span>
                  </span>
                  <StatusPill status={e.status} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Capacity />
      </div>
    </div>
  );
}

// ── Menu ─────────────────────────────────────────────────────────────────────
function MenuView() {
  const { available, toggleItem, toast } = useStore();
  const cats: MenuCategory[] = ["cookies", "cupcakes", "cakes"];
  return (
    <div className="grid gap-5">
      <div data-card className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Menu</h1>
          <p className="mt-1 text-sm text-mocha">Switch items on or off. Changes show on the website instantly.</p>
        </div>
        <TLink href="/menu" className="rounded-full border border-line bg-paper px-4 py-2 text-[13px] text-choc hover:border-cocoa/40">
          View live menu ↗
        </TLink>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        {cats.map((c) => (
          <Card key={c} title={c.charAt(0).toUpperCase() + c.slice(1)}>
            <ul className="divide-y divide-line">
              {menu
                .filter((m) => m.category === c)
                .map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-2.5">
                    <div className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-line/60 bg-[#eedfc3] transition-[filter] ${available[m.id] ? "" : "grayscale"}`}>
                      {m.cutout || m.image ? (
                        <Image src={m.cutout || m.image!} alt={m.name} fill sizes="40px" className="object-contain p-0.5" />
                      ) : (
                        <Placeholder art={m.art} tone={m.tone} festive={m.christmas} className="h-full w-full" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[14px] ${available[m.id] ? "" : "text-mocha line-through"}`}>{m.name}</p>
                      <p className="text-[11.5px] text-mocha">
                        {money(m.price)} {m.priceNote} {m.seasonal && <span className="text-rose">· limited time</span>}
                      </p>
                    </div>
                    <Toggle
                      on={available[m.id]}
                      label={`Show ${m.name}`}
                      onChange={() => {
                        toggleItem(m.id);
                        toast(available[m.id] ? `${m.name} hidden` : `${m.name} is back on`, "Demo data only.");
                      }}
                    />
                  </li>
                ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────
function SettingsView() {
  const { settings, updateSettings, toast } = useStore();
  const saved = (msg: string) => toast(msg, "Saved for this demo session.");
  const year = fromISO(settings.closedFrom).getFullYear();
  const cutoffs = [6, 13, 20].map((d) => toISO(new Date(year, 11, d)));

  return (
    <div className="grid gap-5">
      <div data-card>
        <h1 className="font-display text-4xl">Settings</h1>
        <p className="mt-1 text-sm text-mocha">How the website takes enquiries. Every change applies to the live order form.</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Taking enquiries">
          <Row label="Accept new enquiries" sub="Turn off for a breather: the next two weeks close on the site.">
            <Toggle
              on={settings.acceptingOrders}
              label="Accept new enquiries"
              onChange={() => {
                updateSettings({ acceptingOrders: !settings.acceptingOrders });
                saved(settings.acceptingOrders ? "Enquiries paused" : "Enquiries open again");
              }}
            />
          </Row>
          <Row label="Orders per week" sub="Weeks at the cap show as fully booked.">
            <NumberStepper value={settings.weeklyCap} min={1} max={15} onChange={(v) => (updateSettings({ weeklyCap: v }), saved(`Weekly cap set to ${v}`))} />
          </Row>
          <Row label="Blue light discount" sub="Applied when customers tick the box.">
            <NumberStepper value={settings.blueLightPct} min={5} max={25} step={5} suffix="%" onChange={(v) => (updateSettings({ blueLightPct: v }), saved(`Blue light discount set to ${v}%`))} />
          </Row>
        </Card>
        <Card title="Christmas">
          <Row label="Last day for Christmas orders" sub={`Collection runs until ${formatLong(settings.lastChristmasCollection)}.`}>
            <select
              value={settings.christmasCutoff}
              onChange={(e) => (updateSettings({ christmasCutoff: e.target.value }), saved(`Christmas orders now close ${formatShort(e.target.value)}`))}
              className="rounded-full border border-line bg-cream px-4 py-2 text-sm outline-none focus:border-ribbon"
            >
              {cutoffs.map((c) => (
                <option key={c} value={c}>
                  {formatShort(c)}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Christmas break" sub="No collections over the holidays.">
            <span className="text-sm text-cocoa">
              {formatDayMonth(settings.closedFrom)} – {formatDayMonth(settings.closedTo)}
            </span>
          </Row>
        </Card>
        <Card title="Minimum notice">
          {(["cookies", "cupcakes", "cakes", "favours"] as const).map((c) => (
            <Row key={c} label={c.charAt(0).toUpperCase() + c.slice(1)} sub="Days between enquiry and collection">
              <NumberStepper
                value={settings.noticeDays[c]}
                min={1}
                max={21}
                suffix="d"
                onChange={(v) => (updateSettings({ noticeDays: { ...settings.noticeDays, [c]: v } }), saved(`${c} now need ${v} days' notice`))}
              />
            </Row>
          ))}
        </Card>
        <Card title="Collection slots">
          {[
            ["morning", "Morning", "10am – 12pm"],
            ["afternoon", "Afternoon", "2pm – 4pm"],
            ["evening", "Evening", "5pm – 7pm"],
          ].map(([id, label, time]) => (
            <Row key={id} label={label} sub={time}>
              <Toggle
                on={settings.slots[id]}
                label={label}
                onChange={() => {
                  updateSettings({ slots: { ...settings.slots, [id]: !settings.slots[id] } });
                  saved(`${label} slot ${settings.slots[id] ? "hidden" : "available"}`);
                }}
              />
            </Row>
          ))}
          <p className="mt-3 text-[12.5px] text-mocha">Collection is Tuesday to Saturday, from Kensal Rise.</p>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3.5 last:border-0">
      <div>
        <p className="text-[14px] text-choc">{label}</p>
        <p className="text-[12px] text-mocha">{sub}</p>
      </div>
      {children}
    </div>
  );
}
