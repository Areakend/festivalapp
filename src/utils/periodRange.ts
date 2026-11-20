/**
 * The Festivals filter's "Personnalisée" window, as whole UTC days — the
 * same convention InlineDatePicker emits and edition `start_date`s parse to,
 * so every comparison between them is exact.
 *
 * Kept free of React Native imports on purpose: one definition of the default
 * window shared by what the filter sheet SHOWS and what the list APPLIES.
 * They used to be defined separately (the sheet invented "today → +30 days"
 * for display while the list applied "from now on, no end" until a date was
 * actually picked), so choosing "Personnalisée" and leaving the default
 * dates showed 161 festivals under a 12-festival window.
 */

export interface DateRange {
  from: Date;
  to: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Default custom window: today through 30 days from today (UTC days). */
export function defaultCustomRange(now: number = Date.now()): DateRange {
  const d = new Date(now);
  const from = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return { from, to: new Date(from.getTime() + 30 * DAY_MS) };
}

/**
 * The range after the person moves "Du". If the new start passes the end the
 * end follows it — otherwise the window is inverted and silently matches
 * nothing (moving only "Du" into next year used to empty the list).
 */
export function withFrom(range: DateRange, from: Date): DateRange {
  return { from, to: from.getTime() > range.to.getTime() ? from : range.to };
}

/** Same for "Au": the start follows it if the new end falls before. */
export function withTo(range: DateRange, to: Date): DateRange {
  return { from: to.getTime() < range.from.getTime() ? to : range.from, to };
}
