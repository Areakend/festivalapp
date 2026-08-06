import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';

export interface CalendarEvent {
  title: string;
  /** YYYY-MM-DD, inclusive. */
  startDate: string;
  /** YYYY-MM-DD, inclusive (defaults to startDate for a single day). */
  endDate?: string;
  location?: string;
  description?: string;
}

/** All-day events use an exclusive end date, so add one day past the last day. */
function nextDay(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function getWritableCalendarId(): Promise<string> {
  if (Platform.OS === 'ios') {
    return (await Calendar.getDefaultCalendarAsync()).id;
  }
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.find((c) => c.accessLevel === Calendar.CalendarAccessLevel.OWNER);
  if (writable) return writable.id;
  return Calendar.createCalendarAsync({
    title: 'Mainstage',
    color: '#8B5CF6',
    entityType: Calendar.EntityTypes.EVENT,
    source: { isLocalAccount: true, name: 'Mainstage', type: 'LOCAL' },
    name: 'Mainstage',
    ownerAccount: 'Mainstage',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

/**
 * Writes each event straight into the device's calendar via the native
 * Calendar API. Sharing a generated .ics file used to be how this worked,
 * but iOS's share sheet doesn't reliably offer an "Add to Calendar" action
 * for a shared file — it just lets the user save/forward it — so the event
 * silently never actually lands in Calendar. Creating it directly is the
 * only way that's guaranteed to work on both platforms.
 */
export async function exportEventsToCalendar(events: CalendarEvent[]) {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Calendar permission denied');
  }
  const calendarId = await getWritableCalendarId();
  for (const event of events) {
    await Calendar.createEventAsync(calendarId, {
      title: event.title,
      startDate: new Date(`${event.startDate}T00:00:00Z`),
      endDate: new Date(`${nextDay(event.endDate ?? event.startDate)}T00:00:00Z`),
      allDay: true,
      timeZone: 'UTC',
      location: event.location,
      notes: event.description,
    });
  }
}
