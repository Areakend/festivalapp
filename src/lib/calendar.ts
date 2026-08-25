import * as Calendar from 'expo-calendar';
import * as SecureStore from 'expo-secure-store';

export interface CalendarEvent {
  title: string;
  /** YYYY-MM-DD, inclusive. */
  startDate: string;
  /** YYYY-MM-DD, inclusive (defaults to startDate for a single day). */
  endDate?: string;
  location?: string;
  description?: string;
}

export interface WritableCalendar {
  id: string;
  title: string;
  /** Account/source name (e.g. a Google address, "Xiaomi Cloud", or "Work
   *  Exchange") — the only way to tell two same-looking "Calendar" entries
   *  apart when multiple accounts each register their own, on either
   *  platform. */
  source: string;
}

const PREFERRED_CALENDAR_KEY = 'preferred_calendar_id';

export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

/**
 * Every calendar the user can actually write an event to. iOS has just as
 * much multi-account ambiguity as Android — EventKit's "default calendar"
 * is whatever iOS Settings > Calendar > Default happens to be set to,
 * which can just as easily be a work Exchange/Google Workspace calendar as
 * a personal one, and silently writing festival dates there is a real
 * privacy problem, not a hypothetical one.
 */
export async function getWritableCalendars(): Promise<WritableCalendar[]> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return calendars
    .filter((c) => c.accessLevel === Calendar.CalendarAccessLevel.OWNER)
    .map((c) => ({ id: c.id, title: c.title, source: c.source?.name ?? '' }));
}

export async function getPreferredCalendarId(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(PREFERRED_CALENDAR_KEY);
  } catch {
    return null;
  }
}

export async function setPreferredCalendarId(id: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(PREFERRED_CALENDAR_KEY, id);
  } catch {
    // Non-fatal — worst case, the picker just reappears next time.
  }
}

/** All-day events use an exclusive end date, so add one day past the last day. */
function nextDay(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const MAINSTAGE_CALENDAR_TITLE = 'Mainstage';

async function getWritableCalendarId(preferredId?: string | null): Promise<string> {
  const calendars = await getWritableCalendars();
  // A remembered choice wins outright — but only if that calendar still
  // exists (accounts get removed), otherwise fall through to picking one.
  if (preferredId && calendars.some((c) => c.id === preferredId)) return preferredId;
  const writable = calendars[0];
  if (writable) return writable.id;

  // Nothing turned up in the writable-calendars scan above, but a
  // Mainstage calendar this app created earlier might still exist — on
  // iOS, a calendar with a bare LOCAL source isn't always reported back by
  // a fresh getCalendarsAsync() scan the same way twice (remembering its id
  // alone wasn't enough to stop duplicates), so fall back to matching it by
  // title/source directly, across every calendar rather than just the
  // ones that just passed the OWNER filter.
  const all = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const existing = all.find(
    (c) => c.title === MAINSTAGE_CALENDAR_TITLE && c.source?.name === MAINSTAGE_CALENDAR_TITLE,
  );
  if (existing) {
    await setPreferredCalendarId(existing.id);
    return existing.id;
  }

  const createdId = await Calendar.createCalendarAsync({
    title: MAINSTAGE_CALENDAR_TITLE,
    color: '#8B5CF6',
    entityType: Calendar.EntityTypes.EVENT,
    source: { isLocalAccount: true, name: MAINSTAGE_CALENDAR_TITLE, type: 'LOCAL' },
    name: MAINSTAGE_CALENDAR_TITLE,
    ownerAccount: MAINSTAGE_CALENDAR_TITLE,
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
  await setPreferredCalendarId(createdId);
  return createdId;
}

export interface ExportResult {
  added: number;
  /** Already had a same-titled event on the same day in that calendar. */
  skipped: number;
}

/**
 * Writes each event straight into the device's calendar via the native
 * Calendar API. Sharing a generated .ics file used to be how this worked,
 * but iOS's share sheet doesn't reliably offer an "Add to Calendar" action
 * for a shared file — it just lets the user save/forward it — so the event
 * silently never actually lands in Calendar. Creating it directly is the
 * only way that's guaranteed to work on both platforms.
 *
 * Re-exporting the same festival (e.g. after re-opening the export sheet)
 * would otherwise create a second copy of every day's event every time —
 * checked by title against whatever's already on that day in the target
 * calendar before creating.
 */
export async function exportEventsToCalendar(
  events: CalendarEvent[],
  calendarId?: string,
): Promise<ExportResult> {
  if (!(await requestCalendarPermission())) {
    throw new Error('Calendar permission denied');
  }
  const resolvedCalendarId = calendarId ?? (await getWritableCalendarId(await getPreferredCalendarId()));
  let added = 0;
  let skipped = 0;
  for (const event of events) {
    const rangeStart = new Date(`${event.startDate}T00:00:00Z`);
    const rangeEnd = new Date(`${nextDay(event.endDate ?? event.startDate)}T00:00:00Z`);
    const existing = await Calendar.getEventsAsync([resolvedCalendarId], rangeStart, rangeEnd);
    if (existing.some((e) => e.title === event.title)) {
      skipped += 1;
      continue;
    }
    await Calendar.createEventAsync(resolvedCalendarId, {
      title: event.title,
      startDate: rangeStart,
      endDate: rangeEnd,
      allDay: true,
      timeZone: 'UTC',
      location: event.location,
      notes: event.description,
    });
    added += 1;
  }
  return { added, skipped };
}
