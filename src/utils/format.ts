/** Turn an ISO 3166-1 alpha-2 code into its flag emoji (FR → 🇫🇷). */
export function countryFlag(iso: string): string {
  if (!/^[A-Za-z]{2}$/.test(iso)) return '';
  return String.fromCodePoint(
    ...iso.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

/** Locale-aware short date range: "17–26 Jul 2026". */
export function formatDateRange(start: string | null, end: string | null, locale: string): string {
  if (!start) return '';
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  const from = new Date(start);
  if (!end) return fmt.format(from);
  return `${new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(from)}–${fmt.format(new Date(end))}`;
}

/** Compact numbers for stats: 400000 → "400K". */
export function formatCompact(n: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: 'compact' }).format(n);
}
