import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export interface CalendarEvent {
  title: string;
  /** YYYY-MM-DD, inclusive. */
  startDate: string;
  /** YYYY-MM-DD, inclusive (defaults to startDate for a single day). */
  endDate?: string;
  location?: string;
  description?: string;
}

/** YYYY-MM-DD -> YYYYMMDD (all-day iCalendar DATE format). */
function toIcsDate(isoDate: string): string {
  return isoDate.replace(/-/g, '');
}

/** All-day events use an exclusive DTEND, so add one day past the last day. */
function nextDay(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
}

/** Builds a minimal iCalendar (.ics) document with one all-day VEVENT per entry. */
export function buildIcsContent(events: CalendarEvent[]): string {
  const now = toIcsDate(new Date().toISOString().slice(0, 10));
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mainstage//Festival Export//EN'];
  for (const event of events) {
    const end = nextDay(event.endDate ?? event.startDate);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.startDate}-${Math.random().toString(36).slice(2)}@mainstage`,
      `DTSTAMP:${now}T000000Z`,
      `DTSTART;VALUE=DATE:${toIcsDate(event.startDate)}`,
      `DTEND;VALUE=DATE:${toIcsDate(end)}`,
      `SUMMARY:${escapeIcsText(event.title)}`,
    );
    if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  // iCalendar requires CRLF line endings.
  return lines.join('\r\n');
}

/**
 * Writes the events to a temporary .ics file and opens the system share
 * sheet — the user picks Google Calendar, Apple Calendar, Outlook or
 * whatever else can import an .ics from there, so this needs no
 * per-provider integration or account connection.
 */
export async function exportEventsToCalendar(events: CalendarEvent[], fileName = 'festival.ics') {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device');
  }
  const dir = new Directory(Paths.cache, 'calendar-exports');
  dir.create({ intermediates: true, idempotent: true });
  const file = new File(dir, fileName);
  file.create({ overwrite: true });
  file.write(buildIcsContent(events));
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/calendar',
    dialogTitle: 'Export calendar',
    UTI: 'com.apple.ical.ics',
  });
}
