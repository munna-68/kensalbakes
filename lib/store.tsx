"use client";

// In-memory demo state shared by the website and the dashboard.
// Nothing is persisted: a hard refresh resets everything to lib/mock-data.ts.

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { defaultSettings, enquiries as seedEnquiries, menu, type Enquiry, type Settings, type Status } from "./mock-data";
import { weekKey } from "./dates";

interface Toast {
  id: number;
  title: string;
  body?: string;
}

interface Store {
  enquiries: Enquiry[];
  addEnquiry: (e: Omit<Enquiry, "id" | "ref" | "status" | "receivedAt" | "fresh">) => Enquiry;
  setStatus: (id: string, status: Status, quote?: number) => void;
  markSeen: (id: string) => void;
  available: Record<string, boolean>;
  toggleItem: (id: string) => void;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  /** Orders (confirmed or ready) per Monday week key. */
  bookedByWeek: Record<string, number>;
  isWeekFull: (iso: string) => boolean;
  toasts: Toast[];
  toast: (title: string, body?: string) => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>(seedEnquiries);
  const [available, setAvailable] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(menu.map((m) => [m.id, true])),
  );
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const refCounter = useRef(1044);

  const toast = useCallback((title: string, body?: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, title, body }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const addEnquiry: Store["addEnquiry"] = useCallback((e) => {
    const n = refCounter.current++;
    const enquiry: Enquiry = {
      ...e,
      id: `live-${n}`,
      ref: `KB-${n}`,
      status: "new",
      receivedAt: new Date().toISOString(),
      fresh: true,
    };
    setEnquiries((list) => [enquiry, ...list]);
    return enquiry;
  }, []);

  const setStatus = useCallback((id: string, status: Status, quote?: number) => {
    setEnquiries((list) =>
      list.map((e) => (e.id === id ? { ...e, status, quote: quote ?? e.quote ?? e.estimate, fresh: false } : e)),
    );
  }, []);

  const markSeen = useCallback((id: string) => {
    setEnquiries((list) => list.map((e) => (e.id === id && e.fresh ? { ...e, fresh: false } : e)));
  }, []);

  const toggleItem = useCallback((id: string) => setAvailable((a) => ({ ...a, [id]: !a[id] })), []);
  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);

  const bookedByWeek = useMemo(() => {
    const out: Record<string, number> = {};
    for (const e of enquiries) {
      if (e.status === "confirmed" || e.status === "ready") {
        const k = weekKey(e.date);
        out[k] = (out[k] ?? 0) + 1;
      }
    }
    return out;
  }, [enquiries]);

  const isWeekFull = useCallback(
    (iso: string) => (bookedByWeek[weekKey(iso)] ?? 0) >= settings.weeklyCap,
    [bookedByWeek, settings.weeklyCap],
  );

  const value = useMemo(
    () => ({ enquiries, addEnquiry, setStatus, markSeen, available, toggleItem, settings, updateSettings, bookedByWeek, isWeekFull, toasts, toast }),
    [enquiries, addEnquiry, setStatus, markSeen, available, toggleItem, settings, updateSettings, bookedByWeek, isWeekFull, toasts, toast],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
