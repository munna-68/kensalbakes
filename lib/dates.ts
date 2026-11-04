// Small date helpers. Dates are stored as local "yyyy-mm-dd" strings.

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

export function toISO(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fromISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Monday-based week start (UK). */
export function startOfWeek(d: Date) {
  const day = (d.getDay() + 6) % 7;
  return startOfDay(addDays(d, -day));
}

export function sameDay(a: Date, b: Date) {
  return toISO(a) === toISO(b);
}

export function weekKey(iso: string) {
  return toISO(startOfWeek(fromISO(iso)));
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", opts);

export const formatLong = (iso: string) =>
  fmt({ weekday: "long", day: "numeric", month: "long" }).format(fromISO(iso));
export const formatShort = (iso: string) =>
  fmt({ weekday: "short", day: "numeric", month: "short" }).format(fromISO(iso));
export const formatDayMonth = (iso: string) => fmt({ day: "numeric", month: "short" }).format(fromISO(iso));

export function timeAgo(isoDateTime: string, now = new Date()) {
  const mins = Math.max(0, Math.round((now.getTime() - new Date(isoDateTime).getTime()) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}
