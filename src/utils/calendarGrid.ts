export interface DayCell {
  date: string;
  inMonth: boolean;
}

export function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Full 7-wide month grid (Monday first), padded with the trailing days of
 *  the previous/next month so every row is complete. Shared by
 *  PlanningCalendar and InlineDatePicker so the weekday-offset math only
 *  lives in one place. */
export function buildMonthGrid(monthStart: Date): DayCell[] {
  const year = monthStart.getUTCFullYear();
  const month = monthStart.getUTCMonth();
  const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const cells: DayCell[] = [];
  for (let i = firstWeekday; i > 0; i--) {
    const d = new Date(Date.UTC(year, month, 1 - i));
    cells.push({ date: ymd(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: ymd(year, month, day), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const [ly, lm, ld] = cells[cells.length - 1]!.date.split('-').map(Number) as [number, number, number];
    const d = new Date(Date.UTC(ly, lm - 1, ld + 1));
    cells.push({ date: ymd(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), inMonth: false });
  }
  return cells;
}
